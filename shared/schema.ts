import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  vector,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("viewer"), // owner, admin, editor, viewer, auditor
  isSystemAdmin: boolean("is_system_admin").notNull().default(false), // System-level super admin (can manage all companies)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractNumber: varchar("contract_number").unique(), // Auto-generated unique number: CNT-YYYY-NNN
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type").notNull(),
  filePath: varchar("file_path").notNull(),
  contractType: varchar("contract_type"), // license, service, partnership, employment, other
  priority: varchar("priority").notNull().default("normal"), // normal, high, urgent
  status: varchar("status").notNull().default("uploaded"), // uploaded, processing, analyzed, failed
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  notes: text("notes"),
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Editable metadata fields for contract management
  displayName: varchar("display_name"), // User-friendly contract name
  effectiveStart: timestamp("effective_start"), // Contract effective start date
  effectiveEnd: timestamp("effective_end"), // Contract expiration/end date
  renewalTerms: text("renewal_terms"), // Renewal terms and conditions
  governingLaw: varchar("governing_law"), // Jurisdiction/governing law
  organizationName: varchar("organization_name"), // Your organization/company (the party using this platform)
  counterpartyName: varchar("counterparty_name"), // Other party in the contract (vendor, customer, partner, etc.)
  contractOwnerId: varchar("contract_owner_id").references(() => users.id), // Internal contract owner
  approvalState: varchar("approval_state").notNull().default("draft"), // draft, pending_approval, approved, rejected
  currentVersion: integer("current_version").notNull().default(1), // Current version number
  
  // ERP Integration Configuration
  useErpMatching: boolean("use_erp_matching").notNull().default(false), // Toggle: Use ERP data matching vs traditional approach
  
  // Organizational Context Fields (for multi-location context switching)
  companyId: varchar("company_id"), // References companies table
  businessUnitId: varchar("business_unit_id"), // References business_units table
  locationId: varchar("location_id"), // References locations table
});

// Contract analysis results
export const contractAnalysis = pgTable("contract_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  summary: text("summary"),
  keyTerms: jsonb("key_terms"), // Array of extracted terms with confidence scores
  riskAnalysis: jsonb("risk_analysis"), // Risk assessment results
  insights: jsonb("insights"), // AI-generated insights
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // Overall confidence score
  processingTime: integer("processing_time"), // Processing time in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract embeddings for semantic search (AI-driven matching)
export const contractEmbeddings = pgTable("contract_embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  embeddingType: varchar("embedding_type").notNull(), // 'product', 'territory', 'full_contract', 'rule_description'
  sourceText: text("source_text").notNull(), // Original text that was embedded
  embedding: vector("embedding", { dimensions: 384 }), // Hugging Face sentence-transformers/all-MiniLM-L6-v2 produces 384 dimensions
  metadata: jsonb("metadata"), // Additional context (product categories, territories, date ranges, etc.)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("contract_embeddings_contract_idx").on(table.contractId),
  index("contract_embeddings_type_idx").on(table.embeddingType),
]);

// System documentation embeddings for LIQ AI platform knowledge
export const systemEmbeddings = pgTable("system_embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().unique(), // Knowledge base entry ID
  category: varchar("category").notNull(), // Category for filtering
  title: varchar("title").notNull(), // Document title
  sourceText: text("source_text").notNull(), // Original text that was embedded
  embedding: vector("embedding", { dimensions: 384 }), // Same dimensions as contract embeddings
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("system_embeddings_category_idx").on(table.category),
  index("system_embeddings_document_idx").on(table.documentId),
]);

// Contract Versions - Full snapshot versioning for contract metadata
export const contractVersions = pgTable("contract_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  versionNumber: integer("version_number").notNull(),
  editorId: varchar("editor_id").notNull().references(() => users.id),
  changeSummary: text("change_summary"), // Brief description of what changed
  metadataSnapshot: jsonb("metadata_snapshot").notNull(), // Full snapshot of editable metadata fields
  fileReference: varchar("file_reference"), // Reference to file if file was changed
  approvalState: varchar("approval_state").notNull().default("draft"), // draft, pending_approval, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("contract_versions_contract_idx").on(table.contractId),
  index("contract_versions_state_idx").on(table.approvalState),
]);

// Contract Approvals - Approval decisions for contract versions
export const contractApprovals = pgTable("contract_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractVersionId: varchar("contract_version_id").notNull().references(() => contractVersions.id, { onDelete: 'cascade' }),
  approverId: varchar("approver_id").notNull().references(() => users.id),
  status: varchar("status").notNull(), // approved, rejected
  decisionNotes: text("decision_notes"), // Reason for approval/rejection
  decidedAt: timestamp("decided_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("contract_approvals_version_idx").on(table.contractVersionId),
]);

// Audit trail
export const auditTrail = pgTable("audit_trail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // login, logout, upload, analyze, view, edit, delete, etc.
  resourceType: varchar("resource_type"), // contract, user, analysis, etc.
  resourceId: varchar("resource_id"),
  details: jsonb("details"), // Additional context about the action
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  isActive: true,
});

// Login schema for authentication
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration schema with validation
export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address").optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
});

export const insertContractSchema = createInsertSchema(contracts).pick({
  contractNumber: true, // Optional - auto-generated if not provided
  fileName: true,
  originalName: true,
  fileSize: true,
  fileType: true,
  filePath: true,
  contractType: true,
  priority: true,
  uploadedBy: true,
  notes: true,
}).partial({ contractNumber: true }); // Make contractNumber optional

export const insertContractAnalysisSchema = createInsertSchema(contractAnalysis).pick({
  contractId: true,
  summary: true,
  keyTerms: true,
  riskAnalysis: true,
  insights: true,
  confidence: true,
  processingTime: true,
});

