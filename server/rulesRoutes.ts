import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { RulesEngine } from "./services/rulesEngine";
import type { RoyaltyCalculationInput } from "./services/rulesEngine";

// Audit logging function
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

export function registerRulesRoutes(app: Express): void {
  // =====================================================
  // RULES ENGINE API ENDPOINTS
  // =====================================================

  // Get royalty rules for a contract
  app.get('/api/contracts/:id/rules', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;

      // Get contract to check permissions
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      const userRole = (await storage.getUser(userId))?.role;
      const canViewAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canViewAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get royalty rules from database
      const rules = await storage.getRoyaltyRulesByContract(contractId);
      
      console.log(`📋 [RULES API] Returning ${rules.length} rules for contract ${contractId}`);
      
      // Format response
      res.json({
        rules,
        total: rules.length
      });
    } catch (error) {
      console.error('Error fetching rules:', error);
      res.status(500).json({ message: 'Failed to fetch rules' });
    }
  });

  // Delete a royalty rule
  app.delete('/api/contracts/:contractId/rules/:ruleId', isAuthenticated, async (req: any, res) => {
    try {
      const { contractId, ruleId } = req.params;
      const userId = req.user.id;

      // Check permissions
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      const userRole = (await storage.getUser(userId))?.role;
      const canEditAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canEditAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete the rule
      await storage.deleteRoyaltyRule(ruleId);

      // Log the deletion
      await createAuditLog(req, 'rule_deleted', 'royalty_rule', ruleId, {
        contractId
      });

      res.json({ message: 'Rule deleted successfully' });
    } catch (error) {
      console.error('Error deleting rule:', error);
      res.status(500).json({ message: 'Failed to delete rule' });
    }
  });

  // Create a new royalty rule
  app.post('/api/contracts/:contractId/rules', isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.id;
      const ruleData = req.body;

      // Check permissions
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      const userRole = (await storage.getUser(userId))?.role;
      const canEditAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canEditAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Create the rule
      const newRule = await storage.createRoyaltyRule({
        ...ruleData,
        contractId
      });

      // Log the creation
      await createAuditLog(req, 'rule_created', 'royalty_rule', newRule.id, {
        contractId,
        ruleName: ruleData.ruleName
      });

      res.json({ message: 'Rule created successfully', rule: newRule });
    } catch (error) {
      console.error('Error creating rule:', error);
      res.status(500).json({ message: 'Failed to create rule' });
    }
  });

  // Update a royalty rule
  app.patch('/api/contracts/:contractId/rules/:ruleId', isAuthenticated, async (req: any, res) => {
    try {
      const { contractId, ruleId } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Check permissions
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      const userRole = (await storage.getUser(userId))?.role;
      const canEditAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canEditAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Update the rule
      await storage.updateRoyaltyRule(ruleId, updates);

      // Log the update
      await createAuditLog(req, 'rule_updated', 'royalty_rule', ruleId, {
        contractId,
        updates
      });

      res.json({ message: 'Rule updated successfully' });
    } catch (error) {
      console.error('Error updating rule:', error);
      res.status(500).json({ message: 'Failed to update rule' });
    }
  });

  // Update a specific rule within a rule set
  app.put('/api/contracts/:contractId/rules/:ruleSetId/rule/:ruleIndex', isAuthenticated, async (req: any, res) => {
    try {
      const { contractId, ruleSetId, ruleIndex } = req.params;
      const userId = req.user.id;
      const updatedRule = req.body;
      const index = parseInt(ruleIndex);

      // Check permissions
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      const userRole = (await storage.getUser(userId))?.role;
      const canEditAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canEditAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get the rule set
      const ruleSet = await storage.getLicenseRuleSet(ruleSetId);
      if (!ruleSet || ruleSet.contractId !== contractId) {
        return res.status(404).json({ message: 'Rule set not found' });
      }

      // Get current rules
      const rulesDsl = ruleSet.rulesDsl as any;
      const rules = rulesDsl?.rules || [];
      if (index < 0 || index >= rules.length) {
        return res.status(400).json({ message: 'Invalid rule index' });
      }

      // Update the rule
      rules[index] = {
        ...rules[index],
        ...updatedRule,
        id: rules[index].id, // Preserve the ID
      };

      const updatedRulesDsl = {
        ...rulesDsl,
        rules
      };

      await storage.updateLicenseRuleSet(ruleSetId, {
        rulesDsl: updatedRulesDsl
      } as any);

      // Log the update
      await createAuditLog(req, 'rule_updated', 'license_rule', ruleSetId, {
        ruleIndex: index,
        ruleName: updatedRule.ruleName
      });

      res.json({ message: 'Rule updated successfully', rule: rules[index] });
    } catch (error) {
      console.error('Error updating rule:', error);
      res.status(500).json({ message: 'Failed to update rule' });
    }
  });

  // Add a new rule to a rule set
  app.post('/api/contracts/:contractId/rules/:ruleSetId/rule', isAuthenticated, async (req: any, res) => {
    try {
      const { contractId, ruleSetId } = req.params;
      const userId = req.user.id;
      const newRule = req.body;

      // Check permissions
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      const userRole = (await storage.getUser(userId))?.role;
      const canEditAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canEditAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get the rule set
      const ruleSet = await storage.getLicenseRuleSet(ruleSetId);
      if (!ruleSet || ruleSet.contractId !== contractId) {
        return res.status(404).json({ message: 'Rule set not found' });
      }

      // Add the new rule
      const rulesDsl = ruleSet.rulesDsl as any;
      const rules = rulesDsl?.rules || [];
      const ruleWithId = {
        ...newRule,
        id: crypto.randomUUID(),
        priority: newRule.priority || rules.length + 1
      };
      
      rules.push(ruleWithId);

      const updatedRulesDsl = {
        ...rulesDsl,
        rules
      };

      await storage.updateLicenseRuleSet(ruleSetId, {
        rulesDsl: updatedRulesDsl
      } as any);

      // Log the addition
      await createAuditLog(req, 'rule_added', 'license_rule', ruleSetId, {
        ruleName: newRule.ruleName
      });

      res.json({ message: 'Rule added successfully', rule: ruleWithId });
    } catch (error) {
      console.error('Error adding rule:', error);
      res.status(500).json({ message: 'Failed to add rule' });
    }
  });

  // Delete a rule from a rule set
  app.delete('/api/contracts/:contractId/rules/:ruleSetId/rule/:ruleIndex', isAuthenticated, async (req: any, res) => {
    try {
      const { contractId, ruleSetId, ruleIndex } = req.params;
      const userId = req.user.id;
      const index = parseInt(ruleIndex);

      // Check permissions
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      const userRole = (await storage.getUser(userId))?.role;
      const canEditAny = userRole === 'admin' || userRole === 'owner';
      
      if (!canEditAny && contract.uploadedBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get the rule set
      const ruleSet = await storage.getLicenseRuleSet(ruleSetId);
      if (!ruleSet || ruleSet.contractId !== contractId) {
        return res.status(404).json({ message: 'Rule set not found' });
      }

      // Get current rules
      const rulesDsl = ruleSet.rulesDsl as any;
      const rules = rulesDsl?.rules || [];
      if (index < 0 || index >= rules.length) {
        return res.status(400).json({ message: 'Invalid rule index' });
      }

      // Remove the rule
      const deletedRule = rules.splice(index, 1)[0];

      const updatedRulesDsl = {
        ...rulesDsl,
        rules
      };

      await storage.updateLicenseRuleSet(ruleSetId, {
        rulesDsl: updatedRulesDsl
      } as any);

      // Log the deletion
      await createAuditLog(req, 'rule_deleted', 'license_rule', ruleSetId, {
        ruleIndex: index,
        ruleName: deletedRule.ruleName
      });

      res.json({ message: 'Rule deleted successfully' });
    } catch (error) {
      console.error('Error deleting rule:', error);
      res.status(500).json({ message: 'Failed to delete rule' });
    }
  });

  // Calculate royalties using the rules engine
  // NOTE: This route is disabled because it conflicts with the working route in routes.ts
  // and uses non-existent storage.getLicenseRuleSetsByContract() function
  // app.post('/api/contracts/:contractId/calculate-royalties', isAuthenticated, async (req: any, res) => {
  //   try {
  //     const contractId = req.params.contractId;
  //     const userId = req.user.id;
  //     const calculationInput: RoyaltyCalculationInput = req.body;

  //     // Check permissions
  //     const contract = await storage.getContract(contractId);
  //     if (!contract) {
  //       return res.status(404).json({ message: 'Contract not found' });
  //     }

  //     const userRole = (await storage.getUser(userId))?.role;
  //     const canViewAny = userRole === 'admin' || userRole === 'owner';
      
  //     if (!canViewAny && contract.uploadedBy !== userId) {
  //       return res.status(403).json({ message: 'Access denied' });
  //     }

  //     // Get rule sets for this contract
  //     const ruleSets = await storage.getLicenseRuleSetsByContract(contractId);
      
  //     if (ruleSets.length === 0) {
  //       return res.status(404).json({ message: 'No rules found for this contract' });
  //     }

  //     // Convert rule sets to RoyaltyRule format for the engine
  //     const allRules = ruleSets.flatMap(ruleSet => {
  //       const rulesDsl = ruleSet.rulesDsl as any;
  //       return (rulesDsl?.rules || []).map((rule: any) => ({
  //         id: rule.id || crypto.randomUUID(),
  //         ruleName: rule.ruleName || rule.description || 'Unnamed Rule',
  //         ruleType: rule.ruleType || 'percentage',
  //         description: rule.description || '',
  //         conditions: rule.conditions || {},
  //         calculation: rule.calculation || {},
  //         priority: rule.priority || 10,
  //         isActive: true,
  //         confidence: rule.confidence || 1.0
  //       }));
  //     });

  //     // Calculate royalties using the rules engine
  //     const result = await RulesEngine.calculateRoyalties(allRules, calculationInput);

  //     // Log the calculation
  //     await createAuditLog(req, 'royalty_calculated', 'contract', contractId, {
  //       inputData: calculationInput,
  //       totalRoyalty: result.totalRoyalty,
  //       rulesApplied: result.metadata.rulesApplied
  //     });

  //     res.json(result);
  //   } catch (error) {
  //     console.error('Error calculating royalties:', error);
  //     res.status(500).json({ message: 'Failed to calculate royalties' });
  //   }
  // });
}