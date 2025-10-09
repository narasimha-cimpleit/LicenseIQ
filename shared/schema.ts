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
// AI-DRIVEN ROYALTY CALCULATION SYSTEM
// ======================

// Contract-based Royalty Calculations (AI-Matched Workflow)
export const contractRoyaltyCalculations = pgTable("contract_royalty_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ======================
// INSERT SCHEMAS
// ======================

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

// ======================
// TYPES
// ======================

export type ContractRoyaltyCalculation = typeof contractRoyaltyCalculations.$inferSelect;
export type InsertContractRoyaltyCalculation = z.infer<typeof insertContractRoyaltyCalculationSchema>;
