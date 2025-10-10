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

    const tierRules = rules.filter(r => r.ruleType === 'tiered_pricing' || r.ruleType === 'formula_based');
    const minimumRule = rules.find(r => r.ruleType === 'minimum_guarantee');

    if (minimumRule && minimumRule.minimumGuarantee) {
      minimumGuarantee = parseFloat(minimumRule.minimumGuarantee);
    }

    for (const sale of salesItems) {
      const matchingRule = this.findMatchingRule(sale, tierRules);
      
      if (matchingRule) {
        const calculation = this.calculateSaleRoyalty(sale, matchingRule);
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
        const catLower = cat.toLowerCase();
        const saleCategoryLower = sale.category?.toLowerCase() || '';
        const saleProductLower = sale.productName?.toLowerCase() || '';
        
        // Bidirectional match: check both directions
        return saleCategoryLower.includes(catLower) || 
               catLower.includes(saleCategoryLower) ||
               saleProductLower.includes(catLower);
      });
      if (!categoryMatch) return false;
    }

    if (rule.territories && rule.territories.length > 0 && !rule.territories.includes('All')) {
      const territoryMatch = rule.territories.some((terr: string) =>
        sale.territory?.toLowerCase().includes(terr.toLowerCase())
      );
      if (!territoryMatch) return false;
    }

    return true;
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

    const calculatedRoyalty = sale.quantity * tierRate * seasonalMultiplier * territoryMultiplier;
    
    console.log(`   💰 Calculation: ${sale.quantity} qty × ${tierRate} rate × ${seasonalMultiplier} seasonal × ${territoryMultiplier} territory = $${calculatedRoyalty.toFixed(2)}`);

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
    const parts = [`${quantity} units × $${tierRate.toFixed(2)}`];
    
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
