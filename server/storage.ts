import {
  users,
  contracts,
  contractAnalysis,
  auditTrail,
  type User,
  type InsertUser,
  type Contract,
  type InsertContract,
  type ContractAnalysis,
  type InsertContractAnalysis,
  type AuditTrail,
  type InsertAuditTrail,
  type ContractWithAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";

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
  
  // Contract analysis operations
  createContractAnalysis(analysis: InsertContractAnalysis): Promise<ContractAnalysis>;
  getContractAnalysis(contractId: string): Promise<ContractAnalysis | undefined>;
  updateContractAnalysis(contractId: string, analysis: Partial<InsertContractAnalysis>): Promise<ContractAnalysis>;
  
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

  // Contract analysis operations
  async createContractAnalysis(analysis: InsertContractAnalysis): Promise<ContractAnalysis> {
    const [newAnalysis] = await db
      .insert(contractAnalysis)
      .values(analysis)
      .returning();
    return newAnalysis;
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
        ? db.select({ count: count() }).from(contracts).where(and(eq(contracts.uploadedBy, userId), eq(contracts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))))
        : db.select({ count: count() }).from(contracts).where(eq(contracts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
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
}

export const storage = new DatabaseStorage();
