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

// Configure multer for secure file uploads with disk storage
const uploadDir = path.join(process.cwd(), 'uploads');
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate secure filename with UUID
      const { randomUUID } = require('crypto');
      const fileExtension = path.extname(file.originalname);
      const fileName = `${randomUUID()}${fileExtension}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // Reduced to 100MB for better security
  },
  fileFilter: (req, file, cb) => {
    // Security: Only allow specific file types
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

      // Validate file (using disk-based file instead of buffer)
      const validation = fileService.validateFile({
        size: req.file.size,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname
      });
      if (!validation.isValid) {
        // Clean up uploaded file if validation fails
        await fs.promises.unlink(req.file.path).catch(console.error);
        return res.status(400).json({ message: validation.error });
      }

      // File is already saved by multer diskStorage
      const fileResult = {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        filePath: req.file.path,
      };

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
        flagged: flagged
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

  // 📊 FINANCIAL ANALYSIS API ENDPOINTS
  app.post('/api/contracts/:id/analyze/financial', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await createAuditLog(req, 'analyze_financial', 'contract', id);
      
      // Get contract data and text
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      
      const text = await fileService.extractTextFromFile(contract.filePath, contract.fileType);
      const analysis = await groqService.analyzeFinancialTerms(text);
      
      // Save financial analysis
      const financialData = {
        contractId: id,
        totalValue: analysis.totalValue,
        currency: analysis.currency,
        paymentSchedule: analysis.paymentSchedule,
        royaltyStructure: analysis.royaltyStructure,
        revenueProjections: analysis.revenueProjections,
        costImpact: analysis.costImpact,
        currencyRisk: analysis.currencyRisk,
        paymentTerms: analysis.paymentTerms,
        penaltyClauses: analysis.penaltyClauses,
      };
      
      const savedAnalysis = await storage.createFinancialAnalysis(financialData);
      res.json(savedAnalysis);
    } catch (error) {
      console.error('Error analyzing financial terms:', error);
      res.status(500).json({ error: 'Failed to analyze financial terms' });
    }
  });

  app.get('/api/contracts/:id/analysis/financial', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getFinancialAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Financial analysis not found' });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching financial analysis:', error);
      res.status(500).json({ error: 'Failed to fetch financial analysis' });
    }
  });

  // ⚖️ COMPLIANCE ANALYSIS API ENDPOINTS
  app.post('/api/contracts/:id/analyze/compliance', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await createAuditLog(req, 'analyze_compliance', 'contract', id);
      
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      
      const text = await fileService.extractTextFromFile(contract.filePath, contract.fileType);
      const analysis = await groqService.analyzeCompliance(text);
      
      const complianceData = {
        contractId: id,
        complianceScore: analysis.complianceScore,
        regulatoryFrameworks: analysis.regulatoryFrameworks,
        jurisdictionAnalysis: analysis.jurisdictionAnalysis,
        dataProtectionCompliance: analysis.dataProtectionCompliance,
        industryStandards: analysis.industryStandards,
        riskFactors: analysis.riskFactors,
        recommendedActions: analysis.recommendedActions,
      };
      
      const savedAnalysis = await storage.createComplianceAnalysis(complianceData);
      res.json(savedAnalysis);
    } catch (error) {
      console.error('Error analyzing compliance:', error);
      res.status(500).json({ error: 'Failed to analyze compliance' });
    }
  });

  app.get('/api/contracts/:id/analysis/compliance', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getComplianceAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Compliance analysis not found' });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching compliance analysis:', error);
      res.status(500).json({ error: 'Failed to fetch compliance analysis' });
    }
  });

  // 📋 CONTRACT OBLIGATIONS API ENDPOINTS
  app.post('/api/contracts/:id/analyze/obligations', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await createAuditLog(req, 'extract_obligations', 'contract', id);
      
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      
      const text = await fileService.extractTextFromFile(contract.filePath, contract.fileType);
      const obligations = await groqService.extractObligations(text);
      
      // Save all extracted obligations
      const savedObligations = [];
      for (const obligation of obligations) {
        const obligationData = {
          contractId: id,
          obligationType: obligation.obligationType,
          description: obligation.description,
          dueDate: obligation.dueDate ? new Date(obligation.dueDate) : null,
          responsible: obligation.responsible,
          priority: obligation.priority,
          status: 'pending',
        };
        
        const saved = await storage.createContractObligation(obligationData);
        savedObligations.push(saved);
      }
      
      res.json(savedObligations);
    } catch (error) {
      console.error('Error extracting obligations:', error);
      res.status(500).json({ error: 'Failed to extract obligations' });
    }
  });

  app.get('/api/contracts/:id/obligations', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const obligations = await storage.getContractObligations(id);
      res.json(obligations);
    } catch (error) {
      console.error('Error fetching obligations:', error);
      res.status(500).json({ error: 'Failed to fetch obligations' });
    }
  });

  app.patch('/api/obligations/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, completionDate } = req.body;
      
      await createAuditLog(req, 'update_obligation_status', 'obligation', id, { status, completionDate });
      
      const updated = await storage.updateObligationStatus(
        id, 
        status, 
        completionDate ? new Date(completionDate) : undefined
      );
      res.json(updated);
    } catch (error) {
      console.error('Error updating obligation status:', error);
      res.status(500).json({ error: 'Failed to update obligation status' });
    }
  });

  // 📈 PERFORMANCE METRICS API ENDPOINTS
  app.post('/api/contracts/:id/analyze/performance', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await createAuditLog(req, 'predict_performance', 'contract', id);
      
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      
      const text = await fileService.extractTextFromFile(contract.filePath, contract.fileType);
      const analysis = await groqService.predictPerformance(text, contract.contractType);
      
      const metricsData = {
        contractId: id,
        performanceScore: analysis.performanceScore,
        milestoneCompletion: analysis.milestoneCompletion,
        onTimeDelivery: analysis.onTimeDelivery,
        budgetVariance: analysis.budgetVariance,
        qualityScore: analysis.qualityScore,
        clientSatisfaction: analysis.clientSatisfaction,
        renewalProbability: analysis.renewalProbability,
        riskFactors: analysis.riskFactors,
        successFactors: analysis.successFactors,
      };
      
      const savedMetrics = await storage.createPerformanceMetrics(metricsData);
      res.json(savedMetrics);
    } catch (error) {
      console.error('Error predicting performance:', error);
      res.status(500).json({ error: 'Failed to predict performance' });
    }
  });

  app.get('/api/contracts/:id/analysis/performance', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const metrics = await storage.getPerformanceMetrics(id);
      
      if (!metrics) {
        return res.status(404).json({ error: 'Performance metrics not found' });
      }
      
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  // 🎯 STRATEGIC ANALYSIS API ENDPOINTS
  app.post('/api/contracts/:id/analyze/strategic', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await createAuditLog(req, 'analyze_strategic', 'contract', id);
      
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      
      const text = await fileService.extractTextFromFile(contract.filePath, contract.fileType);
      const analysis = await groqService.analyzeStrategicValue(text, contract.contractType);
      
      const strategicData = {
        contractId: id,
        strategicValue: analysis.strategicValue,
        marketAlignment: analysis.marketAlignment,
        competitiveAdvantage: analysis.competitiveAdvantage,
        riskConcentration: analysis.riskConcentration,
        standardizationScore: analysis.standardizationScore,
        negotiationInsights: analysis.negotiationInsights,
        benchmarkComparison: analysis.benchmarkComparison,
        recommendations: analysis.recommendations,
      };
      
      const savedAnalysis = await storage.createStrategicAnalysis(strategicData);
      res.json(savedAnalysis);
    } catch (error) {
      console.error('Error analyzing strategic value:', error);
      res.status(500).json({ error: 'Failed to analyze strategic value' });
    }
  });

  app.get('/api/contracts/:id/analysis/strategic', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getStrategicAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Strategic analysis not found' });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching strategic analysis:', error);
      res.status(500).json({ error: 'Failed to fetch strategic analysis' });
    }
  });

  // 🔍 CONTRACT COMPARISON API ENDPOINTS
  app.post('/api/contracts/:id/analyze/comparison', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await createAuditLog(req, 'compare_contracts', 'contract', id);
      
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      
      // Get similar contracts for comparison
      const userId = req.user.role === 'admin' || req.user.role === 'owner' ? undefined : req.user.id;
      const { contracts: allContracts } = await storage.getContracts(userId, 1000);
      
      const text = await fileService.extractTextFromFile(contract.filePath, contract.fileType);
      const analysis = await groqService.findSimilarContracts(text, allContracts);
      
      const comparisonData = {
        contractId: id,
        similarityScore: analysis.similarityScore,
        clauseVariations: analysis.clauseVariations,
        termComparisons: analysis.termComparisons,
        bestPractices: analysis.bestPractices,
        anomalies: analysis.anomalies,
      };
      
      const savedComparison = await storage.createContractComparison(comparisonData);
      res.json(savedComparison);
    } catch (error) {
      console.error('Error comparing contracts:', error);
      res.status(500).json({ error: 'Failed to compare contracts' });
    }
  });

  app.get('/api/contracts/:id/analysis/comparison', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const comparison = await storage.getContractComparison(id);
      
      if (!comparison) {
        return res.status(404).json({ error: 'Contract comparison not found' });
      }
      
      res.json(comparison);
    } catch (error) {
      console.error('Error fetching contract comparison:', error);
      res.status(500).json({ error: 'Failed to fetch contract comparison' });
    }
  });

  // 📊 COMPREHENSIVE ANALYTICS API ENDPOINT
  app.post('/api/contracts/:id/analyze/comprehensive', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await createAuditLog(req, 'comprehensive_analysis', 'contract', id);
      
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      
      const text = await fileService.extractTextFromFile(contract.filePath, contract.fileType);
      
      // Run all analyses in parallel for efficiency
      const [
        financialAnalysis,
        complianceAnalysis,
        obligations,
        performanceAnalysis,
        strategicAnalysis,
        allContracts
      ] = await Promise.all([
        groqService.analyzeFinancialTerms(text),
        groqService.analyzeCompliance(text),
        groqService.extractObligations(text),
        groqService.predictPerformance(text, contract.contractType),
        groqService.analyzeStrategicValue(text, contract.contractType),
        storage.getContracts(undefined, 1000)
      ]);
      
      const comparisonAnalysis = await groqService.findSimilarContracts(text, allContracts.contracts);
      
      // Save all analyses
      const savedAnalyses = await Promise.all([
        storage.createFinancialAnalysis({
          contractId: id,
          totalValue: financialAnalysis.totalValue,
          currency: financialAnalysis.currency,
          paymentSchedule: financialAnalysis.paymentSchedule,
          royaltyStructure: financialAnalysis.royaltyStructure,
          revenueProjections: financialAnalysis.revenueProjections,
          costImpact: financialAnalysis.costImpact,
          currencyRisk: financialAnalysis.currencyRisk,
          paymentTerms: financialAnalysis.paymentTerms,
          penaltyClauses: financialAnalysis.penaltyClauses,
        }),
        
        storage.createComplianceAnalysis({
          contractId: id,
          complianceScore: complianceAnalysis.complianceScore,
          regulatoryFrameworks: complianceAnalysis.regulatoryFrameworks,
          jurisdictionAnalysis: complianceAnalysis.jurisdictionAnalysis,
          dataProtectionCompliance: complianceAnalysis.dataProtectionCompliance,
          industryStandards: complianceAnalysis.industryStandards,
          riskFactors: complianceAnalysis.riskFactors,
          recommendedActions: complianceAnalysis.recommendedActions,
        }),
        
        storage.createPerformanceMetrics({
          contractId: id,
          performanceScore: performanceAnalysis.performanceScore,
          milestoneCompletion: performanceAnalysis.milestoneCompletion,
          onTimeDelivery: performanceAnalysis.onTimeDelivery,
          budgetVariance: performanceAnalysis.budgetVariance,
          qualityScore: performanceAnalysis.qualityScore,
          clientSatisfaction: performanceAnalysis.clientSatisfaction,
          renewalProbability: performanceAnalysis.renewalProbability,
          riskFactors: performanceAnalysis.riskFactors,
          successFactors: performanceAnalysis.successFactors,
        }),
        
        storage.createStrategicAnalysis({
          contractId: id,
          strategicValue: strategicAnalysis.strategicValue,
          marketAlignment: strategicAnalysis.marketAlignment,
          competitiveAdvantage: strategicAnalysis.competitiveAdvantage,
          riskConcentration: strategicAnalysis.riskConcentration,
          standardizationScore: strategicAnalysis.standardizationScore,
          negotiationInsights: strategicAnalysis.negotiationInsights,
          benchmarkComparison: strategicAnalysis.benchmarkComparison,
          recommendations: strategicAnalysis.recommendations,
        }),
        
        storage.createContractComparison({
          contractId: id,
          similarityScore: comparisonAnalysis.similarityScore,
          clauseVariations: comparisonAnalysis.clauseVariations,
          termComparisons: comparisonAnalysis.termComparisons,
          bestPractices: comparisonAnalysis.bestPractices,
          anomalies: comparisonAnalysis.anomalies,
        })
      ]);
      
      // Save obligations
      const savedObligations = [];
      for (const obligation of obligations) {
        const obligationData = {
          contractId: id,
          obligationType: obligation.obligationType,
          description: obligation.description,
          dueDate: obligation.dueDate ? new Date(obligation.dueDate) : null,
          responsible: obligation.responsible,
          priority: obligation.priority,
          status: 'pending',
        };
        const saved = await storage.createContractObligation(obligationData);
        savedObligations.push(saved);
      }
      
      res.json({
        financial: savedAnalyses[0],
        compliance: savedAnalyses[1],
        performance: savedAnalyses[2],
        strategic: savedAnalyses[3],
        comparison: savedAnalyses[4],
        obligations: savedObligations,
        message: 'Comprehensive analysis completed successfully'
      });
      
    } catch (error) {
      console.error('Error running comprehensive analysis:', error);
      res.status(500).json({ error: 'Failed to run comprehensive analysis' });
    }
  });

  // 📊 PORTFOLIO ANALYTICS API ENDPOINT  
  app.get('/api/analytics/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      await createAuditLog(req, 'view_portfolio_analytics', 'analytics');
      
      const userId = req.query.userId || req.user.id;
      const analytics = await storage.getPortfolioAnalytics(userId === 'all' ? undefined : userId);
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching portfolio analytics:', error);
      res.status(500).json({ error: 'Failed to fetch portfolio analytics' });
    }
  });

  // 💰 FINANCIAL ANALYTICS API ENDPOINT
  app.get('/api/analytics/financial', isAuthenticated, async (req: any, res) => {
    try {
      await createAuditLog(req, 'view_financial_analytics', 'analytics');
      
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      const analytics = await storage.getFinancialAnalytics(
        canViewAll ? undefined : userId
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching financial analytics:', error);
      res.status(500).json({ error: 'Failed to fetch financial analytics' });
    }
  });

  // ⚖️ COMPLIANCE ANALYTICS API ENDPOINT
  app.get('/api/analytics/compliance', isAuthenticated, async (req: any, res) => {
    try {
      await createAuditLog(req, 'view_compliance_analytics', 'analytics');
      
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      const analytics = await storage.getComplianceAnalytics(
        canViewAll ? undefined : userId
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching compliance analytics:', error);
      res.status(500).json({ error: 'Failed to fetch compliance analytics' });
    }
  });

  // 🎯 STRATEGIC ANALYTICS API ENDPOINT
  app.get('/api/analytics/strategic', isAuthenticated, async (req: any, res) => {
    try {
      await createAuditLog(req, 'view_strategic_analytics', 'analytics');
      
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      const analytics = await storage.getStrategicAnalytics(
        canViewAll ? undefined : userId
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching strategic analytics:', error);
      res.status(500).json({ error: 'Failed to fetch strategic analytics' });
    }
  });

  // 📈 PERFORMANCE ANALYTICS API ENDPOINT
  app.get('/api/analytics/performance', isAuthenticated, async (req: any, res) => {
    try {
      await createAuditLog(req, 'view_performance_analytics', 'analytics');
      
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      const analytics = await storage.getPerformanceAnalytics(
        canViewAll ? undefined : userId
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      res.status(500).json({ error: 'Failed to fetch performance analytics' });
    }
  });

  // ⚠️ RISK ANALYTICS API ENDPOINT
  app.get('/api/analytics/risks', isAuthenticated, async (req: any, res) => {
    try {
      await createAuditLog(req, 'view_risk_analytics', 'analytics');
      
      const userId = req.user.id;
      const userRole = (await storage.getUser(userId))?.role;
      const canViewAll = userRole === 'admin' || userRole === 'owner';
      
      const analytics = await storage.getRiskAnalytics(
        canViewAll ? undefined : userId
      );
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching risk analytics:', error);
      res.status(500).json({ error: 'Failed to fetch risk analytics' });
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

// Async contract processing function with comprehensive analytics
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

    console.log('🚀 [CONTRACT-PROCESS] Starting comprehensive contract processing for ID:', contractId);
    console.log('🚀 [CONTRACT-PROCESS] Contract details:', {
      fileName: contract.fileName,
      originalName: contract.originalName,
      fileType: contract.fileType,
      filePath: contract.filePath,
      fileSize: contract.fileSize,
      contractType: contract.contractType
    });
    
    // Extract text from file
    console.log('🚀 [CONTRACT-PROCESS] Calling text extraction...');
    const text = await fileService.extractTextFromFile(contract.filePath, contract.fileType);
    
    console.log('🚀 [CONTRACT-PROCESS] ═══ TEXT EXTRACTION RESULT ═══');
    console.log('🚀 [CONTRACT-PROCESS] Extracted text length:', text.length);
    console.log('🚀 [CONTRACT-PROCESS] Text type:', typeof text);
    console.log('🚀 [CONTRACT-PROCESS] First 400 characters:');
    console.log(text.substring(0, 400));
    console.log('🚀 [CONTRACT-PROCESS] Last 200 characters:');
    console.log(text.substring(Math.max(0, text.length - 200)));
    console.log('🚀 [CONTRACT-PROCESS] ═══ END EXTRACTION RESULT ═══');
    
    // Perform comprehensive AI analysis in parallel for efficiency
    console.log('🤖 [CONTRACT-PROCESS] Starting comprehensive AI analysis...');
    
    const [
      basicAnalysis,
      financialAnalysis,
      complianceAnalysis,
      strategicAnalysis,
      performanceAnalysis,
      riskAnalysis,
      obligations,
      comparisonAnalysis
    ] = await Promise.all([
      // Basic contract analysis
      groqService.analyzeContract(text),
      
      // Specialized analyses
      groqService.analyzeFinancialTerms(text),
      groqService.analyzeCompliance(text),
      groqService.analyzeStrategicValue(text, contract.contractType || 'unknown'),
      groqService.predictPerformance(text, contract.contractType || 'unknown'),
      groqService.analyzeRiskFactors(text, contract.contractType || 'unknown'),
      groqService.extractContractObligations(text),
      groqService.analyzeContractComparison(text, contract.contractType || 'unknown', 'general')
    ]);
    
    console.log('🤖 [CONTRACT-PROCESS] All AI analyses completed');
    console.log('🤖 [CONTRACT-PROCESS] Analysis results:', {
      basicAnalysis: {
        summaryLength: basicAnalysis.summary.length,
        keyTermsCount: basicAnalysis.keyTerms.length,
        riskAnalysisCount: basicAnalysis.riskAnalysis.length,
        insightsCount: basicAnalysis.insights.length,
        confidence: basicAnalysis.confidence
      },
      financialAnalysis: { totalValue: financialAnalysis.totalValue, currency: financialAnalysis.currency },
      complianceAnalysis: { complianceScore: complianceAnalysis.complianceScore },
      strategicAnalysis: { strategicValue: strategicAnalysis.strategicValue },
      performanceAnalysis: { performanceScore: performanceAnalysis.performanceScore },
      riskAnalysis: { overallRiskScore: riskAnalysis.overallRiskScore },
      obligationsCount: obligations.length,
      comparisonAnalysis: { similarityScore: comparisonAnalysis.similarityScore }
    });

    // Save all analyses to database in parallel
    console.log('💾 [CONTRACT-PROCESS] Saving all analyses to database...');
    
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    
    // Prepare all data for database insertion
    const basicAnalysisData = {
      contractId,
      summary: basicAnalysis.summary,
      keyTerms: basicAnalysis.keyTerms,
      riskAnalysis: basicAnalysis.riskAnalysis,
      insights: basicAnalysis.insights,
      confidence: basicAnalysis.confidence.toString(),
      processingTime,
    };

    const financialData = {
      contractId,
      totalValue: financialAnalysis.totalValue ? financialAnalysis.totalValue.toString() : null,
      currency: financialAnalysis.currency || 'USD',
      paymentSchedule: financialAnalysis.paymentSchedule || [],
      royaltyStructure: financialAnalysis.royaltyStructure || [],
      revenueProjections: financialAnalysis.revenueProjections || [],
      costImpact: financialAnalysis.costImpact || [],
      currencyRisk: financialAnalysis.currencyRisk ? financialAnalysis.currencyRisk.toString() : null,
      paymentTerms: financialAnalysis.paymentTerms || null,
      penaltyClauses: financialAnalysis.penaltyClauses || [],
    };

    const complianceData = {
      contractId,
      complianceScore: complianceAnalysis.complianceScore ? complianceAnalysis.complianceScore.toString() : null,
      regulatoryFrameworks: complianceAnalysis.regulatoryFrameworks || [],
      jurisdictionAnalysis: complianceAnalysis.jurisdictionAnalysis || {},
      dataProtectionCompliance: complianceAnalysis.dataProtectionCompliance || false,
      industryStandards: complianceAnalysis.industryStandards || [],
      riskFactors: complianceAnalysis.riskFactors || [],
      recommendedActions: complianceAnalysis.recommendedActions || [],
    };

    const strategicData = {
      contractId,
      strategicValue: strategicAnalysis.strategicValue ? strategicAnalysis.strategicValue.toString() : null,
      marketAlignment: strategicAnalysis.marketAlignment ? strategicAnalysis.marketAlignment.toString() : null,
      competitiveAdvantage: strategicAnalysis.competitiveAdvantage || [],
      riskConcentration: strategicAnalysis.riskConcentration ? strategicAnalysis.riskConcentration.toString() : null,
      standardizationScore: strategicAnalysis.standardizationScore ? strategicAnalysis.standardizationScore.toString() : null,
      negotiationInsights: strategicAnalysis.negotiationInsights || [],
      benchmarkComparison: strategicAnalysis.benchmarkComparison || {},
      recommendations: strategicAnalysis.recommendations || [],
    };

    const performanceData = {
      contractId,
      performanceScore: performanceAnalysis.performanceScore ? performanceAnalysis.performanceScore.toString() : null,
      milestoneCompletion: performanceAnalysis.milestoneCompletion ? performanceAnalysis.milestoneCompletion.toString() : null,
      onTimeDelivery: performanceAnalysis.onTimeDelivery || false,
      budgetVariance: performanceAnalysis.budgetVariance ? performanceAnalysis.budgetVariance.toString() : null,
      qualityScore: performanceAnalysis.qualityScore ? performanceAnalysis.qualityScore.toString() : null,
      clientSatisfaction: performanceAnalysis.clientSatisfaction ? performanceAnalysis.clientSatisfaction.toString() : null,
      renewalProbability: performanceAnalysis.renewalProbability ? performanceAnalysis.renewalProbability.toString() : null,
    };

    const comparisonData = {
      contractId,
      similarContracts: [], // Would be populated with actual similar contract IDs in production
      clauseVariations: comparisonAnalysis.clauseVariations || [],
      termComparisons: comparisonAnalysis.termComparisons || [],
      bestPractices: comparisonAnalysis.bestPractices || [],
      anomalies: comparisonAnalysis.anomalies || [],
    };

    // Save all analyses in parallel for performance
    const [savedBasicAnalysis, savedFinancial, savedCompliance, savedStrategic, savedPerformance, savedComparison] = await Promise.all([
      storage.createContractAnalysis(basicAnalysisData),
      storage.createFinancialAnalysis(financialData),
      storage.createComplianceAnalysis(complianceData),
      storage.createStrategicAnalysis(strategicData),
      storage.createPerformanceMetrics(performanceData),
      storage.createContractComparison(comparisonData),
    ]);

    // Save contract obligations separately (sequential to handle potential duplicates)
    console.log('💾 [CONTRACT-PROCESS] Saving contract obligations...');
    const savedObligations = [];
    for (const obligation of obligations) {
      try {
        const obligationData = {
          contractId,
          obligationType: obligation.obligationType,
          description: obligation.description,
          dueDate: obligation.dueDate ? new Date(obligation.dueDate) : null,
          responsible: obligation.responsible,
          priority: obligation.priority,
          status: 'pending',
        };
        const saved = await storage.createContractObligation(obligationData);
        savedObligations.push(saved);
      } catch (obligationError) {
        console.error('Error saving obligation:', obligation, obligationError);
      }
    }
    
    // Update contract status to analyzed
    await storage.updateContractStatus(contractId, 'analyzed', processingTime);
    
    console.log(`✅ [CONTRACT-PROCESS] Contract ${contractId} processed successfully with comprehensive analytics`);
    console.log('📊 [CONTRACT-PROCESS] Saved analyses:', {
      basicAnalysisId: savedBasicAnalysis.id,
      financialAnalysisId: savedFinancial.id,
      complianceAnalysisId: savedCompliance.id,
      strategicAnalysisId: savedStrategic.id,
      performanceAnalysisId: savedPerformance.id,
      comparisonAnalysisId: savedComparison.id,
      obligationsCount: savedObligations.length,
      totalProcessingTime: processingTime
    });
    
  } catch (error) {
    console.error(`❌ [CONTRACT-PROCESS] Error processing contract ${contractId}:`, error);
    
    // Update status to failed
    try {
      await storage.updateContractStatus(contractId, 'failed');
    } catch (updateError) {
      console.error('Error updating contract status to failed:', updateError);
    }
  }
}
