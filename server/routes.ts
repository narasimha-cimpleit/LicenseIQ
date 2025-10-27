import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto, { randomUUID } from "crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword } from "./auth";
import { fileService } from "./services/fileService";
import { groqService } from "./services/groqService";
import { registerRulesRoutes } from "./rulesRoutes";
import { SalesDataParser } from "./services/salesDataParser";
import { PDFInvoiceService } from "./services/pdfInvoiceService";
import { HuggingFaceEmbeddingService } from "./services/huggingFaceEmbedding";
import { RAGService } from "./services/ragService";
import { db } from "./db";
import { contracts, contractEmbeddings, royaltyRules } from "@shared/schema";
import { 
  insertContractSchema, 
  insertContractAnalysisSchema, 
  insertAuditTrailSchema,
  insertSalesDataSchema
} from "@shared/schema";
import { and, eq, count, desc } from "drizzle-orm";

// Configure multer for secure file uploads with disk storage
const uploadDir = path.join(process.cwd(), 'uploads');
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate secure filename with UUID
      const fileExtension = path.extname(file.originalname);
      const fileName = `${randomUUID()}${fileExtension}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  },
});

// Configure multer for CSV/Excel uploads
const dataUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${randomUUID()}${fileExtension}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for data files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExts = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExts.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  },
});

// Audit logging middleware
async function createAuditLog(req: any, action: string, resourceType?: string, resourceId?: string, details?: any) {
  if (req.user?.id) {
    try {
      await storage.createAuditLog({
        userId: req.user.id,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Emergency fix: Reprocess specific contract
  app.post('/api/emergency-reprocess', async (req, res) => {
    try {
      const contractId = 'af86280e-143e-4865-8f02-f762954fa05a';
      const filePath = '/home/runner/workspace/uploads/a9384579-61ff-482f-8da0-91db501030dc.pdf';
      
      console.log(`🚨 Emergency reprocessing contract ${contractId}`);
      
      // Update status to processing
      await storage.updateContractStatus(contractId, 'processing');
      
      res.json({ message: 'Emergency reprocessing started', contractId });
      
      // Trigger analysis with fixed code
      processContractAnalysis(contractId, filePath);
      
    } catch (error) {
      console.error('Emergency reprocess error:', error);
      res.status(500).json({ error: 'Failed to emergency reprocess' });
    }
  });

  // Vendor routes
//   app.get('/api/vendors', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const search = req.query.search as string;
//       const vendors = await storage.getVendors(search);
//       
//       // Fetch contracts for each vendor
//       const vendorsWithContracts = await Promise.all(
//         vendors.map(async (vendor) => {
//           const contracts = await storage.getContractsByVendor(vendor.id);
//           return {
//             ...vendor,
//             licenses: contracts.map(contract => ({
//               id: contract.id,
//               name: contract.originalName,
//               status: contract.status
//             }))
//           };
//         })
//       );
//       
//       res.json({ vendors: vendorsWithContracts });
//     } catch (error: any) {
//       console.error('Get vendors error:', error);
//       res.status(500).json({ error: error.message || 'Failed to fetch vendors' });
//     }
//   });

//   app.post('/api/vendors', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const vendor = await storage.createVendor(req.body);
//       
//       await createAuditLog(req, 'vendor_create', 'vendor', vendor.id, {
//         name: vendor.name
//       });
//       
//       res.json(vendor);
//     } catch (error: any) {
//       console.error('Create vendor error:', error);
//       res.status(500).json({ error: error.message || 'Failed to create vendor' });
//     }
//   });

  // Contract upload endpoint
  app.post('/api/contracts/upload', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Create contract record
      const contractData = insertContractSchema.parse({
        vendorId: req.body.vendorId || null, // Optional vendor link for royalty contracts
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileSize: req.file.size,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        uploadedBy: req.user.id,
        status: 'processing'
      });

      const contract = await storage.createContract(contractData);

      // Log the upload
      await createAuditLog(req, 'contract_upload', 'contract', contract.id, {
        originalName: req.file.originalname,
        fileSize: req.file.size
      });

      res.json({ 
        id: contract.id,  // Frontend expects 'id' not 'contractId'
        contractId: contract.id,  // Keep both for backward compatibility
        status: 'uploaded',
        message: 'Contract uploaded successfully' 
      });

      // Process contract analysis in background
      processContractAnalysis(contract.id, req.file.path);

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload contract' });
    }
  });

  // Dynamic extraction endpoints
  app.post('/api/contracts/:id/extract-dynamic', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;

      // Fetch contract to get file path
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Extract text from file
      const mimeType = contract.fileType || 'application/pdf';
      const rawText = await fileService.extractTextFromFile(contract.filePath, mimeType);
      
      if (!rawText || rawText.trim().length === 0) {
        return res.status(400).json({ error: 'Failed to extract text from contract file' });
      }

      // Import orchestrator service dynamically
      const { processContractDynamic } = await import('./services/documentOrchestratorService');
      
      // Start extraction in background
      processContractDynamic(contractId, rawText, userId)
        .then(() => console.log(`✅ Dynamic extraction completed for contract ${contractId}`))
        .catch(err => console.error(`❌ Dynamic extraction failed for contract ${contractId}:`, err));

      await createAuditLog(req, 'dynamic_extraction_triggered', 'contract', contractId);

      res.json({ 
        message: 'Dynamic extraction started',
        contractId 
      });
    } catch (error: any) {
      console.error('Dynamic extraction trigger error:', error);
      res.status(500).json({ error: error.message || 'Failed to start dynamic extraction' });
    }
  });

  app.get('/api/extraction-runs/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const run = await storage.getExtractionRun(req.params.id);
      if (!run) {
        return res.status(404).json({ error: 'Extraction run not found' });
      }
      res.json(run);
    } catch (error: any) {
      console.error('Get extraction run error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch extraction run' });
    }
  });

  app.get('/api/contracts/:id/extraction-runs', isAuthenticated, async (req: any, res: Response) => {
    try {
      const runs = await storage.getExtractionRunsByContract(req.params.id);
      res.json(runs);
    } catch (error: any) {
      console.error('Get extraction runs error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch extraction runs' });
    }
  });

  app.get('/api/contracts/:id/knowledge-graph', isAuthenticated, async (req: any, res: Response) => {
    try {
      const graph = await storage.getContractKnowledgeGraph(req.params.id);
      res.json(graph);
    } catch (error: any) {
      console.error('Get knowledge graph error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch knowledge graph' });
    }
  });

  app.get('/api/contracts/:id/dynamic-rules', isAuthenticated, async (req: any, res: Response) => {
    try {
      const rules = await storage.getDynamicRulesByContract(req.params.id);
      res.json(rules);
    } catch (error: any) {
      console.error('Get dynamic rules error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch dynamic rules' });
    }
  });

  app.get('/api/human-review-tasks', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      const tasks = await storage.getPendingReviewTasks(canViewAll ? undefined : userId);
      res.json(tasks);
    } catch (error: any) {
      console.error('Get review tasks error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch review tasks' });
    }
  });

  app.patch('/api/human-review-tasks/:id/approve', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;
      
      // Get task and check authorization
      const task = await db.query.humanReviewTasks.findFirst({
        where: (tasks, { eq }) => eq(tasks.id, taskId),
      });
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Check if user is assigned to task or has admin/owner role
      const userRole = (await storage.getUser(userId))?.role;
      const isAuthorized = task.assignedTo === userId || userRole === 'admin' || userRole === 'owner';
      
      if (!isAuthorized) {
        return res.status(403).json({ error: 'You are not authorized to approve this task' });
      }
      
      // Validate and sanitize review notes
      let reviewData = '';
      if (req.body.reviewNotes !== undefined && req.body.reviewNotes !== null) {
        if (typeof req.body.reviewNotes !== 'string') {
          return res.status(400).json({ error: 'Review notes must be a string' });
        }
        reviewData = req.body.reviewNotes.trim();
      }
      
      await storage.approveReviewTask(taskId, userId, reviewData || 'Approved');
      await createAuditLog(req, 'review_task_approved', 'human_review_task', taskId);
      res.json({ message: 'Task approved' });
    } catch (error: any) {
      console.error('Approve task error:', error);
      res.status(500).json({ error: error.message || 'Failed to approve task' });
    }
  });

  app.patch('/api/human-review-tasks/:id/reject', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;
      
      // Validate request body
      if (!req.body.reviewNotes || typeof req.body.reviewNotes !== 'string' || req.body.reviewNotes.trim() === '') {
        return res.status(400).json({ error: 'Review notes are required for rejection' });
      }
      
      // Get task and check authorization
      const task = await db.query.humanReviewTasks.findFirst({
        where: (tasks, { eq }) => eq(tasks.id, taskId),
      });
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Check if user is assigned to task or has admin/owner role
      const userRole = (await storage.getUser(userId))?.role;
      const isAuthorized = task.assignedTo === userId || userRole === 'admin' || userRole === 'owner';
      
      if (!isAuthorized) {
        return res.status(403).json({ error: 'You are not authorized to reject this task' });
      }
      
      await storage.rejectReviewTask(taskId, userId, req.body.reviewNotes);
      await createAuditLog(req, 'review_task_rejected', 'human_review_task', taskId);
      res.json({ message: 'Task rejected' });
    } catch (error: any) {
      console.error('Reject task error:', error);
      res.status(500).json({ error: error.message || 'Failed to reject task' });
    }
  });

  app.get('/api/rules/:id/validation-events', isAuthenticated, async (req: any, res: Response) => {
    try {
      const events = await storage.getRuleValidationEvents(req.params.id);
      res.json(events);
    } catch (error: any) {
      console.error('Get validation events error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch validation events' });
    }
  });

  // Analytics API endpoints
  app.get('/api/analytics/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      // Add caching (private for user-specific data)
      res.set('Cache-Control', 'private, max-age=300');
      
      const metrics = await storage.getContractMetrics(
        canViewAll ? undefined : userId
      );

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ message: 'Failed to fetch metrics' });
    }
  });

  // Get audit logs
  app.get('/api/audit', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      
      // Check if user has audit access
      if (userRole !== 'admin' && userRole !== 'owner' && userRole !== 'auditor') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getAuditLogs(undefined, limit, offset);
      res.json(result);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Get users list (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      
      // Check if user has admin access
      if (userRole !== 'admin' && userRole !== 'owner') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Update user role (admin only)
  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res: Response) => {
    try {
      const currentUserId = req.user.id;
      const currentUserRole = (await storage.getUser(currentUserId))?.role;
      
      // Check if user has admin access
      if (currentUserRole !== 'admin' && currentUserRole !== 'owner') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { newRole } = req.body;
      const targetUserId = req.params.id;
      
      // Prevent non-owners from changing owner role
      if (newRole === 'owner' && currentUserRole !== 'owner') {
        return res.status(403).json({ error: 'Only owners can assign owner role' });
      }

      await storage.updateUserRole(targetUserId, newRole);
      
      // Log the action
      await createAuditLog(req, 'user_role_update', 'user', targetUserId, {
        newRole,
        previousRole: 'unknown' // We'd need to fetch this beforehand to track properly
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  // Update user profile (admin only)
  app.patch('/api/users/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const currentUserId = req.user.id;
      const currentUserRole = (await storage.getUser(currentUserId))?.role;
      
      // Check if user has admin access or is updating their own profile
      if (currentUserRole !== 'admin' && currentUserRole !== 'owner' && currentUserId !== req.params.id) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { firstName, lastName, email } = req.body;
      const targetUserId = req.params.id;
      
      await storage.updateUser(targetUserId, { firstName, lastName, email });
      
      // Log the action
      await createAuditLog(req, 'user_profile_update', 'user', targetUserId, {
        updatedFields: { firstName, lastName, email }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });

  // Delete user (admin only)
  app.delete('/api/users/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const currentUserId = req.user.id;
      const currentUserRole = (await storage.getUser(currentUserId))?.role;
      
      // Check if user has admin access
      if (currentUserRole !== 'admin' && currentUserRole !== 'owner') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const targetUserId = req.params.id;
      
      // Prevent self-deletion
      if (currentUserId === targetUserId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent non-owners from deleting owners
      if (targetUser.role === 'owner' && currentUserRole !== 'owner') {
        return res.status(403).json({ error: 'Only owners can delete other owners' });
      }

      await storage.deleteUser(targetUserId);
      
      // Log the action
      await createAuditLog(req, 'user_delete', 'user', targetUserId, {
        deletedEmail: targetUser.email
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Get contracts list
  app.get('/api/contracts', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAny = userRole === 'admin' || userRole === 'owner';
      
      const contracts = await storage.getContracts(canViewAny ? undefined : userId);
      res.json(contracts);
    } catch (error) {
      console.error('Get contracts error:', error);
      res.status(500).json({ error: 'Failed to fetch contracts' });
    }
  });

  // Get contract details
  app.get('/api/contracts/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canViewAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(contract);
    } catch (error) {
      console.error('Get contract error:', error);
      res.status(500).json({ error: 'Failed to fetch contract' });
    }
  });

  // Get contract analysis
  app.get('/api/contracts/:id/analysis', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canViewAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const analysis = await storage.getContractAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Get analysis error:', error);
      res.status(500).json({ error: 'Failed to fetch analysis' });
    }
  });

  // Export contract analysis as report
  app.get('/api/contracts/:id/report', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      
      // Get contract and analysis data
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Check permissions  
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canViewAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const analysis = await storage.getContractAnalysis(contractId);
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      // Generate report content
      const reportContent = `
