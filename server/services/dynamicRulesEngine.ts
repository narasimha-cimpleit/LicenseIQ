import { db } from '../db';
import { royaltyRules, salesData } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { FormulaInterpreter } from './formulaInterpreter';
import type { FormulaDefinition } from '@shared/formula-types';

interface VolumeTier {
  min: number;
  max: number | null;
  rate: number;
}

interface SeasonalAdjustments {
  [season: string]: number;
}

interface TerritoryPremiums {
  [territory: string]: number;
}

interface SaleItem {
  id: string;
  productName: string;
  category: string;
  territory: string;
  quantity: number;
  transactionDate: Date;
  grossAmount: number;
}

interface RoyaltyBreakdownItem {
  saleId: string;
  productName: string;
  category: string;
  territory: string;
  quantity: number;
  ruleApplied: string;
  baseRate: number;
  tierRate: number;
  seasonalMultiplier: number;
  territoryMultiplier: number;
  calculatedRoyalty: number;
  explanation: string;
}

interface CalculationResult {
  totalRoyalty: number;
  breakdown: RoyaltyBreakdownItem[];
  minimumGuarantee: number | null;
  finalRoyalty: number;
  rulesApplied: string[];
}

export class DynamicRulesEngine {
  async calculateRoyalty(contractId: string, salesItems: SaleItem[]): Promise<CalculationResult> {
    console.log(`🧮 Starting dynamic royalty calculation for contract: ${contractId}`);
    console.log(`📊 Processing ${salesItems.length} sales items`);

    const rules = await db
      .select()
      .from(royaltyRules)
      .where(and(
        eq(royaltyRules.contractId, contractId),
        eq(royaltyRules.isActive, true)
      ))
      .orderBy(royaltyRules.priority);

    console.log(`📋 Loaded ${rules.length} active rules`);

    const breakdown: RoyaltyBreakdownItem[] = [];
    let totalRoyalty = 0;
    let minimumGuarantee: number | null = null;
    const rulesApplied = new Set<string>();

    // Accept ANY royalty/payment rule type (AI returns various types like 'tiered', 'percentage', etc.)
    const validRuleTypes = ['tiered', 'tiered_pricing', 'formula_based', 'percentage', 'minimum_guarantee', 
                            'cap', 'fixed_fee', 'fixed_price', 'variable_price', 'per_seat', 'per_unit', 
                            'per_time_period', 'volume_discount', 'license_scope', 'usage_based'];
    const tierRules = rules.filter(r => validRuleTypes.includes(r.ruleType) && r.ruleType !== 'minimum_guarantee');
    const minimumRule = rules.find(r => r.ruleType === 'minimum_guarantee');

    if (minimumRule && minimumRule.minimumGuarantee) {
      minimumGuarantee = parseFloat(minimumRule.minimumGuarantee);
    }

    for (const sale of salesItems) {
      const matchingRule = this.findMatchingRule(sale, tierRules);
      
      if (matchingRule) {
        const calculation = this.calculateSaleRoyalty(sale, matchingRule);
        
        // 🛡️ SAFETY GUARD: Prevent royalties from exceeding sales amounts
        if (calculation.calculatedRoyalty > sale.grossAmount * 1.01) { // Allow 1% tolerance for rounding
          const errorMsg = `FORMULA ERROR: Royalty ($${calculation.calculatedRoyalty.toFixed(2)}) exceeds sale amount ($${sale.grossAmount.toFixed(2)}) for ${sale.productName}. Rule: ${matchingRule.ruleName}. This indicates incorrect tier rates or formula structure.`;
          console.error(`🚨 ${errorMsg}`);
          throw new Error(errorMsg); // Hard error - forces user to fix formula instead of silently capping
        }
        
        breakdown.push(calculation);
        totalRoyalty += calculation.calculatedRoyalty;
        rulesApplied.add(matchingRule.ruleName);
      } else {
        console.warn(`⚠️ No matching rule for sale: ${sale.productName} (${sale.category})`);
      }
    }

    const finalRoyalty = minimumGuarantee 
      ? Math.max(totalRoyalty, minimumGuarantee)
      : totalRoyalty;

    console.log(`💰 Calculated royalty: $${totalRoyalty.toFixed(2)}`);
    if (minimumGuarantee) {
      console.log(`🔒 Minimum guarantee: $${minimumGuarantee.toFixed(2)}`);
      console.log(`✅ Final royalty (with minimum): $${finalRoyalty.toFixed(2)}`);
    }

    return {
      totalRoyalty,
      breakdown,
      minimumGuarantee,
      finalRoyalty,
      rulesApplied: Array.from(rulesApplied)
    };
  }

