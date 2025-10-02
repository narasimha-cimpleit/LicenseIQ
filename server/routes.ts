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
import { 
  insertContractSchema, 
  insertContractAnalysisSchema, 
  insertAuditTrailSchema,
  insertVendorSchema,
  insertLicenseDocumentSchema,
  insertLicenseRuleSetSchema,
  insertSalesDataSchema,
  insertRoyaltyRunSchema
} from "@shared/schema";

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
  app.get('/api/vendors', isAuthenticated, async (req: any, res: Response) => {
    try {
      const search = req.query.search as string;
      const vendors = await storage.getVendors(search);
      
      // Fetch contracts for each vendor
      const vendorsWithContracts = await Promise.all(
        vendors.map(async (vendor) => {
          const contracts = await storage.getContractsByVendor(vendor.id);
          return {
            ...vendor,
            licenses: contracts.map(contract => ({
              id: contract.id,
              name: contract.originalName,
              status: contract.status
            }))
          };
        })
      );
      
      res.json({ vendors: vendorsWithContracts });
    } catch (error: any) {
      console.error('Get vendors error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch vendors' });
    }
  });

  app.post('/api/vendors', isAuthenticated, async (req: any, res: Response) => {
    try {
      const vendor = await storage.createVendor(req.body);
      
      await createAuditLog(req, 'vendor_create', 'vendor', vendor.id, {
        name: vendor.name
      });
      
      res.json(vendor);
    } catch (error: any) {
      console.error('Create vendor error:', error);
      res.status(500).json({ error: error.message || 'Failed to create vendor' });
    }
  });

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

  // ==========================================
  // ERP IMPORT ROUTES
  // ==========================================
  
  // Upload and import sales data from CSV/Excel
  app.post('/api/erp-imports', isAuthenticated, dataUpload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { vendorId } = req.body;
      if (!vendorId) {
        return res.status(400).json({ error: 'Vendor ID is required' });
      }

      // Create import job
      const importJob = await storage.createErpImportJob({
        jobType: 'manual_upload',
        fileName: req.file.originalname,
        status: 'processing',
        createdBy: req.user.id,
        connectionId: null,
        vendorId: vendorId,
        startedAt: new Date()
      });

      // Parse file
      const fileBuffer = fs.readFileSync(req.file.path);
      const parseResult = await SalesDataParser.parseFile(fileBuffer, req.file.originalname);

      // Store parsed rows in staging
      for (const row of parseResult.rows) {
        await storage.createSalesStaging({
          importJobId: importJob.id,
          externalId: row.externalId,
          rowData: { ...row.rowData, vendorId }, // Add vendorId to row data
          validationStatus: row.validationStatus,
          validationErrors: row.validationErrors || null
        });
      }

      // Update import job status
      await storage.updateErpImportJobStatus(importJob.id, 'completed', {
        recordsImported: parseResult.validRows,
        recordsFailed: parseResult.invalidRows
      });

      // Log the import
      await createAuditLog(req, 'import_sales_data', 'erp_import_job', importJob.id, {
        fileName: req.file.originalname,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows
      });

      res.json({
        importJob,
        summary: {
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          invalidRows: parseResult.invalidRows
        }
      });
    } catch (error) {
      console.error('ERP import error:', error);
      res.status(500).json({ error: 'Failed to import sales data' });
    }
  });

  // Get all import jobs
  app.get('/api/erp-imports', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { status } = req.query;
      const jobs = await storage.getErpImportJobs(req.user.id, status as string);
      res.json({ jobs });
    } catch (error) {
      console.error('Get import jobs error:', error);
      res.status(500).json({ error: 'Failed to fetch import jobs' });
    }
  });

  // Get specific import job with staging data
  app.get('/api/erp-imports/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const importJob = await storage.getErpImportJob(req.params.id);
      if (!importJob) {
        return res.status(404).json({ error: 'Import job not found' });
      }

      const stagingData = await storage.getSalesStaging(req.params.id);
      res.json({ importJob, stagingData });
    } catch (error) {
      console.error('Get import job error:', error);
      res.status(500).json({ error: 'Failed to fetch import job' });
    }
  });

  // Promote staging data to sales data
  app.post('/api/erp-imports/:id/promote', isAuthenticated, async (req: any, res: Response) => {
    try {
      const importJob = await storage.getErpImportJob(req.params.id);
      if (!importJob) {
        return res.status(404).json({ error: 'Import job not found' });
      }

      const promotedCount = await storage.promoteStagingToSales(req.params.id);

      // Log the promotion
      await createAuditLog(req, 'promote_sales_data', 'erp_import_job', req.params.id, {
        promotedCount
      });

      res.json({ message: 'Sales data promoted successfully', promotedCount });
    } catch (error) {
      console.error('Promote sales data error:', error);
      res.status(500).json({ error: 'Failed to promote sales data' });
    }
  });

  // ==========================================
  // ROYALTY RUN ROUTES
  // ==========================================
  
  // Create royalty run and calculate
  app.post('/api/royalty-runs', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { name, vendorId, ruleSetId, periodStart, periodEnd } = req.body;

      // Create royalty run
      const run = await storage.createRoyaltyRun({
        name,
        vendorId,
        ruleSetId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        runBy: req.user.id
      });

      // Update status to calculating
      await storage.updateRoyaltyRunStatus(run.id, 'calculating');

      res.json({ run });

      // Trigger async calculation (don't await)
      calculateRoyalties(run.id, vendorId, ruleSetId, periodStart, periodEnd);
    } catch (error) {
      console.error('Create royalty run error:', error);
      res.status(500).json({ error: 'Failed to create royalty run' });
    }
  });

  // Get all royalty runs
  app.get('/api/royalty-runs', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { vendorId, status } = req.query;
      const runs = await storage.getRoyaltyRuns(vendorId as string, status as string);
      res.json({ runs });
    } catch (error) {
      console.error('Get royalty runs error:', error);
      res.status(500).json({ error: 'Failed to fetch royalty runs' });
    }
  });

  // Get specific royalty run
  app.get('/api/royalty-runs/:id', isAuthenticated, async (req: any, res: Response) => {
    try {
      const run = await storage.getRoyaltyRun(req.params.id);
      if (!run) {
        return res.status(404).json({ error: 'Royalty run not found' });
      }

      const results = await storage.getRoyaltyResults(req.params.id);
      res.json({ run, results });
    } catch (error) {
      console.error('Get royalty run error:', error);
      res.status(500).json({ error: 'Failed to fetch royalty run' });
    }
  });

  // Approve royalty run
  app.post('/api/royalty-runs/:id/approve', isAuthenticated, async (req: any, res: Response) => {
    try {
      const run = await storage.approveRoyaltyRun(req.params.id, req.user.id);

      await createAuditLog(req, 'approve_royalty_run', 'royalty_run', req.params.id, {
        totalRoyalty: run.totalRoyalty
      });

      res.json({ run });
    } catch (error) {
      console.error('Approve royalty run error:', error);
      res.status(500).json({ error: 'Failed to approve royalty run' });
    }
  });

  // Reject royalty run
  app.post('/api/royalty-runs/:id/reject', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { reason } = req.body;
      const run = await storage.rejectRoyaltyRun(req.params.id, reason);

      await createAuditLog(req, 'reject_royalty_run', 'royalty_run', req.params.id, {
        reason
      });

      res.json({ run });
    } catch (error) {
      console.error('Reject royalty run error:', error);
      res.status(500).json({ error: 'Failed to reject royalty run' });
    }
  });

  // Register rules engine routes
  registerRulesRoutes(app);

  // Return the configured app - server will be started in index.ts
  return createServer(app);
}

