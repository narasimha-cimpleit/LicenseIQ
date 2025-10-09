import {
  users,
  contracts,
  contractAnalysis,
  auditTrail,
  financialAnalysis,
  complianceAnalysis,
  contractObligations,
  performanceMetrics,
  strategicAnalysis,
  contractComparisons,
  marketBenchmarks,
  // Royalty system imports
  vendors,
  licenseDocuments,
  licenseRuleSets,
  licenseRules,
  erpConnections,
  salesStaging,
  salesData,
  royaltyRuns,
  royaltyResults,
  productMappings,
  erpImportJobs,
  type User,
  type InsertUser,
  type Contract,
  type InsertContract,
  type ContractAnalysis,
  type InsertContractAnalysis,
  type AuditTrail,
  type InsertAuditTrail,
  type ContractWithAnalysis,
  type FinancialAnalysis,
  type InsertFinancialAnalysis,
  type ComplianceAnalysis,
  type InsertComplianceAnalysis,
  type ContractObligation,
  type InsertContractObligation,
  type PerformanceMetrics,
  type InsertPerformanceMetrics,
  type StrategicAnalysis,
  type InsertStrategicAnalysis,
  type ContractComparison,
  type InsertContractComparison,
  type MarketBenchmark,
  type InsertMarketBenchmark,
  // Royalty system types
  type Vendor,
  type InsertVendor,
  type LicenseDocument,
  type InsertLicenseDocument,
  type LicenseRuleSet,
  type InsertLicenseRuleSet,
  type LicenseRule,
  type ErpConnection,
  type SalesStaging,
  type SalesData,
  type InsertSalesData,
  type RoyaltyRun,
  type InsertRoyaltyRun,
  type RoyaltyResult,
  type ProductMapping,
  type ErpImportJob,
  type VendorWithLicenses,
  type LicenseDocumentWithRules,
  type RoyaltyRunWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User>;
  getAllUsers(search?: string, role?: string): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  resetUserPassword(id: string, newPassword: string): Promise<User>;
  getAdminCount(): Promise<number>;
  
  // Contract operations
  createContract(contract: InsertContract): Promise<Contract>;
  getContract(id: string): Promise<ContractWithAnalysis | undefined>;
  getContracts(userId?: string, limit?: number, offset?: number): Promise<{ contracts: ContractWithAnalysis[], total: number }>;
  updateContractStatus(id: string, status: string, processingTime?: number): Promise<Contract>;
  searchContracts(query: string, userId?: string): Promise<ContractWithAnalysis[]>;
  getContractsByUser(userId: string): Promise<Contract[]>;
  getContractsByVendor(vendorId: string): Promise<Contract[]>;
  deleteContract(id: string): Promise<void>;

  // ==========================================
  // ROYALTY SYSTEM OPERATIONS
  // ==========================================
  
  // Vendor operations
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  getVendor(id: string): Promise<VendorWithLicenses | undefined>;
  getVendors(search?: string): Promise<VendorWithLicenses[]>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;
  
  // License Document operations
  createLicenseDocument(licenseDoc: InsertLicenseDocument): Promise<LicenseDocument>;
  getLicenseDocument(id: string): Promise<LicenseDocumentWithRules | undefined>;
  getLicenseDocuments(vendorId?: string): Promise<LicenseDocumentWithRules[]>;
  updateLicenseDocumentStatus(id: string, status: string): Promise<LicenseDocument>;
  deleteLicenseDocument(id: string): Promise<void>;
  
  // License Rule Set operations
  createLicenseRuleSet(ruleSet: InsertLicenseRuleSet): Promise<LicenseRuleSet>;
  getLicenseRuleSet(id: string): Promise<LicenseRuleSet | undefined>;
  getLicenseRuleSets(licenseDocumentId?: string, vendorId?: string, status?: string): Promise<LicenseRuleSet[]>;
  getLicenseRuleSetsByContract(contractId: string): Promise<LicenseRuleSet[]>;
  publishLicenseRuleSet(id: string, publishedBy: string): Promise<LicenseRuleSet>;
  updateLicenseRuleSet(id: string, updates: Partial<InsertLicenseRuleSet>): Promise<LicenseRuleSet>;
  deleteLicenseRuleSet(id: string): Promise<void>;
  
  // License Rule operations
  createLicenseRule(rule: Omit<LicenseRule, 'id' | 'createdAt'>): Promise<LicenseRule>;
  getLicenseRules(ruleSetId: string): Promise<LicenseRule[]>;
  updateLicenseRule(id: string, updates: Partial<Omit<LicenseRule, 'id' | 'createdAt'>>): Promise<LicenseRule>;
  deleteLicenseRule(id: string): Promise<void>;
  
  // Sales Data operations
  createSalesData(salesData: InsertSalesData): Promise<SalesData>;
  getSalesData(vendorId?: string, startDate?: Date, endDate?: Date): Promise<SalesData[]>;
  importSalesDataBatch(salesDataList: InsertSalesData[]): Promise<SalesData[]>;
  deleteSalesData(vendorId: string, importJobId?: string): Promise<void>;
  
  // Royalty Run operations
  createRoyaltyRun(run: InsertRoyaltyRun): Promise<RoyaltyRun>;
  getRoyaltyRun(id: string): Promise<RoyaltyRunWithDetails | undefined>;
  getRoyaltyRuns(vendorId?: string, status?: string): Promise<RoyaltyRunWithDetails[]>;
  updateRoyaltyRunStatus(id: string, status: string, totals?: {totalSalesAmount?: number, totalRoyalty?: number, recordsProcessed?: number}): Promise<RoyaltyRun>;
  approveRoyaltyRun(id: string, approvedBy: string): Promise<RoyaltyRun>;
  rejectRoyaltyRun(id: string, rejectionReason: string): Promise<RoyaltyRun>;
  deleteRoyaltyRun(id: string): Promise<void>;
  
  // Royalty Result operations
  createRoyaltyResults(results: Omit<RoyaltyResult, 'id' | 'createdAt'>[]): Promise<RoyaltyResult[]>;
  getRoyaltyResults(runId: string): Promise<RoyaltyResult[]>;
  deleteRoyaltyResults(runId: string): Promise<void>;
  
  // ERP Import Job operations
  createErpImportJob(job: Omit<ErpImportJob, 'id' | 'createdAt'>): Promise<ErpImportJob>;
  getErpImportJob(id: string): Promise<ErpImportJob | undefined>;
  getErpImportJobs(createdBy?: string, status?: string): Promise<ErpImportJob[]>;
  updateErpImportJobStatus(id: string, status: string, counts?: {recordsImported?: number, recordsFailed?: number}): Promise<ErpImportJob>;
  
  // Sales Staging operations
  createSalesStaging(staging: Omit<SalesStaging, 'id' | 'createdAt'>): Promise<SalesStaging>;
  getSalesStaging(importJobId: string): Promise<SalesStaging[]>;
  updateStagingValidation(id: string, status: string, errors?: any): Promise<SalesStaging>;
  promoteStagingToSales(importJobId: string): Promise<number>;
  
  // Contract analysis operations
  createContractAnalysis(analysis: InsertContractAnalysis): Promise<ContractAnalysis>;
  getContractAnalysis(contractId: string): Promise<ContractAnalysis | undefined>;
  updateContractAnalysis(contractId: string, analysis: Partial<InsertContractAnalysis>): Promise<ContractAnalysis>;
  deleteContractAnalysis(contractId: string): Promise<void>;
  
  // Financial analysis operations
  createFinancialAnalysis(analysis: InsertFinancialAnalysis): Promise<FinancialAnalysis>;
  getFinancialAnalysis(contractId: string): Promise<FinancialAnalysis | undefined>;
  updateFinancialAnalysis(contractId: string, analysis: Partial<InsertFinancialAnalysis>): Promise<FinancialAnalysis>;
  deleteFinancialAnalysis(contractId: string): Promise<void>;
  
  // Compliance analysis operations
  createComplianceAnalysis(analysis: InsertComplianceAnalysis): Promise<ComplianceAnalysis>;
  getComplianceAnalysis(contractId: string): Promise<ComplianceAnalysis | undefined>;
  updateComplianceAnalysis(contractId: string, analysis: Partial<InsertComplianceAnalysis>): Promise<ComplianceAnalysis>;
  deleteComplianceAnalysis(contractId: string): Promise<void>;
  
  // Contract obligations operations
  createContractObligation(obligation: InsertContractObligation): Promise<ContractObligation>;
  getContractObligations(contractId: string): Promise<ContractObligation[]>;
  updateObligationStatus(id: string, status: string, completionDate?: Date): Promise<ContractObligation>;
  deleteContractObligation(id: string): Promise<void>;
  
  // Performance metrics operations
  createPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics>;
  getPerformanceMetrics(contractId: string): Promise<PerformanceMetrics | undefined>;
  updatePerformanceMetrics(contractId: string, metrics: Partial<InsertPerformanceMetrics>): Promise<PerformanceMetrics>;
  deletePerformanceMetrics(contractId: string): Promise<void>;
  
  // Strategic analysis operations
  createStrategicAnalysis(analysis: InsertStrategicAnalysis): Promise<StrategicAnalysis>;
  getStrategicAnalysis(contractId: string): Promise<StrategicAnalysis | undefined>;
  updateStrategicAnalysis(contractId: string, analysis: Partial<InsertStrategicAnalysis>): Promise<StrategicAnalysis>;
  deleteStrategicAnalysis(contractId: string): Promise<void>;
  
  // Contract comparison operations
  createContractComparison(comparison: InsertContractComparison): Promise<ContractComparison>;
  getContractComparison(contractId: string): Promise<ContractComparison | undefined>;
  updateContractComparison(contractId: string, comparison: Partial<InsertContractComparison>): Promise<ContractComparison>;
  deleteContractComparison(contractId: string): Promise<void>;
  
  // Market benchmark operations
  createMarketBenchmark(benchmark: InsertMarketBenchmark): Promise<MarketBenchmark>;
  getMarketBenchmarks(contractType?: string, industry?: string): Promise<MarketBenchmark[]>;
  updateMarketBenchmark(id: string, benchmark: Partial<InsertMarketBenchmark>): Promise<MarketBenchmark>;
  deleteMarketBenchmark(id: string): Promise<void>;
  
  // Audit trail operations
  createAuditLog(audit: InsertAuditTrail): Promise<AuditTrail>;
  getAuditLogs(userId?: string, limit?: number, offset?: number): Promise<{ logs: AuditTrail[], total: number }>;
  
  // Analytics operations
  getContractMetrics(userId?: string): Promise<{
    totalContracts: number;
    processing: number;
    analyzed: number;
    recentUploads: number;
    activeUsers: number;
  }>;
  
  // Advanced analytics operations
  getPortfolioAnalytics(userId?: string): Promise<{
    totalValue: number;
    avgPerformanceScore: number;
    complianceRate: number;
    upcomingObligations: number;
    renewalsPending: number;
  }>;

  // Aggregate analytics operations
  getFinancialAnalytics(userId?: string): Promise<{
    totalContractValue: number;
    avgContractValue: number;
    totalPaymentScheduled: number;
    currencyDistribution: Record<string, number>;
    riskDistribution: { low: number; medium: number; high: number };
    topPaymentTerms: Array<{ term: string; count: number }>;
  }>;

  getComplianceAnalytics(userId?: string): Promise<{
    avgComplianceScore: number;
    complianceDistribution: { compliant: number; partial: number; nonCompliant: number };
    topRegulatoryFrameworks: Array<{ framework: string; count: number }>;
    jurisdictionBreakdown: Record<string, number>;
    dataProtectionCompliance: number;
  }>;

  getStrategicAnalytics(userId?: string): Promise<{
    avgStrategicValue: number;
    marketAlignmentDistribution: { high: number; medium: number; low: number };
    competitiveAdvantages: Array<{ advantage: string; count: number }>;
    avgRiskConcentration: number;
    topRecommendations: Array<{ recommendation: string; frequency: number }>;
  }>;

  getPerformanceAnalytics(userId?: string): Promise<{
    avgPerformanceScore: number;
    avgMilestoneCompletion: number;
    onTimeDeliveryRate: number;
    avgBudgetVariance: number;
    avgQualityScore: number;
    avgRenewalProbability: number;
  }>;

  getRiskAnalytics(userId?: string): Promise<{
    riskDistribution: { high: number; medium: number; low: number };
    topRiskFactors: Array<{ risk: string; frequency: number }>;
    avgRiskScore: number;
    contractsAtRisk: number;
    riskTrends: Array<{ date: string; riskScore: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(search?: string, role?: string): Promise<User[]> {
    let query = db.select().from(users);
    
    const conditions = [];
    if (search) {
      conditions.push(
        ilike(users.email, `%${search}%`)
      );
    }
    if (role) {
      conditions.push(eq(users.role, role));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(users.createdAt));
  }

  // Contract operations
  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db
      .insert(contracts)
      .values(contract)
      .returning();
    return newContract;
  }

  async getContract(id: string): Promise<ContractWithAnalysis | undefined> {
    const result = await db
      .select({
        contract: contracts,
        analysis: contractAnalysis,
        uploadedByUser: users,
      })
      .from(contracts)
      .leftJoin(contractAnalysis, eq(contracts.id, contractAnalysis.contractId))
      .leftJoin(users, eq(contracts.uploadedBy, users.id))
      .where(eq(contracts.id, id));

    if (result.length === 0) return undefined;

    const { contract, analysis, uploadedByUser } = result[0];
    return {
      ...contract,
      analysis: analysis || undefined,
      uploadedByUser: uploadedByUser || undefined,
    };
  }

  async getContracts(userId?: string, limit = 20, offset = 0): Promise<{ contracts: ContractWithAnalysis[], total: number }> {
    let contractsQuery = db
      .select({
        contract: contracts,
        analysis: contractAnalysis,
        uploadedByUser: users,
      })
      .from(contracts)
      .leftJoin(contractAnalysis, eq(contracts.id, contractAnalysis.contractId))
      .leftJoin(users, eq(contracts.uploadedBy, users.id));

    let countQuery = db.select({ count: count() }).from(contracts);

    if (userId) {
      contractsQuery = contractsQuery.where(eq(contracts.uploadedBy, userId));
      countQuery = countQuery.where(eq(contracts.uploadedBy, userId));
    }

    const [contractsResult, totalResult] = await Promise.all([
      contractsQuery
        .orderBy(desc(contracts.createdAt))
        .limit(limit)
        .offset(offset),
      countQuery
    ]);

    const contractsWithAnalysis = contractsResult.map(({ contract, analysis, uploadedByUser }) => ({
      ...contract,
      analysis: analysis || undefined,
      uploadedByUser: uploadedByUser || undefined,
    }));

    return {
      contracts: contractsWithAnalysis,
      total: totalResult[0].count,
    };
  }

  async updateContractStatus(id: string, status: string, processingTime?: number): Promise<Contract> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (status === 'processing') {
      updateData.processingStartedAt = new Date();
    } else if (status === 'analyzed' || status === 'failed') {
      updateData.processingCompletedAt = new Date();
    }

    const [contract] = await db
      .update(contracts)
      .set(updateData)
      .where(eq(contracts.id, id))
      .returning();
    return contract;
  }

  async updateContractFlag(id: string, flagged: boolean): Promise<Contract> {
    const [contract] = await db
      .update(contracts)
      .set({ 
        flaggedForReview: flagged,
        updatedAt: new Date() 
      })
      .where(eq(contracts.id, id))
      .returning();
    return contract;
  }

  async searchContracts(query: string, userId?: string): Promise<ContractWithAnalysis[]> {
    let searchQuery = db
      .select({
        contract: contracts,
        analysis: contractAnalysis,
        uploadedByUser: users,
      })
      .from(contracts)
      .leftJoin(contractAnalysis, eq(contracts.id, contractAnalysis.contractId))
      .leftJoin(users, eq(contracts.uploadedBy, users.id))
      .where(
        ilike(contracts.originalName, `%${query}%`)
      );

    if (userId) {
      searchQuery = searchQuery.where(
        and(
          ilike(contracts.originalName, `%${query}%`),
          eq(contracts.uploadedBy, userId)
        )
      );
    }

    const result = await searchQuery.orderBy(desc(contracts.createdAt));

    return result.map(({ contract, analysis, uploadedByUser }) => ({
      ...contract,
      analysis: analysis || undefined,
      uploadedByUser: uploadedByUser || undefined,
    }));
  }

  async getContractsByUser(userId: string): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.uploadedBy, userId))
      .orderBy(desc(contracts.createdAt));
  }

  async getContractsByVendor(vendorId: string): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.vendorId, vendorId))
      .orderBy(desc(contracts.createdAt));
  }

  async deleteContract(id: string): Promise<void> {
    // First delete the associated analysis if it exists
    await db.delete(contractAnalysis).where(eq(contractAnalysis.contractId, id));
    
    // Then delete the contract itself
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  // Contract analysis operations
  async createContractAnalysis(analysis: InsertContractAnalysis): Promise<ContractAnalysis> {
    const [newAnalysis] = await db
      .insert(contractAnalysis)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async deleteContractAnalysis(contractId: string): Promise<void> {
    await db.delete(contractAnalysis).where(eq(contractAnalysis.contractId, contractId));
  }

  async getContractAnalysis(contractId: string): Promise<ContractAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(contractAnalysis)
      .where(eq(contractAnalysis.contractId, contractId));
    return analysis;
  }

  async updateContractAnalysis(contractId: string, analysisData: Partial<InsertContractAnalysis>): Promise<ContractAnalysis> {
    const [analysis] = await db
      .update(contractAnalysis)
      .set({ ...analysisData, updatedAt: new Date() })
      .where(eq(contractAnalysis.contractId, contractId))
      .returning();
    return analysis;
  }

  // Audit trail operations
  async createAuditLog(audit: InsertAuditTrail): Promise<AuditTrail> {
    const [log] = await db
      .insert(auditTrail)
      .values(audit)
      .returning();
    return log;
  }

  async getAuditLogs(userId?: string, limit = 50, offset = 0): Promise<{ logs: AuditTrail[], total: number }> {
    let logsQuery = db.select().from(auditTrail);
    let countQuery = db.select({ count: count() }).from(auditTrail);

    if (userId) {
      logsQuery = logsQuery.where(eq(auditTrail.userId, userId));
      countQuery = countQuery.where(eq(auditTrail.userId, userId));
    }

    const [logs, totalResult] = await Promise.all([
      logsQuery
        .orderBy(desc(auditTrail.createdAt))
        .limit(limit)
        .offset(offset),
      countQuery
    ]);

    return {
      logs,
      total: totalResult[0].count,
    };
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async resetUserPassword(id: string, newPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAdminCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(users)
      .where(or(eq(users.role, 'admin'), eq(users.role, 'owner')));
    return result[0].count;
  }

  // Delete contract analysis  
  async deleteContractAnalysis(contractId: string): Promise<void> {
    await db.delete(contractAnalysis).where(eq(contractAnalysis.contractId, contractId));
  }

  // Financial analysis operations
  async createFinancialAnalysis(analysisData: InsertFinancialAnalysis): Promise<FinancialAnalysis> {
    const [analysis] = await db
      .insert(financialAnalysis)
      .values(analysisData)
      .returning();
    return analysis;
  }

  async getFinancialAnalysis(contractId: string): Promise<FinancialAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(financialAnalysis)
      .where(eq(financialAnalysis.contractId, contractId));
    return analysis;
  }

  async updateFinancialAnalysis(contractId: string, updates: Partial<InsertFinancialAnalysis>): Promise<FinancialAnalysis> {
    const [analysis] = await db
      .update(financialAnalysis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(financialAnalysis.contractId, contractId))
      .returning();
    return analysis;
  }

  async deleteFinancialAnalysis(contractId: string): Promise<void> {
    await db.delete(financialAnalysis).where(eq(financialAnalysis.contractId, contractId));
  }

  // Compliance analysis operations
  async createComplianceAnalysis(analysisData: InsertComplianceAnalysis): Promise<ComplianceAnalysis> {
    const [analysis] = await db
      .insert(complianceAnalysis)
      .values(analysisData)
      .returning();
    return analysis;
  }

  async getComplianceAnalysis(contractId: string): Promise<ComplianceAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(complianceAnalysis)
      .where(eq(complianceAnalysis.contractId, contractId));
    return analysis;
  }

  async updateComplianceAnalysis(contractId: string, updates: Partial<InsertComplianceAnalysis>): Promise<ComplianceAnalysis> {
    const [analysis] = await db
      .update(complianceAnalysis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(complianceAnalysis.contractId, contractId))
      .returning();
    return analysis;
  }

  async deleteComplianceAnalysis(contractId: string): Promise<void> {
    await db.delete(complianceAnalysis).where(eq(complianceAnalysis.contractId, contractId));
  }

  // Contract obligations operations
  async createContractObligation(obligationData: InsertContractObligation): Promise<ContractObligation> {
    const [obligation] = await db
      .insert(contractObligations)
      .values(obligationData)
      .returning();
    return obligation;
  }

  async getContractObligations(contractId: string): Promise<ContractObligation[]> {
    return await db
      .select()
      .from(contractObligations)
      .where(eq(contractObligations.contractId, contractId))
      .orderBy(desc(contractObligations.dueDate));
  }

  async updateObligationStatus(id: string, status: string, completionDate?: Date): Promise<ContractObligation> {
    const updates: any = { status, updatedAt: new Date() };
    if (completionDate) {
      updates.completionDate = completionDate;
    }
    
    const [obligation] = await db
      .update(contractObligations)
      .set(updates)
      .where(eq(contractObligations.id, id))
      .returning();
    return obligation;
  }

  async deleteContractObligation(id: string): Promise<void> {
    await db.delete(contractObligations).where(eq(contractObligations.id, id));
  }

  // Performance metrics operations
  async createPerformanceMetrics(metricsData: InsertPerformanceMetrics): Promise<PerformanceMetrics> {
    const [metrics] = await db
      .insert(performanceMetrics)
      .values(metricsData)
      .returning();
    return metrics;
  }

  async getPerformanceMetrics(contractId: string): Promise<PerformanceMetrics | undefined> {
    const [metrics] = await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.contractId, contractId));
    return metrics;
  }

  async updatePerformanceMetrics(contractId: string, updates: Partial<InsertPerformanceMetrics>): Promise<PerformanceMetrics> {
    const [metrics] = await db
      .update(performanceMetrics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(performanceMetrics.contractId, contractId))
      .returning();
    return metrics;
  }

  async deletePerformanceMetrics(contractId: string): Promise<void> {
    await db.delete(performanceMetrics).where(eq(performanceMetrics.contractId, contractId));
  }

  // Strategic analysis operations
  async createStrategicAnalysis(analysisData: InsertStrategicAnalysis): Promise<StrategicAnalysis> {
    const [analysis] = await db
      .insert(strategicAnalysis)
      .values(analysisData)
      .returning();
    return analysis;
  }

  async getStrategicAnalysis(contractId: string): Promise<StrategicAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(strategicAnalysis)
      .where(eq(strategicAnalysis.contractId, contractId));
    return analysis;
  }

  async updateStrategicAnalysis(contractId: string, updates: Partial<InsertStrategicAnalysis>): Promise<StrategicAnalysis> {
    const [analysis] = await db
      .update(strategicAnalysis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(strategicAnalysis.contractId, contractId))
      .returning();
    return analysis;
  }

  async deleteStrategicAnalysis(contractId: string): Promise<void> {
    await db.delete(strategicAnalysis).where(eq(strategicAnalysis.contractId, contractId));
  }

  // Contract comparison operations
  async createContractComparison(comparisonData: InsertContractComparison): Promise<ContractComparison> {
    const [comparison] = await db
      .insert(contractComparisons)
      .values(comparisonData)
      .returning();
    return comparison;
  }

  async getContractComparison(contractId: string): Promise<ContractComparison | undefined> {
    const [comparison] = await db
      .select()
      .from(contractComparisons)
      .where(eq(contractComparisons.contractId, contractId));
    return comparison;
  }

  async updateContractComparison(contractId: string, updates: Partial<InsertContractComparison>): Promise<ContractComparison> {
    const [comparison] = await db
      .update(contractComparisons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractComparisons.contractId, contractId))
      .returning();
    return comparison;
  }

  async deleteContractComparison(contractId: string): Promise<void> {
    await db.delete(contractComparisons).where(eq(contractComparisons.contractId, contractId));
  }

  // Market benchmark operations
  async createMarketBenchmark(benchmarkData: InsertMarketBenchmark): Promise<MarketBenchmark> {
    const [benchmark] = await db
      .insert(marketBenchmarks)
      .values(benchmarkData)
      .returning();
    return benchmark;
  }

  async getMarketBenchmarks(contractType?: string, industry?: string): Promise<MarketBenchmark[]> {
    let query = db.select().from(marketBenchmarks);
    
    if (contractType || industry) {
      const conditions = [];
      if (contractType) conditions.push(eq(marketBenchmarks.contractType, contractType));
      if (industry) conditions.push(eq(marketBenchmarks.industry, industry));
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(marketBenchmarks.lastUpdated));
  }

  async updateMarketBenchmark(id: string, updates: Partial<InsertMarketBenchmark>): Promise<MarketBenchmark> {
    const [benchmark] = await db
      .update(marketBenchmarks)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(marketBenchmarks.id, id))
      .returning();
    return benchmark;
  }

  async deleteMarketBenchmark(id: string): Promise<void> {
    await db.delete(marketBenchmarks).where(eq(marketBenchmarks.id, id));
  }

  // Analytics operations
  async getContractMetrics(userId?: string): Promise<{
    totalContracts: number;
    processing: number;
    analyzed: number;
    recentUploads: number;
    activeUsers: number;
  }> {
    let baseQuery = db.select({ count: count() }).from(contracts);
    
    if (userId) {
      baseQuery = baseQuery.where(eq(contracts.uploadedBy, userId));
    }

    const [
      totalResult,
      processingResult,
      analyzedResult,
      recentResult,
      activeUsersResult
    ] = await Promise.all([
      baseQuery,
      userId 
        ? db.select({ count: count() }).from(contracts).where(and(eq(contracts.uploadedBy, userId), eq(contracts.status, 'processing')))
        : db.select({ count: count() }).from(contracts).where(eq(contracts.status, 'processing')),
      userId
        ? db.select({ count: count() }).from(contracts).where(and(eq(contracts.uploadedBy, userId), eq(contracts.status, 'analyzed')))
        : db.select({ count: count() }).from(contracts).where(eq(contracts.status, 'analyzed')),
      userId
        ? db.select({ count: count() }).from(contracts).where(and(eq(contracts.uploadedBy, userId), gte(contracts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))))
        : db.select({ count: count() }).from(contracts).where(gte(contracts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true))
    ]);

    return {
      totalContracts: totalResult[0].count,
      processing: processingResult[0].count,
      analyzed: analyzedResult[0].count,
      recentUploads: recentResult[0].count,
      activeUsers: activeUsersResult[0].count,
    };
  }

  // Advanced analytics operations
  async getPortfolioAnalytics(userId?: string): Promise<{
    totalValue: number;
    avgPerformanceScore: number;
    complianceRate: number;
    upcomingObligations: number;
    renewalsPending: number;
  }> {
    // This is a complex aggregation that would join multiple analytics tables
    // For now, return sample data - this would be enhanced in production
    return {
      totalValue: 0,
      avgPerformanceScore: 0,
      complianceRate: 0,
      upcomingObligations: 0,
      renewalsPending: 0,
    };
  }

  // Aggregate analytics implementations
  async getFinancialAnalytics(userId?: string): Promise<{
    totalContractValue: number;
    avgContractValue: number;
    totalPaymentScheduled: number;
    currencyDistribution: Record<string, number>;
    riskDistribution: { low: number; medium: number; high: number };
    topPaymentTerms: Array<{ term: string; count: number }>;
  }> {
    let contractsQuery = db
      .select({
        contractId: contracts.id,
        totalValue: financialAnalysis.totalValue,
        currency: financialAnalysis.currency,
        currencyRisk: financialAnalysis.currencyRisk,
        paymentTerms: financialAnalysis.paymentTerms,
      })
      .from(contracts)
      .leftJoin(financialAnalysis, eq(contracts.id, financialAnalysis.contractId));

    if (userId) {
      contractsQuery = contractsQuery.where(eq(contracts.uploadedBy, userId));
    }

    const results = await contractsQuery;
    
    const totalValue = results
      .filter(r => r.totalValue)
      .reduce((sum, r) => sum + parseFloat(r.totalValue?.toString() || '0'), 0);
    
    const avgValue = results.filter(r => r.totalValue).length > 0 ? 
      totalValue / results.filter(r => r.totalValue).length : 0;

    const currencyDistribution: Record<string, number> = {};
    const paymentTermsCount: Record<string, number> = {};
    const riskCounts = { low: 0, medium: 0, high: 0 };

    results.forEach(r => {
      if (r.currency) {
        currencyDistribution[r.currency] = (currencyDistribution[r.currency] || 0) + 1;
      }
      if (r.paymentTerms) {
        paymentTermsCount[r.paymentTerms] = (paymentTermsCount[r.paymentTerms] || 0) + 1;
      }
      if (r.currencyRisk) {
        const risk = parseFloat(r.currencyRisk.toString());
        if (risk < 30) riskCounts.low++;
        else if (risk < 70) riskCounts.medium++;
        else riskCounts.high++;
      }
    });

    const topPaymentTerms = Object.entries(paymentTermsCount)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalContractValue: totalValue,
      avgContractValue: avgValue,
      totalPaymentScheduled: totalValue, // Simplified - would calculate from payment schedules
      currencyDistribution,
      riskDistribution: riskCounts,
      topPaymentTerms,
    };
  }

  async getComplianceAnalytics(userId?: string): Promise<{
    avgComplianceScore: number;
    complianceDistribution: { compliant: number; partial: number; nonCompliant: number };
    topRegulatoryFrameworks: Array<{ framework: string; count: number }>;
    jurisdictionBreakdown: Record<string, number>;
    dataProtectionCompliance: number;
  }> {
    let complianceQuery = db
      .select({
        complianceScore: complianceAnalysis.complianceScore,
        regulatoryFrameworks: complianceAnalysis.regulatoryFrameworks,
        jurisdictionAnalysis: complianceAnalysis.jurisdictionAnalysis,
        dataProtectionCompliance: complianceAnalysis.dataProtectionCompliance,
      })
      .from(contracts)
      .leftJoin(complianceAnalysis, eq(contracts.id, complianceAnalysis.contractId));

    if (userId) {
      complianceQuery = complianceQuery.where(eq(contracts.uploadedBy, userId));
    }

    const results = await complianceQuery;
    const validResults = results.filter(r => r.complianceScore);

    const avgScore = validResults.length > 0 ? 
      validResults.reduce((sum, r) => sum + parseFloat(r.complianceScore?.toString() || '0'), 0) / validResults.length : 0;

    const distribution = { compliant: 0, partial: 0, nonCompliant: 0 };
    let dataProtectionCount = 0;
    const frameworkCounts: Record<string, number> = {};
    const jurisdictionCounts: Record<string, number> = {};

    validResults.forEach(r => {
      const score = parseFloat(r.complianceScore?.toString() || '0');
      if (score >= 80) distribution.compliant++;
      else if (score >= 50) distribution.partial++;
      else distribution.nonCompliant++;

      if (r.dataProtectionCompliance) dataProtectionCount++;

      // Process regulatory frameworks and jurisdictions from JSONB data
      if (r.regulatoryFrameworks && Array.isArray(r.regulatoryFrameworks)) {
        r.regulatoryFrameworks.forEach((fw: any) => {
          if (typeof fw === 'string') {
            frameworkCounts[fw] = (frameworkCounts[fw] || 0) + 1;
          }
        });
      }
    });

    const topFrameworks = Object.entries(frameworkCounts)
      .map(([framework, count]) => ({ framework, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      avgComplianceScore: avgScore,
      complianceDistribution: distribution,
      topRegulatoryFrameworks: topFrameworks,
      jurisdictionBreakdown: jurisdictionCounts,
      dataProtectionCompliance: dataProtectionCount,
    };
  }

  async getStrategicAnalytics(userId?: string): Promise<{
    avgStrategicValue: number;
    marketAlignmentDistribution: { high: number; medium: number; low: number };
    competitiveAdvantages: Array<{ advantage: string; count: number }>;
    avgRiskConcentration: number;
    topRecommendations: Array<{ recommendation: string; frequency: number }>;
  }> {
    let strategicQuery = db
      .select({
        strategicValue: strategicAnalysis.strategicValue,
        marketAlignment: strategicAnalysis.marketAlignment,
        competitiveAdvantage: strategicAnalysis.competitiveAdvantage,
        riskConcentration: strategicAnalysis.riskConcentration,
        recommendations: strategicAnalysis.recommendations,
      })
      .from(contracts)
      .leftJoin(strategicAnalysis, eq(contracts.id, strategicAnalysis.contractId));

    if (userId) {
      strategicQuery = strategicQuery.where(eq(contracts.uploadedBy, userId));
    }

    const results = await strategicQuery;
    const validResults = results.filter(r => r.strategicValue);

    const avgStrategicValue = validResults.length > 0 ? 
      validResults.reduce((sum, r) => sum + parseFloat(r.strategicValue?.toString() || '0'), 0) / validResults.length : 0;

    const avgRiskConcentration = validResults.length > 0 ? 
      validResults.reduce((sum, r) => sum + parseFloat(r.riskConcentration?.toString() || '0'), 0) / validResults.length : 0;

    const alignmentDistribution = { high: 0, medium: 0, low: 0 };
    const advantageCounts: Record<string, number> = {};
    const recommendationCounts: Record<string, number> = {};

    validResults.forEach(r => {
      const alignment = parseFloat(r.marketAlignment?.toString() || '0');
      if (alignment >= 80) alignmentDistribution.high++;
      else if (alignment >= 50) alignmentDistribution.medium++;
      else alignmentDistribution.low++;

      // Process competitive advantages and recommendations from JSONB
      if (r.competitiveAdvantage && Array.isArray(r.competitiveAdvantage)) {
        r.competitiveAdvantage.forEach((adv: any) => {
          if (typeof adv === 'object' && adv.advantage) {
            advantageCounts[adv.advantage] = (advantageCounts[adv.advantage] || 0) + 1;
          }
        });
      }

      if (r.recommendations && Array.isArray(r.recommendations)) {
        r.recommendations.forEach((rec: any) => {
          if (typeof rec === 'object' && rec.title) {
            recommendationCounts[rec.title] = (recommendationCounts[rec.title] || 0) + 1;
          }
        });
      }
    });

    return {
      avgStrategicValue,
      marketAlignmentDistribution: alignmentDistribution,
      competitiveAdvantages: Object.entries(advantageCounts)
        .map(([advantage, count]) => ({ advantage, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      avgRiskConcentration,
      topRecommendations: Object.entries(recommendationCounts)
        .map(([recommendation, frequency]) => ({ recommendation, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
    };
  }

  async getPerformanceAnalytics(userId?: string): Promise<{
    avgPerformanceScore: number;
    avgMilestoneCompletion: number;
    onTimeDeliveryRate: number;
    avgBudgetVariance: number;
    avgQualityScore: number;
    avgRenewalProbability: number;
  }> {
    let performanceQuery = db
      .select({
        performanceScore: performanceMetrics.performanceScore,
        milestoneCompletion: performanceMetrics.milestoneCompletion,
        onTimeDelivery: performanceMetrics.onTimeDelivery,
        budgetVariance: performanceMetrics.budgetVariance,
        qualityScore: performanceMetrics.qualityScore,
        renewalProbability: performanceMetrics.renewalProbability,
      })
      .from(contracts)
      .leftJoin(performanceMetrics, eq(contracts.id, performanceMetrics.contractId));

    if (userId) {
      performanceQuery = performanceQuery.where(eq(contracts.uploadedBy, userId));
    }

    const results = await performanceQuery;
    const validResults = results.filter(r => r.performanceScore);

    if (validResults.length === 0) {
      return {
        avgPerformanceScore: 0,
        avgMilestoneCompletion: 0,
        onTimeDeliveryRate: 0,
        avgBudgetVariance: 0,
        avgQualityScore: 0,
        avgRenewalProbability: 0,
      };
    }

    const avgPerformanceScore = validResults.reduce((sum, r) => 
      sum + parseFloat(r.performanceScore?.toString() || '0'), 0) / validResults.length;
    
    const avgMilestoneCompletion = validResults.reduce((sum, r) => 
      sum + parseFloat(r.milestoneCompletion?.toString() || '0'), 0) / validResults.length;
    
    const onTimeCount = validResults.filter(r => r.onTimeDelivery).length;
    const onTimeDeliveryRate = (onTimeCount / validResults.length) * 100;
    
    const avgBudgetVariance = validResults.reduce((sum, r) => 
      sum + parseFloat(r.budgetVariance?.toString() || '0'), 0) / validResults.length;
    
    const avgQualityScore = validResults.reduce((sum, r) => 
      sum + parseFloat(r.qualityScore?.toString() || '0'), 0) / validResults.length;
    
    const avgRenewalProbability = validResults.reduce((sum, r) => 
      sum + parseFloat(r.renewalProbability?.toString() || '0'), 0) / validResults.length;

    return {
      avgPerformanceScore,
      avgMilestoneCompletion,
      onTimeDeliveryRate,
      avgBudgetVariance,
      avgQualityScore,
      avgRenewalProbability,
    };
  }

  async getRiskAnalytics(userId?: string): Promise<{
    riskDistribution: { high: number; medium: number; low: number };
    topRiskFactors: Array<{ risk: string; frequency: number }>;
    avgRiskScore: number;
    contractsAtRisk: number;
    riskTrends: Array<{ date: string; riskScore: number }>;
  }> {
    // Aggregate risk data from multiple analysis tables
    let analysisQuery = db
      .select({
        contractId: contracts.id,
        createdAt: contracts.createdAt,
        riskAnalysis: contractAnalysis.riskAnalysis,
        currencyRisk: financialAnalysis.currencyRisk,
        complianceScore: complianceAnalysis.complianceScore,
        riskConcentration: strategicAnalysis.riskConcentration,
      })
      .from(contracts)
      .leftJoin(contractAnalysis, eq(contracts.id, contractAnalysis.contractId))
      .leftJoin(financialAnalysis, eq(contracts.id, financialAnalysis.contractId))
      .leftJoin(complianceAnalysis, eq(contracts.id, complianceAnalysis.contractId))
      .leftJoin(strategicAnalysis, eq(contracts.id, strategicAnalysis.contractId));

    if (userId) {
      analysisQuery = analysisQuery.where(eq(contracts.uploadedBy, userId));
    }

    const results = await analysisQuery;

    const riskDistribution = { high: 0, medium: 0, low: 0 };
    const riskFactorCounts: Record<string, number> = {};
    const riskScores: number[] = [];
    let contractsAtRisk = 0;
    const riskTrends: Array<{ date: string; riskScore: number }> = [];

    results.forEach(r => {
      let overallRisk = 0;
      let riskCount = 0;

      // Aggregate various risk scores
      if (r.currencyRisk) {
        overallRisk += parseFloat(r.currencyRisk.toString());
        riskCount++;
      }
      
      if (r.complianceScore) {
        // Convert compliance score to risk (inverse relationship)
        overallRisk += (100 - parseFloat(r.complianceScore.toString()));
        riskCount++;
      }

      if (r.riskConcentration) {
        overallRisk += parseFloat(r.riskConcentration.toString());
        riskCount++;
      }

      if (riskCount > 0) {
        const avgRisk = overallRisk / riskCount;
        riskScores.push(avgRisk);

        // Categorize risk level
        if (avgRisk >= 70) {
          riskDistribution.high++;
          contractsAtRisk++;
        } else if (avgRisk >= 40) {
          riskDistribution.medium++;
        } else {
          riskDistribution.low++;
        }

        // Add to risk trends (simplified monthly aggregation)
        if (r.createdAt) {
          const monthKey = r.createdAt.toISOString().slice(0, 7); // YYYY-MM
          riskTrends.push({ date: monthKey, riskScore: avgRisk });
        }
      }

      // Process risk factors from contract analysis
      if (r.riskAnalysis && Array.isArray(r.riskAnalysis)) {
        r.riskAnalysis.forEach((risk: any) => {
          if (typeof risk === 'object' && risk.title) {
            riskFactorCounts[risk.title] = (riskFactorCounts[risk.title] || 0) + 1;
          }
        });
      }
    });

    const avgRiskScore = riskScores.length > 0 ? 
      riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length : 0;

    // Group risk trends by month and average
    const trendMap = new Map<string, { total: number; count: number }>();
    riskTrends.forEach(trend => {
      const existing = trendMap.get(trend.date) || { total: 0, count: 0 };
      existing.total += trend.riskScore;
      existing.count += 1;
      trendMap.set(trend.date, existing);
    });

    const aggregatedTrends = Array.from(trendMap.entries())
      .map(([date, data]) => ({ date, riskScore: data.total / data.count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6); // Last 6 months

    return {
      riskDistribution,
      topRiskFactors: Object.entries(riskFactorCounts)
        .map(([risk, frequency]) => ({ risk, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10),
      avgRiskScore,
      contractsAtRisk,
      riskTrends: aggregatedTrends,
    };
  }

  // ==========================================
  // ROYALTY SYSTEM IMPLEMENTATIONS
  // ==========================================
  
  // Vendor operations
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [created] = await db.insert(vendors).values(vendor).returning();
    return created;
  }

  async getVendor(id: string): Promise<VendorWithLicenses | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!vendor) return undefined;

    const licenses = await db.select().from(licenseDocuments).where(eq(licenseDocuments.vendorId, id));
    return { ...vendor, licenses };
  }

  async getVendors(search?: string): Promise<VendorWithLicenses[]> {
    let query = db.select().from(vendors);
    if (search) {
      query = query.where(or(ilike(vendors.name, `%${search}%`), ilike(vendors.contactEmail, `%${search}%`)));
    }
    
    const vendorList = await query;
    const vendorsWithLicenses = await Promise.all(
      vendorList.map(async (vendor) => {
        const licenses = await db.select().from(licenseDocuments).where(eq(licenseDocuments.vendorId, vendor.id));
        return { ...vendor, licenses };
      })
    );
    
    return vendorsWithLicenses;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor> {
    const [updated] = await db.update(vendors).set({...updates, updatedAt: new Date()}).where(eq(vendors.id, id)).returning();
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // License Document operations
  async createLicenseDocument(licenseDoc: InsertLicenseDocument): Promise<LicenseDocument> {
    const [created] = await db.insert(licenseDocuments).values(licenseDoc).returning();
    return created;
  }

  async getLicenseDocument(id: string): Promise<LicenseDocumentWithRules | undefined> {
    const [doc] = await db.select().from(licenseDocuments).where(eq(licenseDocuments.id, id));
    if (!doc) return undefined;

    const ruleSets = await db.select().from(licenseRuleSets).where(eq(licenseRuleSets.licenseDocumentId, id));
    return { ...doc, ruleSets };
  }

  async getLicenseDocuments(vendorId?: string): Promise<LicenseDocumentWithRules[]> {
    let query = db.select().from(licenseDocuments);
    if (vendorId) {
      query = query.where(eq(licenseDocuments.vendorId, vendorId));
    }
    
    const docs = await query;
    const docsWithRules = await Promise.all(
      docs.map(async (doc) => {
        const ruleSets = await db.select().from(licenseRuleSets).where(eq(licenseRuleSets.licenseDocumentId, doc.id));
        return { ...doc, ruleSets };
      })
    );
    
    return docsWithRules;
  }

  async updateLicenseDocumentStatus(id: string, status: string): Promise<LicenseDocument> {
    const [updated] = await db.update(licenseDocuments).set({status, updatedAt: new Date()}).where(eq(licenseDocuments.id, id)).returning();
    return updated;
  }

  async deleteLicenseDocument(id: string): Promise<void> {
    await db.delete(licenseDocuments).where(eq(licenseDocuments.id, id));
  }

  // License Rule Set operations
  async createLicenseRuleSet(ruleSet: InsertLicenseRuleSet): Promise<LicenseRuleSet> {
    const [created] = await db.insert(licenseRuleSets).values(ruleSet).returning();
    return created;
  }

  async getLicenseRuleSet(id: string): Promise<LicenseRuleSet | undefined> {
    const [ruleSet] = await db.select().from(licenseRuleSets).where(eq(licenseRuleSets.id, id));
    return ruleSet;
  }

  async getLicenseRuleSets(licenseDocumentId?: string, vendorId?: string, status?: string): Promise<LicenseRuleSet[]> {
    let conditions = [];
    if (licenseDocumentId) conditions.push(eq(licenseRuleSets.licenseDocumentId, licenseDocumentId));
    if (vendorId) conditions.push(eq(licenseRuleSets.vendorId, vendorId));
    if (status) conditions.push(eq(licenseRuleSets.status, status));
    
    let query = db.select().from(licenseRuleSets);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getLicenseRuleSetsByContract(contractId: string): Promise<LicenseRuleSet[]> {
    return await db.select().from(licenseRuleSets)
      .where(eq(licenseRuleSets.contractId, contractId))
      .orderBy(desc(licenseRuleSets.createdAt));
  }

  async publishLicenseRuleSet(id: string, publishedBy: string): Promise<LicenseRuleSet> {
    const [published] = await db.update(licenseRuleSets)
      .set({status: 'published', publishedBy, publishedAt: new Date(), updatedAt: new Date()})
      .where(eq(licenseRuleSets.id, id))
      .returning();
    return published;
  }

  async updateLicenseRuleSet(id: string, updates: Partial<InsertLicenseRuleSet>): Promise<LicenseRuleSet> {
    const [updated] = await db.update(licenseRuleSets).set({...updates, updatedAt: new Date()}).where(eq(licenseRuleSets.id, id)).returning();
    return updated;
  }

  async deleteLicenseRuleSet(id: string): Promise<void> {
    await db.delete(licenseRuleSets).where(eq(licenseRuleSets.id, id));
  }

  // License Rule operations  
  async createLicenseRule(rule: Omit<LicenseRule, 'id' | 'createdAt'>): Promise<LicenseRule> {
    const [created] = await db.insert(licenseRules).values(rule).returning();
    return created;
  }

  async getLicenseRules(ruleSetId: string): Promise<LicenseRule[]> {
    return await db.select().from(licenseRules).where(eq(licenseRules.ruleSetId, ruleSetId));
  }

  async updateLicenseRule(id: string, updates: Partial<Omit<LicenseRule, 'id' | 'createdAt'>>): Promise<LicenseRule> {
    const [updated] = await db.update(licenseRules).set(updates).where(eq(licenseRules.id, id)).returning();
    return updated;
  }

  async deleteLicenseRule(id: string): Promise<void> {
    await db.delete(licenseRules).where(eq(licenseRules.id, id));
  }

  // Sales Data operations
  async createSalesData(salesData: InsertSalesData): Promise<SalesData> {
    const [created] = await db.insert(salesData).values(salesData).returning();
    return created;
  }
  
  async getSalesData(vendorId?: string, startDate?: Date, endDate?: Date): Promise<SalesData[]> {
    let conditions = [];
    if (vendorId) conditions.push(eq(salesData.vendorId, vendorId));
    if (startDate) conditions.push(gte(salesData.transactionDate, startDate));
    
    let query = db.select().from(salesData);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }
  
  async importSalesDataBatch(salesDataList: InsertSalesData[]): Promise<SalesData[]> {
    const created = await db.insert(salesData).values(salesDataList).returning();
    return created;
  }
  
  async deleteSalesData(vendorId: string, importJobId?: string): Promise<void> {
    let conditions = [eq(salesData.vendorId, vendorId)];
    if (importJobId) conditions.push(eq(salesData.importJobId, importJobId));
    
    await db.delete(salesData).where(and(...conditions));
  }
  
  // Royalty Run operations
  async createRoyaltyRun(run: InsertRoyaltyRun): Promise<RoyaltyRun> {
    const [created] = await db.insert(royaltyRuns).values(run).returning();
    return created;
  }
  
  async getRoyaltyRun(id: string): Promise<RoyaltyRunWithDetails | undefined> {
    const [run] = await db.select().from(royaltyRuns).where(eq(royaltyRuns.id, id));
    if (!run) return undefined;
    
    const results = await db.select().from(royaltyResults).where(eq(royaltyResults.runId, id));
    return { ...run, results };
  }
  
  async getRoyaltyRuns(vendorId?: string, status?: string): Promise<RoyaltyRunWithDetails[]> {
    let conditions = [];
    if (vendorId) conditions.push(eq(royaltyRuns.vendorId, vendorId));
    if (status) conditions.push(eq(royaltyRuns.status, status));
    
    let query = db.select().from(royaltyRuns);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const runs = await query;
    const runsWithDetails = await Promise.all(
      runs.map(async (run) => {
        const results = await db.select().from(royaltyResults).where(eq(royaltyResults.runId, run.id));
        return { ...run, results };
      })
    );
    
    return runsWithDetails;
  }
  
  async updateRoyaltyRunStatus(id: string, status: string, totals?: {totalSalesAmount?: number, totalRoyalty?: number, recordsProcessed?: number}): Promise<RoyaltyRun> {
    const updateData: any = { status, updatedAt: new Date() };
    if (totals?.totalSalesAmount) updateData.totalSalesAmount = totals.totalSalesAmount;
    if (totals?.totalRoyalty) updateData.totalRoyalty = totals.totalRoyalty;
    if (totals?.recordsProcessed) updateData.recordsProcessed = totals.recordsProcessed;
    
    const [updated] = await db.update(royaltyRuns).set(updateData).where(eq(royaltyRuns.id, id)).returning();
    return updated;
  }
  
  async deleteRoyaltyRun(id: string): Promise<void> {
    await db.delete(royaltyRuns).where(eq(royaltyRuns.id, id));
  }
  
  async approveRoyaltyRun(id: string, approvedBy: string): Promise<RoyaltyRun> {
    const [updated] = await db.update(royaltyRuns)
      .set({ 
        status: 'approved', 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(royaltyRuns.id, id))
      .returning();
    return updated;
  }
  
  async rejectRoyaltyRun(id: string, rejectionReason: string): Promise<RoyaltyRun> {
    const [updated] = await db.update(royaltyRuns)
      .set({ 
        status: 'rejected', 
        rejectionReason,
        updatedAt: new Date()
      })
      .where(eq(royaltyRuns.id, id))
      .returning();
    return updated;
  }
  
  // Royalty Result operations
  async createRoyaltyResults(results: Omit<RoyaltyResult, 'id' | 'createdAt'>[]): Promise<RoyaltyResult[]> {
    const created = await db.insert(royaltyResults).values(results).returning();
    return created;
  }
  
  async getRoyaltyResults(runId: string): Promise<RoyaltyResult[]> {
    return await db.select().from(royaltyResults).where(eq(royaltyResults.runId, runId));
  }
  
  async deleteRoyaltyResults(runId: string): Promise<void> {
    await db.delete(royaltyResults).where(eq(royaltyResults.runId, runId));
  }
  
  // ERP Import Job operations
  async createErpImportJob(job: Omit<ErpImportJob, 'id' | 'createdAt'>): Promise<ErpImportJob> {
    const [created] = await db.insert(erpImportJobs).values(job).returning();
    return created;
  }
  
  async getErpImportJob(id: string): Promise<ErpImportJob | undefined> {
    const [job] = await db.select().from(erpImportJobs).where(eq(erpImportJobs.id, id));
    return job;
  }
  
  async getErpImportJobs(createdBy?: string, status?: string): Promise<ErpImportJob[]> {
    let query = db.select().from(erpImportJobs);
    const conditions = [];
    if (createdBy) conditions.push(eq(erpImportJobs.createdBy, createdBy));
    if (status) conditions.push(eq(erpImportJobs.status, status));
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(desc(erpImportJobs.createdAt));
  }
  
  async updateErpImportJobStatus(id: string, status: string, counts?: {recordsImported?: number, recordsFailed?: number}): Promise<ErpImportJob> {
    const updateData: any = { status };
    if (counts?.recordsImported !== undefined) updateData.recordsImported = counts.recordsImported;
    if (counts?.recordsFailed !== undefined) updateData.recordsFailed = counts.recordsFailed;
    if (status === 'completed' || status === 'failed') updateData.completedAt = new Date();
    
    const [updated] = await db.update(erpImportJobs).set(updateData).where(eq(erpImportJobs.id, id)).returning();
    return updated;
  }
  
  // Sales Staging operations
  async createSalesStaging(staging: Omit<SalesStaging, 'id' | 'createdAt'>): Promise<SalesStaging> {
    const [created] = await db.insert(salesStaging).values(staging).returning();
    return created;
  }
  
  async getSalesStaging(importJobId: string): Promise<SalesStaging[]> {
    return await db.select().from(salesStaging).where(eq(salesStaging.importJobId, importJobId));
  }
  
  async updateStagingValidation(id: string, status: string, errors?: any): Promise<SalesStaging> {
    const updateData: any = { validationStatus: status };
    if (errors) updateData.validationErrors = errors;
    if (status === 'valid' || status === 'invalid') updateData.processedAt = new Date();
    
    const [updated] = await db.update(salesStaging).set(updateData).where(eq(salesStaging.id, id)).returning();
    return updated;
  }
  
  async promoteStagingToSales(importJobId: string): Promise<number> {
    const stagingRows = await db.select().from(salesStaging)
      .where(and(
        eq(salesStaging.importJobId, importJobId),
        eq(salesStaging.validationStatus, 'valid')
      ));
    
    if (stagingRows.length === 0) return 0;
    
    const salesRows = stagingRows.map((row: any) => ({
      vendorId: row.rowData.vendorId || null, // Optional - for manual vendor assignment
      matchedContractId: row.rowData._aiMatch?.contractId || null, // AI-matched contract
      matchConfidence: row.rowData._aiMatch?.confidence || null, // AI matching confidence
      transactionDate: new Date(row.rowData.transactionDate),
      transactionId: row.rowData.transactionId || row.externalId,
      productCode: row.rowData.productCode,
      productName: row.rowData.productName,
      category: row.rowData.category,
      territory: row.rowData.territory,
      currency: row.rowData.currency || 'USD',
      grossAmount: row.rowData.grossAmount,
      netAmount: row.rowData.netAmount,
      quantity: row.rowData.quantity,
      unitPrice: row.rowData.unitPrice,
      customFields: row.rowData.customFields || {},
      importJobId: importJobId
    }));
    
    await db.insert(salesData).values(salesRows);
    return salesRows.length;
  }
}

export const storage = new DatabaseStorage();