export const insertAuditTrailSchema = createInsertSchema(auditTrail).pick({
  userId: true,
  action: true,
  resourceType: true,
  resourceId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export const insertContractVersionSchema = createInsertSchema(contractVersions).pick({
  contractId: true,
  versionNumber: true,
  editorId: true,
  changeSummary: true,
  metadataSnapshot: true,
  fileReference: true,
  approvalState: true,
});

export const insertContractApprovalSchema = createInsertSchema(contractApprovals).pick({
  contractVersionId: true,
  approverId: true,
  status: true,
  decisionNotes: true,
});

// Schema for updating contract metadata (editable fields only)
export const updateContractMetadataSchema = z.object({
  displayName: z.string().optional(),
  effectiveStart: z.string().optional(), // ISO date string
  effectiveEnd: z.string().optional(), // ISO date string
  renewalTerms: z.string().optional(),
  governingLaw: z.string().optional(),
  organizationName: z.string().optional(),
  counterpartyName: z.string().optional(),
  contractOwnerId: z.string().optional(),
  contractType: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional(),
  changeSummary: z.string().min(1, "Please describe what changed"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContractAnalysis = z.infer<typeof insertContractAnalysisSchema>;
export type ContractAnalysis = typeof contractAnalysis.$inferSelect;
export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;
export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertContractVersion = z.infer<typeof insertContractVersionSchema>;
export type ContractVersion = typeof contractVersions.$inferSelect;
export type InsertContractApproval = z.infer<typeof insertContractApprovalSchema>;
export type ContractApproval = typeof contractApprovals.$inferSelect;
export type UpdateContractMetadata = z.infer<typeof updateContractMetadataSchema>;

// Financial Analysis table
export const financialAnalysis = pgTable("financial_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }),
  currency: varchar("currency").default("USD"),
  paymentSchedule: jsonb("payment_schedule"), // Array of payment dates and amounts
  royaltyStructure: jsonb("royalty_structure"), // Royalty rates and calculation methods
  revenueProjections: jsonb("revenue_projections"), // Projected income over time
  costImpact: jsonb("cost_impact"), // Cost analysis and budget impact
  currencyRisk: decimal("currency_risk", { precision: 5, scale: 2 }), // Risk score 0-100
  paymentTerms: text("payment_terms"),
  penaltyClauses: jsonb("penalty_clauses"), // Financial penalties and conditions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Compliance Analysis table
export const complianceAnalysis = pgTable("compliance_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }), // Overall compliance score 0-100
  regulatoryFrameworks: jsonb("regulatory_frameworks"), // GDPR, SOX, HIPAA, etc.
  jurisdictionAnalysis: jsonb("jurisdiction_analysis"), // Governing law analysis
  dataProtectionCompliance: boolean("data_protection_compliance"),
  industryStandards: jsonb("industry_standards"), // Industry-specific compliance
  riskFactors: jsonb("risk_factors"), // Compliance risk factors
  recommendedActions: jsonb("recommended_actions"), // Compliance improvement suggestions
  lastComplianceCheck: timestamp("last_compliance_check").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract Obligations table
export const contractObligations = pgTable("contract_obligations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  obligationType: varchar("obligation_type").notNull(), // payment, delivery, performance, reporting
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  responsible: varchar("responsible"), // party responsible for obligation
  status: varchar("status").default("pending"), // pending, completed, overdue, cancelled
  priority: varchar("priority").default("medium"), // low, medium, high, critical
  completionDate: timestamp("completion_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract Performance Metrics table
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }), // 0-100
  milestoneCompletion: decimal("milestone_completion", { precision: 5, scale: 2 }), // % completed
  onTimeDelivery: boolean("on_time_delivery").default(true),
  budgetVariance: decimal("budget_variance", { precision: 10, scale: 2 }), // Over/under budget
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }), // Quality assessment
  clientSatisfaction: decimal("client_satisfaction", { precision: 5, scale: 2 }), // Satisfaction rating
  renewalProbability: decimal("renewal_probability", { precision: 5, scale: 2 }), // Renewal likelihood
  lastReviewDate: timestamp("last_review_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Strategic Analysis table
export const strategicAnalysis = pgTable("strategic_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  strategicValue: decimal("strategic_value", { precision: 5, scale: 2 }), // Strategic importance score
  marketAlignment: decimal("market_alignment", { precision: 5, scale: 2 }), // How well aligned with market
  competitiveAdvantage: jsonb("competitive_advantage"), // Competitive benefits
  riskConcentration: decimal("risk_concentration", { precision: 5, scale: 2 }), // Risk concentration level
  standardizationScore: decimal("standardization_score", { precision: 5, scale: 2 }), // Template compliance
  negotiationInsights: jsonb("negotiation_insights"), // Negotiation patterns and suggestions
  benchmarkComparison: jsonb("benchmark_comparison"), // Industry benchmark comparison
  recommendations: jsonb("recommendations"), // Strategic recommendations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract Comparisons table (for similar contract analysis)
export const contractComparisons = pgTable("contract_comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  similarContracts: jsonb("similar_contracts"), // Array of similar contract IDs and similarity scores
  clauseVariations: jsonb("clause_variations"), // Differences in key clauses
  termComparisons: jsonb("term_comparisons"), // Financial and legal term comparisons
  bestPractices: jsonb("best_practices"), // Identified best practices from comparisons
  anomalies: jsonb("anomalies"), // Unusual terms or conditions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Market Benchmarks table
export const marketBenchmarks = pgTable("market_benchmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractType: varchar("contract_type").notNull(),
  industry: varchar("industry"),
  benchmarkData: jsonb("benchmark_data"), // Market standard terms, rates, etc.
  averageValue: decimal("average_value", { precision: 15, scale: 2 }),
  standardTerms: jsonb("standard_terms"), // Common terms for this contract type
  riskFactors: jsonb("risk_factors"), // Common risk factors
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertFinancialAnalysisSchema = createInsertSchema(financialAnalysis).pick({
  contractId: true,
  totalValue: true,
  currency: true,
  paymentSchedule: true,
  royaltyStructure: true,
  revenueProjections: true,
  costImpact: true,
  currencyRisk: true,
  paymentTerms: true,
  penaltyClauses: true,
});

export const insertComplianceAnalysisSchema = createInsertSchema(complianceAnalysis).pick({
  contractId: true,
  complianceScore: true,
  regulatoryFrameworks: true,
  jurisdictionAnalysis: true,
  dataProtectionCompliance: true,
  industryStandards: true,
  riskFactors: true,
  recommendedActions: true,
});

export const insertContractObligationSchema = createInsertSchema(contractObligations).pick({
  contractId: true,
  obligationType: true,
  description: true,
  dueDate: true,
  responsible: true,
  status: true,
  priority: true,
  notes: true,
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).pick({
  contractId: true,
  performanceScore: true,
  milestoneCompletion: true,
  onTimeDelivery: true,
  budgetVariance: true,
  qualityScore: true,
  clientSatisfaction: true,
  renewalProbability: true,
});

export const insertStrategicAnalysisSchema = createInsertSchema(strategicAnalysis).pick({
  contractId: true,
  strategicValue: true,
  marketAlignment: true,
  competitiveAdvantage: true,
  riskConcentration: true,
  standardizationScore: true,
  negotiationInsights: true,
  benchmarkComparison: true,
  recommendations: true,
});

export const insertContractComparisonSchema = createInsertSchema(contractComparisons).pick({
  contractId: true,
  similarContracts: true,
  clauseVariations: true,
  termComparisons: true,
  bestPractices: true,
  anomalies: true,
});

export const insertMarketBenchmarkSchema = createInsertSchema(marketBenchmarks).pick({
  contractType: true,
  industry: true,
  benchmarkData: true,
  averageValue: true,
  standardTerms: true,
  riskFactors: true,
});

// Enhanced types
export type FinancialAnalysis = typeof financialAnalysis.$inferSelect;
export type InsertFinancialAnalysis = z.infer<typeof insertFinancialAnalysisSchema>;
export type ComplianceAnalysis = typeof complianceAnalysis.$inferSelect;
export type InsertComplianceAnalysis = z.infer<typeof insertComplianceAnalysisSchema>;
export type ContractObligation = typeof contractObligations.$inferSelect;
export type InsertContractObligation = z.infer<typeof insertContractObligationSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type StrategicAnalysis = typeof strategicAnalysis.$inferSelect;
export type InsertStrategicAnalysis = z.infer<typeof insertStrategicAnalysisSchema>;
export type ContractComparison = typeof contractComparisons.$inferSelect;
export type InsertContractComparison = z.infer<typeof insertContractComparisonSchema>;
export type MarketBenchmark = typeof marketBenchmarks.$inferSelect;
export type InsertMarketBenchmark = z.infer<typeof insertMarketBenchmarkSchema>;

// Enhanced contract with all analysis data
export type ContractWithAnalysis = Contract & {
  analysis?: ContractAnalysis;
  financialAnalysis?: FinancialAnalysis;
  complianceAnalysis?: ComplianceAnalysis;
  obligations?: ContractObligation[];
  performanceMetrics?: PerformanceMetrics;
  strategicAnalysis?: StrategicAnalysis;
  comparisons?: ContractComparison;
  uploadedByUser?: User;
};

// ======================
// AI-DRIVEN ROYALTY CALCULATION SYSTEM
// ======================

// Sales Data (AI-Matched to Contracts)
export const salesData = pgTable("sales_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchedContractId: varchar("matched_contract_id").references(() => contracts.id, { onDelete: 'set null' }),
  matchConfidence: decimal("match_confidence", { precision: 5, scale: 2 }),
  transactionDate: timestamp("transaction_date").notNull(),
  transactionId: varchar("transaction_id"),
  productCode: varchar("product_code"),
  productName: varchar("product_name"),
  category: varchar("category"),
  territory: varchar("territory"),
  currency: varchar("currency").default("USD"),
  grossAmount: decimal("gross_amount", { precision: 15, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }),
  quantity: decimal("quantity", { precision: 12, scale: 4 }),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }),
  customFields: jsonb("custom_fields"),
  importJobId: varchar("import_job_id"),
  
  // Multi-location context fields (inherited from matched contract or set during import)
  companyId: varchar("company_id").references(() => companies.id),
  businessUnitId: varchar("business_unit_id").references(() => businessUnits.id),
  locationId: varchar("location_id").references(() => locations.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract-based Royalty Calculations (AI-Matched Workflow)
export const contractRoyaltyCalculations = pgTable("contract_royalty_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(), // e.g., "Q1 2024 Royalties"
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  status: varchar("status").default("pending_approval"), // pending_approval, approved, rejected, paid
  totalSalesAmount: decimal("total_sales_amount", { precision: 15, scale: 2 }),
  totalRoyalty: decimal("total_royalty", { precision: 15, scale: 2 }),
  currency: varchar("currency").default("USD"),
  salesCount: integer("sales_count"),
  breakdown: jsonb("breakdown"), // Detailed per-sale breakdown
  chartData: jsonb("chart_data"), // Pre-computed chart data
  calculatedBy: varchar("calculated_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  comments: text("comments"),
  
  // Multi-location context fields (inherited from contract)
  companyId: varchar("company_id").references(() => companies.id),
  businessUnitId: varchar("business_unit_id").references(() => businessUnits.id),
  locationId: varchar("location_id").references(() => locations.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Structured Royalty Rules (Extracted from Contracts)
export const royaltyRules = pgTable("royalty_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  ruleType: varchar("rule_type").notNull(), // 'percentage', 'tiered', 'minimum_guarantee', 'cap', 'deduction', 'fixed_fee'
  ruleName: varchar("rule_name").notNull(),
  description: text("description"),
  
  // NEW: JSON-based dynamic formula storage
  formulaDefinition: jsonb("formula_definition"), // Complete FormulaDefinition object with expression tree
  formulaVersion: varchar("formula_version").default("1.0"), // Version for tracking formula changes
  
  // LEGACY: Tabular columns (kept for backwards compatibility during migration)
  productCategories: text("product_categories").array(), // Array of product categories this rule applies to
  territories: text("territories").array(), // Array of territories
  containerSizes: text("container_sizes").array(), // e.g., ["1-gallon", "5-gallon"]
  seasonalAdjustments: jsonb("seasonal_adjustments"), // e.g., {"Spring": 1.10, "Fall": 0.95, "Holiday": 1.20}
  territoryPremiums: jsonb("territory_premiums"), // e.g., {"Secondary": 1.10, "Organic": 1.25}
  volumeTiers: jsonb("volume_tiers"), // [{"min": 0, "max": 4999, "rate": 1.25}, {"min": 5000, "rate": 1.10}]
  baseRate: decimal("base_rate", { precision: 15, scale: 2 }), // Base royalty rate
  minimumGuarantee: decimal("minimum_guarantee", { precision: 15, scale: 2 }), // Annual minimum
  calculationFormula: text("calculation_formula"), // Description of how to calculate
  
  // Metadata
  priority: integer("priority").default(10), // Lower number = higher priority
  isActive: boolean("is_active").default(true),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // AI extraction confidence
  sourceSection: varchar("source_section"), // Where in contract this was found
  sourceText: text("source_text"), // Original contract text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ======================
// INSERT SCHEMAS
// ======================

export const insertSalesDataSchema = createInsertSchema(salesData).pick({
  matchedContractId: true,
  matchConfidence: true,
  transactionDate: true,
  transactionId: true,
  productCode: true,
  productName: true,
  category: true,
  territory: true,
  currency: true,
  grossAmount: true,
  netAmount: true,
  quantity: true,
  unitPrice: true,
  customFields: true,
  importJobId: true,
});

export const insertContractRoyaltyCalculationSchema = createInsertSchema(contractRoyaltyCalculations).pick({
  contractId: true,
  name: true,
  periodStart: true,
  periodEnd: true,
  totalSalesAmount: true,
  totalRoyalty: true,
  currency: true,
  salesCount: true,
  breakdown: true,
  chartData: true,
  calculatedBy: true,
  comments: true,
});

export const insertRoyaltyRuleSchema = createInsertSchema(royaltyRules).pick({
  contractId: true,
  ruleType: true,
  ruleName: true,
  description: true,
  
  // NEW: JSON-based formula fields
  formulaDefinition: true,
  formulaVersion: true,
  
  // LEGACY: Tabular fields (kept for backwards compatibility)
  productCategories: true,
  territories: true,
  containerSizes: true,
  seasonalAdjustments: true,
  territoryPremiums: true,
  volumeTiers: true,
  baseRate: true,
  minimumGuarantee: true,
  calculationFormula: true,
  
  priority: true,
  isActive: true,
  confidence: true,
  sourceSection: true,
  sourceText: true,
});

// ======================
// TYPES
// ======================

export type SalesData = typeof salesData.$inferSelect;
export type InsertSalesData = z.infer<typeof insertSalesDataSchema>;
export type ContractRoyaltyCalculation = typeof contractRoyaltyCalculations.$inferSelect;
export type InsertContractRoyaltyCalculation = z.infer<typeof insertContractRoyaltyCalculationSchema>;
export type RoyaltyRule = typeof royaltyRules.$inferSelect;
export type InsertRoyaltyRule = z.infer<typeof insertRoyaltyRuleSchema>;

// ======================
// DYNAMIC CONTRACT PROCESSING SYSTEM
// AI-Powered Knowledge Graph & Flexible Extraction
// ======================

// Contract Documents - Raw text segments with metadata
export const contractDocuments = pgTable("contract_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  extractionRunId: varchar("extraction_run_id"),
  documentSection: varchar("document_section"), // 'header', 'parties', 'terms', 'payment', 'termination', etc.
  sectionOrder: integer("section_order"), // Order within document
  rawText: text("raw_text").notNull(), // Original text from PDF
  normalizedText: text("normalized_text"), // Cleaned/normalized version
  pageNumber: integer("page_number"),
  metadata: jsonb("metadata"), // Layout info, confidence, formatting details
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("contract_documents_contract_idx").on(table.contractId),
  index("contract_documents_extraction_idx").on(table.extractionRunId),
]);

// Contract Graph Nodes - Entities extracted from contracts (people, terms, clauses, etc.)
export const contractGraphNodes = pgTable("contract_graph_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  extractionRunId: varchar("extraction_run_id"),
  nodeType: varchar("node_type").notNull(), // 'party', 'product', 'territory', 'clause', 'term', 'obligation', 'royalty_rule'
  label: varchar("label").notNull(), // Human-readable name
  properties: jsonb("properties").notNull(), // All extracted properties as flexible JSON
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // AI confidence (0-1)
  sourceDocumentId: varchar("source_document_id").references(() => contractDocuments.id),
  sourceText: text("source_text"), // Original text this was extracted from
  embedding: vector("embedding", { dimensions: 384 }), // Semantic embedding for this node
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("graph_nodes_contract_idx").on(table.contractId),
  index("graph_nodes_type_idx").on(table.nodeType),
  index("graph_nodes_extraction_idx").on(table.extractionRunId),
]);

// Contract Graph Edges - Relationships between nodes
export const contractGraphEdges = pgTable("contract_graph_edges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  extractionRunId: varchar("extraction_run_id"),
  sourceNodeId: varchar("source_node_id").notNull().references(() => contractGraphNodes.id),
  targetNodeId: varchar("target_node_id").notNull().references(() => contractGraphNodes.id),
  relationshipType: varchar("relationship_type").notNull(), // 'applies_to', 'references', 'requires', 'modifies', etc.
  properties: jsonb("properties"), // Additional relationship metadata
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("graph_edges_contract_idx").on(table.contractId),
  index("graph_edges_source_idx").on(table.sourceNodeId),
  index("graph_edges_target_idx").on(table.targetNodeId),
]);

// Extraction Runs - Track each AI extraction attempt with confidence and validation
export const extractionRuns = pgTable("extraction_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  runType: varchar("run_type").notNull(), // 'initial', 'reprocess', 'manual_correction'
  status: varchar("status").notNull().default("processing"), // 'processing', 'completed', 'failed', 'pending_review'
  overallConfidence: decimal("overall_confidence", { precision: 5, scale: 2 }),
  nodesExtracted: integer("nodes_extracted"),
  edgesExtracted: integer("edges_extracted"),
  rulesExtracted: integer("rules_extracted"),
  validationResults: jsonb("validation_results"), // Results from validation checks
  aiModel: varchar("ai_model").default("llama-3.1-8b"), // Which LLM was used
  processingTime: integer("processing_time"), // Milliseconds
  errorLog: text("error_log"),
  triggeredBy: varchar("triggered_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("extraction_runs_contract_idx").on(table.contractId),
  index("extraction_runs_status_idx").on(table.status),
]);

// Rule Definitions - Dynamic rule storage with extensible formula types
export const ruleDefinitions = pgTable("rule_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  extractionRunId: varchar("extraction_run_id").references(() => extractionRuns.id),
  linkedGraphNodeId: varchar("linked_graph_node_id").references(() => contractGraphNodes.id), // Link to knowledge graph
  ruleType: varchar("rule_type").notNull(), // Can be ANY type, not just predefined ones
  ruleName: varchar("rule_name").notNull(),
  description: text("description"),
  formulaDefinition: jsonb("formula_definition").notNull(), // Complete FormulaNode tree
  applicabilityFilters: jsonb("applicability_filters"), // When this rule applies (flexible JSON)
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  validationStatus: varchar("validation_status").default("pending"), // 'pending', 'validated', 'failed', 'approved'
  validationErrors: jsonb("validation_errors"), // Any validation issues found
  isActive: boolean("is_active").default(false), // Only active after approval
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("rule_definitions_contract_idx").on(table.contractId),
  index("rule_definitions_status_idx").on(table.validationStatus),
]);

// Rule Node Definitions - Registry of custom FormulaNode types (extensible system)
export const ruleNodeDefinitions = pgTable("rule_node_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nodeType: varchar("node_type").unique().notNull(), // e.g., 'hybrid_percentage_plus_fixed', 'conditional_tier'
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  schema: jsonb("schema").notNull(), // JSON schema for this node type's structure
  evaluationAdapter: text("evaluation_adapter"), // Optional: custom evaluation logic
  examples: jsonb("examples"), // Example usage
  createdAt: timestamp("created_at").defaultNow(),
});

// Human Review Tasks - Queue for low-confidence extractions
export const humanReviewTasks = pgTable("human_review_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  extractionRunId: varchar("extraction_run_id").references(() => extractionRuns.id),
  taskType: varchar("task_type").notNull(), // 'node_review', 'rule_review', 'relationship_review', 'field_mapping'
  priority: varchar("priority").default("normal"), // 'low', 'normal', 'high', 'critical'
  status: varchar("status").default("pending"), // 'pending', 'in_review', 'approved', 'rejected', 'needs_revision'
  targetId: varchar("target_id"), // ID of the node/rule/edge being reviewed
  targetType: varchar("target_type"), // 'graph_node', 'rule_definition', 'graph_edge', 'field_mapping'
  originalData: jsonb("original_data").notNull(), // Original AI extraction
  suggestedCorrection: jsonb("suggested_correction"), // User's correction
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  reviewNotes: text("review_notes"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("review_tasks_contract_idx").on(table.contractId),
  index("review_tasks_status_idx").on(table.status),
  index("review_tasks_assigned_idx").on(table.assignedTo),
]);

// Sales Field Mappings - Learned associations between sales data columns and contract terms
export const salesFieldMappings = pgTable("sales_field_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").references(() => contracts.id, { onDelete: 'set null' }), // Can be contract-specific or global (null)
  sourceFieldName: varchar("source_field_name").notNull(), // Field name from sales data (e.g., "Item", "SKU")
  targetFieldType: varchar("target_field_type").notNull(), // Semantic type (e.g., "productName", "territory", "quantity")
  mappingConfidence: decimal("mapping_confidence", { precision: 5, scale: 2 }),
  mappingMethod: varchar("mapping_method").default("ai_semantic"), // 'ai_semantic', 'manual', 'learned', 'exact_match'
  sampleValues: jsonb("sample_values"), // Example values to help validate mapping
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  usageCount: integer("usage_count").default(0), // How many times this mapping was successfully used
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("field_mappings_contract_idx").on(table.contractId),
  index("field_mappings_source_idx").on(table.sourceFieldName),
]);

// Semantic Index Entries - GraphRAG embeddings for enhanced search
export const semanticIndexEntries = pgTable("semantic_index_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  indexType: varchar("index_type").notNull(), // 'graph_node', 'document_chunk', 'rule_description', 'combined'
  sourceId: varchar("source_id"), // ID of source (graph node, document, rule)
  content: text("content").notNull(), // Text content that was embedded
  embedding: vector("embedding", { dimensions: 384 }),
  metadata: jsonb("metadata"), // Context about this entry (node type, section, etc.)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("semantic_index_contract_idx").on(table.contractId),
  index("semantic_index_type_idx").on(table.indexType),
]);

// Rule Validation Events - Audit trail for rule validation
export const ruleValidationEvents = pgTable("rule_validation_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleDefinitionId: varchar("rule_definition_id").notNull().references(() => ruleDefinitions.id),
  validationType: varchar("validation_type").notNull(), // 'dimensional', 'ai_consistency', 'monte_carlo', 'manual'
  validationResult: varchar("validation_result").notNull(), // 'passed', 'failed', 'warning'
  issues: jsonb("issues"), // Array of validation issues found
  recommendations: jsonb("recommendations"), // Suggested fixes
  validatorId: varchar("validator_id").references(() => users.id), // For manual validations
  validatedAt: timestamp("validated_at").defaultNow(),
}, (table) => [
  index("validation_events_rule_idx").on(table.ruleDefinitionId),
]);

// ======================
// INSERT SCHEMAS FOR NEW TABLES
// ======================

export const insertContractDocumentSchema = createInsertSchema(contractDocuments).pick({
  contractId: true,
  extractionRunId: true,
  documentSection: true,
  sectionOrder: true,
  rawText: true,
  normalizedText: true,
  pageNumber: true,
  metadata: true,
});

export const insertContractGraphNodeSchema = createInsertSchema(contractGraphNodes).pick({
  contractId: true,
  extractionRunId: true,
  nodeType: true,
  label: true,
  properties: true,
  confidence: true,
  sourceDocumentId: true,
  sourceText: true,
});

export const insertContractGraphEdgeSchema = createInsertSchema(contractGraphEdges).pick({
  contractId: true,
  extractionRunId: true,
  sourceNodeId: true,
  targetNodeId: true,
  relationshipType: true,
  properties: true,
  confidence: true,
});

export const insertExtractionRunSchema = createInsertSchema(extractionRuns).pick({
  contractId: true,
  runType: true,
  status: true,
  overallConfidence: true,
  nodesExtracted: true,
  edgesExtracted: true,
  rulesExtracted: true,
  validationResults: true,
  aiModel: true,
  processingTime: true,
  errorLog: true,
  triggeredBy: true,
});

export const insertRuleDefinitionSchema = createInsertSchema(ruleDefinitions).pick({
  contractId: true,
  extractionRunId: true,
  linkedGraphNodeId: true,
  ruleType: true,
  ruleName: true,
  description: true,
  formulaDefinition: true,
  applicabilityFilters: true,
  confidence: true,
  validationStatus: true,
  validationErrors: true,
  isActive: true,
  version: true,
});

export const insertRuleNodeDefinitionSchema = createInsertSchema(ruleNodeDefinitions).pick({
  nodeType: true,
  displayName: true,
  description: true,
  schema: true,
  evaluationAdapter: true,
  examples: true,
});

export const insertHumanReviewTaskSchema = createInsertSchema(humanReviewTasks).pick({
  contractId: true,
  extractionRunId: true,
  taskType: true,
  priority: true,
  status: true,
  targetId: true,
  targetType: true,
  originalData: true,
  suggestedCorrection: true,
  confidence: true,
  reviewNotes: true,
  assignedTo: true,
});

export const insertSalesFieldMappingSchema = createInsertSchema(salesFieldMappings).pick({
  contractId: true,
  sourceFieldName: true,
  targetFieldType: true,
  mappingConfidence: true,
  mappingMethod: true,
  sampleValues: true,
  approvedBy: true,
});

export const insertSemanticIndexEntrySchema = createInsertSchema(semanticIndexEntries).pick({
  contractId: true,
  indexType: true,
  sourceId: true,
  content: true,
  metadata: true,
});

export const insertRuleValidationEventSchema = createInsertSchema(ruleValidationEvents).pick({
  ruleDefinitionId: true,
  validationType: true,
  validationResult: true,
  issues: true,
  recommendations: true,
  validatorId: true,
});

// ======================
// LEAD CAPTURE TABLES
// ======================

// Early access signups from landing page
export const earlyAccessSignups = pgTable("early_access_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  name: varchar("name"),
  company: varchar("company"),
  source: varchar("source").default("landing_page"), // landing_page, referral, etc.
  status: varchar("status").notNull().default("new"), // new, contacted, scheduled, converted
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("early_access_email_idx").on(table.email),
  index("early_access_status_idx").on(table.status),
]);

// Demo requests from pricing section
export const demoRequests = pgTable("demo_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  planTier: varchar("plan_tier").notNull(), // licenseiq, licenseiq_plus, licenseiq_ultra
  source: varchar("source").default("pricing_section"), // pricing_section, other
  status: varchar("status").notNull().default("new"), // new, contacted, scheduled, converted
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("demo_requests_email_idx").on(table.email),
  index("demo_requests_status_idx").on(table.status),
  index("demo_requests_plan_idx").on(table.planTier),
]);

// ======================
// ERP CATALOG SYSTEM (Universal ERP Support)
// ======================

// ERP Systems - Define supported ERP vendors (Oracle, SAP, NetSuite, custom, etc.)
export const erpSystems = pgTable("erp_systems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Oracle ERP Cloud", "SAP S/4HANA", "Custom ERP"
  vendor: varchar("vendor").notNull(), // oracle, sap, microsoft, netsuite, workday, custom
  version: varchar("version"), // e.g., "21D", "2023", "v2.1"
  description: text("description"),
  category: varchar("category").default("enterprise"), // enterprise, sme, custom
  status: varchar("status").notNull().default("active"), // active, archived
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("erp_systems_vendor_idx").on(table.vendor),
  index("erp_systems_status_idx").on(table.status),
]);

// ERP Entities - Tables/objects within each ERP system (AR_CUSTOMERS, INV_ITEMS, etc.)
export const erpEntities = pgTable("erp_entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  systemId: varchar("system_id").notNull().references(() => erpSystems.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(), // Display name: "Customer Master", "Item Master"
  technicalName: varchar("technical_name").notNull(), // e.g., "AR_CUSTOMERS", "INV_ITEMS"
  entityType: varchar("entity_type").notNull(), // customers, items, suppliers, invoices, etc.
  description: text("description"),
  sampleData: jsonb("sample_data"), // Example records for reference
  status: varchar("status").notNull().default("active"), // active, archived
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("erp_entities_system_idx").on(table.systemId),
  index("erp_entities_type_idx").on(table.entityType),
]);

// ERP Fields - Field definitions for each entity
export const erpFields = pgTable("erp_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id").notNull().references(() => erpEntities.id, { onDelete: 'cascade' }),
  fieldName: varchar("field_name").notNull(), // e.g., "CUSTOMER_ID", "ITEM_NUMBER"
  dataType: varchar("data_type").notNull(), // varchar, number, date, boolean, json
  constraints: jsonb("constraints"), // { maxLength: 240, required: true, pattern: "..." }
  sampleValues: text("sample_values"), // Example values: "100001, 100002, 100003"
  description: text("description"),
  isPrimaryKey: boolean("is_primary_key").default(false),
  isRequired: boolean("is_required").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("erp_fields_entity_idx").on(table.entityId),
]);