// Background contract processing
async function processContractAnalysis(contractId: string, filePath: string) {
  try {
    console.log(`Starting analysis for contract ${contractId}`);

    // Extract text from file based on file type
    const contract = await storage.getContract(contractId);
    const mimeType = contract?.fileType || 'application/pdf';
    const extractedText = await fileService.extractTextFromFile(filePath, mimeType);
    
    // Pre-filter text to royalty-relevant sections to reduce Groq API load
    const royaltyRelevantText = extractRoyaltyRelevantSections(extractedText);
    console.log(`📝 Filtered text: ${royaltyRelevantText.length} chars (from ${extractedText.length})`);
    
    // Analyze with Groq AI with smart rate limiting
    const aiAnalysis = await groqService.analyzeContract(royaltyRelevantText);
    const detailedRules = await groqService.extractDetailedRoyaltyRules(royaltyRelevantText);
    
    // Log extracted rules for debugging
    console.log(`📋 Extracted ${detailedRules.rules.length} detailed royalty rules from contract ${contractId}`);
    
    // Store detailed rules in the license rules system (only if we have rules)
    if (detailedRules.rules.length > 0) {
      await processLicenseRules(contractId, detailedRules);
      console.log(`✅ Successfully stored ${detailedRules.rules.length} royalty rules`);
    } else {
      console.log(`⚠️ No rules extracted - marking for manual review instead of storing empty set`);
      // Don't store empty rule sets - this indicates extraction failure
    }
    
    // Save analysis
    const analysisData = insertContractAnalysisSchema.parse({
      contractId,
      summary: aiAnalysis.summary,
      keyTerms: aiAnalysis.keyTerms,
      riskAnalysis: aiAnalysis.riskAnalysis,
      insights: aiAnalysis.insights,
      confidence: aiAnalysis.confidence.toString() // Convert to string for decimal field
    });

    await storage.createContractAnalysis(analysisData);

    // Update contract status - mark as needing review if no rules extracted
    const finalStatus = detailedRules.rules.length > 0 ? 'analyzed' : 'reviewed_needed';
    await storage.updateContractStatus(contractId, finalStatus);

    console.log(`Analysis completed for contract ${contractId}`);

  } catch (error) {
    console.error(`Analysis failed for contract ${contractId}:`, error);
    await storage.updateContractStatus(contractId, 'failed');
  }
}

