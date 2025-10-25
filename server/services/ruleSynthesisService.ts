import { db } from '../db';
import { ruleDefinitions } from '@shared/schema';
import { ExtractedEntity } from './zeroShotExtractionService';
import { GroqService } from './groqService';

/**
 * Rule Synthesis Service
 * 
 * Dynamically generates FormulaNode expression trees from contract entities.
 * Handles ANY royalty structure - percentages, fixed fees, tiers, hybrids, seasonal, etc.
 */

// Create a reusable Groq instance
const groqService = new GroqService();

// Helper function to call Groq with simple interface
async function callGroq(prompt: string, options: { temperature?: number; maxTokens?: number } = {}): Promise<string> {
  const messages = [
    { role: 'system' as const, content: 'You are a royalty calculation expert. Always respond with valid JSON.' },
    { role: 'user' as const, content: prompt }
  ];
  
  const response = await (groqService as any).makeRequest(messages, options.temperature || 0.1, options.maxTokens || 2000);
  return response;
}

export interface FormulaNode {
  type: string; // 'percentage', 'fixed', 'tier', 'conditional', 'arithmetic', etc.
  [key: string]: any; // Flexible properties based on type
}

export interface SynthesizedRule {
  id?: string;
  ruleType: string;
  ruleName: string;
  description: string;
  formulaDefinition: FormulaNode;
  applicabilityFilters: Record<string, any>;
  confidence: number;
  linkedNodeId?: string;
}

export interface RuleSynthesisResult {
  rules: SynthesizedRule[];
  lowConfidenceRules: SynthesizedRule[];
  averageConfidence: number;
}

const CONFIDENCE_THRESHOLD = 0.70;

/**
 * Synthesize royalty rules from extracted entities
 */
export async function synthesizeRules(
  entities: ExtractedEntity[],
  graphNodes: any[],
  contractId: string,
  runId: string
): Promise<RuleSynthesisResult> {
  console.log(`[RuleSynthesis] Synthesizing rules from ${entities.length} entities`);

  // Find royalty-related entities
  const royaltyEntities = entities.filter(e => 
    e.type.toLowerCase().includes('royalty') ||
    e.type.toLowerCase().includes('payment') ||
    e.type.toLowerCase().includes('fee') ||
    (e.properties.rate !== undefined) ||
    (e.properties.percentage !== undefined)
  );

  console.log(`[RuleSynthesis] Found ${royaltyEntities.length} royalty-related entities`);

  if (royaltyEntities.length === 0) {
    // Try to synthesize from context
    return await synthesizeRulesFromContext(entities, graphNodes, contractId, runId);
  }

  const rules: SynthesizedRule[] = [];
  const lowConfidenceRules: SynthesizedRule[] = [];

  for (const entity of royaltyEntities) {
    try {
      const synthesizedRule = await synthesizeRuleFromEntity(entity, graphNodes);
      
      if (synthesizedRule) {
        // Insert into database
        const [dbRule] = await db.insert(ruleDefinitions).values({
          contractId,
          extractionRunId: runId,
          linkedGraphNodeId: synthesizedRule.linkedNodeId,
          ruleType: synthesizedRule.ruleType,
          ruleName: synthesizedRule.ruleName,
          description: synthesizedRule.description,
          formulaDefinition: synthesizedRule.formulaDefinition,
          applicabilityFilters: synthesizedRule.applicabilityFilters,
          confidence: synthesizedRule.confidence.toFixed(2),
          validationStatus: synthesizedRule.confidence >= CONFIDENCE_THRESHOLD ? 'validated' : 'pending',
          isActive: synthesizedRule.confidence >= CONFIDENCE_THRESHOLD,
        }).returning();

        synthesizedRule.id = dbRule.id;
        rules.push(synthesizedRule);

        if (synthesizedRule.confidence < CONFIDENCE_THRESHOLD) {
          lowConfidenceRules.push(synthesizedRule);
        }
      }

    } catch (error) {
      console.error(`[RuleSynthesis] Failed to synthesize rule from entity ${entity.label}:`, error);
    }
  }

  const averageConfidence = rules.length > 0
    ? rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length
    : 0;

  console.log(`[RuleSynthesis] ✓ Synthesized ${rules.length} rules`);
  console.log(`[RuleSynthesis] Average confidence: ${(averageConfidence * 100).toFixed(1)}%`);

  return { rules, lowConfidenceRules, averageConfidence };
}

/**
 * Synthesize a single rule from an entity using LLM
 */