LICENSEIQ ANALYSIS REPORT
==========================

Contract: ${contract.originalName}
Analysis Date: ${analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A'}
Confidence Score: ${Math.round(parseFloat(analysis.confidence || '0') * 100)}%

EXECUTIVE SUMMARY
=================
${analysis.summary}

KEY TERMS & CONDITIONS
======================
${Array.isArray(analysis.keyTerms) ? analysis.keyTerms.map((term: string, index: number) => `${index + 1}. ${term}`).join('\n') : 'No key terms extracted'}

RISK ANALYSIS
=============
${analysis.riskAnalysis}

AI INSIGHTS & RECOMMENDATIONS
==============================
${analysis.insights}

---
Generated by LicenseIQ AI Analysis Platform
Report ID: ${contractId}
`;

      // Set headers for file download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${contract.originalName}_analysis_report.txt"`);
      
      res.send(reportContent);
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  // Reprocess contract endpoint for testing
  app.post('/api/contracts/:id/reprocess', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Check permissions
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canReprocess = userRole === 'admin' || userRole === 'owner' || contract.uploadedBy === userId;
      
      if (!canReprocess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Clear existing rules first
      console.log(`🗑️ Clearing existing rules for contract ${contractId}`);
      // Note: Rules will be replaced during reprocessing

      res.json({ message: 'Reprocessing started', contractId });

      // Update status to processing
      await storage.updateContractStatus(contractId, 'processing');

      // Trigger analysis in background
      processContractAnalysis(contractId, contract.filePath);

    } catch (error) {
      console.error('Reprocess error:', error);
      res.status(500).json({ error: 'Failed to reprocess contract' });
    }
  });

  // Calculate royalties for all sales matched to this contract
  app.post('/api/contracts/:id/calculate-matched-royalties', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const { periodStart, periodEnd } = req.body;
      
      // Get contract and check permissions
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canView = userRole === 'admin' || userRole === 'owner' || contract.uploadedBy === userId;
      
      if (!canView) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get all sales matched to this contract
      const { dynamicRulesEngine } = await import('./services/dynamicRulesEngine.js');
      const allSales = await storage.getSalesDataByContract(contractId);
      
      // Filter by date range if provided
      let salesToCalculate = allSales;
      if (periodStart || periodEnd) {
        salesToCalculate = allSales.filter(sale => {
          const saleDate = new Date(sale.transactionDate);
          if (periodStart && saleDate < new Date(periodStart)) return false;
          if (periodEnd && saleDate > new Date(periodEnd)) return false;
          return true;
        });
      }

      if (salesToCalculate.length === 0) {
        return res.json({ 
          success: true,
          totalRoyalty: 0, 
          salesCount: 0,
          breakdown: [],
          message: 'No sales data matched to this contract' 
        });
      }

      // Convert sales to format expected by dynamic engine
      const salesItems = salesToCalculate.map(sale => ({
        id: sale.id,
        productName: sale.productName || 'Unknown',
        category: sale.category || '',
        territory: sale.territory || 'Primary Territory',
        quantity: parseFloat(sale.quantity || '0'),
        transactionDate: new Date(sale.transactionDate),
        grossAmount: parseFloat(sale.grossAmount || '0')
      }));

      // Use dynamic rules engine to calculate royalties
      const result = await dynamicRulesEngine.calculateRoyalty(contractId, salesItems);

      const breakdown = result.breakdown.map(item => ({
        saleId: item.saleId,
        productName: item.productName,
        category: item.category,
        territory: item.territory,
        quantity: item.quantity,
        royaltyAmount: item.calculatedRoyalty,
        ruleApplied: item.ruleApplied,
        explanation: item.explanation,
        tierRate: item.tierRate,
        seasonalMultiplier: item.seasonalMultiplier,
        territoryMultiplier: item.territoryMultiplier
      }));

      res.json({
        success: true,
        contractId,
        contractName: contract.originalName,
        calculatedRoyalty: result.totalRoyalty,
        totalRoyalty: result.finalRoyalty,
        minimumGuarantee: result.minimumGuarantee,
        finalRoyalty: result.finalRoyalty,
        salesCount: salesToCalculate.length,
        periodStart,
        periodEnd,
        breakdown,
        rulesApplied: result.rulesApplied,
        currency: 'USD'
      });

    } catch (error) {
      console.error('Royalty calculation error:', error);
      res.status(500).json({ error: 'Failed to calculate royalties' });
    }
  });

  // ==========================================
  // ERP IMPORT ROUTES
  // ==========================================
  
  // Upload and import sales data from CSV/Excel (with AI-driven contract matching)
//   app.post('/api/erp-imports', isAuthenticated, dataUpload.single('file'), async (req: any, res: Response) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//       }
// 
//       // No vendor selection needed - AI will match contracts automatically using semantic search
//       const { vendorId } = req.body; // Legacy support, but not used anymore
// 
//       // Create import job (vendor matching happens via AI semantic search)
//       const importJob = await storage.createErpImportJob({
//         jobType: 'manual_upload',
//         fileName: req.file.originalname,
//         status: 'processing',
//         createdBy: req.user.id,
//         connectionId: null,
//         startedAt: new Date()
//       });
// 
//       // Parse file
//       const fileBuffer = fs.readFileSync(req.file.path);
//       const parseResult = await SalesDataParser.parseFile(fileBuffer, req.file.originalname);
// 
//       // Import SemanticSearchService and GroqValidationService dynamically
//       const { SemanticSearchService } = await import('./services/semanticSearchService.js');
//       const { GroqValidationService } = await import('./services/groqValidationService.js');
// 
//       let lowConfidenceCount = 0;
//       let highConfidenceCount = 0;
//       let noMatchCount = 0;
// 
//       // Store parsed rows in staging with AI contract matching
//       for (const row of parseResult.rows) {
//         let matchedVendorId = vendorId; // Use manual vendor if provided
//         let matchConfidence = 1.0;
//         let matchReasoning = vendorId ? 'Manual vendor selection' : null;
//         let needsReview = false;
// 
//         // AI-driven matching if no vendor specified
//         if (!vendorId && row.validationStatus === 'valid') {
//           try {
//             const salesData = row.rowData as any;
//             const match = await SemanticSearchService.findBestContractForSales({
//               productCode: salesData.productCode,
//               productName: salesData.productName,
//               category: salesData.category,
//               territory: salesData.territory,
//               transactionDate: salesData.transactionDate ? new Date(salesData.transactionDate) : undefined
//             });
// 
//             if (match) {
//               // Use Groq LLaMA to validate the match (FREE)
//               const contract = await storage.getContract(match.contractId);
//               const validation = await GroqValidationService.validateContractMatch(
//                 salesData,
//                 {
//                   summary: contract?.analysis?.summary,
//                   keyTerms: contract?.analysis?.keyTerms,
//                 },
//                 match.confidence
//               );
// 
//               matchedVendorId = match.vendorId;
//               matchConfidence = validation.confidence;
//               matchReasoning = `${match.reasoning}; AI validation: ${validation.reasoning}`;
//               needsReview = validation.confidence < 0.6 || !validation.isValid;
// 
//               if (needsReview) {
//                 lowConfidenceCount++;
//               } else {
//                 highConfidenceCount++;
//               }
//             } else {
//               noMatchCount++;
//               needsReview = true;
//               matchReasoning = 'No matching contract found';
//             }
//           } catch (matchError) {
//             console.error(`❌ Matching error for row ${row.externalId}:`, matchError);
//             needsReview = true;
//             matchConfidence = 0;
//             matchReasoning = `Matching failed: ${matchError.message}`;
//             noMatchCount++;
//           }
//         }
// 
//         await storage.createSalesStaging({
//           importJobId: importJob.id,
//           externalId: row.externalId,
//           rowData: { 
//             ...row.rowData, 
//             vendorId: matchedVendorId,
//             _aiMatch: {
//               confidence: matchConfidence,
//               reasoning: matchReasoning,
//               needsReview
//             }
//           },
//           validationStatus: needsReview ? 'needs_review' : row.validationStatus,
//           validationErrors: row.validationErrors || null
//         });
//       }
// 
//       // Update import job status with AI matching summary
//       await storage.updateErpImportJobStatus(importJob.id, 'completed', {
//         recordsImported: parseResult.validRows,
//         recordsFailed: parseResult.invalidRows,
//         aiMatchingSummary: vendorId ? null : {
//           highConfidence: highConfidenceCount,
//           lowConfidence: lowConfidenceCount,
//           noMatch: noMatchCount
//         }
//       });
// 
//       // Log the import
//       await createAuditLog(req, 'import_sales_data', 'erp_import_job', importJob.id, {
//         fileName: req.file.originalname,
//         totalRows: parseResult.totalRows,
//         validRows: parseResult.validRows,
//         invalidRows: parseResult.invalidRows,
//         aiMatchingEnabled: !vendorId
//       });
// 
//       res.json({
//         importJob,
//         summary: {
//           totalRows: parseResult.totalRows,
//           validRows: parseResult.validRows,
//           invalidRows: parseResult.invalidRows,
//           aiMatching: vendorId ? null : {
//             highConfidence: highConfidenceCount,
//             lowConfidence: lowConfidenceCount,
//             noMatch: noMatchCount
//           }
//         }
//       });
//     } catch (error) {
//       console.error('ERP import error:', error);
//       res.status(500).json({ error: 'Failed to import sales data' });
//     }
//   });

  // Get all import jobs
