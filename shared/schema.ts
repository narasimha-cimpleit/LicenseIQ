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
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id), // Link to vendor for royalty calculation
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
});

// Contract analysis results
export const contractAnalysis = pgTable("contract_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
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
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  embeddingType: varchar("embedding_type").notNull(), // 'product', 'territory', 'full_contract', 'rule_description'
  sourceText: text("source_text").notNull(), // Original text that was embedded
  embedding: vector("embedding", { dimensions: 384 }), // Hugging Face sentence-transformers/all-MiniLM-L6-v2 produces 384 dimensions
  metadata: jsonb("metadata"), // Additional context (product categories, territories, date ranges, etc.)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("contract_embeddings_contract_idx").on(table.contractId),
  index("contract_embeddings_type_idx").on(table.embeddingType),
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
  fileName: true,
  originalName: true,
  fileSize: true,
  fileType: true,
  filePath: true,
  contractType: true,
  priority: true,
  uploadedBy: true,
  notes: true,
});

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

// Financial Analysis table
export const financialAnalysis = pgTable("financial_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
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
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
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
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
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
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
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
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
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
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
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
// ROYALTY CALCULATION SYSTEM TABLES
// ======================

// Vendors/Licensors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  code: varchar("code").unique().notNull(), // Short vendor code for identification
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  address: text("address"),
  taxId: varchar("tax_id"),
  currency: varchar("currency").default("USD"),
  paymentTerms: varchar("payment_terms"), // Net 30, Net 60, etc
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// License Documents table (separate from general contracts)
export const licenseDocuments = pgTable("license_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  licenseType: varchar("license_type"), // Royalty, Fixed Fee, Revenue Share, etc
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  status: varchar("status").default("uploaded"), // uploaded, processing, extracted, active
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// License RuleSets (versioned)
export const licenseRuleSets = pgTable("license_rule_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseDocumentId: varchar("license_document_id").references(() => licenseDocuments.id), // Made optional for unified workflow
  vendorId: varchar("vendor_id").references(() => vendors.id), // Made optional for unified workflow
  contractId: varchar("contract_id").references(() => contracts.id), // NEW: Support contracts in unified workflow
  version: integer("version").notNull(),
  name: varchar("name").notNull(),
  status: varchar("status").default("draft"), // draft, published, archived
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  rulesDsl: jsonb("rules_dsl").notNull(), // JSON DSL for calculation rules
  extractionMetadata: jsonb("extraction_metadata"), // AI extraction confidence, source spans, etc
  publishedBy: varchar("published_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual License Rules within a RuleSet
export const licenseRules = pgTable("license_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleSetId: varchar("rule_set_id").notNull().references(() => licenseRuleSets.id),
  ruleType: varchar("rule_type").notNull(), // percentage, tiered, minimum_guarantee, cap, deduction
  ruleName: varchar("rule_name").notNull(),
  conditions: jsonb("conditions"), // Conditions when this rule applies
  calculation: jsonb("calculation"), // Calculation parameters
  priority: integer("priority").default(0), // Order of execution
  isActive: boolean("is_active").default(true),
  sourceSpan: jsonb("source_span"), // PDF page/coordinates where this rule was found
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // AI extraction confidence
  createdAt: timestamp("created_at").defaultNow(),
});

// ERP Connections table
export const erpConnections = pgTable("erp_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  erpType: varchar("erp_type").notNull(), // csv, sftp, netsuite, sap, dynamics, etc
  connectionConfig: jsonb("connection_config"), // Encrypted connection details
  mappingConfig: jsonb("mapping_config"), // Field mapping configuration
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales Data Staging table
export const salesStaging = pgTable("sales_staging", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  importJobId: varchar("import_job_id").notNull(),
  externalId: varchar("external_id"), // ID from source system
  rowData: jsonb("row_data").notNull(), // Raw imported data
  validationStatus: varchar("validation_status").default("pending"), // pending, valid, invalid
  validationErrors: jsonb("validation_errors"), // Array of validation errors
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Normalized Sales Data table
export const salesData = pgTable("sales_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  transactionDate: timestamp("transaction_date").notNull(),
  transactionId: varchar("transaction_id"), // External transaction ID
  productCode: varchar("product_code"),
  productName: varchar("product_name"),
  category: varchar("category"),
  territory: varchar("territory"),
  currency: varchar("currency").default("USD"),
  grossAmount: decimal("gross_amount", { precision: 15, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }),
  quantity: decimal("quantity", { precision: 12, scale: 4 }),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }),
  customFields: jsonb("custom_fields"), // Additional flexible fields
  importJobId: varchar("import_job_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Royalty Calculation Runs
export const royaltyRuns = pgTable("royalty_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  ruleSetId: varchar("rule_set_id").references(() => licenseRuleSets.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  status: varchar("status").default("pending"), // pending, calculating, awaiting_approval, approved, rejected, completed, failed
  totalSalesAmount: decimal("total_sales_amount", { precision: 15, scale: 2 }),
  totalRoyalty: decimal("total_royalty", { precision: 15, scale: 2 }),
  recordsProcessed: integer("records_processed"),
  executionLog: jsonb("execution_log"), // Detailed calculation log
  runBy: varchar("run_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Detailed Royalty Calculation Results
export const royaltyResults = pgTable("royalty_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").notNull().references(() => royaltyRuns.id),
  salesDataId: varchar("sales_data_id").references(() => salesData.id),
  ruleId: varchar("rule_id").references(() => licenseRules.id),
  salesAmount: decimal("sales_amount", { precision: 15, scale: 2 }).notNull(),
  royaltyAmount: decimal("royalty_amount", { precision: 15, scale: 2 }).notNull(),
  royaltyRate: decimal("royalty_rate", { precision: 8, scale: 4 }), // Actual rate applied
  calculationDetails: jsonb("calculation_details"), // Step-by-step calculation
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Mappings (for vendor product codes to internal categories)
export const productMappings = pgTable("product_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  externalCode: varchar("external_code").notNull(), // Product code from ERP
  internalCategory: varchar("internal_category").notNull(),
  description: varchar("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ERP Import Jobs tracking
export const erpImportJobs = pgTable("erp_import_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").references(() => erpConnections.id),
  // vendorId removed - using semantic matching instead of manual vendor selection
  jobType: varchar("job_type").notNull(), // manual_upload, scheduled_import, api_sync
  fileName: varchar("file_name"),
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  recordsImported: integer("records_imported"),
  recordsFailed: integer("records_failed"),
  errors: jsonb("errors"), // Import errors
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ======================
// INSERT SCHEMAS FOR NEW TABLES
// ======================

export const insertVendorSchema = createInsertSchema(vendors).pick({
  name: true,
  code: true,
  contactEmail: true,
  contactPhone: true,
  address: true,
  taxId: true,
  currency: true,
  paymentTerms: true,
  notes: true,
  isActive: true,
  createdBy: true,
});

export const insertLicenseDocumentSchema = createInsertSchema(licenseDocuments).pick({
  vendorId: true,
  fileName: true,
  originalName: true,
  filePath: true,
  fileSize: true,
  licenseType: true,
  effectiveDate: true,
  expirationDate: true,
  uploadedBy: true,
});

export const insertLicenseRuleSetSchema = createInsertSchema(licenseRuleSets).pick({
  licenseDocumentId: true,
  vendorId: true,
  contractId: true,
  version: true,
  name: true,
  effectiveDate: true,
  expirationDate: true,
  rulesDsl: true,
  extractionMetadata: true,
  createdBy: true,
});

export const insertSalesDataSchema = createInsertSchema(salesData).pick({
  vendorId: true,
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

export const insertRoyaltyRunSchema = createInsertSchema(royaltyRuns).pick({
  name: true,
  vendorId: true,
  ruleSetId: true,
  periodStart: true,
  periodEnd: true,
  runBy: true,
});

// ======================
// TYPES FOR NEW TABLES
// ======================

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type LicenseDocument = typeof licenseDocuments.$inferSelect;
export type InsertLicenseDocument = z.infer<typeof insertLicenseDocumentSchema>;
export type LicenseRuleSet = typeof licenseRuleSets.$inferSelect;
export type InsertLicenseRuleSet = z.infer<typeof insertLicenseRuleSetSchema>;
export type LicenseRule = typeof licenseRules.$inferSelect;
export type ErpConnection = typeof erpConnections.$inferSelect;
export type SalesStaging = typeof salesStaging.$inferSelect;
export type SalesData = typeof salesData.$inferSelect;
export type InsertSalesData = z.infer<typeof insertSalesDataSchema>;
export type RoyaltyRun = typeof royaltyRuns.$inferSelect;
export type InsertRoyaltyRun = z.infer<typeof insertRoyaltyRunSchema>;
export type RoyaltyResult = typeof royaltyResults.$inferSelect;
export type ProductMapping = typeof productMappings.$inferSelect;
export type ErpImportJob = typeof erpImportJobs.$inferSelect;

// Enhanced types with relationships
export type VendorWithLicenses = Vendor & {
  licenseDocuments?: LicenseDocument[];
  ruleSets?: LicenseRuleSet[];
  salesData?: SalesData[];
};

export type LicenseDocumentWithRules = LicenseDocument & {
  vendor?: Vendor;
  ruleSets?: LicenseRuleSet[];
};

export type RoyaltyRunWithDetails = RoyaltyRun & {
  vendor?: Vendor;
  ruleSet?: LicenseRuleSet;
  results?: RoyaltyResult[];
};
