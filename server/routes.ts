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

  // Contract upload endpoint
  app.post('/api/contracts/upload', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Create contract record
      const contractData = insertContractSchema.parse({
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

      res.json({ message: 'Reprocessing started', contractId });

      // Trigger analysis in background
      processContractAnalysis(contractId, contract.filePath);

    } catch (error) {
      console.error('Reprocess error:', error);
      res.status(500).json({ error: 'Failed to reprocess contract' });
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

  } catch (error) {
    console.error(`Analysis failed for contract ${contractId}:`, error);
    await storage.updateContractStatus(contractId, 'failed');
  }
}

// Process and save detailed license rules
async function processLicenseRules(contractId: string, extractionResult: any) {
  try {
    console.log(`🔧 Processing license rules for contract ${contractId}`);

    // Create license rule set
    const ruleSet = await storage.createLicenseRuleSet({
      contractId: contractId, // FIXED: Link to the contract!
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


export default registerRoutes;