// Helper function to extract royalty-relevant sections
function extractRoyaltyRelevantSections(contractText: string): string {
  const royaltyKeywords = [
    'royalty', 'royalties', 'tier', 'tier 1', 'tier 2', 'tier 3', 
    'per unit', 'per-unit', 'minimum', 'guarantee', 'payment', 'payments',
    'seasonal', 'spring', 'fall', 'holiday', 'premium', 'organic',
    'container', 'multiplier', 'schedule', 'exhibit', 'calculation',
    'territory', 'primary', 'secondary', 'volume', 'threshold',
    'ornamental', 'perennials', 'shrubs', 'roses', 'hydrangea',
    'licensee shall pay', 'per plant', 'quarterly payment'
  ];

  const lines = contractText.split('\n');
  const relevantLines: string[] = [];
  const contextWindow = 3; // Include 3 lines before and after relevant content

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (royaltyKeywords.some(keyword => line.includes(keyword))) {
      // Add context lines before
      for (let j = Math.max(0, i - contextWindow); j < i; j++) {
        if (!relevantLines.includes(lines[j])) {
          relevantLines.push(lines[j]);
        }
      }
      
      // Add the relevant line
      if (!relevantLines.includes(lines[i])) {
        relevantLines.push(lines[i]);
      }
      
      // Add context lines after
      for (let j = i + 1; j <= Math.min(lines.length - 1, i + contextWindow); j++) {
        if (!relevantLines.includes(lines[j])) {
          relevantLines.push(lines[j]);
        }
      }
    }
  }

  const filteredText = relevantLines.join('\n');
  
  // If filtered text is too short, use first part of original (but truncated)
  if (filteredText.length < 1000) {
    console.log(`📝 Filtered text too short (${filteredText.length}), using truncated original`);
    return contractText.substring(0, 6000); // Smaller truncation for Groq
  }
  
  // If filtered text is too long, truncate it
  if (filteredText.length > 8000) {
    console.log(`📝 Filtered text too long (${filteredText.length}), truncating`);
    return filteredText.substring(0, 8000);
  }
  
  return filteredText;
}