  private findMatchingRule(sale: SaleItem, rules: any[]): any | null {
    for (const rule of rules) {
      if (this.ruleMatchesSale(sale, rule)) {
        return rule;
      }
    }
    return null;
  }

  private ruleMatchesSale(sale: SaleItem, rule: any): boolean {
    if (rule.productCategories && rule.productCategories.length > 0) {
      const categoryMatch = rule.productCategories.some((cat: string) => {
        const catLower = cat.toLowerCase().trim();
        const saleCategoryLower = (sale.category?.toLowerCase() || '').trim();
        const saleProductLower = (sale.productName?.toLowerCase() || '').trim();
        
        // Guard: require rule category to be non-empty
        if (!catLower) {
          return false;
        }
        
        // PRIORITY 1: Product name exact matching (AI often stores product names in productCategories)
        if (saleProductLower && (saleProductLower.includes(catLower) || catLower.includes(saleProductLower))) {
          return true;
        }
        
        // PRIORITY 2: Category matching (for generic rules)
        if (saleCategoryLower) {
          return this.categoriesMatch(saleCategoryLower, catLower);
        }
        
        return false;
      });
      if (!categoryMatch) return false;
    }

    if (rule.territories && rule.territories.length > 0 && !rule.territories.includes('All')) {
      const saleTerritory = (sale.territory || '').toLowerCase().trim();
      
      // Skip territory check for abstract/generic territory names commonly used in sales data
      const abstractTerritories = ['primary', 'secondary', 'tertiary', 'domestic', 'international', 'north', 'south', 'east', 'west'];
      const isAbstractTerritory = saleTerritory.length > 0 && abstractTerritories.some(abs => saleTerritory === abs);
      
      if (!isAbstractTerritory) {
        // Only enforce territory matching for specific territory names (guard against empty territory)
        const territoryMatch = saleTerritory.length > 0 && rule.territories.some((terr: string) =>
          saleTerritory.includes(terr.toLowerCase()) || terr.toLowerCase().includes(saleTerritory)
        );
        if (!territoryMatch) return false;
      }
      // If abstract territory, skip strict matching and allow product match to succeed
    }

    return true;
  }

