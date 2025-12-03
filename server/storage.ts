import {
  users,
  contracts,
  contractAnalysis,
  contractEmbeddings,
  contractVersions,
  contractApprovals,
  auditTrail,
  financialAnalysis,
  complianceAnalysis,
  contractObligations,
  performanceMetrics,
  strategicAnalysis,
  contractComparisons,
  marketBenchmarks,
  contractRoyaltyCalculations,
  salesData,
  royaltyRules,
  extractionRuns,
  contractGraphNodes,
  contractGraphEdges,
  humanReviewTasks,
  ruleDefinitions,
  ruleValidationEvents,
  earlyAccessSignups,
  demoRequests,
  masterDataMappings,
  erpSystems,
  erpEntities,
  erpFields,
  dataImportJobs,
  importedErpRecords,
  licenseiqEntities,
  licenseiqFields,
  licenseiqEntityRecords,
  companies,
  businessUnits,
  locations,
  userOrganizationRoles,
  userActiveContext,
  type User,
  type InsertUser,
  type UserOrganizationRole,
  type InsertUserOrganizationRole,
  type UserActiveContext,
  type InsertUserActiveContext,
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
  type ContractRoyaltyCalculation,
  type InsertContractRoyaltyCalculation,
  type SalesData,
  type InsertSalesData,
  type RoyaltyRule,
  type InsertRoyaltyRule,
  type EarlyAccessSignup,
  type InsertEarlyAccessSignup,
  type DemoRequest,
  type InsertDemoRequest,
  type ContractVersion,
  type InsertContractVersion,
  type ContractApproval,
  type InsertContractApproval,
  type ErpSystem,
  type InsertErpSystem,
  type ErpEntity,
  type InsertErpEntity,
  type ErpField,
  type InsertErpField,
  type MasterDataMapping,
  type InsertMasterDataMapping,
  type LicenseiqEntity,
  type InsertLicenseiqEntity,
  type LicenseiqField,
  type InsertLicenseiqField,
  type LicenseiqEntityRecord,
  type InsertLicenseiqEntityRecord,
  type Company,
  type InsertCompany,
  type BusinessUnit,
  type InsertBusinessUnit,
  type Location,
  type InsertLocation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count, gte, sql, inArray, isNull } from "drizzle-orm";

/**
 * Organizational context for hierarchical access control
 */
export interface OrgAccessContext {
  activeContext: any; // User's active organizational context (companyId, businessUnitId, locationId, role)
  globalRole: string; // User's global system role
  userId?: string; // User ID for fallback filtering
  isSystemAdmin?: boolean; // System Admin bypass flag
}

/**
 * Hierarchical Access Control Helper (Table-Agnostic)
 * Builds query conditions based on organizational context.
 * Hierarchy: Company > Business Unit > Location
 * 
 * Legacy contracts (with NULL org fields) are included for Company Admins/Owners.
 * 
 * @param columns - Object with column references: { companyId, businessUnitId, locationId }
 * @param context - Organizational access context
 * @returns Drizzle query condition or null (no filtering needed)
 */