//   app.get('/api/erp-imports', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const { status } = req.query;
//       const jobs = await storage.getErpImportJobs(req.user.id, status as string);
//       res.json({ jobs });
//     } catch (error) {
//       console.error('Get import jobs error:', error);
//       res.status(500).json({ error: 'Failed to fetch import jobs' });
//     }
//   });

  // Get specific import job with staging data
//   app.get('/api/erp-imports/:id', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const importJob = await storage.getErpImportJob(req.params.id);
//       if (!importJob) {
//         return res.status(404).json({ error: 'Import job not found' });
//       }
// 
//       const stagingData = await storage.getSalesStaging(req.params.id);
//       res.json({ importJob, stagingData });
//     } catch (error) {
//       console.error('Get import job error:', error);
//       res.status(500).json({ error: 'Failed to fetch import job' });
//     }
//   });

  // Promote staging data to sales data
//   app.post('/api/erp-imports/:id/promote', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const importJob = await storage.getErpImportJob(req.params.id);
//       if (!importJob) {
//         return res.status(404).json({ error: 'Import job not found' });
//       }
// 
//       const promotedCount = await storage.promoteStagingToSales(req.params.id);
// 
//       // Log the promotion
//       await createAuditLog(req, 'promote_sales_data', 'erp_import_job', req.params.id, {
//         promotedCount
//       });
// 
//       res.json({ message: 'Sales data promoted successfully', promotedCount });
//     } catch (error) {
//       console.error('Promote sales data error:', error);
//       res.status(500).json({ error: 'Failed to promote sales data' });
//     }
//   });

  // ==========================================
  // ROYALTY RUN ROUTES
  // ==========================================
  
  // Create royalty run and calculate
//   app.post('/api/royalty-runs', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const { name, vendorId, ruleSetId, periodStart, periodEnd } = req.body;
// 
//       // Create royalty run
//       const run = await storage.createRoyaltyRun({
//         name,
//         vendorId,
//         ruleSetId,
//         periodStart: new Date(periodStart),
//         periodEnd: new Date(periodEnd),
//         runBy: req.user.id
//       });
// 
//       // Update status to calculating
//       await storage.updateRoyaltyRunStatus(run.id, 'calculating');
// 
//       res.json({ run });
// 
//       // Trigger async calculation (don't await)
//       calculateRoyalties(run.id, vendorId, ruleSetId, periodStart, periodEnd);
//     } catch (error) {
//       console.error('Create royalty run error:', error);
//       res.status(500).json({ error: 'Failed to create royalty run' });
//     }
//   });

  // Get all royalty runs
//   app.get('/api/royalty-runs', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const { vendorId, status } = req.query;
//       const runs = await storage.getRoyaltyRuns(vendorId as string, status as string);
//       res.json({ runs });
//     } catch (error) {
//       console.error('Get royalty runs error:', error);
//       res.status(500).json({ error: 'Failed to fetch royalty runs' });
//     }
//   });

  // Get specific royalty run
//   app.get('/api/royalty-runs/:id', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const run = await storage.getRoyaltyRun(req.params.id);
//       if (!run) {
//         return res.status(404).json({ error: 'Royalty run not found' });
//       }
// 
//       const results = await storage.getRoyaltyResults(req.params.id);
//       res.json({ run, results });
//     } catch (error) {
//       console.error('Get royalty run error:', error);
//       res.status(500).json({ error: 'Failed to fetch royalty run' });
//     }
//   });

  // Approve royalty run
//   app.post('/api/royalty-runs/:id/approve', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const run = await storage.approveRoyaltyRun(req.params.id, req.user.id);
// 
//       await createAuditLog(req, 'approve_royalty_run', 'royalty_run', req.params.id, {
//         totalRoyalty: run.totalRoyalty
//       });
// 
//       res.json({ run });
//     } catch (error) {
//       console.error('Approve royalty run error:', error);
//       res.status(500).json({ error: 'Failed to approve royalty run' });
//     }
//   });

  // Reject royalty run