async function synthesizeRuleFromEntity(
  entity: ExtractedEntity,
  graphNodes: any[]
): Promise<SynthesizedRule | null> {
  const prompt = `You are a royalty calculation expert. Convert this extracted entity into a FormulaNode expression tree.

ENTITY:
${JSON.stringify(entity, null, 2)}

AVAILABLE FORMULA NODE TYPES:
- percentage: { type: "percentage", rate: 0.15, base: "netSales" }
- fixed: { type: "fixed", amount: 1000, currency: "USD" }
- tier: { type: "tier", tiers: [{ min: 0, max: 10000, rate: 0.10 }, { min: 10000, max: null, rate: 0.15 }] }
- conditional: { type: "conditional", condition: { field: "territory", operator: "equals", value: "US" }, trueFormula: {...}, falseFormula: {...} }
- arithmetic: { type: "arithmetic", operator: "+", operands: [{...}, {...}] }
- minimum: { type: "minimum", amount: 500 }
- maximum: { type: "maximum", amount: 100000 }

Create a FormulaNode tree that represents this royalty rule.

Respond with JSON:
{
  "ruleType": "inferred type (e.g., 'percentage_of_sales', 'tiered_volume', 'fixed_quarterly')",
  "ruleName": "descriptive name",
  "description": "what this rule does",
  "formulaDefinition": { FormulaNode tree },
  "applicabilityFilters": { "product": "...", "territory": "...", etc. },
  "confidence": 0.85
}`;

  try {
    const response = await callGroq(prompt, { temperature: 0.1, maxTokens: 1500 });
    
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.match(/```\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : response;
    const result = JSON.parse(jsonText);

    // Find linked graph node
    const linkedNode = graphNodes.find(n => n.label === entity.label);

    return {
      ruleType: result.ruleType,
      ruleName: result.ruleName,
      description: result.description,
      formulaDefinition: result.formulaDefinition,
      applicabilityFilters: result.applicabilityFilters || {},
      confidence: parseFloat(result.confidence) || entity.confidence,
      linkedNodeId: linkedNode?.id,
    };

  } catch (error) {
    console.error(`[RuleSynthesis] LLM synthesis failed for ${entity.label}:`, error);
    return null;
  }
}

/**
 * Fallback: Synthesize rules from general context when no explicit royalty entities found
 */
async function synthesizeRulesFromContext(
  entities: ExtractedEntity[],
  graphNodes: any[],
  contractId: string,
  runId: string
): Promise<RuleSynthesisResult> {
  console.log(`[RuleSynthesis] No explicit royalty entities found, analyzing context...`);

  const contextPrompt = `Based on these contract entities, infer likely royalty rules.

ENTITIES:
${JSON.stringify(entities.slice(0, 20), null, 2)}

Even if no explicit royalty clauses are mentioned, infer reasonable rules based on:
- Contract type
- Payment terms mentioned
- Product/service pricing
- Industry standards

Respond with JSON array of rules (may be empty if truly no royalty structure):
[
  {
    "ruleType": "...",
    "ruleName": "...",
    "description": "...",
    "formulaDefinition": {...},
    "applicabilityFilters": {},
    "confidence": 0.5
  }
]`;

  try {
    const response = await callGroq(contextPrompt, { temperature: 0.2, maxTokens: 2000 });
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.match(/```\s*([\s\S]*?)\s*```/) ||
                     response.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
    const inferredRules = JSON.parse(jsonText);

    const rules: SynthesizedRule[] = [];
    const lowConfidenceRules: SynthesizedRule[] = [];

    for (const rule of inferredRules) {
      const [dbRule] = await db.insert(ruleDefinitions).values({
        contractId,
        extractionRunId: runId,
        ruleType: rule.ruleType,
        ruleName: rule.ruleName,
        description: rule.description,
        formulaDefinition: rule.formulaDefinition,
        applicabilityFilters: rule.applicabilityFilters || {},
        confidence: (parseFloat(rule.confidence) * 0.8).toFixed(2), // Reduce confidence for inferred rules
        validationStatus: 'pending',
        isActive: false,
      }).returning();

      const synthesizedRule: SynthesizedRule = {
        id: dbRule.id,
        ...rule,
        confidence: parseFloat(rule.confidence) * 0.8,
      };

      rules.push(synthesizedRule);
      lowConfidenceRules.push(synthesizedRule); // All inferred rules need review
    }

    return {
      rules,
      lowConfidenceRules,
      averageConfidence: rules.length > 0
        ? rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length
        : 0,
    };

  } catch (error) {
    console.error('[RuleSynthesis] Context-based synthesis failed:', error);
    return { rules: [], lowConfidenceRules: [], averageConfidence: 0 };
  }
}