// ======================
// MASTER DATA MAPPING (ERP INTEGRATION)
// ======================

// AI-driven master data mapping for ERP integrations
export const masterDataMappings = pgTable("master_data_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mappingName: varchar("mapping_name").notNull(), // e.g., "Oracle ERP - Customers"
  erpSystem: varchar("erp_system").notNull(), // ERP system name (e.g., "Oracle EBS 12.2")
  entityType: varchar("entity_type").notNull(), // Entity type name (e.g., "Customers", "Items")
  customerId: varchar("customer_id").references(() => contracts.id), // Optional: Link to specific customer contract
  sourceSchema: jsonb("source_schema").notNull(), // Your app's schema structure
  targetSchema: jsonb("target_schema").notNull(), // ERP schema structure
  mappingResults: jsonb("mapping_results").notNull(), // Array of {source_field, target_field, transformation_rule, confidence}
  status: varchar("status").notNull().default("active"), // active, archived, draft
  aiModel: varchar("ai_model").default("llama-3.3-70b-versatile"), // Track which AI model was used
  createdBy: varchar("created_by").notNull().references(() => users.id),
  notes: text("notes"), // Additional mapping notes or transformation logic
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("master_data_mappings_customer_idx").on(table.customerId),
  index("master_data_mappings_erp_idx").on(table.erpSystem),
  index("master_data_mappings_entity_idx").on(table.entityType),
  index("master_data_mappings_status_idx").on(table.status),
]);