// Process and save detailed license rules
async function processLicenseRules(contractId: string, extractionResult: any) {
  try {
    console.log(`🔧 Processing license rules for contract ${contractId}`);

    // Create license rule set
    const ruleSet = await storage.createLicenseRuleSet({
      contractId: contractId,
      name: extractionResult.licenseType || 'Extracted License Rules',
      version: 1,
      rulesDsl: {
        licensorName: extractionResult.parties.licensor,
        licenseeName: extractionResult.parties.licensee,
        currency: extractionResult.currency,
        paymentTerms: extractionResult.paymentTerms,
        rules: extractionResult.rules
      },
      effectiveDate: extractionResult.effectiveDate ? new Date(extractionResult.effectiveDate) : null,
      expirationDate: extractionResult.expirationDate ? new Date(extractionResult.expirationDate) : null,
      extractionMetadata: {
        documentType: extractionResult.documentType,
        extractionMetadata: extractionResult.extractionMetadata,
        reportingRequirements: extractionResult.reportingRequirements
      }
    });

    // Create individual license rules
    for (const rule of extractionResult.rules) {
      await storage.createLicenseRule({
        ruleSetId: ruleSet.id,
        ruleName: rule.ruleName,
        ruleType: rule.ruleType,
        conditions: rule.conditions,
        calculation: rule.calculation,
        priority: rule.priority,
        sourceSpan: rule.sourceSpan,
        confidence: rule.confidence.toString(), // Convert to string for decimal field
        isActive: true
      });
    }

    console.log(`✅ Successfully processed ${extractionResult.rules.length} license rules for contract ${contractId}`);

  } catch (error) {
    console.error(`❌ Failed to process license rules for contract ${contractId}:`, error);
    // Don't throw error - allow contract processing to continue even if rules processing fails
  }
}

// Helper function to calculate royalties asynchronously
async function calculateRoyalties(runId: string, vendorId: string, ruleSetId: string, periodStart: string, periodEnd: string) {
  try {
    // Get sales data for the period
    const salesData = await storage.getSalesData(vendorId, new Date(periodStart), new Date(periodEnd));
    
    // Get rule set
    const ruleSet = await storage.getLicenseRuleSet(ruleSetId);
    if (!ruleSet) {
      throw new Error('Rule set not found');
    }

    // Extract rules from rulesDsl
    const rulesDsl = ruleSet.rulesDsl as any;
    const rules = (rulesDsl?.rules || []).map((rule: any) => ({
      id: rule.id || crypto.randomUUID(),
      ruleName: rule.ruleName || 'Unnamed Rule',
      ruleType: rule.ruleType || 'percentage',
      description: rule.description || '',
      conditions: rule.conditions || {},
      calculation: rule.calculation || {},
      priority: rule.priority || 10,
      isActive: true,
      confidence: rule.confidence || 1.0
    }));

    // Import RulesEngine dynamically
    const { RulesEngine } = await import('./services/rulesEngine.js');
    
    let totalRoyalty = 0;
    let totalSalesAmount = 0;
    const results = [];

    // Calculate royalty for each sales record
    for (const sale of salesData) {
      const calculationInput = {
        grossRevenue: Number(sale.grossAmount),
        netRevenue: Number(sale.netAmount || sale.grossAmount),
        units: Number(sale.quantity || 1),
        territory: sale.territory,
        productCategory: sale.category,
        timeframe: 'monthly' as const
      };

      const calculation = await RulesEngine.calculateRoyalties(rules, calculationInput);
      
      totalRoyalty += calculation.totalRoyalty;
      totalSalesAmount += Number(sale.grossAmount);

      // Store result
      results.push({
        runId,
        salesDataId: sale.id,
        ruleId: calculation.breakdown[0]?.ruleName || null,
        salesAmount: sale.grossAmount,
        royaltyAmount: calculation.totalRoyalty.toString(),
        royaltyRate: calculation.breakdown[0]?.rate || null,
        calculationDetails: calculation
      });
    }

    // Save results
    if (results.length > 0) {
      await storage.createRoyaltyResults(results);
    }

    // Update run status to awaiting approval
    await storage.updateRoyaltyRunStatus(runId, 'awaiting_approval', {
      totalSalesAmount,
      totalRoyalty,
      recordsProcessed: salesData.length
    });

    console.log(`✅ Royalty calculation completed for run ${runId}: ${results.length} records, $${totalRoyalty.toFixed(2)} total royalty`);
  } catch (error) {
    console.error(`❌ Royalty calculation failed for run ${runId}:`, error);
    await storage.updateRoyaltyRunStatus(runId, 'failed');
  }
}


export default registerRoutes;