  /**
   * Smart category matching with word-based overlap
   * Requires meaningful category words to match, not just tier/grade labels
   * Example: "Ornamental Shrubs" matches "Ornamental Trees & Shrubs" (shared: ornamental, shrubs)
   * Example: "Tier 1 Shrubs" does NOT match "Tier 1 Trees" (different product category)
   * Example: "Tier 1 Shrubs" does NOT match "Tier 2 Shrubs" (conflicting tier)
   * Example: "Shrubs" does NOT match "Tier 2 Shrubs" (tier-specific rule requires tier match)
   */
  private categoriesMatch(saleCategory: string, ruleCategory: string): boolean {
    // Word-based matching with tier/grade awareness
    const saleWords = this.extractCategoryWords(saleCategory);
    const ruleWords = this.extractCategoryWords(ruleCategory);
    
    // If either has no meaningful words, no match
    if (saleWords.length === 0 || ruleWords.length === 0) {
      return false;
    }
    
    // CHECK TIER/GRADE CONFLICTS FIRST (before any matching logic)
    const saleNumbers = saleWords.filter(word => /^\d+$/.test(word));
    const ruleNumbers = ruleWords.filter(word => /^\d+$/.test(word));
    
    // If only ONE has numbers, it's a tier mismatch (e.g., "Shrubs" vs "Tier 2 Shrubs")
    if ((saleNumbers.length > 0) !== (ruleNumbers.length > 0)) {
      return false; // One is tiered, the other isn't
    }
    
    // If BOTH have numbers, they must all match (e.g., "Tier 1" must match "Tier 1", not "Tier 2")
    if (saleNumbers.length > 0 && ruleNumbers.length > 0) {
      const numbersMatch = saleNumbers.every(num => ruleNumbers.includes(num)) &&
                          ruleNumbers.every(num => saleNumbers.includes(num));
      if (!numbersMatch) {
        return false; // Conflicting tier/grade numbers
      }
    }
    
    // Identify generic tier/grade/level words and numbers
    const genericWords = new Set(['tier', 'grade', 'level', 'class', 'type']);
    const isGenericOrNumber = (word: string) => genericWords.has(word) || /^\d+$/.test(word);
    
    // Find shared words, separating category descriptors from tier/grade labels
    const sharedWords = saleWords.filter(word => ruleWords.includes(word));
    const sharedCategoryWords = sharedWords.filter(word => !isGenericOrNumber(word));
    
    // MUST have at least 1 shared meaningful category word (not just "tier" + number)
    if (sharedCategoryWords.length === 0) {
      return false;
    }
    
    // For single-word categories (after filtering generics), require 100% match
    const saleCategoryWords = saleWords.filter(word => !isGenericOrNumber(word));
    const ruleCategoryWords = ruleWords.filter(word => !isGenericOrNumber(word));
    
    if (saleCategoryWords.length === 1 && ruleCategoryWords.length === 1) {
      return saleCategoryWords[0] === ruleCategoryWords[0];
    }
    
    // For multi-word categories, require at least 2 shared category words OR 100% of smaller
    const minCategoryWords = Math.min(saleCategoryWords.length, ruleCategoryWords.length);
    const requiredShared = Math.min(2, minCategoryWords);
    
    if (sharedCategoryWords.length < requiredShared) {
      return false;
    }
    
    return true;
  }

  /**
   * Extract meaningful words from a category string
   * Filters out ONLY stop words, keeps all other words including numbers/grades
   */
  private extractCategoryWords(category: string): string[] {
    const stopWords = new Set(['and', 'or', 'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for']);
    
    return category
      .toLowerCase()
      .split(/[\s&,/\-()]+/) // Split by space, &, comma, slash, dash, parentheses
      .map(word => word.trim())
      .filter(word => word.length > 0 && !stopWords.has(word)); // Keep all non-stop words
  }

