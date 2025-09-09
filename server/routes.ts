import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword } from "./auth";
import { fileService } from "./services/fileService";
import { groqService } from "./services/groqService";
import { insertContractSchema, insertContractAnalysisSchema, insertAuditTrailSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB
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

// Generate analysis report content
function generateAnalysisReport(contract: any, analysis: any): string {
  const report = [];
  
  report.push("CONTRACT ANALYSIS REPORT");
  report.push("=" + "=".repeat(50));
  report.push("");
  
  report.push("Contract Information:");
  report.push("-".repeat(20));
  report.push(`File Name: ${contract.originalName}`);
  report.push(`Upload Date: ${new Date(contract.createdAt).toLocaleDateString()}`);
  report.push(`File Size: ${(contract.fileSize / 1024 / 1024).toFixed(1)} MB`);
  report.push(`Status: ${contract.status}`);
  report.push(`Analysis Confidence: ${Math.round(parseFloat(analysis.confidence) * 100)}%`);
  report.push("");
  
  report.push("AI Summary:");
  report.push("-".repeat(12));
  report.push(analysis.summary);
  report.push("");
  
  if (analysis.keyTerms && analysis.keyTerms.length > 0) {
    report.push("Key Terms:");
    report.push("-".repeat(10));
    analysis.keyTerms.forEach((term: any, index: number) => {
      report.push(`${index + 1}. ${term.type}`);
      report.push(`   Description: ${term.description}`);
      report.push(`   Confidence: ${Math.round(term.confidence * 100)}%`);
      report.push(`   Location: ${term.location}`);
      report.push("");
    });
  }
  
  if (analysis.riskAnalysis && analysis.riskAnalysis.length > 0) {
    report.push("Risk Analysis:");
    report.push("-".repeat(14));
    analysis.riskAnalysis.forEach((risk: any, index: number) => {
      report.push(`${index + 1}. ${risk.level.toUpperCase()} RISK: ${risk.title}`);
      report.push(`   ${risk.description}`);
      report.push("");
    });
  }
  
  if (analysis.insights && analysis.insights.length > 0) {
    report.push("Business Insights:");
    report.push("-".repeat(17));
    analysis.insights.forEach((insight: any, index: number) => {
      report.push(`${index + 1}. ${insight.title} (${insight.type.toUpperCase()})`);
      report.push(`   ${insight.description}`);
      report.push("");
    });
  }
  
  report.push("Report generated on: " + new Date().toLocaleString());
  
  return report.join("\n");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // The auth routes are now handled in setupAuth function

  // Contract routes
  app.post('/api/contracts/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Validate file
      const validation = fileService.validateFile(req.file);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }

      // Save file
      const fileResult = await fileService.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Create contract record
      const contractData = {
        fileName: fileResult.fileName,
        originalName: fileResult.originalName,
        fileSize: fileResult.fileSize,
        fileType: fileResult.fileType,
        filePath: fileResult.filePath,
        contractType: req.body.contractType || 'other',
        priority: req.body.priority || 'normal',
        uploadedBy: req.user.id,
        notes: req.body.notes || null,
      };

      const validatedData = insertContractSchema.parse(contractData);
      const contract = await storage.createContract(validatedData);

      await createAuditLog(req, 'contract_uploaded', 'contract', contract.id, {
        fileName: fileResult.originalName,
        fileSize: fileResult.fileSize,
      });

      // Start processing asynchronously
      processContractAsync(contract.id);

      res.status(201).json(contract);
    } catch (error) {
      console.error('Error uploading contract:', error);
      res.status(500).json({ message: 'Failed to upload contract' });
    }
  });

  app.get('/api/contracts', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const userId = req.user.id;
      
      // Check if user can view all contracts (admin/owner) or only their own
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      const result = await storage.getContracts(
        canViewAll ? undefined : userId,
        limit,
        offset
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      res.status(500).json({ message: 'Failed to fetch contracts' });
    }
  });

  app.get('/api/contracts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Check permissions
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      if (!canViewAll && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await createAuditLog(req, 'contract_viewed', 'contract', contract.id);
      res.json(contract);
    } catch (error) {
      console.error('Error fetching contract:', error);
      res.status(500).json({ message: 'Failed to fetch contract' });
    }
  });

  // Get contract file (original document)
  app.get('/api/contracts/:id/file', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Check permissions
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      if (!canViewAll && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Serve the file
      const filePath = path.join(process.cwd(), contract.filePath);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${contract.originalName}"`);
      res.sendFile(filePath);

      // Log file access
      await createAuditLog(req, 'contract_file_accessed', 'contract', contractId, {
        fileName: contract.originalName,
      });
    } catch (error) {
      console.error('Error serving contract file:', error);
      res.status(500).json({ message: 'Failed to serve file' });
    }
  });

  // Download analysis report
  app.get('/api/contracts/:id/report', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Check permissions
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      if (!canViewAll && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (!contract.analysis) {
        return res.status(400).json({ message: 'Analysis not available' });
      }

      // Generate simple text-based analysis report
      const reportContent = generateAnalysisReport(contract, contract.analysis);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${contract.originalName}_analysis_report.txt"`);
      res.send(reportContent);
      

      // Log report download
      await createAuditLog(req, 'analysis_report_downloaded', 'contract', contractId, {
        fileName: contract.originalName,
      });
    } catch (error) {
      console.error('Error generating analysis report:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  // Flag contract for review
  app.patch('/api/contracts/:id/flag', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;
      const { flagged } = req.body;
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Update flag status
      const updatedContract = await storage.updateContractFlag(contractId, flagged);
      
      // Log flag action
      await createAuditLog(req, flagged ? 'contract_flagged' : 'contract_unflagged', 'contract', contractId, {
        fileName: contract.originalName,
        flaggedBy: userId,
      });

      res.json({ 
        message: flagged ? 'Contract flagged for review' : 'Flag removed from contract',
        flagged: updatedContract.flaggedForReview 
      });
    } catch (error) {
      console.error('Error updating contract flag:', error);
      res.status(500).json({ message: 'Failed to update flag status' });
    }
  });

  app.get('/api/contracts/search/:query', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.params.query;
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      const contracts = await storage.searchContracts(
        query,
        canViewAll ? undefined : userId
      );

      await createAuditLog(req, 'contracts_searched', undefined, undefined, { query });
      res.json(contracts);
    } catch (error) {
      console.error('Error searching contracts:', error);
      res.status(500).json({ message: 'Failed to search contracts' });
    }
  });

  app.delete('/api/contracts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;
      
      // Get the contract first
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Check permissions - user can delete their own contract or admin/owner can delete any
      const userRole = (await storage.getUser(userId))?.role;
      const canDeleteAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canDeleteAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete the contract and its analysis
      await storage.deleteContract(contractId);

      // Log the deletion
      await createAuditLog(req, 'contract_deleted', 'contract', contractId, {
        fileName: contract.originalName,
        deletedBy: userId,
      });

      res.json({ message: 'Contract deleted successfully' });
    } catch (error) {
      console.error('Error deleting contract:', error);
      res.status(500).json({ message: 'Failed to delete contract' });
    }
  });

  // Analytics routes
  app.get('/api/analytics/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      const metrics = await storage.getContractMetrics(
        canViewAll ? undefined : userId
      );

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ message: 'Failed to fetch metrics' });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const search = req.query.search as string;
      const role = req.query.role as string;
      
      const users = await storage.getAllUsers(search, role);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Alternative endpoint for users (for compatibility)
  app.get('/api/users/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const search = req.query.search as string;
      const role = req.query.role as string;
      
      const users = await storage.getAllUsers(search, role);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Create user endpoint (admin only) - doesn't log in the new user
  app.post('/api/users/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { username, password, email, firstName, lastName, role } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        role: role || "viewer",
        isActive: true,
      });

      await createAuditLog(req, 'user_created', 'user', newUser.id, {
        email: newUser.email,
        role: newUser.role,
      });

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isActive: newUser.isActive,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { role } = req.body;
      const targetUserId = req.params.id;
      
      const updatedUser = await storage.updateUserRole(targetUserId, role);
      
      await createAuditLog(req, 'user_role_updated', 'user', targetUserId, {
        newRole: role,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  // Reset user password endpoint (admin only)
  app.post('/api/users/:id/reset-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const targetUserId = req.params.id;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      const updatedUser = await storage.resetUserPassword(targetUserId, hashedPassword);
      
      await createAuditLog(req, 'user_password_reset', 'user', targetUserId, {
        email: targetUser.email,
      });

      res.json({ 
        message: 'Password reset successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName
        }
      });
    } catch (error) {
      console.error('Error resetting user password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Delete user endpoint (admin only)
  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const targetUserId = req.params.id;
      const targetUser = await storage.getUser(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent deleting the last admin/owner
      if (targetUser.role === 'owner' || targetUser.role === 'admin') {
        const adminCount = await storage.getAdminCount();
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot delete the last admin user' });
        }
      }

      await storage.deleteUser(targetUserId);
      
      await createAuditLog(req, 'user_deleted', 'user', targetUserId, {
        email: targetUser.email,
        role: targetUser.role,
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Update user endpoint (admin only)
  app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const targetUserId = req.params.id;
      const { firstName, lastName, email } = req.body;
      
      const updatedUser = await storage.updateUser(targetUserId, {
        firstName,
        lastName,
        email,
      });
      
      await createAuditLog(req, 'user_updated', 'user', targetUserId, {
        firstName,
        lastName,
        email,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Audit trail routes
  app.get('/api/audit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'auditor')) {
        return res.status(403).json({ message: 'Access denied' });
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

  // File serving route
  app.get('/api/files/:fileName', isAuthenticated, async (req: any, res) => {
    try {
      const fileName = req.params.fileName;
      const filePath = `uploads/${fileName}`;
      
      // Check if user has access to this file
      // This would require implementing file ownership checking
      
      const fileBuffer = await fileService.readFile(filePath);
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(404).json({ message: 'File not found' });
    }
  });

  // Sample contract download route
  app.get('/api/download/sample-contract', (req, res) => {
    const filePath = 'sample_contract.html';
    res.download(filePath, 'sample_contract.html', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(404).json({ message: 'File not found' });
      }
    });
  });

  // Documentation archive download route
  app.get('/api/download/documentation', (req, res) => {
    const filePath = 'licence-iq-documentation.tar.gz';
    res.download(filePath, 'licence-iq-documentation.tar.gz', (err) => {
      if (err) {
        console.error('Error downloading documentation:', err);
        res.status(404).json({ message: 'Documentation file not found' });
      }
    });
  });

  // Individual documentation file downloads
  app.get('/api/download/poc-plan', (req, res) => {
    res.download('POC_PLAN.md', 'POC_PLAN.md');
  });

  app.get('/api/download/tech-specs', (req, res) => {
    res.download('TECHNICAL_SPECIFICATIONS.md', 'TECHNICAL_SPECIFICATIONS.md');
  });

  app.get('/api/download/architecture', (req, res) => {
    res.download('SYSTEM_ARCHITECTURE.md', 'SYSTEM_ARCHITECTURE.md');
  });

  app.get('/api/download/api-docs', (req, res) => {
    res.download('API_DOCUMENTATION.md', 'API_DOCUMENTATION.md');
  });

  app.get('/api/download/deployment', (req, res) => {
    res.download('DEPLOYMENT_GUIDE.md', 'DEPLOYMENT_GUIDE.md');
  });

  app.get('/api/download/summary', (req, res) => {
    res.download('PROJECT_SUMMARY.md', 'PROJECT_SUMMARY.md');
  });

  // Reprocess contract route
  app.post('/api/contracts/:id/reprocess', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = req.params.id;
      
      // Check if contract exists
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Check permissions
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canReprocess = userRole === 'admin' || userRole === 'owner' || contract.uploadedBy === userId;
      
      if (!canReprocess) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete existing analysis
      await storage.deleteContractAnalysis(contractId);
      
      // Trigger reprocessing
      processContractAsync(contractId);
      
      res.json({ message: 'Reprocessing started' });
    } catch (error) {
      console.error('Error reprocessing contract:', error);
      res.status(500).json({ message: 'Failed to reprocess contract' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Async contract processing function
async function processContractAsync(contractId: string): Promise<void> {
  try {
    const startTime = Date.now();
    
    // Update status to processing
    await storage.updateContractStatus(contractId, 'processing');
    
    // Get contract details
    const contract = await storage.getContract(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Extract text from file
    const text = await fileService.extractTextFromFile(contract.filePath, contract.fileType);
    
    // DEBUG: Log what text is being sent to AI
    console.log('=== DEBUG: Text being sent to AI ===');
    console.log('Text length:', text.length);
    console.log('First 300 characters:');
    console.log(text.substring(0, 300));
    console.log('Last 300 characters:');
    console.log(text.substring(Math.max(0, text.length - 300)));
    console.log('=== END DEBUG ===');
    
    // Analyze with Groq
    const analysis = await groqService.analyzeContract(text);
    
    // Save analysis
    const analysisData = {
      contractId,
      summary: analysis.summary,
      keyTerms: analysis.keyTerms,
      riskAnalysis: analysis.riskAnalysis,
      insights: analysis.insights,
      confidence: analysis.confidence.toString(),
      processingTime: Math.round((Date.now() - startTime) / 1000),
    };

    const validatedAnalysis = insertContractAnalysisSchema.parse(analysisData);
    await storage.createContractAnalysis(validatedAnalysis);
    
    // Update contract status to analyzed
    await storage.updateContractStatus(contractId, 'analyzed', analysisData.processingTime);
    
    console.log(`Contract ${contractId} processed successfully`);
  } catch (error) {
    console.error(`Error processing contract ${contractId}:`, error);
    
    // Update status to failed
    try {
      await storage.updateContractStatus(contractId, 'failed');
    } catch (updateError) {
      console.error('Error updating contract status to failed:', updateError);
    }
  }
}
