import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
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