// Data import jobs - Track ERP data import operations
export const dataImportJobs = pgTable("data_import_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mappingId: varchar("mapping_id").notNull().references(() => masterDataMappings.id, { onDelete: 'cascade' }),
  customerId: varchar("customer_id").references(() => contracts.id), // Customer/contract context
  jobName: varchar("job_name").notNull(), // e.g., "Oracle Customers Import - 2025-11-04"
  uploadMeta: jsonb("upload_meta"), // { fileName, fileSize, recordCount, etc. }
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  recordsTotal: integer("records_total").default(0),
  recordsProcessed: integer("records_processed").default(0),
  recordsFailed: integer("records_failed").default(0),
  errorLog: jsonb("error_log"), // Array of error messages
  createdBy: varchar("created_by").notNull().references(() => users.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("data_import_jobs_mapping_idx").on(table.mappingId),
  index("data_import_jobs_customer_idx").on(table.customerId),
  index("data_import_jobs_status_idx").on(table.status),
]);

// Imported ERP records - Stores actual imported data with vector embeddings
export const importedErpRecords = pgTable("imported_erp_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => dataImportJobs.id, { onDelete: 'cascade' }),
  mappingId: varchar("mapping_id").notNull().references(() => masterDataMappings.id),
  customerId: varchar("customer_id").references(() => contracts.id), // Customer context for scoped search
  sourceRecord: jsonb("source_record").notNull(), // Transformed data in your app's format
  targetRecord: jsonb("target_record").notNull(), // Original ERP data
  embedding: vector("embedding", { dimensions: 384 }), // HuggingFace MiniLM embeddings
  metadata: jsonb("metadata"), // { primaryKey, recordType, tags, etc. }
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("imported_records_job_idx").on(table.jobId),
  index("imported_records_mapping_idx").on(table.mappingId),
  index("imported_records_customer_idx").on(table.customerId),
  index("imported_records_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
]);