function buildOrgContextFilter(
  columns: { companyId: any; businessUnitId: any; locationId: any },
  context: OrgAccessContext
) {
  const { activeContext, globalRole, isSystemAdmin } = context;
  
  // System Admin bypass - see everything
  if (isSystemAdmin) {
    return null;
  }
  
  // Global Admin/Owner bypass all context filtering - see everything
  if (globalRole === 'admin' || globalRole === 'owner') {
    return null;
  }

  // No active context = no organization assignments = see only own data (handled by userId filtering)
  if (!activeContext) {
    return null;
  }

  const { companyId, businessUnitId, locationId, role: contextRole } = activeContext;

  // Company Admin/Owner (context role) - see all data in their company + legacy contracts (NULL org)
  if ((contextRole === 'admin' || contextRole === 'owner') && companyId) {
    return or(
      eq(columns.companyId, companyId),
      isNull(columns.companyId) // Include legacy contracts without org assignment
    );
  }

  // Location level: Most restrictive - see only this specific location's data + legacy contracts
  if (locationId) {
    return or(
      eq(columns.locationId, locationId),
      isNull(columns.companyId) // Include legacy contracts
    );
  }

  // Business Unit level: See all locations within this BU + legacy contracts
  if (businessUnitId) {
    return or(
      eq(columns.businessUnitId, businessUnitId),
      isNull(columns.companyId) // Include legacy contracts
    );
  }

  // Company level: See all data within the company (all BUs and locations) + legacy contracts
  if (companyId) {
    return or(
      eq(columns.companyId, companyId),
      isNull(columns.companyId) // Include legacy contracts
    );
  }

  // Fallback: no filtering
  return null;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User>;
  getAllUsers(search?: string, role?: string): Promise<User[]>;
  getAllUsersWithCompanies(): Promise<any[]>;
  getUsersByCompany(companyId: string): Promise<any[]>;
  deleteUser(id: string): Promise<void>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  resetUserPassword(id: string, newPassword: string): Promise<User>;
  getAdminCount(): Promise<number>;
  
  // Contract operations
  createContract(contract: InsertContract): Promise<Contract>;
  getContract(id: string, context?: OrgAccessContext): Promise<ContractWithAnalysis | undefined>;
  getContracts(userId?: string, limit?: number, offset?: number, context?: OrgAccessContext): Promise<{ contracts: ContractWithAnalysis[], total: number }>;
  updateContractStatus(id: string, status: string, processingTime?: number): Promise<Contract>;
  searchContracts(query: string, userId?: string, context?: OrgAccessContext): Promise<ContractWithAnalysis[]>;
  getContractsByUser(userId: string, context?: OrgAccessContext): Promise<Contract[]>;
  deleteContract(id: string): Promise<void>;
  updateContractMetadata(id: string, metadata: any, userId: string): Promise<Contract>;
  submitContractForApproval(id: string, userId: string): Promise<Contract>;
  updateContractErpMatching(id: string, enabled: boolean): Promise<Contract>;
  
  // Contract versioning operations
  createContractVersion(version: any): Promise<any>;
  getContractVersions(contractId: string): Promise<any[]>;
  getContractVersion(versionId: string): Promise<any | undefined>;
  
  // Contract approval operations
  createContractApproval(approval: any): Promise<any>;
  getContractApprovals(versionId: string): Promise<any[]>;
  getPendingApprovals(userId: string): Promise<any[]>;

  // Contract analysis operations
  createContractAnalysis(analysis: InsertContractAnalysis): Promise<ContractAnalysis>;
  getContractAnalysis(contractId: string): Promise<ContractAnalysis | undefined>;
  updateContractAnalysis(contractId: string, analysis: Partial<InsertContractAnalysis>): Promise<ContractAnalysis>;
  deleteContractAnalysis(contractId: string): Promise<void>;
  
  // Contract embeddings operations
  saveContractEmbedding(data: {
    contractId: string;
    embeddingType: string;
    embedding: number[];
    sourceText: string;
    metadata?: any;
  }): Promise<void>;
  
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

  // Sales data operations
  createSalesData(salesData: InsertSalesData): Promise<SalesData>;
  createBulkSalesData(salesDataArray: InsertSalesData[]): Promise<SalesData[]>;
  getSalesDataByContract(contractId: string, context?: OrgAccessContext): Promise<SalesData[]>;
  getAllSalesData(limit?: number, offset?: number, context?: OrgAccessContext): Promise<{ salesData: SalesData[], total: number }>;
  updateSalesDataMatch(id: string, contractId: string, confidence: number): Promise<SalesData>;
  deleteSalesData(id: string): Promise<void>;
  deleteAllSalesDataForContract(contractId: string): Promise<void>;
  
  // Contract royalty calculation operations
  createContractRoyaltyCalculation(calculation: InsertContractRoyaltyCalculation): Promise<ContractRoyaltyCalculation>;
  getContractRoyaltyCalculations(contractId: string, context?: OrgAccessContext): Promise<ContractRoyaltyCalculation[]>;
  getContractRoyaltyCalculation(id: string, context?: OrgAccessContext): Promise<ContractRoyaltyCalculation | undefined>;
  updateCalculationStatus(id: string, status: string, comments?: string): Promise<ContractRoyaltyCalculation>;
  deleteContractRoyaltyCalculation(id: string): Promise<void>;
  deleteAllCalculationsForContract(contractId: string): Promise<void>;

  // Royalty rule operations
  createRoyaltyRule(rule: InsertRoyaltyRule): Promise<RoyaltyRule>;
  getRoyaltyRulesByContract(contractId: string): Promise<RoyaltyRule[]>;
  getActiveRoyaltyRulesByContract(contractId: string): Promise<RoyaltyRule[]>;
  deleteRoyaltyRule(ruleId: string): Promise<void>;
  deleteRoyaltyRulesByContract(contractId: string): Promise<void>;
  updateRoyaltyRule(ruleId: string, updates: Partial<InsertRoyaltyRule>): Promise<RoyaltyRule>;
  
  // Dynamic extraction operations
  getExtractionRun(id: string): Promise<any>;
  getExtractionRunsByContract(contractId: string): Promise<any[]>;
  getContractKnowledgeGraph(contractId: string): Promise<{ nodes: any[], edges: any[] }>;
  getPendingReviewTasks(userId?: string): Promise<any[]>;
  approveReviewTask(taskId: string, userId: string, reviewNotes?: string): Promise<void>;
  rejectReviewTask(taskId: string, userId: string, reviewNotes: string): Promise<void>;
  getDynamicRulesByContract(contractId: string): Promise<any[]>;
  getRuleValidationEvents(ruleId: string): Promise<any[]>;
  
  // Lead capture operations
  createEarlyAccessSignup(signup: InsertEarlyAccessSignup): Promise<EarlyAccessSignup>;
  getAllEarlyAccessSignups(status?: string): Promise<EarlyAccessSignup[]>;
  updateEarlyAccessSignupStatus(id: string, status: string, notes?: string): Promise<EarlyAccessSignup>;
  createDemoRequest(request: InsertDemoRequest): Promise<DemoRequest>;
  getAllDemoRequests(status?: string, planTier?: string): Promise<DemoRequest[]>;
  updateDemoRequestStatus(id: string, status: string, notes?: string): Promise<DemoRequest>;
  
  // Master data mapping operations
  createMasterDataMapping(mapping: InsertMasterDataMapping): Promise<MasterDataMapping>;
  getMasterDataMapping(id: string): Promise<MasterDataMapping | undefined>;
  getAllMasterDataMappings(filters?: { erpSystem?: string; entityType?: string; status?: string }): Promise<MasterDataMapping[]>;
  updateMasterDataMapping(id: string, updates: Partial<InsertMasterDataMapping>): Promise<MasterDataMapping>;
  deleteMasterDataMapping(id: string): Promise<void>;
  
  // ERP Systems operations
  createErpSystem(system: InsertErpSystem): Promise<ErpSystem>;
  getErpSystem(id: string): Promise<ErpSystem | undefined>;
  getAllErpSystems(status?: string): Promise<ErpSystem[]>;
  updateErpSystem(id: string, updates: Partial<InsertErpSystem>): Promise<ErpSystem>;
  deleteErpSystem(id: string): Promise<void>;
  
  // ERP Entities operations
  createErpEntity(entity: InsertErpEntity): Promise<ErpEntity>;
  getErpEntity(id: string): Promise<ErpEntity | undefined>;
  getErpEntitiesBySystem(systemId: string, entityType?: string): Promise<ErpEntity[]>;
  updateErpEntity(id: string, updates: Partial<InsertErpEntity>): Promise<ErpEntity>;
  deleteErpEntity(id: string): Promise<void>;
  
  // ERP Fields operations
  createErpField(field: InsertErpField): Promise<ErpField>;
  getErpField(id: string): Promise<ErpField | undefined>;
  getErpFieldsByEntity(entityId: string): Promise<ErpField[]>;
  updateErpField(id: string, updates: Partial<InsertErpField>): Promise<ErpField>;
  deleteErpField(id: string): Promise<void>;
  
  // LicenseIQ Entities operations
  createLicenseiqEntity(entity: InsertLicenseiqEntity): Promise<LicenseiqEntity>;
  getLicenseiqEntity(id: string): Promise<LicenseiqEntity | undefined>;
  getAllLicenseiqEntities(category?: string): Promise<LicenseiqEntity[]>;
  updateLicenseiqEntity(id: string, updates: Partial<InsertLicenseiqEntity>): Promise<LicenseiqEntity>;
  deleteLicenseiqEntity(id: string): Promise<void>;
  
  // LicenseIQ Fields operations
  createLicenseiqField(field: InsertLicenseiqField): Promise<LicenseiqField>;
  getLicenseiqField(id: string): Promise<LicenseiqField | undefined>;
  getLicenseiqFieldsByEntity(entityId: string): Promise<LicenseiqField[]>;
  updateLicenseiqField(id: string, updates: Partial<InsertLicenseiqField>): Promise<LicenseiqField>;
  deleteLicenseiqField(id: string): Promise<void>;
  
  // LicenseIQ Entity Records operations
  createLicenseiqEntityRecord(record: InsertLicenseiqEntityRecord): Promise<LicenseiqEntityRecord>;
  getLicenseiqEntityRecord(id: string): Promise<LicenseiqEntityRecord | undefined>;
  getLicenseiqEntityRecordsByEntity(entityId: string): Promise<LicenseiqEntityRecord[]>;
  updateLicenseiqEntityRecord(id: string, updates: Partial<InsertLicenseiqEntityRecord>): Promise<LicenseiqEntityRecord>;
  deleteLicenseiqEntityRecord(id: string): Promise<void>;
  
  // Data import jobs operations
  createDataImportJob(job: any): Promise<any>;
  getDataImportJobs(contractId?: string, status?: string): Promise<any[]>;
  getDataImportJob(id: string): Promise<any | undefined>;
  updateDataImportJob(id: string, updates: any): Promise<any>;
  
  // Imported ERP records operations
  createImportedErpRecords(records: any[]): Promise<void>;
  getImportedErpRecords(contractId?: string, jobId?: string): Promise<any[]>;
  searchSemanticMatches(embedding: number[], contractId?: string, limit?: number): Promise<any[]>;
  
  // Master Data operations - Company
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  getAllCompanies(status?: string): Promise<Company[]>;
  updateCompany(id: string, updates: Partial<InsertCompany>, userId: string): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  
  // Master Data operations - Business Unit
  createBusinessUnit(unit: InsertBusinessUnit): Promise<BusinessUnit>;
  getBusinessUnit(id: string): Promise<BusinessUnit | undefined>;
  getBusinessUnitsByCompany(companyId: string, status?: string): Promise<BusinessUnit[]>;
  updateBusinessUnit(id: string, updates: Partial<InsertBusinessUnit>, userId: string): Promise<BusinessUnit>;
  deleteBusinessUnit(id: string): Promise<void>;
  
  // Master Data operations - Location
  createLocation(location: InsertLocation): Promise<Location>;
  getLocation(id: string): Promise<Location | undefined>;
  getLocationsByCompany(companyId: string, status?: string): Promise<Location[]>;
  getLocationsByBusinessUnit(orgId: string, status?: string): Promise<Location[]>;
  updateLocation(id: string, updates: Partial<InsertLocation>, userId: string): Promise<Location>;
  deleteLocation(id: string): Promise<void>;
  
  // Master Data operations - Get full hierarchy
  getMasterDataHierarchy(status?: string): Promise<any>;
  
  // User Organization Roles operations
  createUserOrganizationRole(role: InsertUserOrganizationRole): Promise<UserOrganizationRole>;
  getUserOrganizationRoleById(id: string): Promise<UserOrganizationRole | undefined>;
  getUserOrganizationRoles(userId: string): Promise<any[]>;
  getAllUserOrganizationRoles(): Promise<any[]>;
  updateUserOrganizationRole(id: string, updates: Partial<InsertUserOrganizationRole>, userId: string): Promise<UserOrganizationRole>;
  deleteUserOrganizationRole(id: string): Promise<void>;
  getUsersByOrganization(companyId: string, businessUnitId?: string, locationId?: string): Promise<any[]>;
  
  // User Active Context operations
  getUserActiveContext(userId: string): Promise<UserActiveContext | undefined>;
  setUserActiveContext(userId: string, orgRoleId: string): Promise<UserActiveContext>;
  deleteUserActiveContext(userId: string): Promise<void>;
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

  async getAllUsersWithCompanies(): Promise<any[]> {
    // Get all users with their company assignments aggregated
    // Explicitly select non-sensitive fields (exclude password)
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        isSystemAdmin: users.isSystemAdmin,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    
    // Get all organization roles with company names
    const allOrgRoles = await db
      .select({
        userId: userOrganizationRoles.userId,
        companyId: userOrganizationRoles.companyId,
        companyName: companies.companyName,
        role: userOrganizationRoles.role,
      })
      .from(userOrganizationRoles)
      .leftJoin(companies, eq(userOrganizationRoles.companyId, companies.id));
    
    // Group company assignments by user
    const userCompanyMap = new Map<string, { companyId: string; companyName: string; role: string }[]>();
    for (const role of allOrgRoles) {
      if (!userCompanyMap.has(role.userId)) {
        userCompanyMap.set(role.userId, []);
      }
      userCompanyMap.get(role.userId)!.push({
        companyId: role.companyId,
        companyName: role.companyName || 'Unknown',
        role: role.role,
      });
    }
    
    // Merge user data with company assignments (no password exposed)
    return allUsers.map(user => ({
      ...user,
      companies: userCompanyMap.get(user.id) || [],
      // Primary company is the first one (for display purposes)
      primaryCompany: userCompanyMap.get(user.id)?.[0]?.companyName || null,
    }));
  }

  async getUsersByCompany(companyId: string): Promise<any[]> {
    // Get all users that have at least one organization role in this company
    // Explicitly exclude password for security
    const usersWithRolesInCompany = await db
      .selectDistinct({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        isSystemAdmin: users.isSystemAdmin,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(userOrganizationRoles, eq(users.id, userOrganizationRoles.userId))
      .where(eq(userOrganizationRoles.companyId, companyId))
      .orderBy(desc(users.createdAt));
    
    return usersWithRolesInCompany;
  }

  // Contract operations
  async createContract(contract: InsertContract): Promise<Contract> {
    // Auto-generate contract number if not provided
    if (!contract.contractNumber) {
      const currentYear = new Date().getFullYear();
      
      // Get the highest contract number for the current year
      const [lastContract] = await db
        .select({ contractNumber: contracts.contractNumber })
        .from(contracts)
        .where(sql`contract_number LIKE ${`CNT-${currentYear}-%`}`)
        .orderBy(desc(contracts.contractNumber))
        .limit(1);
      
      let nextNumber = 1;
      if (lastContract?.contractNumber) {
        // Extract number from format CNT-YYYY-NNN and increment
        const parts = lastContract.contractNumber.split('-');
        if (parts.length === 3) {
          nextNumber = parseInt(parts[2]) + 1;
        }
      }
      
      // Generate formatted contract number: CNT-YYYY-NNN
      contract.contractNumber = `CNT-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
    }
    
    const [newContract] = await db
      .insert(contracts)
      .values(contract)
      .returning();
    return newContract;
  }

  async getContract(id: string, context?: OrgAccessContext): Promise<ContractWithAnalysis | undefined> {
    // Build filter conditions: ID is required, context and userId are optional
    const filterConditions: any[] = [eq(contracts.id, id)];

    // Apply organizational context filter
    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: contracts.companyId,
          businessUnitId: contracts.businessUnitId,
          locationId: contracts.locationId,
        },
        context
      );
      if (orgFilter) {
        filterConditions.push(orgFilter);
      }

      // Also apply user filter if not admin/owner
      if (context.userId && context.globalRole !== 'admin' && context.globalRole !== 'owner') {
        filterConditions.push(eq(contracts.uploadedBy, context.userId));
      }
    }

    const result = await db
      .select({
        contract: contracts,
        analysis: contractAnalysis,
        uploadedByUser: users,
      })
      .from(contracts)
      .leftJoin(contractAnalysis, eq(contracts.id, contractAnalysis.contractId))
      .leftJoin(users, eq(contracts.uploadedBy, users.id))
      .where(and(...filterConditions));

    if (result.length === 0) return undefined;

    const { contract, analysis, uploadedByUser } = result[0];
    return {
      ...contract,
      analysis: analysis || undefined,
      uploadedByUser: uploadedByUser || undefined,
    };
  }

  async getContracts(userId?: string, limit = 20, offset = 0, context?: OrgAccessContext): Promise<{ contracts: ContractWithAnalysis[], total: number }> {
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

    // Build filter conditions
    const filterConditions: any[] = [];

    // Apply organizational context filter if provided
    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: contracts.companyId,
          businessUnitId: contracts.businessUnitId,
          locationId: contracts.locationId,
        },
        context
      );
      if (orgFilter) {
        filterConditions.push(orgFilter);
      }
    }

    // Apply user filter if provided (for non-admin users without org context)
    if (userId) {
      filterConditions.push(eq(contracts.uploadedBy, userId));
    }

    // Apply combined filters
    if (filterConditions.length > 0) {
      const combinedFilter = filterConditions.length === 1 
        ? filterConditions[0] 
        : and(...filterConditions);
      contractsQuery = contractsQuery.where(combinedFilter);
      countQuery = countQuery.where(combinedFilter);
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
    } else if (status === 'completed' || status === 'analyzed' || status === 'failed') {
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

  async searchContracts(query: string, userId?: string, context?: OrgAccessContext): Promise<ContractWithAnalysis[]> {
    // Comprehensive search conditions across all contract-related fields
    const searchPattern = `%${query}%`;
    
    const searchConditions = or(
      // Contract basic fields
      ilike(contracts.originalName, searchPattern),
      ilike(contracts.displayName, searchPattern),
      ilike(contracts.contractNumber, searchPattern),
      ilike(contracts.contractType, searchPattern),
      ilike(contracts.notes, searchPattern),
      
      // Contract metadata fields
      ilike(contracts.counterpartyName, searchPattern),
      ilike(contracts.organizationName, searchPattern),
      ilike(contracts.governingLaw, searchPattern),
      ilike(contracts.renewalTerms, searchPattern),
      
      // User fields (who created the contract)
      ilike(users.username, searchPattern),
      ilike(users.firstName, searchPattern),
      ilike(users.lastName, searchPattern),
      
      // Contract analysis fields
      ilike(contractAnalysis.summary, searchPattern),
      // Search in JSONB fields using text cast for insights and keyTerms
      sql`${contractAnalysis.insights}::text ILIKE ${searchPattern}`,
      sql`${contractAnalysis.keyTerms}::text ILIKE ${searchPattern}`
    );

    // Build base query
    let baseQuery = db
      .select({
        contract: contracts,
        analysis: contractAnalysis,
        uploadedByUser: users,
      })
      .from(contracts)
      .leftJoin(contractAnalysis, eq(contracts.id, contractAnalysis.contractId))
      .leftJoin(users, eq(contracts.uploadedBy, users.id));

    // Build filter conditions
    const filterConditions: any[] = [searchConditions];

    // Apply organizational context filter
    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: contracts.companyId,
          businessUnitId: contracts.businessUnitId,
          locationId: contracts.locationId,
        },
        context
      );
      if (orgFilter) {
        filterConditions.push(orgFilter);
      }
    }

    // Apply user filter if provided
    if (userId) {
      filterConditions.push(eq(contracts.uploadedBy, userId));
    }

    // Apply combined filters
    baseQuery = baseQuery.where(and(...filterConditions));

    // Execute base contract search
    const contractResults = await baseQuery.orderBy(desc(contracts.createdAt));
    
    // Also search in royalty rules and get matching contract IDs
    // First, find contracts that match through rules
    const rulesSearchConditions = or(
      ilike(royaltyRules.ruleName, searchPattern),
      ilike(royaltyRules.description, searchPattern),
      ilike(royaltyRules.sourceText, searchPattern),
      ilike(royaltyRules.sourceSection, searchPattern),
      ilike(royaltyRules.calculationFormula, searchPattern)
    );
    
    let rulesSearchQuery = db
      .select({
        contractId: royaltyRules.contractId,
        uploadedBy: contracts.uploadedBy
      })
      .from(royaltyRules)
      .leftJoin(contracts, eq(royaltyRules.contractId, contracts.id));
    
    // Apply combined conditions: search pattern + context + user filter
    const rulesFilterConditions: any[] = [rulesSearchConditions];
    
    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: contracts.companyId,
          businessUnitId: contracts.businessUnitId,
          locationId: contracts.locationId,
        },
        context
      );
      if (orgFilter) {
        rulesFilterConditions.push(orgFilter);
      }
    }
    
    if (userId) {
      rulesFilterConditions.push(eq(contracts.uploadedBy, userId));
    }
    
    rulesSearchQuery = rulesSearchQuery.where(and(...rulesFilterConditions));
    
    const rulesResults = await rulesSearchQuery;
    
    const contractIdsFromRules = new Set(rulesResults.map(r => r.contractId).filter(Boolean));
    
    // Also search by date (separate query to avoid SQL errors with OR conditions)
    // Search for dates in formats: "11/3/2025", "11/03/2025", "November", "2025"
    const dateFilterConditions: any[] = [
      or(
        sql`to_char(${contracts.createdAt}, 'MM/DD/YYYY') ILIKE ${searchPattern}`,
        sql`to_char(${contracts.createdAt}, 'FMMM/FMDD/YYYY') ILIKE ${searchPattern}`,
        sql`to_char(${contracts.createdAt}, 'FMMonth') ILIKE ${searchPattern}`,
        sql`to_char(${contracts.createdAt}, 'YYYY') ILIKE ${searchPattern}`
      )
    ];

    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: contracts.companyId,
          businessUnitId: contracts.businessUnitId,
          locationId: contracts.locationId,
        },
        context
      );
      if (orgFilter) {
        dateFilterConditions.push(orgFilter);
      }
    }

    if (userId) {
      dateFilterConditions.push(eq(contracts.uploadedBy, userId));
    }

    const dateSearchResults = await db
      .select({
        id: contracts.id
      })
      .from(contracts)
      .where(and(...dateFilterConditions));
    
    const contractIdsFromDates = new Set(dateSearchResults.map(r => r.id));
    
    // Combine all contract IDs from rules and dates
    const allAdditionalIds = new Set([...contractIdsFromRules, ...contractIdsFromDates]);
    
    // If we found contracts through rules or dates search, fetch those contracts too
    if (allAdditionalIds.size > 0) {
      const contractIdsArray = Array.from(allAdditionalIds);
      
      // Build filters for additional fetch: IDs + context + userId
      const additionalFilterConditions: any[] = [inArray(contracts.id, contractIdsArray)];

      if (context) {
        const orgFilter = buildOrgContextFilter(
          {
            companyId: contracts.companyId,
            businessUnitId: contracts.businessUnitId,
            locationId: contracts.locationId,
          },
          context
        );
        if (orgFilter) {
          additionalFilterConditions.push(orgFilter);
        }
      }

      if (userId) {
        additionalFilterConditions.push(eq(contracts.uploadedBy, userId));
      }

      const additionalContractsQuery = db
        .select({
          contract: contracts,
          analysis: contractAnalysis,
          uploadedByUser: users,
        })
        .from(contracts)
        .leftJoin(contractAnalysis, eq(contracts.id, contractAnalysis.contractId))
        .leftJoin(users, eq(contracts.uploadedBy, users.id))
        .where(and(...additionalFilterConditions))
        .orderBy(desc(contracts.createdAt));
      
      const additionalContracts = await additionalContractsQuery;
      
      // Combine results and deduplicate by contract ID
      const allResults = [...contractResults, ...additionalContracts];
      const uniqueContractsMap = new Map();
      
      allResults.forEach(result => {
        if (!uniqueContractsMap.has(result.contract.id)) {
          uniqueContractsMap.set(result.contract.id, result);
        }
      });
      
      return Array.from(uniqueContractsMap.values()).map(({ contract, analysis, uploadedByUser }) => ({
        ...contract,
        analysis: analysis || undefined,
        uploadedByUser: uploadedByUser || undefined,
      }));
    }

    // Return just contract results if no rules/dates matches
    return contractResults.map(({ contract, analysis, uploadedByUser }) => ({
      ...contract,
      analysis: analysis || undefined,
      uploadedByUser: uploadedByUser || undefined,
    }));
  }

  async getContractsByUser(userId: string, context?: OrgAccessContext): Promise<Contract[]> {
    // Build filter conditions: userId is required, context is optional
    const filterConditions: any[] = [eq(contracts.uploadedBy, userId)];

    // Apply organizational context filter
    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: contracts.companyId,
          businessUnitId: contracts.businessUnitId,
          locationId: contracts.locationId,
        },
        context
      );
      if (orgFilter) {
        filterConditions.push(orgFilter);
      }
    }

    return await db
      .select()
      .from(contracts)
      .where(and(...filterConditions))
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
    // Database cascade deletes will automatically remove all child records:
    // - contractAnalysis (onDelete: cascade)
    // - contractEmbeddings (onDelete: cascade)
    // - contractVersions (onDelete: cascade)
    // - royaltyRules (onDelete: cascade)
    // - contractRoyaltyCalculations (onDelete: cascade)
    // - dynamicExtractionRuns (onDelete: cascade)
    // - documentChatSessions (onDelete: cascade)
    // - etc.
    // 
    // Sales data uses matchedContractId with onDelete: set null, so it won't be deleted
    // but the contract reference will be cleared
    
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  async updateContractMetadata(id: string, metadata: any, userId: string): Promise<Contract> {
    // Get current contract to capture current state
    const [currentContract] = await db.select().from(contracts).where(eq(contracts.id, id));
    
    if (!currentContract) {
      throw new Error("Contract not found");
    }

    // Helper function to parse date strings to Date objects
    const parseDate = (dateValue: any): Date | null => {
      if (!dateValue) return null;
      // If already a Date object, return it
      if (dateValue instanceof Date) return dateValue;
      // Try parsing string to Date
      try {
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
      } catch {
        return null;
      }
    };

    // Create metadata snapshot of ALL editable fields (including undefined to preserve schema)
    const metadataSnapshot = {
      displayName: metadata.displayName !== undefined ? metadata.displayName : currentContract.displayName,
      effectiveStart: metadata.effectiveStart !== undefined ? parseDate(metadata.effectiveStart) : currentContract.effectiveStart,
      effectiveEnd: metadata.effectiveEnd !== undefined ? parseDate(metadata.effectiveEnd) : currentContract.effectiveEnd,
      renewalTerms: metadata.renewalTerms !== undefined ? metadata.renewalTerms : currentContract.renewalTerms,
      governingLaw: metadata.governingLaw !== undefined ? metadata.governingLaw : currentContract.governingLaw,
      organizationName: metadata.organizationName !== undefined ? metadata.organizationName : currentContract.organizationName,
      counterpartyName: metadata.counterpartyName !== undefined ? metadata.counterpartyName : currentContract.counterpartyName,
      contractOwnerId: metadata.contractOwnerId !== undefined ? metadata.contractOwnerId : currentContract.contractOwnerId,
      contractType: metadata.contractType !== undefined ? metadata.contractType : currentContract.contractType,
      priority: metadata.priority !== undefined ? metadata.priority : currentContract.priority,
      notes: metadata.notes !== undefined ? metadata.notes : currentContract.notes,
      changeSummary: metadata.changeSummary || 'Metadata updated',
    };

    // Update contract with new metadata and increment version (handle null currentVersion)
    const currentVersion = currentContract.currentVersion ?? 0;
    const newVersion = currentVersion + 1;
    
    const [updatedContract] = await db
      .update(contracts)
      .set({
        displayName: metadataSnapshot.displayName,
        effectiveStart: metadataSnapshot.effectiveStart,
        effectiveEnd: metadataSnapshot.effectiveEnd,
        renewalTerms: metadataSnapshot.renewalTerms,
        governingLaw: metadataSnapshot.governingLaw,
        organizationName: metadataSnapshot.organizationName,
        counterpartyName: metadataSnapshot.counterpartyName,
        contractOwnerId: metadataSnapshot.contractOwnerId,
        contractType: metadataSnapshot.contractType,
        priority: metadataSnapshot.priority,
        notes: metadataSnapshot.notes,
        currentVersion: newVersion,
        approvalState: 'draft', // Reset to draft when editing
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id))
      .returning();

    // Create version record
    await db.insert(contractVersions).values({
      contractId: id,
      versionNumber: newVersion,
      editorId: userId,
      changeSummary: metadataSnapshot.changeSummary,
      metadataSnapshot,
      approvalState: 'draft',
    });

    return updatedContract;
  }

  async submitContractForApproval(id: string, userId: string): Promise<Contract> {
    const [contract] = await db
      .update(contracts)
      .set({
        approvalState: 'pending_approval',
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id))
      .returning();

    // Update the latest version to pending_approval
    await db
      .update(contractVersions)
      .set({ approvalState: 'pending_approval' })
      .where(
        and(
          eq(contractVersions.contractId, id),
          eq(contractVersions.versionNumber, contract.currentVersion)
        )
      );

    return contract;
  }

  async updateContractErpMatching(id: string, enabled: boolean): Promise<Contract> {
    const [contract] = await db
      .update(contracts)
      .set({
        useErpMatching: enabled,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id))
      .returning();

    if (!contract) {
      throw new Error("Contract not found");
    }

    return contract;
  }

  async createContractVersion(version: any): Promise<any> {
    const [newVersion] = await db.insert(contractVersions).values(version).returning();
    return newVersion;
  }

  async getContractVersions(contractId: string): Promise<any[]> {
    const versions = await db
      .select({
        id: contractVersions.id,
        contractId: contractVersions.contractId,
        versionNumber: contractVersions.versionNumber,
        changeSummary: contractVersions.changeSummary,
        metadataSnapshot: contractVersions.metadataSnapshot,
        editorId: contractVersions.editorId,
        editorUsername: users.username,
        createdAt: contractVersions.createdAt,
        approvalState: contractVersions.approvalState,
      })
      .from(contractVersions)
      .leftJoin(users, eq(contractVersions.editorId, users.id))
      .where(eq(contractVersions.contractId, contractId))
      .orderBy(desc(contractVersions.versionNumber));
    return versions;
  }

  async getContractVersion(versionId: string): Promise<any | undefined> {
    const [version] = await db
      .select()
      .from(contractVersions)
      .where(eq(contractVersions.id, versionId));
    return version;
  }

  async createContractApproval(approval: any): Promise<any> {
    const [newApproval] = await db.insert(contractApprovals).values(approval).returning();
    
    // Update the version approval state
    await db
      .update(contractVersions)
      .set({ approvalState: approval.status })
      .where(eq(contractVersions.id, approval.contractVersionId));

    // If approved, update the contract with the approved version's metadata
    if (approval.status === 'approved') {
      const [version] = await db
        .select()
        .from(contractVersions)
        .where(eq(contractVersions.id, approval.contractVersionId));
      
      if (version && version.metadataSnapshot) {
        const snapshot: any = version.metadataSnapshot;
        
        // Helper to safely convert date values from JSONB
        const parseSnapshotDate = (value: any): Date | null | undefined => {
          if (!value) return value === null ? null : undefined;
          if (value instanceof Date) return value;
          if (typeof value === 'string') {
            try {
              const parsed = new Date(value);
              return isNaN(parsed.getTime()) ? null : parsed;
            } catch {
              return null;
            }
          }
          return null;
        };
        
        await db
          .update(contracts)
          .set({ 
            approvalState: 'approved',
            displayName: snapshot.displayName,
            effectiveStart: parseSnapshotDate(snapshot.effectiveStart),
            effectiveEnd: parseSnapshotDate(snapshot.effectiveEnd),
            renewalTerms: snapshot.renewalTerms,
            governingLaw: snapshot.governingLaw,
            organizationName: snapshot.organizationName,
            counterpartyName: snapshot.counterpartyName,
            contractOwnerId: snapshot.contractOwnerId,
            contractType: snapshot.contractType,
            priority: snapshot.priority,
            notes: snapshot.notes,
            currentVersion: version.versionNumber,
          })
          .where(eq(contracts.id, version.contractId));
      }
    }

    return newApproval;
  }

  async getContractApprovals(versionId: string): Promise<any[]> {
    return await db
      .select()
      .from(contractApprovals)
      .where(eq(contractApprovals.contractVersionId, versionId))
      .orderBy(desc(contractApprovals.decidedAt));
  }

  async getPendingApprovals(userId: string): Promise<any[]> {
    // Get all pending versions with contract info
    const pendingVersions = await db
      .select({
        version: contractVersions,
        contract: contracts,
        editor: users,
      })
      .from(contractVersions)
      .innerJoin(contracts, eq(contractVersions.contractId, contracts.id))
      .leftJoin(users, eq(contractVersions.editorId, users.id))
      .where(eq(contractVersions.approvalState, 'pending_approval'))
      .orderBy(desc(contractVersions.createdAt));

    return pendingVersions.map(({ version, contract, editor }) => ({
      ...version,
      contract,
      editor,
    }));
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

  // Contract embeddings operations
  async saveContractEmbedding(data: {
    contractId: string;
    embeddingType: string;
    embedding: number[];
    sourceText: string;
    metadata?: any;
  }): Promise<void> {
    const vectorString = `[${data.embedding.join(',')}]`;
    await db.insert(contractEmbeddings).values({
      contractId: data.contractId,
      embeddingType: data.embeddingType,
      embedding: sql`${vectorString}::vector`,
      sourceText: data.sourceText,
      metadata: data.metadata || {}
    });
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

  // Sales data operations
  async createSalesData(data: InsertSalesData): Promise<SalesData> {
    const [salesDataRecord] = await db.insert(salesData).values(data).returning();
    return salesDataRecord;
  }

  async createBulkSalesData(salesDataArray: InsertSalesData[]): Promise<SalesData[]> {
    if (salesDataArray.length === 0) return [];
    const records = await db.insert(salesData).values(salesDataArray).returning();
    return records;
  }

  async getSalesDataByContract(contractId: string, context?: OrgAccessContext): Promise<SalesData[]> {
    const filterConditions: any[] = [eq(salesData.matchedContractId, contractId)];
    
    // Apply organizational context filtering
    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: salesData.companyId,
          businessUnitId: salesData.businessUnitId,
          locationId: salesData.locationId,
        },
        context
      );
      if (orgFilter) {
        filterConditions.push(orgFilter);
      }
    }
    
    return await db
      .select()
      .from(salesData)
      .where(and(...filterConditions))
      .orderBy(desc(salesData.transactionDate));
  }

  async getAllSalesData(limit: number = 100, offset: number = 0, context?: OrgAccessContext): Promise<{ salesData: SalesData[], total: number }> {
    const filterConditions: any[] = [];
    
    // Apply organizational context filtering
    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: salesData.companyId,
          businessUnitId: salesData.businessUnitId,
          locationId: salesData.locationId,
        },
        context
      );
      if (orgFilter) {
        filterConditions.push(orgFilter);
      }
    }
    
    // Build base query with optional filters
    const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(salesData)
      .where(whereClause);
      
    const data = await db
      .select()
      .from(salesData)
      .where(whereClause)
      .orderBy(desc(salesData.transactionDate))
      .limit(limit)
      .offset(offset);
    
    return {
      salesData: data,
      total: totalResult?.count || 0,
    };
  }

  async updateSalesDataMatch(id: string, contractId: string, confidence: number): Promise<SalesData> {
    const [updated] = await db
      .update(salesData)
      .set({ 
        matchedContractId: contractId, 
        matchConfidence: confidence.toString() 
      })
      .where(eq(salesData.id, id))
      .returning();
    return updated;
  }

  async deleteSalesData(id: string): Promise<void> {
    await db.delete(salesData).where(eq(salesData.id, id));
  }

  async deleteAllSalesDataForContract(contractId: string): Promise<void> {
    await db.delete(salesData).where(eq(salesData.matchedContractId, contractId));
  }

  // Contract royalty calculation operations
  async createContractRoyaltyCalculation(calculation: InsertContractRoyaltyCalculation): Promise<ContractRoyaltyCalculation> {
    const [created] = await db
      .insert(contractRoyaltyCalculations)
      .values(calculation)
      .returning();
    return created;
  }

  async getContractRoyaltyCalculations(contractId: string, context?: OrgAccessContext): Promise<ContractRoyaltyCalculation[]> {
    const filterConditions: any[] = [eq(contractRoyaltyCalculations.contractId, contractId)];
    
    // Apply organizational context filtering
    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: contractRoyaltyCalculations.companyId,
          businessUnitId: contractRoyaltyCalculations.businessUnitId,
          locationId: contractRoyaltyCalculations.locationId,
        },
        context
      );
      if (orgFilter) {
        filterConditions.push(orgFilter);
      }
    }
    
    return await db
      .select()
      .from(contractRoyaltyCalculations)
      .where(and(...filterConditions))
      .orderBy(desc(contractRoyaltyCalculations.createdAt));
  }

  async getContractRoyaltyCalculation(id: string, context?: OrgAccessContext): Promise<ContractRoyaltyCalculation | undefined> {
    const filterConditions: any[] = [eq(contractRoyaltyCalculations.id, id)];
    
    // Apply organizational context filtering
    if (context) {
      const orgFilter = buildOrgContextFilter(
        {
          companyId: contractRoyaltyCalculations.companyId,
          businessUnitId: contractRoyaltyCalculations.businessUnitId,
          locationId: contractRoyaltyCalculations.locationId,
        },
        context
      );
      if (orgFilter) {
        filterConditions.push(orgFilter);
      }
    }
    
    const [calculation] = await db
      .select()
      .from(contractRoyaltyCalculations)
      .where(and(...filterConditions));
    return calculation;
  }

  async updateCalculationStatus(id: string, status: string, comments?: string): Promise<ContractRoyaltyCalculation> {
    const updateData: any = { status };
    if (comments !== undefined) {
      updateData.comments = comments;
    }
    
    const [updated] = await db
      .update(contractRoyaltyCalculations)
      .set(updateData)
      .where(eq(contractRoyaltyCalculations.id, id))
      .returning();
    return updated;
  }

  async deleteContractRoyaltyCalculation(id: string): Promise<void> {
    await db.delete(contractRoyaltyCalculations).where(eq(contractRoyaltyCalculations.id, id));
  }

  async deleteAllCalculationsForContract(contractId: string): Promise<void> {
    await db.delete(contractRoyaltyCalculations).where(eq(contractRoyaltyCalculations.contractId, contractId));
  }

  // Royalty rule operations
  async createRoyaltyRule(rule: InsertRoyaltyRule): Promise<RoyaltyRule> {
    const [newRule] = await db.insert(royaltyRules).values(rule).returning();
    return newRule;
  }

  async getRoyaltyRulesByContract(contractId: string): Promise<RoyaltyRule[]> {
    return await db
      .select()
      .from(royaltyRules)
      .where(eq(royaltyRules.contractId, contractId))
      .orderBy(royaltyRules.priority);
  }

  async getActiveRoyaltyRulesByContract(contractId: string): Promise<RoyaltyRule[]> {
    return await db
      .select()
      .from(royaltyRules)
      .where(and(eq(royaltyRules.contractId, contractId), eq(royaltyRules.isActive, true)))
      .orderBy(royaltyRules.priority);
  }

  async deleteRoyaltyRule(ruleId: string): Promise<void> {
    await db.delete(royaltyRules).where(eq(royaltyRules.id, ruleId));
  }

  async deleteRoyaltyRulesByContract(contractId: string): Promise<void> {
    await db.delete(royaltyRules).where(eq(royaltyRules.contractId, contractId));
  }

  async updateRoyaltyRule(ruleId: string, updates: Partial<InsertRoyaltyRule>): Promise<RoyaltyRule> {
    const [updated] = await db
      .update(royaltyRules)
      .set(updates)
      .where(eq(royaltyRules.id, ruleId))
      .returning();
    return updated;
  }

  // Dynamic extraction operations
  async getExtractionRun(id: string): Promise<any> {
    const run = await db.query.extractionRuns.findFirst({
      where: (runs, { eq }) => eq(runs.id, id),
    });
    return run;
  }

  async getExtractionRunsByContract(contractId: string): Promise<any[]> {
    const runs = await db.query.extractionRuns.findMany({
      where: (runs, { eq }) => eq(runs.contractId, contractId),
      orderBy: (runs, { desc }) => [desc(runs.createdAt)],
    });
    return runs;
  }

  async getContractKnowledgeGraph(contractId: string): Promise<{ nodes: any[], edges: any[] }> {
    const nodes = await db.query.contractGraphNodes.findMany({
      where: (nodes, { eq }) => eq(nodes.contractId, contractId),
    });
    
    const edges = await db.query.contractGraphEdges.findMany({
      where: (edges, { eq }) => eq(edges.contractId, contractId),
    });
    
    return { nodes, edges };
  }

  async getPendingReviewTasks(userId?: string): Promise<any[]> {
    let whereClause = (tasks: any, { eq, and }: any) => {
      const conditions = [eq(tasks.status, 'pending')];
      if (userId) {
        conditions.push(eq(tasks.assignedTo, userId));
      }
      return and(...conditions);
    };

    const tasks = await db.query.humanReviewTasks.findMany({
      where: whereClause,
      orderBy: (tasks, { desc }) => [desc(tasks.priority), desc(tasks.createdAt)],
    });
    return tasks;
  }

  async approveReviewTask(taskId: string, userId: string, reviewNotes?: string): Promise<void> {
    await db
      .update(humanReviewTasks)
      .set({
        status: 'approved',
        reviewNotes: reviewNotes || 'Approved',
        reviewedBy: userId,
        reviewedAt: new Date(),
      })
      .where(eq(humanReviewTasks.id, taskId));
  }

  async rejectReviewTask(taskId: string, userId: string, reviewNotes: string): Promise<void> {
    await db
      .update(humanReviewTasks)
      .set({
        status: 'rejected',
        reviewNotes,
        reviewedBy: userId,
        reviewedAt: new Date(),
      })
      .where(eq(humanReviewTasks.id, taskId));
  }

  async getDynamicRulesByContract(contractId: string): Promise<any[]> {
    const rules = await db.query.ruleDefinitions.findMany({
      where: (rules, { eq }) => eq(rules.contractId, contractId),
      orderBy: (rules, { desc }) => [desc(rules.createdAt)],
    });
    return rules;
  }

  async getRuleValidationEvents(ruleId: string): Promise<any[]> {
    const events = await db.query.ruleValidationEvents.findMany({
      where: (events, { eq }) => eq(events.ruleDefinitionId, ruleId),
      orderBy: (events, { desc }) => [desc(events.createdAt)],
    });
    return events;
  }

  // Lead capture operations
  async createEarlyAccessSignup(signup: InsertEarlyAccessSignup): Promise<EarlyAccessSignup> {
    const [result] = await db
      .insert(earlyAccessSignups)
      .values(signup)
      .returning();
    return result;
  }

  async getAllEarlyAccessSignups(status?: string): Promise<EarlyAccessSignup[]> {
    let query = db.select().from(earlyAccessSignups);
    
    if (status) {
      query = query.where(eq(earlyAccessSignups.status, status));
    }
    
    return await query.orderBy(desc(earlyAccessSignups.createdAt));
  }

  async updateEarlyAccessSignupStatus(id: string, status: string, notes?: string): Promise<EarlyAccessSignup> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    const [result] = await db
      .update(earlyAccessSignups)
      .set(updateData)
      .where(eq(earlyAccessSignups.id, id))
      .returning();
    return result;
  }

  async createDemoRequest(request: InsertDemoRequest): Promise<DemoRequest> {
    const [result] = await db
      .insert(demoRequests)
      .values(request)
      .returning();
    return result;
  }

  async getAllDemoRequests(status?: string, planTier?: string): Promise<DemoRequest[]> {
    let query = db.select().from(demoRequests);
    
    const conditions = [];
    if (status) {
      conditions.push(eq(demoRequests.status, status));
    }
    if (planTier) {
      conditions.push(eq(demoRequests.planTier, planTier));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(demoRequests.createdAt));
  }

  async updateDemoRequestStatus(id: string, status: string, notes?: string): Promise<DemoRequest> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    const [result] = await db
      .update(demoRequests)
      .set(updateData)
      .where(eq(demoRequests.id, id))
      .returning();
    return result;
  }

  // Master data mapping operations
  async createMasterDataMapping(mapping: any): Promise<any> {
    const [result] = await db
      .insert(masterDataMappings)
      .values(mapping)
      .returning();
    return result;
  }

  async getMasterDataMapping(id: string): Promise<any | undefined> {
    const [mapping] = await db
      .select()
      .from(masterDataMappings)
      .where(eq(masterDataMappings.id, id));
    return mapping;
  }

  async getAllMasterDataMappings(filters?: { erpSystem?: string; entityType?: string; status?: string }): Promise<any[]> {
    let query = db.select().from(masterDataMappings);
    
    const conditions = [];
    if (filters?.erpSystem) {
      conditions.push(eq(masterDataMappings.erpSystem, filters.erpSystem));
    }
    if (filters?.entityType) {
      conditions.push(eq(masterDataMappings.entityType, filters.entityType));
    }
    if (filters?.status) {
      conditions.push(eq(masterDataMappings.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(masterDataMappings.createdAt));
  }

  async updateMasterDataMapping(id: string, updates: Partial<any>): Promise<any> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    
    const [result] = await db
      .update(masterDataMappings)
      .set(updateData)
      .where(eq(masterDataMappings.id, id))
      .returning();
    return result;
  }

  async deleteMasterDataMapping(id: string): Promise<void> {
    await db
      .delete(masterDataMappings)
      .where(eq(masterDataMappings.id, id));
  }

  // ERP Systems operations
  async createErpSystem(system: InsertErpSystem): Promise<ErpSystem> {
    const [result] = await db
      .insert(erpSystems)
      .values(system)
      .returning();
    return result;
  }

  async getErpSystem(id: string): Promise<ErpSystem | undefined> {
    const [result] = await db
      .select()
      .from(erpSystems)
      .where(eq(erpSystems.id, id));
    return result;
  }

  async getAllErpSystems(status?: string): Promise<ErpSystem[]> {
    const conditions = status ? eq(erpSystems.status, status) : undefined;
    const results = await db
      .select()
      .from(erpSystems)
      .where(conditions)
      .orderBy(desc(erpSystems.createdAt));
    return results;
  }

  async updateErpSystem(id: string, updates: Partial<InsertErpSystem>): Promise<ErpSystem> {
    const [result] = await db
      .update(erpSystems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(erpSystems.id, id))
      .returning();
    return result;
  }

  async deleteErpSystem(id: string): Promise<void> {
    await db
      .delete(erpSystems)
      .where(eq(erpSystems.id, id));
  }

  // ERP Entities operations
  async createErpEntity(entity: InsertErpEntity): Promise<ErpEntity> {
    const [result] = await db
      .insert(erpEntities)
      .values(entity)
      .returning();
    return result;
  }

  async getErpEntity(id: string): Promise<ErpEntity | undefined> {
    const [result] = await db
      .select()
      .from(erpEntities)
      .where(eq(erpEntities.id, id));
    return result;
  }

  async getErpEntitiesBySystem(systemId: string, entityType?: string): Promise<ErpEntity[]> {
    const conditions = entityType
      ? and(eq(erpEntities.systemId, systemId), eq(erpEntities.entityType, entityType))
      : eq(erpEntities.systemId, systemId);
    
    const results = await db
      .select()
      .from(erpEntities)
      .where(conditions)
      .orderBy(erpEntities.name);
    return results;
  }

  async updateErpEntity(id: string, updates: Partial<InsertErpEntity>): Promise<ErpEntity> {
    const [result] = await db
      .update(erpEntities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(erpEntities.id, id))
      .returning();
    return result;
  }

  async deleteErpEntity(id: string): Promise<void> {
    await db
      .delete(erpEntities)
      .where(eq(erpEntities.id, id));
  }

  // ERP Fields operations
  async createErpField(field: InsertErpField): Promise<ErpField> {
    const [result] = await db
      .insert(erpFields)
      .values(field)
      .returning();
    return result;
  }

  async getErpField(id: string): Promise<ErpField | undefined> {
    const [result] = await db
      .select()
      .from(erpFields)
      .where(eq(erpFields.id, id));
    return result;
  }

  async getErpFieldsByEntity(entityId: string): Promise<ErpField[]> {
    const results = await db
      .select()
      .from(erpFields)
      .where(eq(erpFields.entityId, entityId))
      .orderBy(erpFields.fieldName);
    return results;
  }

  async updateErpField(id: string, updates: Partial<InsertErpField>): Promise<ErpField> {
    const [result] = await db
      .update(erpFields)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(erpFields.id, id))
      .returning();
    return result;
  }

  async deleteErpField(id: string): Promise<void> {
    await db
      .delete(erpFields)
      .where(eq(erpFields.id, id));
  }

  // LicenseIQ Entities operations
  async createLicenseiqEntity(entity: InsertLicenseiqEntity): Promise<LicenseiqEntity> {
    const [result] = await db
      .insert(licenseiqEntities)
      .values(entity)
      .returning();
    return result;
  }

  async getLicenseiqEntity(id: string): Promise<LicenseiqEntity | undefined> {
    const [result] = await db
      .select()
      .from(licenseiqEntities)
      .where(eq(licenseiqEntities.id, id));
    return result;
  }

  async getAllLicenseiqEntities(category?: string): Promise<LicenseiqEntity[]> {
    const conditions = category ? eq(licenseiqEntities.category, category) : undefined;
    const results = await db
      .select()
      .from(licenseiqEntities)
      .where(conditions)
      .orderBy(licenseiqEntities.name);
    return results;
  }

  async updateLicenseiqEntity(id: string, updates: Partial<InsertLicenseiqEntity>): Promise<LicenseiqEntity> {
    const [result] = await db
      .update(licenseiqEntities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(licenseiqEntities.id, id))
      .returning();
    return result;
  }

  async deleteLicenseiqEntity(id: string): Promise<void> {
    await db
      .delete(licenseiqEntities)
      .where(eq(licenseiqEntities.id, id));
  }

  // LicenseIQ Fields operations
  async createLicenseiqField(field: InsertLicenseiqField): Promise<LicenseiqField> {
    const [result] = await db
      .insert(licenseiqFields)
      .values(field)
      .returning();
    return result;
  }

  async getLicenseiqField(id: string): Promise<LicenseiqField | undefined> {
    const [result] = await db
      .select()
      .from(licenseiqFields)
      .where(eq(licenseiqFields.id, id));
    return result;
  }

  async getLicenseiqFieldsByEntity(entityId: string): Promise<LicenseiqField[]> {
    const results = await db
      .select()
      .from(licenseiqFields)
      .where(eq(licenseiqFields.entityId, entityId))
      .orderBy(licenseiqFields.fieldName);
    return results;
  }

  async updateLicenseiqField(id: string, updates: Partial<InsertLicenseiqField>): Promise<LicenseiqField> {
    const [result] = await db
      .update(licenseiqFields)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(licenseiqFields.id, id))
      .returning();
    return result;
  }

  async deleteLicenseiqField(id: string): Promise<void> {
    await db
      .delete(licenseiqFields)
      .where(eq(licenseiqFields.id, id));
  }

  // LicenseIQ Entity Records operations
  async createLicenseiqEntityRecord(record: InsertLicenseiqEntityRecord): Promise<LicenseiqEntityRecord> {
    const [result] = await db
      .insert(licenseiqEntityRecords)
      .values(record)
      .returning();
    return result;
  }

  async getLicenseiqEntityRecord(id: string): Promise<LicenseiqEntityRecord | undefined> {
    const [result] = await db
      .select()
      .from(licenseiqEntityRecords)
      .where(eq(licenseiqEntityRecords.id, id));
    return result;
  }

  async getLicenseiqEntityRecordsByEntity(entityId: string): Promise<LicenseiqEntityRecord[]> {
    const results = await db
      .select()
      .from(licenseiqEntityRecords)
      .where(eq(licenseiqEntityRecords.entityId, entityId))
      .orderBy(desc(licenseiqEntityRecords.createdAt));
    return results;
  }

  async updateLicenseiqEntityRecord(id: string, updates: Partial<InsertLicenseiqEntityRecord>): Promise<LicenseiqEntityRecord> {
    const [result] = await db
      .update(licenseiqEntityRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(licenseiqEntityRecords.id, id))
      .returning();
    return result;
  }

  async deleteLicenseiqEntityRecord(id: string): Promise<void> {
    await db
      .delete(licenseiqEntityRecords)
      .where(eq(licenseiqEntityRecords.id, id));
  }

  // Data import jobs operations
  async createDataImportJob(job: any): Promise<any> {
    const [result] = await db
      .insert(dataImportJobs)
      .values(job)
      .returning();
    return result;
  }

  async getDataImportJobs(contractId?: string, status?: string): Promise<any[]> {
    let query = db.select().from(dataImportJobs);
    
    const conditions = [];
    if (contractId) {
      conditions.push(eq(dataImportJobs.customerId, contractId));
    }
    if (status) {
      conditions.push(eq(dataImportJobs.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const results = await query.orderBy(desc(dataImportJobs.createdAt));
    return results;
  }

  async getDataImportJob(id: string): Promise<any | undefined> {
    const [result] = await db
      .select()
      .from(dataImportJobs)
      .where(eq(dataImportJobs.id, id));
    return result;
  }

  async updateDataImportJob(id: string, updates: any): Promise<any> {
    const [result] = await db
      .update(dataImportJobs)
      .set(updates)
      .where(eq(dataImportJobs.id, id))
      .returning();
    return result;
  }

  // Imported ERP records operations
  async createImportedErpRecords(records: any[]): Promise<void> {
    if (records.length === 0) return;
    
    await db.insert(importedErpRecords).values(records);
  }

  async getImportedErpRecords(contractId?: string, jobId?: string): Promise<any[]> {
    let query = db.select().from(importedErpRecords);
    
    const conditions = [];
    if (contractId) {
      conditions.push(eq(importedErpRecords.customerId, contractId));
    }
    if (jobId) {
      conditions.push(eq(importedErpRecords.jobId, jobId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const results = await query.orderBy(desc(importedErpRecords.createdAt));
    return results;
  }

  async searchSemanticMatches(embedding: number[], contractId?: string, limit: number = 10): Promise<any[]> {
    const embeddingStr = JSON.stringify(embedding);
    
    let query = `
      SELECT 
        id,
        job_id,
        mapping_id,
        customer_id,
        source_record,
        target_record,
        metadata,
        created_at,
        1 - (embedding <=> $1::vector) as similarity
      FROM imported_erp_records
    `;
    
    const params: any[] = [embeddingStr];
    
    if (contractId) {
      query += ' WHERE customer_id = $2';
      params.push(contractId);
    }
    
    query += ' ORDER BY embedding <=> $1::vector';
    query += ` LIMIT ${limit}`;
    
    const result = await db.execute(sql.raw(query, ...params));
    return result.rows as any[];
  }

  // Master Data operations - Company
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    return company;
  }

  async getAllCompanies(status?: string): Promise<Company[]> {
    let query = db.select().from(companies);
    
    if (status) {
      query = query.where(eq(companies.status, status)) as any;
    }
    
    return await query.orderBy(companies.companyName);
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>, userId: string): Promise<Company> {
    const [updated] = await db
      .update(companies)
      .set({ ...updates, lastUpdateDate: new Date(), lastUpdatedBy: userId })
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Master Data operations - Business Unit
  async createBusinessUnit(unit: InsertBusinessUnit): Promise<BusinessUnit> {
    const [newUnit] = await db
      .insert(businessUnits)
      .values(unit)
      .returning();
    return newUnit;
  }

  async getBusinessUnit(id: string): Promise<BusinessUnit | undefined> {
    const [unit] = await db
      .select()
      .from(businessUnits)
      .where(eq(businessUnits.id, id));
    return unit;
  }

  async getBusinessUnitsByCompany(companyId: string, status?: string): Promise<BusinessUnit[]> {
    let query = db
      .select()
      .from(businessUnits)
      .where(eq(businessUnits.companyId, companyId));
    
    if (status) {
      query = query.where(and(
        eq(businessUnits.companyId, companyId),
        eq(businessUnits.status, status)
      )) as any;
    }
    
    return await query.orderBy(businessUnits.orgName);
  }

  async updateBusinessUnit(id: string, updates: Partial<InsertBusinessUnit>, userId: string): Promise<BusinessUnit> {
    const [updated] = await db
      .update(businessUnits)
      .set({ ...updates, lastUpdateDate: new Date(), lastUpdatedBy: userId })
      .where(eq(businessUnits.id, id))
      .returning();
    return updated;
  }

  async deleteBusinessUnit(id: string): Promise<void> {
    await db.delete(businessUnits).where(eq(businessUnits.id, id));
  }

  // Master Data operations - Location
  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db
      .insert(locations)
      .values(location)
      .returning();
    return newLocation;
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id));
    return location;
  }

  async getLocationsByCompany(companyId: string, status?: string): Promise<Location[]> {
    let query = db
      .select()
      .from(locations)
      .where(eq(locations.companyId, companyId));
    
    if (status) {
      query = query.where(and(
        eq(locations.companyId, companyId),
        eq(locations.status, status)
      )) as any;
    }
    
    return await query.orderBy(locations.locName);
  }

  async getLocationsByBusinessUnit(orgId: string, status?: string): Promise<Location[]> {
    let query = db
      .select()
      .from(locations)
      .where(eq(locations.orgId, orgId));
    
    if (status) {
      query = query.where(and(
        eq(locations.orgId, orgId),
        eq(locations.status, status)
      )) as any;
    }
    
    return await query.orderBy(locations.locName);
  }

  async updateLocation(id: string, updates: Partial<InsertLocation>, userId: string): Promise<Location> {
    const [updated] = await db
      .update(locations)
      .set({ ...updates, lastUpdateDate: new Date(), lastUpdatedBy: userId })
      .where(eq(locations.id, id))
      .returning();
    return updated;
  }

  async deleteLocation(id: string): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Master Data operations - Get full hierarchy
  async getMasterDataHierarchy(status?: string): Promise<any> {
    let companiesQuery = db.select().from(companies);
    if (status) {
      companiesQuery = companiesQuery.where(eq(companies.status, status)) as any;
    }
    const allCompanies = await companiesQuery.orderBy(companies.companyName);
    
    const hierarchy = await Promise.all(
      allCompanies.map(async (company) => {
        let unitsQuery = db
          .select()
          .from(businessUnits)
          .where(eq(businessUnits.companyId, company.id));
        
        if (status) {
          unitsQuery = unitsQuery.where(and(
            eq(businessUnits.companyId, company.id),
            eq(businessUnits.status, status)
          )) as any;
        }
        
        const units = await unitsQuery.orderBy(businessUnits.orgName);
        
        const unitsWithLocations = await Promise.all(
          units.map(async (unit) => {
            let locsQuery = db
              .select()
              .from(locations)
              .where(eq(locations.orgId, unit.id));
            
            if (status) {
              locsQuery = locsQuery.where(and(
                eq(locations.orgId, unit.id),
                eq(locations.status, status)
              )) as any;
            }
            
            const locs = await locsQuery.orderBy(locations.locName);
            
            return {
              ...unit,
              locations: locs,
            };
          })
        );
        
        return {
          ...company,
          businessUnits: unitsWithLocations,
        };
      })
    );
    
    return hierarchy;
  }

  // User Organization Roles operations
  async createUserOrganizationRole(roleData: InsertUserOrganizationRole): Promise<UserOrganizationRole> {
    const [role] = await db
      .insert(userOrganizationRoles)
      .values(roleData)
      .returning();
    return role;
  }

  async getUserOrganizationRoles(userId: string): Promise<any[]> {
    const roles = await db
      .select({
        id: userOrganizationRoles.id,
        userId: userOrganizationRoles.userId,
        companyId: userOrganizationRoles.companyId,
        companyName: companies.companyName,
        businessUnitId: userOrganizationRoles.businessUnitId,
        businessUnitName: businessUnits.orgName,
        locationId: userOrganizationRoles.locationId,
        locationName: locations.locName,
        role: userOrganizationRoles.role,
        status: userOrganizationRoles.status,
        creationDate: userOrganizationRoles.creationDate,
        lastUpdateDate: userOrganizationRoles.lastUpdateDate,
      })
      .from(userOrganizationRoles)
      .leftJoin(companies, eq(userOrganizationRoles.companyId, companies.id))
      .leftJoin(businessUnits, eq(userOrganizationRoles.businessUnitId, businessUnits.id))
      .leftJoin(locations, eq(userOrganizationRoles.locationId, locations.id))
      .where(eq(userOrganizationRoles.userId, userId))
      .orderBy(companies.companyName, businessUnits.orgName, locations.locName);
    
    return roles;
  }

  async getAllUserOrganizationRoles(): Promise<any[]> {
    const roles = await db
      .select({
        id: userOrganizationRoles.id,
        userId: userOrganizationRoles.userId,
        username: users.username,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        companyId: userOrganizationRoles.companyId,
        companyName: companies.companyName,
        businessUnitId: userOrganizationRoles.businessUnitId,
        businessUnitName: businessUnits.orgName,
        locationId: userOrganizationRoles.locationId,
        locationName: locations.locName,
        role: userOrganizationRoles.role,
        status: userOrganizationRoles.status,
        creationDate: userOrganizationRoles.creationDate,
        lastUpdateDate: userOrganizationRoles.lastUpdateDate,
      })
      .from(userOrganizationRoles)
      .leftJoin(users, eq(userOrganizationRoles.userId, users.id))
      .leftJoin(companies, eq(userOrganizationRoles.companyId, companies.id))
      .leftJoin(businessUnits, eq(userOrganizationRoles.businessUnitId, businessUnits.id))
      .leftJoin(locations, eq(userOrganizationRoles.locationId, locations.id))
      .orderBy(users.username, companies.companyName);
    
    return roles;
  }

  async getUserOrganizationRoleById(id: string): Promise<UserOrganizationRole | undefined> {
    const [role] = await db
      .select()
      .from(userOrganizationRoles)
      .where(eq(userOrganizationRoles.id, id));
    return role;
  }

  async updateUserOrganizationRole(id: string, updates: Partial<InsertUserOrganizationRole>, userId: string): Promise<UserOrganizationRole> {
    const [updated] = await db
      .update(userOrganizationRoles)
      .set({ ...updates, lastUpdateDate: new Date(), lastUpdatedBy: userId })
      .where(eq(userOrganizationRoles.id, id))
      .returning();
    return updated;
  }

  async deleteUserOrganizationRole(id: string): Promise<void> {
    await db.delete(userOrganizationRoles).where(eq(userOrganizationRoles.id, id));
  }

  async getUsersByOrganization(companyId: string, businessUnitId?: string, locationId?: string): Promise<any[]> {
    let query = db
      .select({
        id: userOrganizationRoles.id,
        userId: userOrganizationRoles.userId,
        username: users.username,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        role: userOrganizationRoles.role,
        status: userOrganizationRoles.status,
      })
      .from(userOrganizationRoles)
      .leftJoin(users, eq(userOrganizationRoles.userId, users.id))
      .where(eq(userOrganizationRoles.companyId, companyId));
    
    if (businessUnitId) {
      query = query.where(and(
        eq(userOrganizationRoles.companyId, companyId),
        eq(userOrganizationRoles.businessUnitId, businessUnitId)
      )) as any;
    }
    
    if (locationId) {
      query = query.where(and(
        eq(userOrganizationRoles.companyId, companyId),
        eq(userOrganizationRoles.businessUnitId, businessUnitId!),
        eq(userOrganizationRoles.locationId, locationId)
      )) as any;
    }
    
    return await query.orderBy(users.username);
  }

  // User Active Context operations
  async getUserActiveContext(userId: string): Promise<UserActiveContext | undefined> {
    const [context] = await db
      .select()
      .from(userActiveContext)
      .where(eq(userActiveContext.userId, userId));
    return context;
  }

  async setUserActiveContext(userId: string, orgRoleId: string): Promise<UserActiveContext> {
    // Check if user already has an active context
    const existing = await this.getUserActiveContext(userId);
    
    if (existing) {
      // Update existing context
      const [updated] = await db
        .update(userActiveContext)
        .set({ 
          activeOrgRoleId: orgRoleId, 
          lastSwitched: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(userActiveContext.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new context
      const [created] = await db
        .insert(userActiveContext)
        .values({ 
          userId, 
          activeOrgRoleId: orgRoleId,
          lastSwitched: new Date()
        })
        .returning();
      return created;
    }
  }

  async deleteUserActiveContext(userId: string): Promise<void> {
    await db.delete(userActiveContext).where(eq(userActiveContext.userId, userId));
  }

}

export const storage = new DatabaseStorage();