  private calculateSaleRoyalty(sale: SaleItem, rule: any): RoyaltyBreakdownItem {
    // 🚀 NEW: Use FormulaInterpreter if formulaDefinition exists
    if (rule.formulaDefinition) {
      console.log(`🧮 [FORMULA CALC] Using FormulaInterpreter for rule: ${rule.ruleName}`);
      
      const season = this.determineSeason(sale.transactionDate);
      const interpreter = new FormulaInterpreter({ debug: true });
      
      // Build context from sale data
      const context: any = {
        units: sale.quantity,
        quantity: sale.quantity,
        season: season,
        territory: sale.territory,
        product: sale.productName,
        category: sale.category,
        salesVolume: sale.quantity.toString(), // For range-based lookups
        grossAmount: sale.grossAmount,
      };
      
      const formulaDef = rule.formulaDefinition as FormulaDefinition;
      const result = interpreter.evaluateFormula(formulaDef, context);
      
      console.log(`   ✅ Formula result: $${result.value.toFixed(2)}`);
      if (result.debugLog) {
        result.debugLog.forEach(log => console.log(`      ${log}`));
      }
      
      return {
        saleId: sale.id,
        productName: sale.productName,
        category: sale.category,
        territory: sale.territory,
        quantity: sale.quantity,
        ruleApplied: rule.ruleName,
        baseRate: 0, // Not applicable for formula-based
        tierRate: result.value / sale.quantity, // Effective rate per unit
        seasonalMultiplier: 1, // Already included in formula
        territoryMultiplier: 1, // Already included in formula
        calculatedRoyalty: result.value,
        explanation: `Formula: ${formulaDef.description || rule.ruleName} = $${result.value.toFixed(2)}`
      };
    }
    
    // 📊 LEGACY: Fall back to old calculation method
    const volumeTiers: VolumeTier[] = rule.volumeTiers || [];
    const seasonalAdj: SeasonalAdjustments = rule.seasonalAdjustments || {};
    const territoryPrem: TerritoryPremiums = rule.territoryPremiums || {};

    let tierRate = parseFloat(rule.baseRate || '0');
    
    console.log(`🔍 [LEGACY CALC] Rule: ${rule.ruleName}`);
    console.log(`   - Base Rate: ${rule.baseRate} → ${tierRate}`);
    console.log(`   - Volume Tiers: ${JSON.stringify(volumeTiers)}`);
    console.log(`   - Seasonal Adj: ${JSON.stringify(seasonalAdj)}`);
    console.log(`   - Territory Prem: ${JSON.stringify(territoryPrem)}`);
    
    if (volumeTiers.length > 0) {
      const matchingTier = volumeTiers.find((tier: VolumeTier) => {
        if (tier.max === null) {
          return sale.quantity >= tier.min;
        }
        return sale.quantity >= tier.min && sale.quantity <= tier.max;
      });
      
      if (matchingTier) {
        tierRate = matchingTier.rate;
        console.log(`   ✓ Matching tier found: ${matchingTier.min}-${matchingTier.max || '∞'} @ rate ${matchingTier.rate}`);
      }
    }

    const season = this.determineSeason(sale.transactionDate);
    const seasonalMultiplier = seasonalAdj[season] || 1.0;

    let territoryMultiplier = 1.0;
    for (const [terr, premium] of Object.entries(territoryPrem)) {
      if (sale.territory?.toLowerCase().includes(terr.toLowerCase())) {
        territoryMultiplier = premium;
        break;
      }
    }

    // ⚠️ CRITICAL FIX: Legacy rules must use percentage-based calculation to match formula interpreter
    // ALL rates stored as percentages (25 = 25%, NOT $25 per unit) - consistent with FormulaInterpreter
    const rateAsDecimal = tierRate / 100; // Convert percentage to decimal (e.g., 25% → 0.25)
    const calculatedRoyalty = sale.grossAmount * rateAsDecimal * seasonalMultiplier * territoryMultiplier;
    
    console.log(`   💰 Calculation: $${sale.grossAmount} × ${tierRate}% × ${seasonalMultiplier} seasonal × ${territoryMultiplier} territory = $${calculatedRoyalty.toFixed(2)}`);

    const explanation = this.buildExplanation(
      sale.quantity,
      tierRate,
      seasonalMultiplier,
      territoryMultiplier,
      season,
      sale.territory
    );

    return {
      saleId: sale.id,
      productName: sale.productName,
      category: sale.category,
      territory: sale.territory,
      quantity: sale.quantity,
      ruleApplied: rule.ruleName,
      baseRate: parseFloat(rule.baseRate || '0'),
      tierRate,
      seasonalMultiplier,
      territoryMultiplier,
      calculatedRoyalty,
      explanation
    };
  }

  private determineSeason(date: Date): string {
    const month = date.getMonth();
    
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    if (month === 11 || month === 0) return 'Holiday';
    return 'Winter';
  }

  private buildExplanation(
    quantity: number,
    tierRate: number,
    seasonal: number,
    territory: number,
    season: string,
    territoryName: string
  ): string {
    // Updated to reflect percentage-based calculation (consistent with formula interpreter)
    const parts = [`${tierRate}% of gross sales`];
    
    if (seasonal !== 1.0) {
      parts.push(`× ${seasonal.toFixed(2)} (${season})`);
    }
    
    if (territory !== 1.0) {
      parts.push(`× ${territory.toFixed(2)} (${territoryName})`);
    }
    
    return parts.join(' ');
  }
}

export const dynamicRulesEngine = new DynamicRulesEngine();