// ========================================
// LICENSEIQ SCHEMA CATALOG
// ========================================

// LicenseIQ Entities - Defines standard entities in the LicenseIQ platform
export const licenseiqEntities = pgTable("licenseiq_entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Sales Data", "Contracts", "Royalty Rules"
  technicalName: varchar("technical_name", { length: 100 }).notNull().unique(), // e.g., "sales_data", "contracts"
  description: text("description"), // Description of the entity
  category: varchar("category", { length: 50 }), // e.g., "Transactional", "Master Data", "Rules"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LicenseIQ Fields - Defines standard fields for each entity
export const licenseiqFields = pgTable("licenseiq_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id").notNull().references(() => licenseiqEntities.id, { onDelete: 'cascade' }),
  fieldName: varchar("field_name", { length: 100 }).notNull(), // e.g., "productName", "quantity"
  dataType: varchar("data_type", { length: 50 }).notNull(), // e.g., "string", "number", "date", "boolean"
  description: text("description"), // Description of the field
  isRequired: boolean("is_required").notNull().default(false), // Is this field mandatory
  defaultValue: varchar("default_value"), // Default value if any
  validationRules: text("validation_rules"), // JSON string with validation rules
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("licenseiq_fields_entity_idx").on(table.entityId),
]);

// ======================
// MASTER DATA MANAGEMENT
// ======================

