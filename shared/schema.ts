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

// Contract with analysis
export type ContractWithAnalysis = Contract & {
  analysis?: ContractAnalysis;
  uploadedByUser?: User;
};