//   app.post('/api/royalty-runs/:id/reject', isAuthenticated, async (req: any, res: Response) => {
//     try {
//       const { reason } = req.body;
//       const run = await storage.rejectRoyaltyRun(req.params.id, reason);
// 
//       await createAuditLog(req, 'reject_royalty_run', 'royalty_run', req.params.id, {
//         reason
//       });
// 
//       res.json({ run });
//     } catch (error) {
//       console.error('Reject royalty run error:', error);
//       res.status(500).json({ error: 'Failed to reject royalty run' });
//     }
//   });

  // Register rules engine routes
  registerRulesRoutes(app);

  // Get sales data for a contract
  app.get('/api/contracts/:id/sales', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const salesData = await storage.getSalesDataByContract(contractId);
      
      res.json({
        salesData,
        total: salesData.length,
      });
    } catch (error: any) {
      console.error('Error fetching sales data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete all sales data for a contract
  app.delete('/api/contracts/:id/sales', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const userId = req.user?.id;
      
      // Verify contract exists and check ownership
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      // Check permissions: admin, owner role, or contract uploader can delete sales data
      const user = await storage.getUser(userId);
      const isOwner = contract.uploadedBy === userId;
      const isAdmin = user?.role === 'admin' || user?.role === 'owner';
      const canDelete = isOwner || isAdmin;
      
      if (!canDelete) {
        return res.status(403).json({ message: 'You do not have permission to delete sales data for this contract' });
      }
      
      await storage.deleteAllSalesDataForContract(contractId);
      
      await createAuditLog(req, 'delete_sales_data', 'contract', contractId, {
        action: 'bulk_delete_sales',
        contractName: contract.originalName
      });
      
      res.json({ message: 'All sales data deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting sales data:', error);
      res.status(500).json({ message: error.message || 'Failed to delete sales data' });
    }
  });

  // Preview formulas that will be applied to sales data
  app.get('/api/contracts/:id/formula-preview', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const { periodStart, periodEnd } = req.query;
      
      // Get sales data and rules
      let allSales = await storage.getSalesDataByContract(contractId);
      
      // Filter sales data by date range if provided
      if (periodStart && periodEnd) {
        const startDate = new Date(periodStart as string);
        const endDate = new Date(periodEnd as string);
        
        allSales = allSales.filter(sale => {
          const saleDate = new Date(sale.transactionDate);
          return saleDate >= startDate && saleDate <= endDate;
        });
      }
      
      const rules = await db
        .select()
        .from(royaltyRules)
        .where(and(
          eq(royaltyRules.contractId, contractId),
          eq(royaltyRules.isActive, true)
        ))
        .orderBy(royaltyRules.priority);
      
      if (allSales.length === 0) {
        return res.json({ 
          samples: [], 
          totalProducts: 0,
          totalRules: rules.length,
          unmatchedSales: 0
        });
      }

      // Group sales by product and get sample from each
      const productGroups = new Map<string, typeof allSales[0]>();
      allSales.forEach(sale => {
        const key = `${sale.productName}-${sale.category}`;
        if (!productGroups.has(key)) {
          productGroups.set(key, sale);
        }
      });

      // Helper to recursively evaluate a FormulaNode to a primitive value (number or string)
      const evaluateNode = (node: any): any => {
        if (!node) return null;
        if (typeof node === 'number' || typeof node === 'string') return node;
        if (!node.type) return null;

        switch (node.type) {
          case 'literal':
            return node.value;
            
          case 'reference':
            return node.field; // Return field name as string
            
          case 'multiply':
            if (node.operands && Array.isArray(node.operands)) {
              const values = node.operands.map(evaluateNode).filter((v: any) => typeof v === 'number');
              return values.length > 0 ? values.reduce((a: any, b: any) => a * b, 1) : null;
            }
            return null;
            
          case 'add':
            if (node.operands && Array.isArray(node.operands)) {
              const values = node.operands.map(evaluateNode).filter((v: any) => typeof v === 'number');
              return values.length > 0 ? values.reduce((a: any, b: any) => a + b, 0) : null;
            }
            return null;
            
          case 'subtract':
            const left = evaluateNode(node.left);
            const right = evaluateNode(node.right);
            if (typeof left === 'number' && typeof right === 'number') {
              return left - right;
            }
            return null;
            
          case 'premium':
            const baseVal = evaluateNode(node.base);
            if (typeof baseVal === 'number' && typeof node.percentage === 'number') {
              if (node.mode === 'multiplicative') {
                return baseVal * (1 + node.percentage / 100);
              } else { // additive
                return baseVal + node.percentage;
              }
            }
            return null;
            
          case 'max':
            if (node.operands && Array.isArray(node.operands)) {
              const values = node.operands.map(evaluateNode).filter((v: any) => typeof v === 'number');
              return values.length > 0 ? Math.max(...values) : null;
            }
            return null;
            
          case 'min':
            if (node.operands && Array.isArray(node.operands)) {
              const values = node.operands.map(evaluateNode).filter((v: any) => typeof v === 'number');
              return values.length > 0 ? Math.min(...values) : null;
            }
            return null;
            
          case 'round':
            const val = evaluateNode(node.value);
            if (typeof val === 'number') {
              const multiplier = Math.pow(10, node.precision || 2);
              if (node.mode === 'floor') {
                return Math.floor(val * multiplier) / multiplier;
              } else if (node.mode === 'ceil') {
                return Math.ceil(val * multiplier) / multiplier;
              } else {
                return Math.round(val * multiplier) / multiplier;
              }
            }
            return null;
            
          default:
            // For complex nodes we can't evaluate (tier, lookup, if), return null
            return null;
        }
      };

      // Helper to parse formula definition and extract displayable details
      const parseFormulaDefinition = (def: any): any => {
        const details: any = {
          type: 'formula_based',
          baseRate: null,
          volumeTiers: [],
          seasonalAdjustments: {},
          territoryPremiums: {},
          calculationFormula: '',
          rawDefinition: def
        };

        // Recursive function to extract details from formula nodes
        const extractFromNode = (node: any) => {
          if (!node || !node.type) return;

          switch (node.type) {
            case 'literal':
              // Extract base rate from percentage or decimal literals
              if (node.unit === 'percent' && typeof node.value === 'number') {
                details.baseRate = details.baseRate || (node.value / 100); // Convert percent to decimal
              } else if (typeof node.value === 'number' && node.value < 1 && !node.unit) {
                details.baseRate = details.baseRate || node.value;
              } else if (typeof node.value === 'number' && node.value >= 1 && (node.unit === 'dollars' || node.unit === 'currency')) {
                // Per-unit royalty (e.g., $1.25 per unit)
                details.baseRate = details.baseRate || node.value;
              }
              break;

            case 'tier':
              // Extract volume tiers and evaluate rates to primitives
              if (node.tiers && Array.isArray(node.tiers)) {
                details.volumeTiers = node.tiers.map((tier: any) => ({
                  min: tier.min,
                  max: tier.max,
                  rate: evaluateNode(tier.rate), // Evaluate rate to primitive
                  label: tier.label
                }));
              }
              break;

            case 'lookup':
              // Extract seasonal adjustments or territory premiums and evaluate to primitives
              if (node.reference && node.reference.field) {
                const table = node.table || {};
                const evaluatedTable: any = {};
                
                // Evaluate each table entry to primitive value
                for (const [key, value] of Object.entries(table)) {
                  evaluatedTable[key] = evaluateNode(value);
                }

                if (node.reference.field === 'season') {
                  details.seasonalAdjustments = evaluatedTable;
                } else if (node.reference.field === 'territory') {
                  details.territoryPremiums = evaluatedTable;
                }
              }
              break;

            case 'multiply':
            case 'add':
            case 'subtract':
              // Recursively extract from operands
              if (node.operands && Array.isArray(node.operands)) {
                node.operands.forEach(extractFromNode);
              }
              if (node.left) extractFromNode(node.left);
              if (node.right) extractFromNode(node.right);
              break;

            case 'if':
              // Recursively extract from conditional branches
              if (node.then) extractFromNode(node.then);
              if (node.else) extractFromNode(node.else);
              break;

            case 'premium':
              // Extract premium percentage as base rate if not set
              if (node.percentage && !details.baseRate) {
                details.baseRate = node.percentage / 100; // Convert percentage to decimal
              }
              if (node.base) extractFromNode(node.base);
              break;

            case 'max':
            case 'min':
              // Recursively extract from operands
              if (node.operands && Array.isArray(node.operands)) {
                node.operands.forEach(extractFromNode);
              }
              break;
          }
        };

        // Start extraction from the formula root
        if (def.formula) {
          extractFromNode(def.formula);
        }

        // Generate human-readable calculation formula (matches DynamicRulesEngine logic)
        const hasSeasonalAdj = Object.keys(details.seasonalAdjustments).length > 0;
        const hasTerritoryPrem = Object.keys(details.territoryPremiums).length > 0;
        
        if (details.volumeTiers && details.volumeTiers.length > 0) {
          // Volume-based tiered pricing formula
          let formulaParts: string[] = [];
          details.volumeTiers.forEach((tier: any, idx: number) => {
            const condition = tier.max 
              ? `if (quantity >= ${tier.min.toLocaleString()} && quantity <= ${tier.max.toLocaleString()})` 
              : `if (quantity >= ${tier.min.toLocaleString()})`;
            
            // Always show rate as currency (per-unit dollar amount)
            let rateStr = typeof tier.rate === 'number' 
              ? `$${tier.rate.toFixed(2)}`
              : 'rate';
            
            let formula = `  royalty = quantity × ${rateStr}`;
            if (hasSeasonalAdj) formula += ' × seasonalMultiplier';
            if (hasTerritoryPrem) formula += ' × territoryMultiplier';
            
            formulaParts.push(`${condition} {\n${formula}\n}`);
          });
          details.calculationFormula = formulaParts.join(' else ');
        } else if (details.baseRate !== null) {
          // Simple base rate formula - always show as per-unit currency
          let rateStr = `$${details.baseRate.toFixed(2)}`;
          
          details.calculationFormula = `royalty = quantity × ${rateStr}`;
          if (hasSeasonalAdj) details.calculationFormula += ' × seasonalMultiplier';
          if (hasTerritoryPrem) details.calculationFormula += ' × territoryMultiplier';
        } else {
          details.calculationFormula = 'royalty = formula-based calculation (see rule details)';
        }

        return details;
      };

      // Helper to find matching rule (same logic as DynamicRulesEngine)
      const findMatchingRule = (sale: any) => {
        const tierRules = rules.filter(r => r.ruleType === 'tiered_pricing' || r.ruleType === 'formula_based');
        
        // PHASE 1: Try to find specific rules (with product categories)
        for (const rule of tierRules) {
          // Skip global fallback rules (no categories) in first pass
          const hasCategories = Array.isArray(rule.productCategories) && rule.productCategories.length > 0;
          if (!hasCategories) continue;
          
          // Check product categories (bidirectional matching)
          const categoryMatch = rule.productCategories!.some((cat: string) => {
            const catLower = cat.toLowerCase().trim();
            const saleCategoryLower = (sale.category?.toLowerCase() || '').trim();
            const saleProductLower = (sale.productName?.toLowerCase() || '').trim();
            
            // Guard: require rule category to be non-empty
            if (!catLower) {
              return false;
            }
            
            // Primary match: bidirectional category matching (requires non-empty sale category)
            if (saleCategoryLower) {
              return saleCategoryLower.includes(catLower) || catLower.includes(saleCategoryLower);
            }
            
            // Fallback: product name matching (only if category is empty, and only exact substring)
            if (saleProductLower) {
              return saleProductLower.includes(catLower);
            }
            
            return false;
          });
          if (!categoryMatch) continue;

          // Check territories
          if (rule.territories && rule.territories.length > 0 && !rule.territories.includes('All')) {
            const territoryMatch = rule.territories.some((terr: string) =>
              sale.territory?.toLowerCase().includes(terr.toLowerCase())
            );
            if (!territoryMatch) continue;
          }

          return rule; // Found specific match
        }
        
        // PHASE 2: No specific match found, try global fallback rules (no categories)
        for (const rule of tierRules) {
          const hasCategories = Array.isArray(rule.productCategories) && rule.productCategories.length > 0;
          if (hasCategories) continue; // Skip specific rules in second pass
          
          // Check territories for global rules
          if (rule.territories && rule.territories.length > 0 && !rule.territories.includes('All')) {
            const territoryMatch = rule.territories.some((terr: string) =>
              sale.territory?.toLowerCase().includes(terr.toLowerCase())
            );
            if (!territoryMatch) continue;
          }
          
          return rule; // Found global fallback
        }
        
        return null; // No match found
      };

      // Create preview samples
      const samples = Array.from(productGroups.values()).map(sale => {
        const matchingRule = findMatchingRule(sale);
        
        if (!matchingRule) {
          return {
            productName: sale.productName,
            category: sale.category,
            sampleUnits: parseInt(sale.quantity || '0'),
            matched: false,
            ruleName: null,
            ruleDescription: null,
            formulaType: null
          };
        }

        // Extract formula type and details from formula definition or legacy fields
        let formulaType = 'Standard rate';
        let ruleDescription = matchingRule.description || '';
        let formulaDetails: any = {};

        // ALWAYS read legacy columns first (these may be manually populated)
        const baseRate = matchingRule.baseRate ? parseFloat(matchingRule.baseRate) : null;
        const volumeTiers = (matchingRule.volumeTiers as any[]) || [];
        const seasonalAdj = (matchingRule.seasonalAdjustments as Record<string, any>) || {};
        const territoryPrem = (matchingRule.territoryPremiums as Record<string, any>) || {};

        if (matchingRule.formulaDefinition) {
          const def = matchingRule.formulaDefinition as any;
          formulaType = def.description || def.name || 'Formula-based';
          
          // Parse the formula definition to extract displayable details
          formulaDetails = parseFormulaDefinition(def);
          
          // MERGE: If FormulaNode didn't extract tiers/adjustments, use legacy columns
          if ((!formulaDetails.volumeTiers || formulaDetails.volumeTiers.length === 0) && volumeTiers.length > 0) {
            formulaDetails.volumeTiers = volumeTiers;
          }
          if ((!formulaDetails.seasonalAdjustments || Object.keys(formulaDetails.seasonalAdjustments).length === 0) && Object.keys(seasonalAdj).length > 0) {
            formulaDetails.seasonalAdjustments = seasonalAdj;
          }
          if ((!formulaDetails.territoryPremiums || Object.keys(formulaDetails.territoryPremiums).length === 0) && Object.keys(territoryPrem).length > 0) {
            formulaDetails.territoryPremiums = territoryPrem;
          }
          if (!formulaDetails.baseRate && baseRate !== null) {
            formulaDetails.baseRate = baseRate;
          }
          
          // Regenerate calculation formula with merged data
          const hasSeasonalAdj = Object.keys(formulaDetails.seasonalAdjustments || {}).length > 0;
          const hasTerritoryPrem = Object.keys(formulaDetails.territoryPremiums || {}).length > 0;
          
          if (formulaDetails.volumeTiers && formulaDetails.volumeTiers.length > 0) {
            // Volume-based tiered pricing formula
            let formulaParts: string[] = [];
            formulaDetails.volumeTiers.forEach((tier: any, idx: number) => {
              const condition = tier.max 
                ? `if (quantity >= ${tier.min.toLocaleString()} && quantity <= ${tier.max.toLocaleString()})` 
                : `if (quantity >= ${tier.min.toLocaleString()})`;
              
              let rateStr = typeof tier.rate === 'number' 
                ? `$${tier.rate.toFixed(2)}`
                : 'rate';
              
              let formula = `  royalty = quantity × ${rateStr}`;
              if (hasSeasonalAdj) formula += ' × seasonalMultiplier';
              if (hasTerritoryPrem) formula += ' × territoryMultiplier';
              
              formulaParts.push(`${condition} {\n${formula}\n}`);
            });
            formulaDetails.calculationFormula = formulaParts.join(' else ');
          } else if (formulaDetails.baseRate !== null) {
            let rateStr = `$${formulaDetails.baseRate.toFixed(2)}`;
            formulaDetails.calculationFormula = `royalty = quantity × ${rateStr}`;
            if (hasSeasonalAdj) formulaDetails.calculationFormula += ' × seasonalMultiplier';
            if (hasTerritoryPrem) formulaDetails.calculationFormula += ' × territoryMultiplier';
          }
          
          // Override formula type based on merged content
          if (formulaDetails.volumeTiers && formulaDetails.volumeTiers.length > 0) {
            formulaType = 'Volume-based tiered pricing';
          } else if (Object.keys(formulaDetails.seasonalAdjustments || {}).length > 0) {
            formulaType = 'Seasonal adjustments';
          } else if (Object.keys(formulaDetails.territoryPremiums || {}).length > 0) {
            formulaType = 'Territory premiums';
          }
        } else {
          // Pure legacy format - no FormulaNode
          if (volumeTiers.length > 0) {
            formulaType = 'Volume-based tiered pricing';
          } else if (Object.keys(seasonalAdj).length > 0) {
            formulaType = 'Seasonal adjustments';
          } else if (Object.keys(territoryPrem).length > 0) {
            formulaType = 'Territory premiums';
          }
          
          // Generate calculation formula for legacy rules
          let calculationFormula = '';
          const hasSeasonalAdj = Object.keys(seasonalAdj).length > 0;
          const hasTerritoryPrem = Object.keys(territoryPrem).length > 0;
          
          if (volumeTiers.length > 0) {
            let formulaParts: string[] = [];
            volumeTiers.forEach((tier: any, idx: number) => {
              const condition = tier.max 
                ? `if (quantity >= ${tier.min.toLocaleString()} && quantity <= ${tier.max.toLocaleString()})` 
                : `if (quantity >= ${tier.min.toLocaleString()})`;
              
              let rateStr = typeof tier.rate === 'number' 
                ? `$${tier.rate.toFixed(2)}`
                : 'rate';
              
              let formula = `  royalty = quantity × ${rateStr}`;
              if (hasSeasonalAdj) formula += ' × seasonalMultiplier';
              if (hasTerritoryPrem) formula += ' × territoryMultiplier';
              
              formulaParts.push(`${condition} {\n${formula}\n}`);
            });
            calculationFormula = formulaParts.join(' else ');
          } else if (baseRate !== null) {
            let rateStr = `$${baseRate.toFixed(2)}`;
            calculationFormula = `royalty = quantity × ${rateStr}`;
            if (hasSeasonalAdj) calculationFormula += ' × seasonalMultiplier';
            if (hasTerritoryPrem) calculationFormula += ' × territoryMultiplier';
          } else {
            calculationFormula = 'royalty = quantity × rate';
          }
          
          formulaDetails = {
            type: 'legacy',
            baseRate,
            volumeTiers,
            seasonalAdjustments: seasonalAdj,
            territoryPremiums: territoryPrem,
            calculationFormula
          };
        }

        return {
          productName: sale.productName,
          category: sale.category,
          sampleUnits: parseInt(sale.quantity || '0'),
          matched: true,
          ruleName: matchingRule.ruleName,
          ruleDescription,
          formulaType,
          formulaDetails,
          priority: matchingRule.priority,
          confidence: matchingRule.confidence,
          sourceSection: matchingRule.sourceSection || null,
          sourceText: matchingRule.sourceText ? matchingRule.sourceText.substring(0, 150) + '...' : null
        };
      });

      const unmatchedCount = samples.filter(s => !s.matched).length;

      res.json({
        samples: samples.slice(0, 10), // Top 10 product samples
        totalProducts: productGroups.size,
        totalRules: rules.length,
        unmatchedSales: unmatchedCount
      });

    } catch (error: any) {
      console.error('Error generating formula preview:', error);
      res.status(500).json({ message: error.message || 'Failed to generate preview' });
    }
  });

  // Calculate royalties for a contract using dynamic rules engine
  app.post('/api/contracts/:id/calculate-royalties', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const { periodStart, periodEnd, name } = req.body;
      
      // Get sales data for this contract
      const { dynamicRulesEngine } = await import('./services/dynamicRulesEngine.js');
      const allSales = await storage.getSalesDataByContract(contractId);
      
      // Filter by period if provided
      let filteredSales = allSales;
      if (periodStart || periodEnd) {
        filteredSales = allSales.filter(sale => {
          const saleDate = new Date(sale.transactionDate);
          if (periodStart && saleDate < new Date(periodStart)) return false;
          if (periodEnd && saleDate > new Date(periodEnd)) return false;
          return true;
        });
      }
      
      if (filteredSales.length === 0) {
        return res.status(400).json({ 
          message: 'No sales data found for the selected period' 
        });
      }

      // Convert sales to format expected by dynamic engine
      const salesItems = filteredSales.map(sale => ({
        id: sale.id,
        productName: sale.productName || 'Unknown',
        category: sale.category || '',
        territory: sale.territory || 'Primary Territory',
        quantity: parseFloat(sale.quantity || '0'),
        transactionDate: new Date(sale.transactionDate),
        grossAmount: parseFloat(sale.grossAmount || '0')
      }));

      // Use dynamic rules engine to calculate royalties
      const result = await dynamicRulesEngine.calculateRoyalty(contractId, salesItems);
      
      // Calculate total sales amount
      const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.grossAmount), 0);
      
      // Create lookup map for sales data
      const salesMap = new Map(filteredSales.map(sale => [sale.id, sale]));
      
      // Prepare enhanced breakdown with rule details and actual sale amounts
      const breakdown = result.breakdown.map(item => {
        const sale = salesMap.get(item.saleId);
        return {
          saleId: item.saleId,
          productName: item.productName,
          category: item.category,
          territory: item.territory,
          quantity: item.quantity,
          saleAmount: sale ? parseFloat(sale.grossAmount) : 0, // Use actual gross amount
          royaltyAmount: item.calculatedRoyalty.toString(),
          ruleApplied: item.ruleApplied,
          explanation: item.explanation,
          tierRate: item.tierRate,
          seasonalMultiplier: item.seasonalMultiplier,
          territoryMultiplier: item.territoryMultiplier
        };
      });
      
      // Create calculation record with enhanced data
      const calculation = await storage.createContractRoyaltyCalculation({
        contractId,
        name: name || `Calculation ${new Date().toLocaleDateString()}`,
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        totalSalesAmount: totalSalesAmount.toString(),
        totalRoyalty: result.finalRoyalty.toString(),
        breakdown: JSON.stringify(breakdown),
        chartData: JSON.stringify({
          minimumGuarantee: result.minimumGuarantee,
          calculatedRoyalty: result.totalRoyalty,
          rulesApplied: result.rulesApplied
        }),
        calculatedBy: req.user.id,
        salesCount: filteredSales.length,
      });

      res.json({
        success: true,
        calculation: {
          ...calculation,
          minimumGuarantee: result.minimumGuarantee,
          calculatedRoyalty: result.totalRoyalty,
          totalRoyalty: result.finalRoyalty.toString(),
          rulesApplied: result.rulesApplied
        },
        message: `Calculated ${filteredSales.length} sales transactions`,
      });

    } catch (error: any) {
      console.error('Error calculating royalties:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to calculate royalties' 
      });
    }
  });

  // Get royalty calculations for a contract
  app.get('/api/contracts/:id/royalty-calculations', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const calculations = await storage.getContractRoyaltyCalculations(contractId);
      
      res.json({
        calculations,
        total: calculations.length,
      });
    } catch (error: any) {
      console.error('Error fetching royalty calculations:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete all royalty calculations for a contract
  app.delete('/api/contracts/:id/royalty-calculations', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const userId = req.user?.id;
      
      // Verify contract exists and check ownership
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      // Check permissions: admin, owner role, or contract uploader can delete calculations
      const user = await storage.getUser(userId);
      const isOwner = contract.uploadedBy === userId;
      const isAdmin = user?.role === 'admin' || user?.role === 'owner';
      const canDelete = isOwner || isAdmin;
      
      if (!canDelete) {
        return res.status(403).json({ message: 'You do not have permission to delete calculations for this contract' });
      }
      
      await storage.deleteAllCalculationsForContract(contractId);
      
      await createAuditLog(req, 'delete_royalty_calculations', 'contract', contractId, {
        action: 'bulk_delete_calculations',
        contractName: contract.originalName
      });
      
      res.json({ message: 'All royalty calculations deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting royalty calculations:', error);
      res.status(500).json({ message: error.message || 'Failed to delete calculations' });
    }
  });

  // Delete a single royalty calculation
  app.delete('/api/royalty-calculations/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const calculationId = req.params.id;
      const userId = req.user?.id;
      
      // Get the calculation to find its contract
      const calculation = await storage.getContractRoyaltyCalculation(calculationId);
      if (!calculation) {
        return res.status(404).json({ message: 'Calculation not found' });
      }
      
      // Verify contract exists and check ownership
      const contract = await storage.getContract(calculation.contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      
      // Check permissions: admin, owner role, or contract uploader can delete calculations
      const user = await storage.getUser(userId);
      const isOwner = contract.uploadedBy === userId;
      const isAdmin = user?.role === 'admin' || user?.role === 'owner';
      const canDelete = isOwner || isAdmin;
      
      if (!canDelete) {
        return res.status(403).json({ message: 'You do not have permission to delete this calculation' });
      }
      
      await storage.deleteContractRoyaltyCalculation(calculationId);
      
      await createAuditLog(req, 'delete_royalty_calculation', 'calculation', calculationId, {
        calculationName: calculation.name,
        contractId: calculation.contractId,
        contractName: contract.originalName
      });
      
      res.json({ message: 'Calculation deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting calculation:', error);
      res.status(500).json({ message: error.message || 'Failed to delete calculation' });
    }
  });

  // Generate PDF invoice (detailed format)
  app.get('/api/royalty-calculations/:id/invoice/detailed', isAuthenticated, async (req: any, res: Response) => {
    try {
      const calculationId = req.params.id;
      
      // Get calculation data
      const calculation = await storage.getContractRoyaltyCalculation(calculationId);
      if (!calculation) {
        return res.status(404).json({ message: 'Calculation not found' });
      }
      
      // Get contract data
      const contract = await storage.getContract(calculation.contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Breakdown data is already an object from the database
      const breakdown = typeof calculation.breakdown === 'string' 
        ? JSON.parse(calculation.breakdown) 
        : calculation.breakdown;
      const chartData = calculation.chartData 
        ? (typeof calculation.chartData === 'string' ? JSON.parse(calculation.chartData) : calculation.chartData)
        : {};
      
      // Extract vendor info from keyTerms if available
      const keyTerms = contract.analysis?.keyTerms as any || {};
      const vendorName = keyTerms?.licensor || keyTerms?.vendor || 'Vendor Name';
      const licensee = keyTerms?.licensee || keyTerms?.client || 'Licensee Name';
      const paymentTerms = keyTerms?.paymentTerms || 'Net 30 days';
      
      // Prepare invoice data
      const invoiceData = {
        calculationId: calculation.id,
        calculationName: calculation.name,
        contractName: contract.originalName,
        vendorName,
        licensee,
        calculationDate: calculation.createdAt || new Date(),
        periodStart: calculation.periodStart || new Date(),
        periodEnd: calculation.periodEnd || new Date(),
        totalRoyalty: parseFloat(calculation.totalRoyalty || '0'),
        minimumGuarantee: chartData.minimumGuarantee,
        finalRoyalty: parseFloat(calculation.totalRoyalty || '0'),
        breakdown: breakdown.map((item: any) => ({
          productName: item.productName,
          category: item.category,
          quantity: item.quantity,
          grossAmount: item.saleAmount || 0,
          ruleApplied: item.ruleApplied,
          calculatedRoyalty: parseFloat(item.royaltyAmount || '0'),
          explanation: item.explanation
        })),
        currency: 'USD',
        paymentTerms
      };
      
      // Generate PDF
      const pdfBuffer = await PDFInvoiceService.generateDetailedInvoice(invoiceData);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-detailed-${calculation.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error('Error generating detailed invoice:', error);
      res.status(500).json({ message: error.message || 'Failed to generate invoice' });
    }
  });

  // Generate PDF invoice (summary format)
  app.get('/api/royalty-calculations/:id/invoice/summary', isAuthenticated, async (req: any, res: Response) => {
    try {
      const calculationId = req.params.id;
      
      // Get calculation data
      const calculation = await storage.getContractRoyaltyCalculation(calculationId);
      if (!calculation) {
        return res.status(404).json({ message: 'Calculation not found' });
      }
      
      // Get contract data
      const contract = await storage.getContract(calculation.contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Breakdown data is already an object from the database
      const breakdown = typeof calculation.breakdown === 'string' 
        ? JSON.parse(calculation.breakdown) 
        : calculation.breakdown;
      const chartData = calculation.chartData 
        ? (typeof calculation.chartData === 'string' ? JSON.parse(calculation.chartData) : calculation.chartData)
        : {};
      
      // Extract vendor info from keyTerms if available
      const keyTerms = contract.analysis?.keyTerms as any || {};
      const vendorName = keyTerms?.licensor || keyTerms?.vendor || 'Vendor Name';
      const licensee = keyTerms?.licensee || keyTerms?.client || 'Licensee Name';
      const paymentTerms = keyTerms?.paymentTerms || 'Net 30 days';
      
      // Prepare invoice data
      const invoiceData = {
        calculationId: calculation.id,
        calculationName: calculation.name,
        contractName: contract.originalName,
        vendorName,
        licensee,
        calculationDate: calculation.createdAt || new Date(),
        periodStart: calculation.periodStart || new Date(),
        periodEnd: calculation.periodEnd || new Date(),
        totalRoyalty: parseFloat(calculation.totalRoyalty || '0'),
        minimumGuarantee: chartData.minimumGuarantee,
        finalRoyalty: parseFloat(calculation.totalRoyalty || '0'),
        breakdown: breakdown.map((item: any) => ({
          productName: item.productName,
          category: item.category,
          quantity: item.quantity,
          grossAmount: item.saleAmount || 0,
          ruleApplied: item.ruleApplied,
          calculatedRoyalty: parseFloat(item.royaltyAmount || '0'),
          explanation: item.explanation
        })),
        currency: 'USD',
        paymentTerms
      };
      
      // Generate PDF
      const pdfBuffer = await PDFInvoiceService.generateSummaryInvoice(invoiceData);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-summary-${calculation.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error('Error generating summary invoice:', error);
      res.status(500).json({ message: error.message || 'Failed to generate invoice' });
    }
  });

  // Delete a contract
  app.delete('/api/contracts/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;

      // Check if contract exists and user has permission
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Check permissions: admin, owner, or uploader can delete
      const user = await storage.getUser(userId);
      const canDelete = user?.role === 'admin' || user?.role === 'owner' || contract.uploadedBy === userId;

      if (!canDelete) {
        return res.status(403).json({ message: 'You do not have permission to delete this contract' });
      }

      // Delete the contract
      await storage.deleteContract(contractId);

      // Create audit log
      await createAuditLog(req, 'delete_contract', 'contract', contractId, {
        fileName: contract.fileName,
      });

      res.json({ 
        success: true, 
        message: 'Contract deleted successfully' 
      });
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to delete contract' 
      });
    }
  });

  // Upload sales data (with AI-driven contract matching)
  app.post('/api/sales/upload', isAuthenticated, dataUpload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse file
      const fileBuffer = fs.readFileSync(req.file.path);
      const { SalesDataParser } = await import('./services/salesDataParser.js');
      const parseResult = await SalesDataParser.parseFile(fileBuffer, req.file.originalname);

      const validRows = parseResult.rows.filter(r => r.validationStatus === 'valid');
      const contractId = req.body.contractId; // Optional - if not provided, AI will match

      // Store sales data (for now, without AI matching - will be enhanced later)
      if (contractId) {
        for (const row of validRows) {
          const salesData = row.rowData as any;
          await storage.createSalesData({
            matchedContractId: contractId,
            transactionId: salesData.transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            transactionDate: salesData.transactionDate ? new Date(salesData.transactionDate) : new Date(),
            productCode: salesData.productCode,
            productName: salesData.productName,
            category: salesData.category,
            territory: salesData.territory,
            currency: salesData.currency || 'USD',
            grossAmount: String(parseFloat(salesData.grossAmount) || 0),
            netAmount: String(parseFloat(salesData.netAmount) || 0),
            quantity: String(parseInt(salesData.quantity) || 0),
            unitPrice: String(parseFloat(salesData.unitPrice) || 0)
          });
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Create audit log
      await createAuditLog(req, 'upload_sales_data', 'sales', undefined, {
        fileName: req.file.originalname,
        rowsImported: validRows.length,
        contractId: contractId || 'AI-matched'
      });

      res.json({
        success: true,
        validRows: validRows.length,
        totalRows: parseResult.rows.length,
        errors: parseResult.rows.filter(r => r.validationStatus === 'invalid').length,
        message: contractId 
          ? `${validRows.length} sales transactions imported successfully` 
          : `${validRows.length} sales transactions parsed. AI matching will be available soon.`
      });

    } catch (error: any) {
      console.error('Sales upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload sales data' });
    }
  });

  // Download sample sales data
  app.get('/api/sales/sample-data', isAuthenticated, (req: any, res: Response) => {
    // Sample data matching Plant Variety License & Royalty Agreement for Trees & Shrubs
    const sampleData = [
      { transactionDate: '2024-03-15', transactionId: 'TXN-2024-001', productCode: 'MAPLE-001', productName: 'Aurora Flame Maple', category: 'Ornamental Trees', territory: 'Primary', containerSize: '1-gallon', season: 'Spring', currency: 'USD', grossAmount: 30000, netAmount: 27000, quantity: 6200, unitPrice: 4.84 },
      { transactionDate: '2024-03-20', transactionId: 'TXN-2024-002', productCode: 'MAPLE-002', productName: 'Aurora Flame Maple', category: 'Ornamental Trees', territory: 'Primary', containerSize: '5-gallon', season: 'Off-Season', currency: 'USD', grossAmount: 25000, netAmount: 22500, quantity: 1100, unitPrice: 22.73 },
      { transactionDate: '2024-10-05', transactionId: 'TXN-2024-003', productCode: 'JUNIPER-001', productName: 'Golden Spire Juniper', category: 'Ornamental Shrubs', territory: 'Secondary', containerSize: '3-gallon', season: 'Fall', currency: 'USD', grossAmount: 28000, netAmount: 25200, quantity: 1800, unitPrice: 15.56 },
      { transactionDate: '2024-04-12', transactionId: 'TXN-2024-004', productCode: 'ROSE-001', productName: 'Pacific Sunset Rose', category: 'Flowering Shrubs', territory: 'Primary', containerSize: '6-inch', season: 'Spring', currency: 'USD', grossAmount: 12000, netAmount: 10800, quantity: 3000, unitPrice: 4 },
      { transactionDate: '2024-09-18', transactionId: 'TXN-2024-005', productCode: 'HOSTA-001', productName: 'Emerald Crown Hosta', category: 'Perennials', territory: 'Primary', containerSize: '2-gallon', season: 'Fall', isOrganic: true, currency: 'USD', grossAmount: 18000, netAmount: 16200, quantity: 900, unitPrice: 20 },
      { transactionDate: '2024-03-25', transactionId: 'TXN-2024-006', productCode: 'HYDRANGEA-001', productName: 'Cascade Blue Hydrangea', category: 'Flowering Shrubs', territory: 'Primary', containerSize: 'Mixed', season: 'Spring', currency: 'USD', grossAmount: 120000, netAmount: 108000, quantity: 20000, unitPrice: 6 },
      { transactionDate: '2024-12-15', transactionId: 'TXN-2024-007', productCode: 'ROSE-002', productName: 'Pacific Sunset Rose', category: 'Flowering Shrubs', territory: 'Primary', containerSize: '1-gallon', season: 'Holiday', currency: 'USD', grossAmount: 5000, netAmount: 4500, quantity: 250, unitPrice: 20 },
      { transactionDate: '2024-05-10', transactionId: 'TXN-2024-008', productCode: 'MAPLE-003', productName: 'Aurora Flame Maple', category: 'Ornamental Trees', territory: 'Secondary', containerSize: '1-gallon', season: 'Spring', currency: 'USD', grossAmount: 15000, netAmount: 13500, quantity: 3000, unitPrice: 5 },
      { transactionDate: '2024-06-15', transactionId: 'TXN-2024-009', productCode: 'JUNIPER-002', productName: 'Golden Spire Juniper', category: 'Ornamental Shrubs', territory: 'Primary', containerSize: '5-gallon', season: 'Summer', currency: 'USD', grossAmount: 22000, netAmount: 19800, quantity: 800, unitPrice: 27.5 },
      { transactionDate: '2024-07-20', transactionId: 'TXN-2024-010', productCode: 'HYDRANGEA-002', productName: 'Cascade Blue Hydrangea', category: 'Flowering Shrubs', territory: 'Secondary', containerSize: '3-gallon', season: 'Summer', currency: 'USD', grossAmount: 18000, netAmount: 16200, quantity: 1200, unitPrice: 15 },
      { transactionDate: '2024-08-10', transactionId: 'TXN-2024-011', productCode: 'HOSTA-002', productName: 'Emerald Crown Hosta', category: 'Perennials', territory: 'Primary', containerSize: '1-gallon', season: 'Fall', currency: 'USD', grossAmount: 12000, netAmount: 10800, quantity: 1500, unitPrice: 8 },
      { transactionDate: '2024-09-05', transactionId: 'TXN-2024-012', productCode: 'ROSE-003', productName: 'Pacific Sunset Rose', category: 'Flowering Shrubs', territory: 'Secondary', containerSize: '2-gallon', season: 'Fall', currency: 'USD', grossAmount: 16000, netAmount: 14400, quantity: 1000, unitPrice: 16 },
      { transactionDate: '2024-10-15', transactionId: 'TXN-2024-013', productCode: 'MAPLE-004', productName: 'Aurora Flame Maple', category: 'Ornamental Trees', territory: 'Primary', containerSize: '3-gallon', season: 'Fall', currency: 'USD', grossAmount: 35000, netAmount: 31500, quantity: 2000, unitPrice: 17.5 },
      { transactionDate: '2024-11-20', transactionId: 'TXN-2024-014', productCode: 'JUNIPER-003', productName: 'Golden Spire Juniper', category: 'Ornamental Shrubs', territory: 'Primary', containerSize: '1-gallon', season: 'Off-Season', currency: 'USD', grossAmount: 8000, netAmount: 7200, quantity: 1600, unitPrice: 5 },
      { transactionDate: '2024-12-10', transactionId: 'TXN-2024-015', productCode: 'HOSTA-003', productName: 'Emerald Crown Hosta', category: 'Perennials', territory: 'Secondary', containerSize: '3-gallon', season: 'Holiday', isOrganic: true, currency: 'USD', grossAmount: 20000, netAmount: 18000, quantity: 750, unitPrice: 26.67 }
    ];

    // Convert to CSV with all relevant fields
    const headers = 'transactionDate,transactionId,productCode,productName,category,territory,containerSize,season,isOrganic,currency,grossAmount,netAmount,quantity,unitPrice\n';
    const csv = headers + sampleData.map(row => 
      `${row.transactionDate},${row.transactionId},${row.productCode},"${row.productName}",${row.category},${row.territory},${row.containerSize || ''},${row.season || ''},${row.isOrganic || ''},${row.currency},${row.grossAmount},${row.netAmount},${row.quantity},${row.unitPrice}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_sales_data.csv"');
    res.send(csv);
  });

  // RAG Q&A endpoint - Ask questions about contracts
  app.post('/api/rag/ask', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { question, contractId } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ message: 'Question is required and must be a string' });
      }
      
      console.log(`🤖 [RAG API] Question: "${question}"${contractId ? ` (contract: ${contractId})` : ''}`);
      
      const result = await RAGService.answerQuestion(question, contractId);
      
      await createAuditLog(req, 'rag_query', 'contract', contractId || 'all', {
        question,
        confidence: result.confidence,
        sourcesCount: result.sources.length
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('RAG query error:', error);
      res.status(500).json({ message: error.message || 'Failed to process question' });
    }
  });

  // RAG Stats endpoint - Get embedding statistics
  app.get('/api/rag/stats', isAuthenticated, async (req: any, res: Response) => {
    try {
      // Get total embeddings count
      const totalEmbeddingsResult = await db
        .select({ count: count() })
        .from(contractEmbeddings);
      const totalEmbeddings = totalEmbeddingsResult[0]?.count || 0;

      // Get embeddings grouped by type
      const embeddingsByTypeResult = await db
        .select({
          type: contractEmbeddings.embeddingType,
          count: count()
        })
        .from(contractEmbeddings)
        .groupBy(contractEmbeddings.embeddingType);

      // Get distinct contracts with embeddings
      const contractsWithEmbeddings = await db
        .selectDistinct({ contractId: contractEmbeddings.contractId })
        .from(contractEmbeddings);

      // Get recent embeddings with contract info
      const recentEmbeddingsData = await db
        .select({
          id: contractEmbeddings.id,
          contractId: contractEmbeddings.contractId,
          contractName: contracts.originalName,
          embeddingType: contractEmbeddings.embeddingType,
          sourceText: contractEmbeddings.sourceText,
          createdAt: contractEmbeddings.createdAt,
        })
        .from(contractEmbeddings)
        .innerJoin(contracts, eq(contractEmbeddings.contractId, contracts.id))
        .orderBy(desc(contractEmbeddings.createdAt))
        .limit(20);

      // Calculate average chunk size
      const avgChunkSize = recentEmbeddingsData.length > 0
        ? recentEmbeddingsData.reduce((sum, emb) => sum + (emb.sourceText?.length || 0), 0) / recentEmbeddingsData.length
        : 0;

      res.json({
        totalEmbeddings,
        totalChunks: totalEmbeddings,
        totalContracts: contractsWithEmbeddings.length,
        avgChunkSize: Math.round(avgChunkSize),
        embeddingsByType: embeddingsByTypeResult.map((item: any) => ({
          type: item.type || 'unknown',
          count: item.count
        })),
        recentEmbeddings: recentEmbeddingsData.map((emb: any) => ({
          id: emb.id,
          contractId: emb.contractId,
          contractName: emb.contractName || 'Unknown Contract',
          embeddingType: emb.embeddingType || 'unknown',
          sourceText: emb.sourceText || '',
          createdAt: emb.createdAt || new Date(),
        })),
      });
    } catch (error: any) {
      console.error('RAG stats error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch RAG stats' });
    }
  });

  // ========================
  // LEAD CAPTURE ENDPOINTS
  // ========================

  // Early access signup (public endpoint - no auth required)
  app.post('/api/early-access-signup', async (req, res) => {
    try {
      console.log('📝 Early access signup request received:', req.body);
      const { email, name, company } = req.body;

      // Basic validation
      if (!email || !email.includes('@')) {
        console.log('❌ Validation failed: invalid email');
        return res.status(400).json({ error: 'Valid email is required' });
      }

      console.log('✅ Validation passed, calling storage.createEarlyAccessSignup...');
      const signup = await storage.createEarlyAccessSignup({
        email,
        name: name || null,
        company: company || null,
        source: 'landing_page',
      });

      console.log('✅ Signup created successfully, returning response:', signup.id);
      res.json({ 
        success: true, 
        message: 'Thank you for your interest! We\'ll be in touch soon.',
        id: signup.id 
      });
    } catch (error) {
      console.error('❌ Early access signup error:', error);
      res.status(500).json({ error: 'Failed to process signup' });
    }
  });

  // Demo request signup (public endpoint - no auth required)
  app.post('/api/demo-request', async (req, res) => {
    try {
      const { email, planTier } = req.body;

      // Basic validation
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
      }

      if (!planTier) {
        return res.status(400).json({ error: 'Plan tier is required' });
      }

      const request = await storage.createDemoRequest({
        email,
        planTier,
        source: 'pricing_section',
      });

      res.json({ 
        success: true, 
        message: 'Thank you! We\'ll contact you soon to schedule your demo.',
        id: request.id 
      });
    } catch (error) {
      console.error('Demo request error:', error);
      res.status(500).json({ error: 'Failed to process demo request' });
    }
  });

  // Get all early access signups (admin only)
  app.get('/api/admin/early-access-signups', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin or owner
      if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { status } = req.query;
      const signups = await storage.getAllEarlyAccessSignups(status as string);

      res.json(signups);
    } catch (error) {
      console.error('Get early access signups error:', error);
      res.status(500).json({ error: 'Failed to retrieve signups' });
    }
  });

  // Get all demo requests (admin only)
  app.get('/api/admin/demo-requests', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin or owner
      if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { status, planTier } = req.query;
      const requests = await storage.getAllDemoRequests(status as string, planTier as string);

      res.json(requests);
    } catch (error) {
      console.error('Get demo requests error:', error);
      res.status(500).json({ error: 'Failed to retrieve demo requests' });
    }
  });

  // Update early access signup status (admin only)
  app.patch('/api/admin/early-access-signups/:id', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin or owner
      if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const signup = await storage.updateEarlyAccessSignupStatus(id, status, notes);

      res.json(signup);
    } catch (error) {
      console.error('Update early access signup error:', error);
      res.status(500).json({ error: 'Failed to update signup' });
    }
  });

  // Update demo request status (admin only)
  app.patch('/api/admin/demo-requests/:id', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin or owner
      if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const request = await storage.updateDemoRequestStatus(id, status, notes);

      res.json(request);
    } catch (error) {
      console.error('Update demo request error:', error);
      res.status(500).json({ error: 'Failed to update demo request' });
    }
  });

  // Return the configured app - server will be started in index.ts
  return createServer(app);
}

// Background contract processing
async function processContractAnalysis(contractId: string, filePath: string) {
  try {
    console.log(`Starting analysis for contract ${contractId}`);
    
    // Get contract details
    const contract = await storage.getContract(contractId);
    if (!contract) {
      console.error(`Contract ${contractId} not found`);
      return;
    }

    // Extract text from file
    const mimeType = contract.fileType || 'application/pdf';
    const extractedText = await fileService.extractTextFromFile(filePath, mimeType);
    
    // Analyze with Groq AI
    const aiAnalysis = await groqService.analyzeContract(extractedText);
    
    // Create contract analysis (INSERT, not UPDATE)
    await storage.createContractAnalysis({
      contractId,
      summary: aiAnalysis.summary,
      keyTerms: aiAnalysis.keyTerms,
      riskAnalysis: aiAnalysis.riskAnalysis,
      insights: aiAnalysis.insights,
      confidence: aiAnalysis.confidence?.toString() || '0',
      processingTime: 0, // Will be calculated if needed
    });

    // 🚀 NEW: Extract and save royalty rules automatically
    await extractAndSaveRoyaltyRules(contractId, extractedText, aiAnalysis);

    // 🔍 Generate embeddings for RAG/semantic search
    await generateContractEmbeddings(contractId, aiAnalysis);

    // Update status to analyzed (frontend expects this)
    await storage.updateContractStatus(contractId, 'analyzed');
    
    console.log(`✅ Analysis completed for contract ${contractId}`);
  } catch (error) {
    console.error(`❌ Analysis failed for contract ${contractId}:`, error);
    await storage.updateContractStatus(contractId, 'failed');
  }
}

// Helper function to extract and save royalty rules from AI analysis
async function extractAndSaveRoyaltyRules(contractId: string, contractText: string, aiAnalysis: any) {
  try {
    console.log(`🔍 Extracting royalty rules for contract ${contractId}...`);
    
    // 🌱 NEW: Extract products with FormulaNode JSON
    console.log(`🌱 Extracting product varieties with formula definitions...`);
    const productsWithFormulas = await groqService.extractProductsWithFormulas(contractText);
    console.log(`📋 Found ${productsWithFormulas.length} product formulas from AI analysis`);
    
    // Save product formulas with FormulaNode JSON
    for (const product of productsWithFormulas) {
      const ruleData: any = {
        contractId,
        ruleType: 'formula_based',
        ruleName: product.ruleName,
        description: product.description,
        productCategories: product.conditions?.productCategories || [product.productName],
        territories: product.conditions?.territories || [],
        containerSizes: product.conditions?.containerSize ? [product.conditions.containerSize] : [],
        
        // 🚀 NEW: Store the complete FormulaDefinition JSON
        formulaDefinition: product.formulaDefinition,
        formulaVersion: '1.0',
        
        isActive: true,
        priority: 1,
        confidence: product.confidence ?? 0.9, // Keep as number for schema validation
        sourceSection: product.sourceSection || null,
        sourceText: product.description,
      };

      await storage.createRoyaltyRule(ruleData);
      console.log(`✅ Saved formula rule: ${product.ruleName} (product: ${product.productName})`);
    }
    
    // 📊 LEGACY: Also extract using old method for backward compatibility
    const detailedRules = await groqService.extractDetailedRoyaltyRules(contractText);
    console.log(`📋 Found ${detailedRules.rules.length} legacy royalty rules`);
    
    // Convert AI-extracted rules to database format (legacy flat structure)
    // Save ALL rules - global adjustments (without categories) are valid and useful!
    const validLegacyRules = detailedRules.rules.filter(rule => {
      // Type assertion for AI rule as it comes from external API
      const r = rule as any;
      
      // Keep rules that have either:
      // 1. Product categories (product-specific rules)
      // 2. Seasonal adjustments or territory premiums (global multipliers)
      // 3. Volume tiers or base rates (calculation rules)
      const hasCategories = r.conditions?.productCategories && r.conditions.productCategories.length > 0;
      const hasSeasonalAdj = r.calculation?.seasonalAdjustments || r.seasonalAdjustments;
      const hasTerritoryPrem = r.calculation?.territoryPremiums || r.territoryPremiums;
      const hasTiers = r.calculation?.tiers && r.calculation.tiers.length > 0;
      const hasRate = r.calculation?.rate || r.calculation?.baseRate || r.baseRate;
      
      const isValid = hasCategories || hasSeasonalAdj || hasTerritoryPrem || hasTiers || hasRate;
      
      if (!isValid) {
        console.log(`   ⚠️ Skipping empty rule (no data): ${r.ruleName}`);
      }
      return isValid;
    });
    
    console.log(`📋 Keeping ${validLegacyRules.length} valid legacy rules (including global adjustments)`);
    
    for (const aiRule of validLegacyRules) {
      // Type assertion for AI rule as it comes from external API
      const rule = aiRule as any;
      
      // Extract seasonal adjustments from various possible locations
      const seasonalAdj = rule.calculation?.seasonalAdjustments || 
                         rule.calculation?.seasonalMultipliers || 
                         rule.seasonalAdjustments || 
                         {};
      
      // Extract territory premiums from various possible locations
      const territoryPrem = rule.calculation?.territoryPremiums || 
                           rule.calculation?.territoryMultipliers || 
                           rule.territoryPremiums || 
                           {};
      
      // Extract volume tiers - ensure they're in correct format
      let volumeTiers = rule.calculation?.tiers || [];
      
      // Extract base rate from multiple possible locations
      const baseRate = rule.calculation?.rate?.toString() || 
                      rule.calculation?.baseRate?.toString() || 
                      rule.baseRate?.toString() || 
                      null;
      
      const ruleData: any = {
        contractId,
        ruleType: mapRuleType(rule.ruleType),
        ruleName: rule.ruleName || 'Extracted Rule',
        description: rule.description || '',
        productCategories: rule.conditions?.productCategories || [],
        territories: rule.conditions?.territories || [],
        containerSizes: rule.conditions?.containerSizes || [],
        seasonalAdjustments: seasonalAdj,
        territoryPremiums: territoryPrem,
        volumeTiers: volumeTiers,
        baseRate: baseRate,
        minimumGuarantee: rule.ruleType === 'minimum_guarantee' ? rule.calculation?.amount?.toString() : null,
        isActive: true,
        priority: rule.priority || 10, // Lower priority than formula-based rules
        confidence: rule.confidence || null,
        sourceSection: rule.sourceSpan?.section || null,
        sourceText: rule.sourceSpan?.text || null,
      };

      await storage.createRoyaltyRule(ruleData);
      console.log(`✅ Saved legacy rule: ${rule.ruleName}`);
    }
    
    console.log(`🎉 Successfully extracted and saved ${productsWithFormulas.length + detailedRules.rules.length} total royalty rules`);
  } catch (error) {
    console.error(`⚠️ Failed to extract royalty rules:`, error);
    // Don't fail the entire analysis if rule extraction fails
  }
}

// Generate embeddings for contract (for RAG Q&A)
async function generateContractEmbeddings(contractId: string, aiAnalysis: any) {
  try {
    console.log(`🔍 Generating embeddings for contract ${contractId}...`);
    
    // Generate embedding for summary
    if (aiAnalysis.summary) {
      const { embedding } = await HuggingFaceEmbeddingService.generateEmbedding(aiAnalysis.summary);
      await storage.saveContractEmbedding({
        contractId,
        embeddingType: 'summary',
        embedding,
        sourceText: aiAnalysis.summary,
        metadata: { type: 'summary' }
      });
      console.log(`✅ Generated summary embedding (${embedding.length} dimensions)`);
    }
    
    // Generate embeddings for key terms
    if (aiAnalysis.keyTerms && Array.isArray(aiAnalysis.keyTerms)) {
      const keyTermsText = aiAnalysis.keyTerms.join(', ');
      const { embedding } = await HuggingFaceEmbeddingService.generateEmbedding(keyTermsText);
      await storage.saveContractEmbedding({
        contractId,
        embeddingType: 'key_terms',
        embedding,
        sourceText: keyTermsText,
        metadata: { terms: aiAnalysis.keyTerms }
      });
      console.log(`✅ Generated key terms embedding`);
    }
    
    // Generate embeddings for insights
    if (aiAnalysis.insights && Array.isArray(aiAnalysis.insights)) {
      const insightsText = aiAnalysis.insights.join(' ');
      const { embedding } = await HuggingFaceEmbeddingService.generateEmbedding(insightsText);
      await storage.saveContractEmbedding({
        contractId,
        embeddingType: 'insights',
        embedding,
        sourceText: insightsText,
        metadata: { insights: aiAnalysis.insights }
      });
      console.log(`✅ Generated insights embedding`);
    }
    
    console.log(`✅ All embeddings generated for contract ${contractId}`);
  } catch (error) {
    console.error(`⚠️ Failed to generate embeddings:`, error);
    // Don't fail the entire analysis if embedding generation fails
  }
}

// Map AI rule types to database enum values
function mapRuleType(aiRuleType: string): string {
  const typeMap: { [key: string]: string} = {
    'percentage': 'tiered_pricing',
    'tiered': 'tiered_pricing',
    'minimum_guarantee': 'minimum_guarantee',
    'cap': 'tiered_pricing',
    'deduction': 'tiered_pricing',
    'fixed_fee': 'tiered_pricing',
  };
  return typeMap[aiRuleType] || 'tiered_pricing';
}

export default registerRoutes;