// Companies table
export const companies = pgTable("companies", {
  id: varchar("company_id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name", { length: 500 }).notNull(),
  companyDescr: text("company_descr"),
  address1: varchar("address1", { length: 500 }),
  address2: varchar("address2", { length: 500 }),
  address3: varchar("address3", { length: 500 }),
  city: varchar("city", { length: 200 }),
  stateProvince: varchar("state_province", { length: 200 }),
  county: varchar("county", { length: 200 }),
  country: varchar("country", { length: 200 }),
  contactPerson: varchar("contact_person", { length: 300 }),
  contactEmail: varchar("contact_email", { length: 300 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactPreference: varchar("contact_preference", { length: 50 }), // email, phone, both
  
  // Audit columns
  status: varchar("status", { length: 1 }).notNull().default("A"), // A=Active, I=Inactive, D=Deleted
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  creationDate: timestamp("creation_date").notNull().defaultNow(),
  lastUpdatedBy: varchar("last_updated_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastUpdateDate: timestamp("last_update_date").notNull().defaultNow(),
}, (table) => [
  index("companies_status_idx").on(table.status),
  index("companies_name_idx").on(table.companyName),
]);

// Business Units table
export const businessUnits = pgTable("business_units", {
  id: varchar("org_id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  orgName: varchar("org_name", { length: 500 }).notNull(),
  orgDescr: text("org_descr"),
  address1: varchar("address1", { length: 500 }),
  contactPerson: varchar("contact_person", { length: 300 }),
  contactEmail: varchar("contact_email", { length: 300 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactPreference: varchar("contact_preference", { length: 50 }),
  
  // Audit columns
  status: varchar("status", { length: 1 }).notNull().default("A"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  creationDate: timestamp("creation_date").notNull().defaultNow(),
  lastUpdatedBy: varchar("last_updated_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastUpdateDate: timestamp("last_update_date").notNull().defaultNow(),
}, (table) => [
  index("business_units_company_idx").on(table.companyId),
  index("business_units_status_idx").on(table.status),
  index("business_units_name_idx").on(table.orgName),
]);

// Locations table
export const locations = pgTable("locations", {
  id: varchar("loc_id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  orgId: varchar("org_id").notNull().references(() => businessUnits.id, { onDelete: 'cascade' }),
  locName: varchar("loc_name", { length: 500 }).notNull(),
  locDescr: text("loc_descr"),
  address1: varchar("address1", { length: 500 }),
  contactPerson: varchar("contact_person", { length: 300 }),
  contactEmail: varchar("contact_email", { length: 300 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactPreference: varchar("contact_preference", { length: 50 }),
  
  // Audit columns
  status: varchar("status", { length: 1 }).notNull().default("A"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  creationDate: timestamp("creation_date").notNull().defaultNow(),
  lastUpdatedBy: varchar("last_updated_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastUpdateDate: timestamp("last_update_date").notNull().defaultNow(),
}, (table) => [
  index("locations_company_idx").on(table.companyId),
  index("locations_org_idx").on(table.orgId),
  index("locations_status_idx").on(table.status),
  index("locations_name_idx").on(table.locName),
]);

// User Organization Roles - Links users to organizations/locations with specific roles
export const userOrganizationRoles = pgTable("user_organization_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  businessUnitId: varchar("business_unit_id").references(() => businessUnits.id, { onDelete: 'cascade' }), // Optional - user can be assigned to company level
  locationId: varchar("location_id").references(() => locations.id, { onDelete: 'cascade' }), // Optional - user can be assigned to specific location
  
  // Role for this specific organization/location context
  role: varchar("role").notNull().default("viewer"), // owner, admin, editor, viewer, auditor
  
  // Audit columns
  status: varchar("status", { length: 1 }).notNull().default("A"), // A=Active, I=Inactive
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  creationDate: timestamp("creation_date").notNull().defaultNow(),
  lastUpdatedBy: varchar("last_updated_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastUpdateDate: timestamp("last_update_date").notNull().defaultNow(),
}, (table) => [
  index("user_org_roles_user_idx").on(table.userId),
  index("user_org_roles_company_idx").on(table.companyId),
  index("user_org_roles_bu_idx").on(table.businessUnitId),
  index("user_org_roles_location_idx").on(table.locationId),
  index("user_org_roles_status_idx").on(table.status),
  // Unique constraint: One role per user per organization path
  unique("user_org_unique").on(table.userId, table.companyId, table.businessUnitId, table.locationId),
]);

// User Active Context - Stores the current active organization context per user (session-level)
export const userActiveContext = pgTable("user_active_context", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }), // One active context per user
  activeOrgRoleId: varchar("active_org_role_id").notNull().references(() => userOrganizationRoles.id, { onDelete: 'cascade' }), // Current active organization role
  lastSwitched: timestamp("last_switched").notNull().defaultNow(), // When user last switched context
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("user_active_ctx_user_idx").on(table.userId),
  index("user_active_ctx_role_idx").on(table.activeOrgRoleId),
]);

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  creationDate: true,
  lastUpdateDate: true,
});

export const insertBusinessUnitSchema = createInsertSchema(businessUnits).omit({
  id: true,
  creationDate: true,
  lastUpdateDate: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  creationDate: true,
  lastUpdateDate: true,
});

export const insertUserOrganizationRoleSchema = createInsertSchema(userOrganizationRoles).omit({
  id: true,
  creationDate: true,
  lastUpdateDate: true,
});

export const insertUserActiveContextSchema = createInsertSchema(userActiveContext).omit({
  id: true,
  updatedAt: true,
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type BusinessUnit = typeof businessUnits.$inferSelect;
export type InsertBusinessUnit = z.infer<typeof insertBusinessUnitSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type UserOrganizationRole = typeof userOrganizationRoles.$inferSelect;
export type InsertUserOrganizationRole = z.infer<typeof insertUserOrganizationRoleSchema>;
export type UserActiveContext = typeof userActiveContext.$inferSelect;
export type InsertUserActiveContext = z.infer<typeof insertUserActiveContextSchema>;


// LicenseIQ Entity Records - Stores actual data for each entity (flexible schema)
export const licenseiqEntityRecords = pgTable("licenseiq_entity_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id").notNull().references(() => licenseiqEntities.id, { onDelete: 'cascade' }),
  recordData: jsonb("record_data").notNull(), // Flexible JSON data matching the entity's fields
  
  // Organization Hierarchy - Records must be linked to company hierarchy
  grpId: varchar("grp_id").notNull().references(() => companies.id, { onDelete: 'restrict' }), // Company ID - MANDATORY
  orgId: varchar("org_id").notNull().references(() => businessUnits.id, { onDelete: 'restrict' }), // Business Unit ID - MANDATORY
  locId: varchar("loc_id").notNull().references(() => locations.id, { onDelete: 'restrict' }), // Location ID - MANDATORY
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("licenseiq_records_entity_idx").on(table.entityId),
  index("licenseiq_records_grp_idx").on(table.grpId),
  index("licenseiq_records_org_idx").on(table.orgId),
  index("licenseiq_records_loc_idx").on(table.locId),
]);

// Insert schemas for lead capture
export const insertEarlyAccessSignupSchema = createInsertSchema(earlyAccessSignups).pick({
  email: true,
  name: true,
  company: true,
  source: true,
});

export const insertDemoRequestSchema = createInsertSchema(demoRequests).pick({
  email: true,
  planTier: true,
  source: true,
});

// Insert schemas for ERP Catalog
export const insertErpSystemSchema = createInsertSchema(erpSystems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErpEntitySchema = createInsertSchema(erpEntities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErpFieldSchema = createInsertSchema(erpFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schema for master data mappings
export const insertMasterDataMappingSchema = createInsertSchema(masterDataMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schema for data import jobs
export const insertDataImportJobSchema = createInsertSchema(dataImportJobs).omit({
  id: true,
  createdAt: true,
});

// Insert schema for imported ERP records
export const insertImportedErpRecordSchema = createInsertSchema(importedErpRecords).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for LicenseIQ Catalog
export const insertLicenseiqEntitySchema = createInsertSchema(licenseiqEntities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicenseiqFieldSchema = createInsertSchema(licenseiqFields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicenseiqEntityRecordSchema = createInsertSchema(licenseiqEntityRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ======================
// TYPES FOR NEW TABLES
// ======================

export type ContractDocument = typeof contractDocuments.$inferSelect;
export type InsertContractDocument = z.infer<typeof insertContractDocumentSchema>;
export type ContractGraphNode = typeof contractGraphNodes.$inferSelect;
export type InsertContractGraphNode = z.infer<typeof insertContractGraphNodeSchema>;
export type ContractGraphEdge = typeof contractGraphEdges.$inferSelect;
export type InsertContractGraphEdge = z.infer<typeof insertContractGraphEdgeSchema>;
export type ExtractionRun = typeof extractionRuns.$inferSelect;
export type InsertExtractionRun = z.infer<typeof insertExtractionRunSchema>;
export type RuleDefinition = typeof ruleDefinitions.$inferSelect;
export type InsertRuleDefinition = z.infer<typeof insertRuleDefinitionSchema>;
export type RuleNodeDefinition = typeof ruleNodeDefinitions.$inferSelect;
export type InsertRuleNodeDefinition = z.infer<typeof insertRuleNodeDefinitionSchema>;
export type HumanReviewTask = typeof humanReviewTasks.$inferSelect;
export type InsertHumanReviewTask = z.infer<typeof insertHumanReviewTaskSchema>;
export type SalesFieldMapping = typeof salesFieldMappings.$inferSelect;
export type InsertSalesFieldMapping = z.infer<typeof insertSalesFieldMappingSchema>;
export type SemanticIndexEntry = typeof semanticIndexEntries.$inferSelect;
export type InsertSemanticIndexEntry = z.infer<typeof insertSemanticIndexEntrySchema>;
export type RuleValidationEvent = typeof ruleValidationEvents.$inferSelect;
export type InsertRuleValidationEvent = z.infer<typeof insertRuleValidationEventSchema>;
export type EarlyAccessSignup = typeof earlyAccessSignups.$inferSelect;
export type InsertEarlyAccessSignup = z.infer<typeof insertEarlyAccessSignupSchema>;
export type DemoRequest = typeof demoRequests.$inferSelect;
export type InsertDemoRequest = z.infer<typeof insertDemoRequestSchema>;
export type ErpSystem = typeof erpSystems.$inferSelect;
export type InsertErpSystem = z.infer<typeof insertErpSystemSchema>;
export type ErpEntity = typeof erpEntities.$inferSelect;
export type InsertErpEntity = z.infer<typeof insertErpEntitySchema>;
export type ErpField = typeof erpFields.$inferSelect;
export type InsertErpField = z.infer<typeof insertErpFieldSchema>;
export type MasterDataMapping = typeof masterDataMappings.$inferSelect;
export type InsertMasterDataMapping = z.infer<typeof insertMasterDataMappingSchema>;
export type DataImportJob = typeof dataImportJobs.$inferSelect;
export type InsertDataImportJob = z.infer<typeof insertDataImportJobSchema>;
export type ImportedErpRecord = typeof importedErpRecords.$inferSelect;
export type InsertImportedErpRecord = z.infer<typeof insertImportedErpRecordSchema>;
export type LicenseiqEntity = typeof licenseiqEntities.$inferSelect;
export type InsertLicenseiqEntity = z.infer<typeof insertLicenseiqEntitySchema>;
export type LicenseiqField = typeof licenseiqFields.$inferSelect;
export type InsertLicenseiqField = z.infer<typeof insertLicenseiqFieldSchema>;
export type LicenseiqEntityRecord = typeof licenseiqEntityRecords.$inferSelect;
export type InsertLicenseiqEntityRecord = z.infer<typeof insertLicenseiqEntityRecordSchema>;

// ======================
// ROLES MANAGEMENT
// ======================

export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleName: varchar("role_name").notNull().unique(), // Unique role identifier (e.g., 'admin', 'editor', 'custom_analyst')
  displayName: varchar("display_name").notNull(), // User-friendly name
  description: text("description"), // Role description
  isSystemRole: boolean("is_system_role").default(false), // Prevent deletion of system roles (admin, owner, etc.)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("roles_name_idx").on(table.roleName),
]);

// Insert schema for roles
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for roles
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

// ======================
// NAVIGATION PERMISSIONS
// ======================

export const navigationPermissions = pgTable("navigation_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemKey: varchar("item_key").notNull(), // Unique identifier for nav item (e.g., 'dashboard', 'contracts')
  itemName: varchar("item_name").notNull(), // Display name
  href: varchar("href").notNull(), // Route path
  iconName: varchar("icon_name"), // Icon identifier
  defaultRoles: jsonb("default_roles").$type<string[]>().default([]), // Default roles that can see this item
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("nav_perm_item_key_idx").on(table.itemKey),
]);

export const roleNavigationPermissions = pgTable("role_navigation_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: varchar("role").notNull(), // Role name (admin, owner, user, etc.)
  navItemKey: varchar("nav_item_key").notNull().references(() => navigationPermissions.itemKey, { onDelete: 'cascade' }),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("role_nav_perm_role_idx").on(table.role),
  index("role_nav_perm_item_idx").on(table.navItemKey),
]);

export const userNavigationOverrides = pgTable("user_navigation_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  navItemKey: varchar("nav_item_key").notNull().references(() => navigationPermissions.itemKey, { onDelete: 'cascade' }),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_nav_override_user_idx").on(table.userId),
  index("user_nav_override_item_idx").on(table.navItemKey),
]);

// Insert schemas for navigation permissions
export const insertNavigationPermissionSchema = createInsertSchema(navigationPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleNavigationPermissionSchema = createInsertSchema(roleNavigationPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserNavigationOverrideSchema = createInsertSchema(userNavigationOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for navigation permissions
export type NavigationPermission = typeof navigationPermissions.$inferSelect;
export type InsertNavigationPermission = z.infer<typeof insertNavigationPermissionSchema>;
export type RoleNavigationPermission = typeof roleNavigationPermissions.$inferSelect;
export type InsertRoleNavigationPermission = z.infer<typeof insertRoleNavigationPermissionSchema>;
export type UserNavigationOverride = typeof userNavigationOverrides.$inferSelect;
export type InsertUserNavigationOverride = z.infer<typeof insertUserNavigationOverrideSchema>;

// ==================================
// NAVIGATION CATEGORIES (Tree Structure)
// ==================================

export const navigationCategories = pgTable("navigation_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryKey: varchar("category_key").notNull().unique(), // Unique identifier (e.g., 'contract_mgmt', 'analytics')
  categoryName: varchar("category_name").notNull(), // Display name (e.g., 'Contract Management')
  iconName: varchar("icon_name"), // Icon for category header
  description: text("description"), // Optional description
  defaultSortOrder: integer("default_sort_order").default(0), // Order in sidebar
  isCollapsible: boolean("is_collapsible").default(true), // Can be collapsed?
  defaultExpanded: boolean("default_expanded").default(true), // Expanded by default?
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("nav_cat_key_idx").on(table.categoryKey),
  index("nav_cat_sort_idx").on(table.defaultSortOrder),
]);

export const navigationItemCategories = pgTable("navigation_item_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  navItemKey: varchar("nav_item_key").notNull().references(() => navigationPermissions.itemKey, { onDelete: 'cascade' }),
  categoryKey: varchar("category_key").notNull().references(() => navigationCategories.categoryKey, { onDelete: 'cascade' }),
  sortOrder: integer("sort_order").default(0), // Order within category
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("nav_item_cat_item_idx").on(table.navItemKey),
  index("nav_item_cat_cat_idx").on(table.categoryKey),
]);

export const userCategoryPreferences = pgTable("user_category_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  navItemKey: varchar("nav_item_key").notNull().references(() => navigationPermissions.itemKey, { onDelete: 'cascade' }),
  categoryKey: varchar("category_key").notNull().references(() => navigationCategories.categoryKey, { onDelete: 'cascade' }),
  sortOrder: integer("sort_order").default(0), // User's custom order
  isVisible: boolean("is_visible").default(true), // User can hide items
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_cat_pref_user_idx").on(table.userId),
  index("user_cat_pref_item_idx").on(table.navItemKey),
]);

export const userCategoryState = pgTable("user_category_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryKey: varchar("category_key").notNull().references(() => navigationCategories.categoryKey, { onDelete: 'cascade' }),
  isExpanded: boolean("is_expanded").default(true), // Remember collapsed/expanded state
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_cat_state_user_idx").on(table.userId),
  index("user_cat_state_cat_idx").on(table.categoryKey),
]);

// Insert schemas for navigation categories
export const insertNavigationCategorySchema = createInsertSchema(navigationCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNavigationItemCategorySchema = createInsertSchema(navigationItemCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCategoryPreferenceSchema = createInsertSchema(userCategoryPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCategoryStateSchema = createInsertSchema(userCategoryState).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for navigation categories
export type NavigationCategory = typeof navigationCategories.$inferSelect;
export type InsertNavigationCategory = z.infer<typeof insertNavigationCategorySchema>;
export type NavigationItemCategory = typeof navigationItemCategories.$inferSelect;
export type InsertNavigationItemCategory = z.infer<typeof insertNavigationItemCategorySchema>;
export type UserCategoryPreference = typeof userCategoryPreferences.$inferSelect;
export type InsertUserCategoryPreference = z.infer<typeof insertUserCategoryPreferenceSchema>;
export type UserCategoryState = typeof userCategoryState.$inferSelect;
export type InsertUserCategoryState = z.infer<typeof insertUserCategoryStateSchema>;

