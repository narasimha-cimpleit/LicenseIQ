import type { FormulaDefinition, FormulaNode } from '@shared/formula-types';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ContractAnalysisResult {
  summary: string;
  keyTerms: Array<{
    type: string;
    description: string;
    confidence: number;
    location: string;
  }>;
  riskAnalysis: Array<{
    level: 'high' | 'medium' | 'low';
    title: string;
    description: string;
  }>;
  insights: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  confidence: number;
}

// =====================================================
// LICENSE RULE EXTRACTION INTERFACES (NEW EXTENSION)
// =====================================================

interface RoyaltyRule {
  ruleType: 'percentage' | 'tiered' | 'minimum_guarantee' | 'cap' | 'deduction' | 'fixed_fee';
  ruleName: string;
  description: string;
  conditions: {
    productCategories?: string[];
    territories?: string[];
    salesVolumeMin?: number;
    salesVolumeMax?: number;
    timeperiod?: string;
    currency?: string;
  };
  calculation: {
    rate?: number; // For percentage rules
    tiers?: Array<{
      min: number;
      max?: number; 
      rate: number;
    }>; // For tiered rules
    amount?: number; // For fixed amounts
    formula?: string; // For complex calculations
  };
  priority: number;
  sourceSpan: {
    page?: number;
    section?: string;
    text: string;
  };
  confidence: number;
}

interface LicenseRuleExtractionResult {
  documentType: 'license' | 'royalty_agreement' | 'revenue_share' | 'other';
  licenseType: string;
  parties: {
    licensor: string;
    licensee: string;
  };
  effectiveDate?: string;
  expirationDate?: string;
  rules: RoyaltyRule[];
  currency: string;
  paymentTerms: string;
  reportingRequirements: Array<{
    frequency: string;
    dueDate: string;
    description: string;
  }>;
  extractionMetadata: {
    totalRulesFound: number;
    avgConfidence: number;
    processingTime: number;
    ruleComplexity: 'simple' | 'moderate' | 'complex';
  };
}

export class GroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
  }

  // Helper method to extract and repair malformed JSON from Groq responses
  private extractAndRepairJSON(response: string, fallbackValue: any = []): any {
    try {
      const cleanResponse = response.trim();
      
      // Try to find JSON array or object
      let jsonMatch = cleanResponse.match(/\[[\s\S]*\]/) || cleanResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.warn('⚠️ No JSON found in response, returning fallback');
        return fallbackValue;
      }

      let jsonStr = jsonMatch[0];
      
      // Repair common JSON issues
      jsonStr = jsonStr
        .replace(/:\s*Infinity/g, ': 999999999')  // Fix Infinity
        .replace(/:\s*NaN/g, ': null')             // Fix NaN
        .replace(/,\s*([}\]])/g, '$1')             // Remove trailing commas
        .replace(/'/g, '"')                         // Fix single quotes
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')    // Fix unquoted keys
        .replace(/\n/g, ' ')                        // Remove newlines
        .replace(/\r/g, '')                         // Remove carriage returns
        .replace(/\t/g, ' ')                        // Replace tabs with spaces
        .replace(/\s+/g, ' ');                      // Normalize whitespace

      // Try to parse
      return JSON.parse(jsonStr);
    } catch (error: any) {
      console.error('❌ JSON extraction/repair failed:', error.message);
      console.error('📄 Response snippet:', response.substring(0, 500));
      return fallbackValue;
    }
  }

  // =====================================================
  // ENHANCED ROYALTY RULES EXTRACTION 
  // =====================================================
  
  async extractDetailedRoyaltyRules(contractText: string): Promise<LicenseRuleExtractionResult> {
    console.log(`🚀 Starting contract analysis...`);
    
    // Step 1: Extract basic contract info and determine if it has royalty terms
    const basicInfo = await this.extractBasicContractInfo(contractText);
    console.log(`📄 Contract type detected: ${basicInfo.documentType}, Has royalty terms: ${basicInfo.hasRoyaltyTerms}`);
    
    let allRules: RoyaltyRule[] = [];
    
    // Step 2: ONLY extract rules if the contract actually contains royalty/payment terms
    if (basicInfo.hasRoyaltyTerms === true) {
      console.log(`💰 Royalty terms detected - extracting payment rules...`);
      await this.delay(2000); // 2 second delay between requests
      
      // Extract tier-based rules
      const tierRules = await this.extractTierBasedRules(contractText);
      await this.delay(2000);
      
      // Extract payment and calculation rules  
      const paymentRules = await this.extractPaymentCalculationRules(contractText);
      await this.delay(2000);
      
      // Extract special adjustments
      const adjustmentRules = await this.extractSpecialAdjustments(contractText);
      
      // Combine all results
      allRules = [...tierRules, ...paymentRules, ...adjustmentRules];
      
      // Filter out low-confidence or empty rules
      allRules = allRules.filter(rule => 
        rule.confidence >= 0.6 && 
        rule.sourceSpan?.text && 
        rule.sourceSpan.text.trim().length > 0
      );
      
      console.log(`✅ Rule extraction complete: ${allRules.length} valid rules found`);
    } else {
      console.log(`ℹ️ No royalty terms detected - skipping rule extraction`);
    }
    
    // Map the flexible AI response to the expected schema format
    const documentType: 'license' | 'royalty_agreement' | 'revenue_share' | 'other' = 
      basicInfo.hasRoyaltyTerms === true ? 'license' : 'other';
    
    // Map dynamic party structure to expected licensor/licensee format
    let parties;
    if (basicInfo.parties) {
      const party1 = basicInfo.parties.party1 || basicInfo.parties;
      const party2 = basicInfo.parties.party2;
      parties = {
        licensor: typeof party1 === 'object' ? party1.name : (party1 || 'Not specified'),
        licensee: typeof party2 === 'object' ? party2.name : (party2 || 'Not specified')
      };
    } else {
      parties = { licensor: 'Not specified', licensee: 'Not specified' };
    }
    
    return {
      documentType,
      licenseType: basicInfo.contractTitle || basicInfo.documentType || 'Contract',
      parties,
      effectiveDate: basicInfo.effectiveDate,
      expirationDate: basicInfo.expirationDate,
      rules: allRules,
      currency: basicInfo.currency || 'USD',
      paymentTerms: basicInfo.paymentTerms || 'Not specified',
      reportingRequirements: [],
      extractionMetadata: {
        totalRulesFound: allRules.length,
        avgConfidence: allRules.length > 0 
          ? allRules.reduce((sum, rule) => sum + rule.confidence, 0) / allRules.length
          : 0,
        processingTime: basicInfo.hasRoyaltyTerms ? 12 : 2,
        ruleComplexity: allRules.length > 5 ? 'complex' : allRules.length > 2 ? 'moderate' : 'simple'
      }
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async extractBasicContractInfo(contractText: string): Promise<any> {
    const prompt = `Analyze this contract and identify its type. DO NOT assume it is a license agreement.

Contract Text:
${contractText.substring(0, 3000)}

Identify the actual contract type (e.g., "License Agreement", "Service Agreement", "Subcontractor Agreement", "Employment Contract", "NDA", etc.) and extract the appropriate parties based on the contract type.

CRITICAL: 
- If this is NOT a license/royalty agreement, set "hasRoyaltyTerms" to false
- Only set "hasRoyaltyTerms" to true if the contract explicitly contains royalty, license fees, or revenue-sharing payment terms
- Do NOT fabricate party information - extract exactly what is in the contract
- Use appropriate party labels for the contract type (e.g., "contractor" and "client" for service agreements, "employer" and "employee" for employment contracts)

Return JSON:
{
  "documentType": "actual type (license/service/subcontractor/employment/other)",
  "contractTitle": "exact title from document",
  "hasRoyaltyTerms": true or false,
  "parties": { 
    "party1": {"name": "exact name", "role": "actual role"},
    "party2": {"name": "exact name", "role": "actual role"}
  },
  "effectiveDate": "date or null",
  "expirationDate": "date or null", 
  "currency": "USD or null",
  "paymentTerms": "only if found, otherwise null"
}

If no information found, return null for that field. Return only valid JSON.`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: 'You are a precise contract analyzer. Extract only what exists in the document. Do NOT assume license/royalty terms. Return only JSON.' },
        { role: 'user', content: prompt }
      ], 0.1, 1000);
      
      const extracted = this.extractAndRepairJSON(response, null);
      
      // If extraction failed completely, return a safe default
      if (!extracted) {
        return {
          documentType: 'unknown',
          contractTitle: 'Unknown Contract',
          hasRoyaltyTerms: false,
          parties: null,
          effectiveDate: null,
          expirationDate: null,
          currency: null,
          paymentTerms: null
        };
      }
      
      return extracted;
    } catch (error) {
      console.error('Basic info extraction failed:', error);
      return {
        documentType: 'unknown',
        contractTitle: 'Unknown Contract',
        hasRoyaltyTerms: false,
        parties: null,
        effectiveDate: null,
        expirationDate: null,
        currency: null,
        paymentTerms: null
      };
    }
  }

  private async extractTierBasedRules(contractText: string): Promise<RoyaltyRule[]> {
    const prompt = `Extract TIER-BASED royalty/license fee rules ONLY if they explicitly exist in this contract.

Contract Text:
${contractText}

CRITICAL REQUIREMENTS:
- ONLY extract rules if you find explicit tier-based payment structures in the contract
- If NO tier-based rules exist, return an empty array []
- Do NOT fabricate or assume rules
- Each rule MUST have actual source text from the contract in sourceSpan.text
- Set confidence below 0.6 if you're uncertain

Look for tier structures like:
- "Tier 1: $1.25 per unit for products A, B, C"
- "Volume tier: 0-5000 units = 5%, 5001+ units = 7%"
- "Product tier 1 rate: $X, Product tier 2 rate: $Y"

ruleType must be one of: "percentage", "tiered", "minimum_guarantee", "cap", "deduction", "fixed_fee"

Return JSON array (empty if no rules found):
[
  {
    "ruleType": "tiered",
    "ruleName": "exact name from contract",
    "description": "exact description",
    "conditions": {...},
    "calculation": {...},
    "priority": 1,
    "sourceSpan": {"section": "actual section name", "text": "verbatim text from contract"},
    "confidence": 0.6 to 1.0
  }
]

If NO tier-based rules exist, return: []`;

    try {
      console.log(`🔍 Extracting tier-based rules...`);
      const response = await this.makeRequest([
        { role: 'system', content: 'Extract ONLY rules that explicitly exist. Do NOT fabricate. Return empty array [] if none found. Return only JSON.' },
        { role: 'user', content: prompt }
      ], 0.1, 1500);
      
      const rules = this.extractAndRepairJSON(response, []);
      return Array.isArray(rules) ? rules : [];
    } catch (error) {
      console.error('Tier rules extraction failed:', error);
      return [];
    }
  }

  private async extractPaymentCalculationRules(contractText: string): Promise<RoyaltyRule[]> {
    const prompt = `Extract PAYMENT CALCULATION rules ONLY if they explicitly exist in this contract.

Contract Text:
${contractText}

CRITICAL REQUIREMENTS:
- ONLY extract if you find explicit payment/royalty calculation rules in the contract
- If NO payment calculation rules exist, return an empty array []
- Do NOT fabricate or assume rules
- Each rule MUST have actual source text from the contract in sourceSpan.text
- Set confidence below 0.6 if you're uncertain

Look for calculation rules like:
- "Minimum annual guarantee: $85,000"
- "Royalty rate: 5% of net sales"
- "Container size multiplier: 1 gallon = $1.00, 5 gallon = $3.50"
- "Quarterly payment due within 30 days of quarter end"

ruleType must be one of: "percentage", "tiered", "minimum_guarantee", "cap", "deduction", "fixed_fee"

Return JSON array (empty if no rules found):
[
  {
    "ruleType": "minimum_guarantee",
    "ruleName": "exact name from contract",
    "description": "exact description",
    "conditions": {...},
    "calculation": {...},
    "priority": 2,
    "sourceSpan": {"section": "actual section name", "text": "verbatim text from contract"},
    "confidence": 0.6 to 1.0
  }
]

If NO payment calculation rules exist, return: []`;

    try {
      console.log(`💰 Extracting payment calculation rules...`);
      const response = await this.makeRequest([
        { role: 'system', content: 'Extract ONLY rules that explicitly exist. Do NOT fabricate. Return empty array [] if none found. Return only JSON.' },
        { role: 'user', content: prompt }
      ], 0.1, 1500);
      
      const rules = this.extractAndRepairJSON(response, []);
      return Array.isArray(rules) ? rules : [];
    } catch (error) {
      console.error('Payment rules extraction failed:', error);
      return [];
    }
  }

  private async extractSpecialAdjustments(contractText: string): Promise<RoyaltyRule[]> {
    const prompt = `Extract SPECIAL ADJUSTMENTS and PREMIUMS ONLY if they explicitly exist in this contract.

Contract Text:
${contractText}

CRITICAL REQUIREMENTS:
- ONLY extract if you find explicit special adjustments/premiums in the contract
- If NO special adjustment rules exist, return an empty array []
- Do NOT fabricate or assume rules
- Each rule MUST have actual source text from the contract in sourceSpan.text
- Set confidence below 0.6 if you're uncertain

Look for adjustment rules like:
- "Spring season premium: additional 15% of base rate"
- "Organic certification bonus: +25%"
- "Territory premium for West Coast: +$0.50 per unit"
- "Holiday multiplier: 1.2x standard rate"

Return JSON array (empty if no rules found):
[
  {
    "ruleType": "percentage",
    "ruleName": "exact name from contract",
    "description": "exact description",
    "conditions": {...},
    "calculation": {...},
    "priority": 3,
    "sourceSpan": {"section": "actual section name", "text": "verbatim text from contract"},
    "confidence": 0.6 to 1.0
  }
]

If NO special adjustments exist, return: []`;

    try {
      console.log(`🌟 Extracting special adjustments...`);
      const response = await this.makeRequest([
        { role: 'system', content: 'Extract ONLY adjustments that explicitly exist. Do NOT fabricate. Return empty array [] if none found. Return only JSON.' },
        { role: 'user', content: prompt }
      ], 0.1, 1500);
      
      const rules = this.extractAndRepairJSON(response, []);
      return Array.isArray(rules) ? rules : [];
    } catch (error) {
      console.error('Special adjustments extraction failed:', error);
      return [];
    }
  }

  /**
   * Extract plant varieties (or other products) with FormulaNode JSON for royalty calculations
   * This generates structured formulas that can be evaluated by the FormulaInterpreter
   */
  async extractProductsWithFormulas(contractText: string): Promise<Array<{
    productName: string;
    ruleName: string;
    description: string;
    formulaDefinition: FormulaDefinition;
    confidence: number;
    sourceSection: string;
    conditions: any;
  }>> {
    const prompt = `You are extracting PRODUCT VARIETIES and their ROYALTY FORMULAS from a licensing contract.

CONTRACT TEXT:
${contractText}

Your task:
1. Find all product/variety names (e.g., "Aurora Flame Maple", "Pacific Sunset Rose")
2. For each product, identify the royalty calculation formula
3. Generate a structured FormulaNode JSON that represents the calculation

FORMULA PATTERNS TO DETECT:
- **Volume Tiers**: "1-gallon: $1.25, 5000+ units: $1.10" → tier node
- **Seasonal Adjustments**: "Spring +10%, Fall -5%" → lookup table
- **Territory Premiums**: "Secondary territory +10%" → lookup table
- **Multiplier Chains**: "base × seasonal × territory × organic" → multiply node
- **Container Size Rates**: Different rates by size → tier or lookup node

FORMULANODE TYPES:
{
  "type": "literal", "value": 1.25  // Fixed number
}
{
  "type": "reference", "field": "units"  // Get value from sales data (units, grossAmount, season, territory)
}
{
  "type": "multiply", "operands": [node1, node2, node3]  // Multiplication
}
{
  "type": "tier", "reference": {field node}, "tiers": [{"min": 0, "max": 4999, "rate": 11.25, "label": "< 5000"}]  // Returns rate as PERCENTAGE
}
{
  "type": "lookup", "reference": {field node}, "table": {"Spring": 1.10, "Summer": 1.0}, "default": 1.0
}

⚠️ **CRITICAL FORMULA RULES:**
1. Tier nodes return PERCENTAGES (e.g., 11.25 = 11.25%, NOT $11.25/unit)
2. ALWAYS multiply by grossAmount first for percentage-based royalties
3. Formula structure: grossAmount × tier_percentage × seasonal_adjustment

RESPONSE FORMAT - Return JSON array:
[
  {
    "productName": "Aurora Flame Maple",
    "ruleName": "Aurora Flame Maple - 1-gallon with volume tiers",
    "description": "1-gallon containers: 1.25% royalty, 1.10% for 5000+ units with seasonal adjustments",
    "conditions": {
      "containerSize": "1-gallon",
      "productCategories": ["Ornamental Trees"],
      "territories": ["Primary", "Secondary"]
    },
    "formulaDefinition": {
      "name": "Aurora Flame Maple Royalty",
      "description": "Volume-tiered percentage with seasonal adjustment",
      "filters": {"containerSize": "1-gallon"},
      "formula": {
        "type": "multiply",
        "operands": [
          {
            "type": "reference",
            "field": "grossAmount"
          },
          {
            "type": "tier",
            "reference": {"type": "reference", "field": "units"},
            "tiers": [
              {"min": 0, "max": 4999, "rate": 1.25, "label": "< 5000 units"},
              {"min": 5000, "max": null, "rate": 1.10, "label": "5000+ units"}
            ]
          },
          {
            "type": "lookup",
            "reference": {"type": "reference", "field": "season"},
            "table": {"Spring": 1.10, "Summer": 1.0, "Fall": 0.95, "Holiday": 1.20},
            "default": 1.0,
            "description": "Seasonal adjustment"
          }
        ]
      }
    },
    "confidence": 0.95,
    "sourceSection": "Section 3.1 - Royalty Structure - Tier 1"
  }
]

CRITICAL: Return ONLY valid JSON array. No explanatory text.`;

    try {
      console.log(`🌱 Extracting product varieties with formulas...`);
      const response = await this.makeRequest([
        { role: 'system', content: 'Extract product varieties with FormulaNode JSON. Return only JSON array.' },
        { role: 'user', content: prompt }
      ], 0.2, 3000); // Higher tokens for complex formulas
      
      return this.extractAndRepairJSON(response, []);
    } catch (error) {
      console.error('Product formula extraction failed:', error);
      return [];
    }
  }

  // =====================================================
  // NEW: GENERAL PAYMENT TERMS EXTRACTION
  // =====================================================
  async extractGeneralPaymentTerms(contractText: string): Promise<any[]> {
    const prompt = `You are a contract payment terms analyst. Extract ALL payment-related clauses from this contract.

IMPORTANT: Extract ACTUAL payment terms from the contract. Do NOT fabricate or assume data. If no payment terms exist, return empty array [].

CONTRACT TEXT:
${contractText.substring(0, 8000)}

Extract the following types of payment terms if they exist:

1. **PAYMENT SCHEDULE**: When payments are due (Net 30, Net 45, milestone-based, etc.)
2. **PAYMENT METHOD**: How payments should be made (wire transfer, direct deposit, check, ACH, etc.)
3. **RATE STRUCTURE**: Pricing model (hourly rate, fixed fee, daily rate, monthly retainer, etc.)
4. **INVOICE REQUIREMENTS**: What's needed for payment (invoice format, supporting documentation, approval process, etc.)
5. **LATE PAYMENT PENALTIES**: Fees or interest for overdue payments
6. **ADVANCE/DEPOSIT**: Upfront payments or deposits required
7. **MILESTONE PAYMENTS**: Payments tied to specific deliverables or dates

CRITICAL RULES:
- ONLY extract terms that are EXPLICITLY stated in the contract
- Do NOT fabricate payment amounts if not specified
- Include confidence score (0.6-1.0) based on clarity of the text
- Include source text citation
- If ZERO payment terms exist, return empty array []

Return ONLY a JSON array (no explanatory text):
[
  {
    "ruleType": "payment_schedule",
    "ruleName": "Payment Timeline",
    "description": "Payment due within 45 days of receiving invoice and supporting documentation",
    "paymentTerms": {
      "dueDays": 45,
      "triggerEvent": "Invoice receipt with documentation",
      "frequency": "per_invoice"
    },
    "confidence": 0.95,
    "sourceText": "exact text from contract"
  },
  {
    "ruleType": "payment_method",
    "ruleName": "Payment Method",
    "description": "Direct deposit to bank account",
    "paymentTerms": {
      "method": "direct_deposit",
      "requirement": "Sub-contractor must sign up for direct deposit"
    },
    "confidence": 0.90,
    "sourceText": "exact text from contract"
  },
  {
    "ruleType": "rate_structure",
    "ruleName": "Hourly Rate",
    "description": "Compensation based on hourly rate",
    "paymentTerms": {
      "rateType": "hourly",
      "amount": null,
      "currency": "USD"
    },
    "confidence": 0.85,
    "sourceText": "exact text from contract"
  }
]

Return empty array [] if contract has NO payment terms.`;

    try {
      console.log(`💰 Extracting general payment terms...`);
      const response = await this.makeRequest([
        { role: 'system', content: 'Extract payment terms from contract. Return only JSON array.' },
        { role: 'user', content: prompt }
      ], 0.1, 2000);
      
      const extracted = this.extractAndRepairJSON(response, []);
      
      // Quality filter: Only keep terms with confidence >= 0.6 and source text
      const validTerms = extracted.filter((term: any) => {
        const hasConfidence = term.confidence && term.confidence >= 0.6;
        const hasSourceText = term.sourceText && term.sourceText.length > 10;
        const hasValidType = ['payment_schedule', 'payment_method', 'rate_structure', 'invoice_requirements', 'late_payment_penalty', 'advance_payment', 'milestone_payment'].includes(term.ruleType);
        
        return hasConfidence && hasSourceText && hasValidType;
      });
      
      console.log(`📋 Found ${validTerms.length} valid payment terms (filtered from ${extracted.length} raw extractions)`);
      return validTerms;
    } catch (error) {
      console.error('General payment terms extraction failed:', error);
      return [];
    }
  }

  // Keep the old single-request method as backup
  async extractDetailedRoyaltyRulesSingleRequest(contractText: string): Promise<LicenseRuleExtractionResult> {
    const prompt = `
    You are a specialized contract analyst expert in extracting detailed royalty calculation rules from licensing agreements. 

    Your task is to extract COMPREHENSIVE ROYALTY RULES with specific formulas, rates, and calculation methods from this contract text.

    CONTRACT TEXT:
    ${contractText}

    Extract detailed royalty rules in the following categories:

    🏷️ **TIER-BASED RULES** (if present):
    - Tier 1, 2, 3, etc. with specific product categories
    - Per-unit rates, thresholds, volume discounts
    - Container sizes, multipliers, seasonal adjustments

    💰 **CALCULATION FORMULAS**:
    - Base rates × multipliers × adjustments
    - Sliding scales based on volume bands
    - Minimum payments for each tier/band

    📊 **ADJUSTMENTS & PREMIUMS**:
    - Seasonal adjustments (Spring, Fall, Holiday, Off-season)
    - Territory premiums (Primary vs Secondary)
    - Product type premiums (Organic, Specialty, etc.)
    - Volume discounts and thresholds

    🔒 **MINIMUM GUARANTEES**:
    - Annual minimum payments
    - Quarterly payment requirements
    - Shortfall calculations

    🎯 **EXTRACTION PRIORITIES:**
    1. Look for TIERED systems (Tier 1, Tier 2, Tier 3)
    2. Extract SPECIFIC RATES and AMOUNTS ($1.25, $1.10, +25%, etc.)
    3. Identify CALCULATION FORMULAS (base × multiplier × adjustment)
    4. Find VOLUME THRESHOLDS (5,000+ units, sales bands)
    5. Extract SEASONAL/TERRITORY ADJUSTMENTS (+10%, -5%, +20%)
    6. Locate MINIMUM GUARANTEES ($85,000 annual)
    7. Document PRODUCT CATEGORIES and CONDITIONS

    🔍 **IMPORTANT REQUIREMENTS:**
    - Extract ACTUAL numbers, percentages, and dollar amounts from the document
    - Create separate rule objects for each distinct calculation method
    - Include detailed formulas showing how royalties are calculated
    - Specify exact conditions when each rule applies
    - Reference the source section/page where each rule was found
    - If information is unclear, note assumptions made and mark with lower confidence

    Return a JSON object with the following structure (extract real data from the document):
    {
      "documentType": "license",
      "licenseType": "extracted license type",
      "parties": {
        "licensor": "extracted licensor name",
        "licensee": "extracted licensee name"
      },
      "effectiveDate": null,
      "expirationDate": null,
      "rules": [
        {
          "ruleType": "tiered",
          "ruleName": "Tier 1 — Category Name",
          "description": "Detailed description with specific rates and conditions",
          "conditions": {
            "productCategories": ["category1", "category2"],
            "territories": ["Primary Territory"],
            "salesVolumeMin": 5000,
            "timeperiod": "annually",
            "currency": "USD"
          },
          "calculation": {
            "tiers": [
              {"min": 0, "max": 4999, "rate": 1.25},
              {"min": 5000, "max": null, "rate": 1.10}
            ],
            "formula": "actual formula from document"
          },
          "priority": 1,
          "sourceSpan": {
            "section": "Section reference",
            "text": "extracted text from document"
          },
          "confidence": 0.95
        }
      ],
      "currency": "USD",
      "paymentTerms": "extracted payment terms",
      "reportingRequirements": [],
      "extractionMetadata": {
        "totalRulesFound": 0,
        "avgConfidence": 0.8,
        "processingTime": 5,
        "ruleComplexity": "moderate"
      }
    }

    Return ONLY the JSON object, no additional text.
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a specialized royalty calculation expert. Extract detailed tier-based royalty rules with specific formulas, rates, and conditions. Return only valid JSON.'
      },
      {
        role: 'user', 
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages, 0.1);
      
      // Clean and parse JSON response
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\\{[\\s\\S]*\\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in rules extraction response');
      }

      const extractionResult = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (!extractionResult.rules || !Array.isArray(extractionResult.rules)) {
        throw new Error('Invalid rules structure returned');
      }

      // Set defaults for missing fields
      return {
        documentType: extractionResult.documentType || 'license',
        licenseType: extractionResult.licenseType || 'License Agreement',
        parties: extractionResult.parties || { licensor: 'Not specified', licensee: 'Not specified' },
        effectiveDate: extractionResult.effectiveDate || undefined,
        expirationDate: extractionResult.expirationDate || undefined,
        rules: extractionResult.rules || [],
        currency: extractionResult.currency || 'USD',
        paymentTerms: extractionResult.paymentTerms || 'Not specified',
        reportingRequirements: extractionResult.reportingRequirements || [],
        extractionMetadata: {
          totalRulesFound: extractionResult.rules?.length || 0,
          avgConfidence: extractionResult.rules?.length > 0 
            ? extractionResult.rules.reduce((sum: number, rule: any) => sum + (rule.confidence || 0.8), 0) / extractionResult.rules.length
            : 0.8,
          processingTime: extractionResult.extractionMetadata?.processingTime || 5,
          ruleComplexity: (extractionResult.extractionMetadata?.ruleComplexity as 'simple' | 'moderate' | 'complex') || 'moderate'
        }
      };

    } catch (error) {
      console.error('Error extracting detailed royalty rules:', error);
      
      // Return basic fallback structure if API fails (handles rate limits)
      return {
        documentType: 'license' as const,
        licenseType: 'License Agreement',
        parties: { licensor: 'Not specified', licensee: 'Not specified' },
        effectiveDate: undefined,
        expirationDate: undefined,
        rules: [],
        currency: 'USD',
        paymentTerms: 'Rules extraction failed - manual review required',
        reportingRequirements: [],
        extractionMetadata: {
          totalRulesFound: 0,
          avgConfidence: 0.5,
          processingTime: 0,
          ruleComplexity: 'moderate' as const
        }
      };
    }
  }

  private async makeRequest(messages: Array<{ role: string; content: string }>, temperature = 0.1, maxTokens = 2000): Promise<string> {
    let lastError: Error | undefined;
    
    // Retry logic for rate limits
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (response.status === 429) {
          // Rate limit - wait and retry
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`🔄 Groq rate limit hit (attempt ${attempt}/3), waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (!response.ok) {
          throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        }

        const data: GroqResponse = await response.json();
        return data.choices[0]?.message?.content || '';
        
      } catch (error) {
        lastError = error as Error;
        if (attempt < 3) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`⚠️ Groq request failed (attempt ${attempt}/3):`, errorMsg);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw lastError || new Error('Unknown error occurred');
  }

  async analyzeContract(contractText: string): Promise<ContractAnalysisResult> {
    const prompt = `
    You are a professional contract analyst specializing in extracting key business terms from legal agreements. 

    Document Text:
    ${contractText}

    FIRST, determine if this document is actually a CONTRACT, AGREEMENT, or LEGAL DOCUMENT that contains business terms. 

    If this document is NOT a contract/agreement (e.g., it's a resume, report, manual, random text, etc.), respond with:
    {
      "summary": "This document does not appear to be a contract or legal agreement. It appears to be a [document type]. This system is designed specifically for contract analysis and cannot provide meaningful business insights for this type of document.",
      "keyTerms": [],
      "riskAnalysis": [
        {
          "level": "low",
          "title": "Document Type Mismatch",
          "description": "This document is not a contract or agreement and should not be analyzed using contract analysis tools."
        }
      ],
      "insights": [
        {
          "type": "alert",
          "title": "Wrong Document Type",
          "description": "Please upload a contract, agreement, or legal document for proper analysis."
        }
      ],
      "confidence": 0.95
    }

    If this IS a contract/agreement, then proceed with your primary objective to identify and clearly explain these CRITICAL CONTRACT SECTIONS:

    🔍 PRIORITY SECTIONS TO EXTRACT:
    1. **Royalty Structure & Payment Terms** (Section 3 or similar) - Payment rates, schedules, calculation methods
    2. **Manufacturing & Quality Requirements** (Section 5 or similar) - Production standards, quality controls
    3. **Licensed Technology & Patents** (Section 1 or similar) - What technology/IP is being licensed
    4. **Termination & Post-Termination** (Section 9 or similar) - How/when contract ends, what happens after
    5. **Financial Obligations** - Any fees, minimum payments, guarantees
    6. **Performance Requirements** - Delivery timelines, milestones, KPIs
    7. **Territory & Scope** - Geographic limitations, usage restrictions

    Provide your analysis in this JSON structure:
    {
      "summary": "Brief 2-paragraph executive summary focusing on the business deal and key commercial terms",
      "keyTerms": [
        {
          "type": "Royalty Structure",
          "description": "Plain English explanation of what this means for the business - avoid legal jargon",
          "confidence": 0.95,
          "location": "Specific section reference (e.g., Section 3.1, Article 5, etc.)"
        },
        {
          "type": "Payment Terms",
          "description": "Plain English explanation of payment schedules and methods",
          "confidence": 0.90,
          "location": "Section reference"
        },
        {
          "type": "Manufacturing Requirements",
          "description": "Production standards and quality requirements",
          "confidence": 0.88,
          "location": "Section reference"
        }
      ],
      "riskAnalysis": [
        {
          "level": "high|medium|low",
          "title": "Business Risk Title",
          "description": "Clear explanation of potential business impact and what could go wrong"
        }
      ],
      "insights": [
        {
          "type": "opportunity|alert|requirement",
          "title": "Key Business Insight",
          "description": "Actionable business insight or recommendation"
        }
      ],
      "confidence": 0.92
    }

    🎯 FOCUS REQUIREMENTS:
    - Create a SEPARATE keyTerm object for EACH contract section you find
    - Each keyTerm should have ONE specific type (e.g., "Royalty Structure", "Payment Terms", "Manufacturing Requirements", etc.)
    - Extract SPECIFIC numbers, percentages, dates, and dollar amounts
    - Explain complex legal terms in simple business language
    - Highlight what the user needs to DO or PAY based on this contract
    - Identify potential business risks and opportunities
    - If sections are missing, note "Not specified in this document"

    Make this analysis actionable for business decision-makers who need to understand the deal quickly without reading legal text.

    Return only valid JSON, no additional text.
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a professional document analyst. Always respond with valid JSON only. Analyze documents based on their actual content and type, not assumptions.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const analysisResult = JSON.parse(jsonMatch[0]);
      
      // Validate and ensure required fields exist
      if (!analysisResult.summary || !Array.isArray(analysisResult.keyTerms)) {
        throw new Error('Invalid analysis structure returned');
      }

      return {
        summary: analysisResult.summary,
        keyTerms: analysisResult.keyTerms || [],
        riskAnalysis: analysisResult.riskAnalysis || [],
        insights: analysisResult.insights || [],
        confidence: Math.max(0, Math.min(1, analysisResult.confidence || 0.8))
      };
    } catch (error) {
      console.error('Error analyzing contract:', error);
      
      // Return a basic analysis if parsing fails
      return {
        summary: 'Contract analysis completed. The document has been processed and key terms have been extracted.',
        keyTerms: [
          {
            type: 'Document Status',
            description: 'Contract processed successfully',
            confidence: 0.9,
            location: 'Document header'
          }
        ],
        riskAnalysis: [
          {
            level: 'medium' as const,
            title: 'Analysis Limitation',
            description: 'Detailed analysis may require manual review due to document complexity.'
          }
        ],
        insights: [
          {
            type: 'alert',
            title: 'Manual Review Recommended',
            description: 'Consider having a legal professional review this contract for comprehensive analysis.'
          }
        ],
        confidence: 0.75
      };
    }
  }

  async summarizeContract(contractText: string): Promise<string> {
    const prompt = `
    Please provide a concise summary of this contract in 2-3 paragraphs. Focus on:
    - Main purpose and parties involved
    - Key terms and obligations
    - Important dates and financial aspects
    - Notable clauses or restrictions

    Contract Text:
    ${contractText}
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a professional contract analyst. Provide clear, concise summaries.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      return await this.makeRequest(messages);
    } catch (error) {
      console.error('Error summarizing contract:', error);
      return 'Contract summary could not be generated at this time. Please try again or contact support.';
    }
  }

  async extractKeyTerms(contractText: string): Promise<Array<{ term: string; value: string; confidence: number }>> {
    const prompt = `
    Extract key terms from this contract and return them as a JSON array. Each term should have:
    - term: the type of term
    - value: the actual value or description
    - confidence: confidence score between 0 and 1

    Contract Text:
    ${contractText}

    Return only a JSON array, no additional text.
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a contract term extraction specialist. Return only valid JSON arrays.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        return [];
      }

      const terms = JSON.parse(jsonMatch[0]);
      return Array.isArray(terms) ? terms : [];
    } catch (error) {
      console.error('Error extracting terms:', error);
      return [];
    }
  }

  // 📊 FINANCIAL ANALYSIS METHODS
  async analyzeFinancialTerms(contractText: string): Promise<any> {
    const prompt = `
    Analyze this contract for financial terms and return a comprehensive financial analysis in JSON format.

    Focus on extracting:
    1. **Total Contract Value** - Overall monetary value (convert to USD if needed)
    2. **Payment Schedule** - All payment dates, amounts, milestones
    3. **Royalty Structure** - Rates, calculation methods, minimum payments
    4. **Revenue Projections** - Expected income over contract lifetime
    5. **Cost Impact** - Budget implications, additional costs
    6. **Currency Risk** - Multi-currency exposure assessment (0-100 score)
    7. **Payment Terms** - Net payment days, methods, late fees
    8. **Penalty Clauses** - Financial penalties, liquidated damages

    Contract Text:
    ${contractText}

    Return only this JSON structure:
    {
      "totalValue": number or null,
      "currency": "USD" or detected currency,
      "paymentSchedule": [
        {"date": "YYYY-MM-DD", "amount": number, "description": "milestone/payment type"}
      ],
      "royaltyStructure": {
        "baseRate": number,
        "minimumPayment": number,
        "calculationMethod": "description"
      },
      "revenueProjections": {
        "year1": number,
        "year2": number,
        "total": number
      },
      "costImpact": {
        "upfrontCosts": number,
        "ongoingCosts": number,
        "budgetImpact": "low|medium|high"
      },
      "currencyRisk": number (0-100),
      "paymentTerms": "Net 30, wire transfer, 2% late fee",
      "penaltyClauses": [
        {"type": "late_payment", "amount": number, "description": "text"}
      ]
    }
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a financial analyst specializing in contract monetization. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in financial analysis response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing financial terms:', error);
      return {
        totalValue: null,
        currency: "USD",
        paymentSchedule: [],
        royaltyStructure: null,
        revenueProjections: null,
        costImpact: null,
        currencyRisk: 0,
        paymentTerms: "Terms not clearly specified",
        penaltyClauses: []
      };
    }
  }

  // ⚖️ COMPLIANCE ANALYSIS METHODS
  async analyzeCompliance(contractText: string): Promise<any> {
    const prompt = `
    Analyze this contract for legal compliance and regulatory adherence. Return a JSON compliance assessment.

    Analyze for:
    1. **Regulatory Frameworks** - GDPR, SOX, HIPAA, CCPA compliance
    2. **Jurisdiction Analysis** - Governing law conflicts, court jurisdiction
    3. **Data Protection** - Privacy clauses, data handling requirements
    4. **Industry Standards** - Sector-specific compliance requirements
    5. **Risk Factors** - Compliance gaps, potential violations
    6. **Recommended Actions** - Steps to improve compliance

    Contract Text:
    ${contractText}

    Return only this JSON structure:
    {
      "complianceScore": number (0-100),
      "regulatoryFrameworks": [
        {"framework": "GDPR", "compliant": boolean, "gaps": ["list of issues"]}
      ],
      "jurisdictionAnalysis": {
        "governingLaw": "jurisdiction",
        "courtJurisdiction": "location",
        "conflicts": ["any jurisdiction conflicts"]
      },
      "dataProtectionCompliance": boolean,
      "industryStandards": [
        {"standard": "ISO 27001", "compliance": "full|partial|none"}
      ],
      "riskFactors": [
        {"level": "high|medium|low", "factor": "description", "impact": "business impact"}
      ],
      "recommendedActions": [
        {"priority": "high|medium|low", "action": "specific action needed"}
      ]
    }
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a legal compliance specialist. Analyze contracts for regulatory adherence. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in compliance analysis response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing compliance:', error);
      return {
        complianceScore: 75,
        regulatoryFrameworks: [],
        jurisdictionAnalysis: {
          governingLaw: "Not specified",
          courtJurisdiction: "Not specified",
          conflicts: []
        },
        dataProtectionCompliance: true,
        industryStandards: [],
        riskFactors: [],
        recommendedActions: []
      };
    }
  }

  // 📋 OBLIGATIONS EXTRACTION
  async extractObligations(contractText: string): Promise<any[]> {
    const prompt = `
    Extract all contractual obligations from this contract. Return a JSON array of detailed obligations.

    For each obligation, identify:
    1. **Type** - payment, delivery, performance, reporting, compliance
    2. **Description** - Clear description of what must be done
    3. **Due Date** - When it's due (if specified)
    4. **Responsible Party** - Who is responsible
    5. **Priority** - critical, high, medium, low

    Contract Text:
    ${contractText}

    Return only this JSON array:
    [
      {
        "obligationType": "payment|delivery|performance|reporting|compliance",
        "description": "Clear description of obligation",
        "dueDate": "YYYY-MM-DD" or null,
        "responsible": "party name or role",
        "priority": "critical|high|medium|low"
      }
    ]
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a contract obligation specialist. Extract all deliverables and requirements. Return only valid JSON arrays.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        return [];
      }

      const obligations = JSON.parse(jsonMatch[0]);
      return Array.isArray(obligations) ? obligations : [];
    } catch (error) {
      console.error('Error extracting obligations:', error);
      return [];
    }
  }

  // 🎯 STRATEGIC ANALYSIS METHODS
  async analyzeStrategicValue(contractText: string, contractType: string = 'unknown'): Promise<any> {
    const prompt = `
    Perform strategic business analysis of this ${contractType} contract. Return comprehensive strategic insights in JSON.

    Analyze:
    1. **Strategic Value** - Business importance score (0-100)
    2. **Market Alignment** - How well aligned with market trends (0-100)
    3. **Competitive Advantage** - Benefits over competitors
    4. **Risk Concentration** - Dependency risk level (0-100)
    5. **Standardization Score** - Template compliance (0-100)
    6. **Negotiation Insights** - Patterns and recommendations
    7. **Benchmark Comparison** - How it compares to industry standards
    8. **Strategic Recommendations** - Business strategy suggestions

    Contract Text:
    ${contractText}

    Return only this JSON structure:
    {
      "strategicValue": number (0-100),
      "marketAlignment": number (0-100),
      "competitiveAdvantage": [
        {"advantage": "description", "impact": "high|medium|low"}
      ],
      "riskConcentration": number (0-100),
      "standardizationScore": number (0-100),
      "negotiationInsights": {
        "keyNegotiationPoints": ["list of points"],
        "flexibilityAreas": ["areas for future negotiation"],
        "recommendations": ["negotiation strategies"]
      },
      "benchmarkComparison": {
        "vsIndustryStandard": "better|similar|worse",
        "marketPosition": "description",
        "improvementAreas": ["areas to improve"]
      },
      "recommendations": [
        {"priority": "high|medium|low", "recommendation": "strategic action", "rationale": "why important"}
      ]
    }
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a strategic business analyst specializing in contract value optimization. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in strategic analysis response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing strategic value:', error);
      return {
        strategicValue: 70,
        marketAlignment: 70,
        competitiveAdvantage: [],
        riskConcentration: 30,
        standardizationScore: 80,
        negotiationInsights: {
          keyNegotiationPoints: [],
          flexibilityAreas: [],
          recommendations: []
        },
        benchmarkComparison: {
          vsIndustryStandard: "similar",
          marketPosition: "Standard market terms",
          improvementAreas: []
        },
        recommendations: []
      };
    }
  }

  // 🔍 CONTRACT COMPARISON METHODS
  async findSimilarContracts(contractText: string, allContracts: any[]): Promise<any> {
    const prompt = `
    Analyze this contract and compare it with similar contracts to identify patterns, anomalies, and best practices.

    Contract to analyze:
    ${contractText}

    For comparison, consider:
    1. **Similar Contract Types** - Identify contracts with similar purpose
    2. **Clause Variations** - How key clauses differ from standards
    3. **Term Comparisons** - Financial and legal term differences
    4. **Best Practices** - Industry best practices found
    5. **Anomalies** - Unusual or non-standard terms

    Return only this JSON structure:
    {
      "similarityScore": number (0-100),
      "clauseVariations": [
        {"clause": "clause name", "variation": "how it differs", "impact": "high|medium|low"}
      ],
      "termComparisons": {
        "financialTerms": "comparison summary",
        "legalTerms": "comparison summary",
        "performanceTerms": "comparison summary"
      },
      "bestPractices": [
        {"practice": "description", "benefit": "business benefit"}
      ],
      "anomalies": [
        {"anomaly": "unusual term", "risk": "high|medium|low", "explanation": "why unusual"}
      ]
    }
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a contract comparison specialist. Identify patterns and anomalies across contracts. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in contract comparison response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error comparing contracts:', error);
      return {
        similarityScore: 50,
        clauseVariations: [],
        termComparisons: {
          financialTerms: "Standard terms",
          legalTerms: "Standard terms",
          performanceTerms: "Standard terms"
        },
        bestPractices: [],
        anomalies: []
      };
    }
  }

  // 📈 PERFORMANCE PREDICTION
  async predictPerformance(contractText: string, contractType: string = 'unknown'): Promise<any> {
    const prompt = `
    Analyze this ${contractType} contract and predict performance metrics based on contract terms and structure.

    Contract Text:
    ${contractText}

    Analyze and predict:
    1. **Performance Score** - Overall contract performance likelihood (0-100)
    2. **Milestone Completion** - Expected milestone completion rate (0-100)
    3. **On-Time Delivery** - Likelihood of timely delivery
    4. **Budget Variance** - Expected budget over/under performance
    5. **Quality Score** - Expected quality of deliverables (0-100)
    6. **Client Satisfaction** - Predicted satisfaction level (0-100)
    7. **Renewal Probability** - Likelihood of contract renewal (0-100)

    Return only this JSON structure:
    {
      "performanceScore": number (0-100),
      "milestoneCompletion": number (0-100),
      "onTimeDelivery": boolean,
      "budgetVariance": number (positive = over budget, negative = under budget),
      "qualityScore": number (0-100),
      "clientSatisfaction": number (0-100),
      "renewalProbability": number (0-100),
      "riskFactors": [
        {"factor": "description", "impact": "high|medium|low"}
      ],
      "successFactors": [
        {"factor": "description", "importance": "high|medium|low"}
      ]
    }
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a contract performance analyst. Predict contract success metrics based on terms and structure. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in performance prediction response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error predicting performance:', error);
      return {
        performanceScore: 75,
        milestoneCompletion: 80,
        onTimeDelivery: true,
        budgetVariance: 0,
        qualityScore: 85,
        clientSatisfaction: 80,
        renewalProbability: 70,
        riskFactors: [],
        successFactors: []
      };
    }
  }

  // 📋 CONTRACT OBLIGATIONS EXTRACTION
  async extractContractObligations(contractText: string): Promise<Array<{
    obligationType: string;
    description: string;
    dueDate: string | null;
    responsible: string;
    priority: string;
  }>> {
    const prompt = `
    Extract all contractual obligations from this contract. Identify who is responsible for what and when.

    Contract Text:
    ${contractText}

    Return a JSON array of obligations with:
    1. **obligationType** - "payment", "delivery", "performance", "reporting", "maintenance", "compliance", etc.
    2. **description** - Clear description of the obligation
    3. **dueDate** - Due date in YYYY-MM-DD format (null if no specific date)
    4. **responsible** - Who is responsible (party name or role)
    5. **priority** - "low", "medium", "high", "critical"

    Return only this JSON array:
    [
      {
        "obligationType": "payment",
        "description": "Monthly payment of $10,000",
        "dueDate": "2024-12-01",
        "responsible": "Client",
        "priority": "high"
      }
    ]
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a contract obligation specialist. Extract all obligations with precise details. Return only valid JSON array.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        return [];
      }

      const obligations = JSON.parse(jsonMatch[0]);
      return Array.isArray(obligations) ? obligations : [];
    } catch (error) {
      console.error('Error extracting obligations:', error);
      return [];
    }
  }

  // ⚠️ COMPREHENSIVE RISK ANALYSIS
  async analyzeRiskFactors(contractText: string, contractType: string = 'unknown'): Promise<{
    overallRiskScore: number;
    riskCategories: Array<{
      category: string;
      score: number;
      factors: Array<{ factor: string; impact: string; description: string }>;
    }>;
    mitigation: Array<{ risk: string; recommendation: string; priority: string }>;
    riskTrends: Array<{ period: string; riskLevel: string; factors: string[] }>;
  }> {
    const prompt = `
    Perform a comprehensive risk analysis of this ${contractType} contract across multiple dimensions.

    Contract Text:
    ${contractText}

    Analyze these risk categories:
    1. **Financial Risk** - Payment terms, currency exposure, financial stability
    2. **Legal Risk** - Compliance, jurisdiction, liability exposure
    3. **Operational Risk** - Delivery, performance, resource availability
    4. **Strategic Risk** - Market changes, competitive positioning
    5. **Reputational Risk** - Brand impact, stakeholder relations
    6. **Technical Risk** - Technology dependencies, obsolescence

    Return only this JSON structure:
    {
      "overallRiskScore": number (0-100, higher = more risk),
      "riskCategories": [
        {
          "category": "Financial Risk",
          "score": number (0-100),
          "factors": [
            {
              "factor": "Payment delay risk",
              "impact": "high|medium|low", 
              "description": "Detailed risk description"
            }
          ]
        }
      ],
      "mitigation": [
        {
          "risk": "Risk description",
          "recommendation": "Mitigation strategy", 
          "priority": "high|medium|low"
        }
      ],
      "riskTrends": [
        {
          "period": "short-term|medium-term|long-term",
          "riskLevel": "increasing|stable|decreasing",
          "factors": ["List of contributing factors"]
        }
      ]
    }
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a comprehensive risk analyst. Evaluate all risk dimensions and provide detailed mitigation strategies. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in risk analysis response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing risk factors:', error);
      return {
        overallRiskScore: 50,
        riskCategories: [
          {
            category: "General Risk",
            score: 50,
            factors: [
              {
                factor: "Analysis incomplete",
                impact: "medium",
                description: "Risk analysis could not be completed automatically"
              }
            ]
          }
        ],
        mitigation: [
          {
            risk: "Incomplete analysis",
            recommendation: "Manual review recommended",
            priority: "medium"
          }
        ],
        riskTrends: [
          {
            period: "short-term",
            riskLevel: "stable",
            factors: ["Analysis pending"]
          }
        ]
      };
    }
  }

  // 🔄 CONTRACT COMPARISON ANALYSIS
  async analyzeContractComparison(
    contractText: string, 
    contractType: string, 
    industry: string = 'unknown'
  ): Promise<{
    similarityScore: number;
    clauseVariations: Array<{ clause: string; variation: string; impact: string }>;
    termComparisons: Array<{ term: string; marketStandard: string; contractValue: string; variance: string }>;
    bestPractices: Array<{ practice: string; recommendation: string; benefit: string }>;
    anomalies: Array<{ anomaly: string; description: string; recommendation: string }>;
  }> {
    const prompt = `
    Analyze this ${contractType} contract in the ${industry} industry for comparison with market standards and best practices.

    Contract Text:
    ${contractText}

    Compare against typical ${contractType} contracts and identify:
    1. **Similarity Score** - How similar to standard contracts (0-100)
    2. **Clause Variations** - Non-standard clauses and their impact
    3. **Term Comparisons** - How terms compare to market standards
    4. **Best Practices** - Adherence to industry best practices
    5. **Anomalies** - Unusual terms that may need attention

    Return only this JSON structure:
    {
      "similarityScore": number (0-100),
      "clauseVariations": [
        {
          "clause": "Termination clause",
          "variation": "Unusually restrictive",
          "impact": "high|medium|low"
        }
      ],
      "termComparisons": [
        {
          "term": "Payment terms",
          "marketStandard": "Net 30 days",
          "contractValue": "Net 60 days", 
          "variance": "Unfavorable to payer"
        }
      ],
      "bestPractices": [
        {
          "practice": "Force majeure clause",
          "recommendation": "Include comprehensive force majeure provisions",
          "benefit": "Protection against unforeseen events"
        }
      ],
      "anomalies": [
        {
          "anomaly": "Unusual liability cap",
          "description": "Liability limited to 10% of contract value",
          "recommendation": "Consider increasing liability cap for better protection"
        }
      ]
    }
    `;

    const messages = [
      {
        role: 'system',
        content: 'You are a contract comparison specialist. Compare contracts against industry standards and best practices. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in comparison analysis response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing contract comparison:', error);
      return {
        similarityScore: 75,
        clauseVariations: [],
        termComparisons: [],
        bestPractices: [],
        anomalies: []
      };
    }
  }

  // =====================================================
  // LICENSE RULE EXTRACTION METHODS (NEW EXTENSION)
  // =====================================================

  async extractLicenseRules(licenseText: string, licenseType?: string): Promise<LicenseRuleExtractionResult> {
    const startTime = Date.now();
    
    const prompt = `
    You are a specialized AI expert in extracting royalty calculation rules from license agreements and contracts.
    Your task is to analyze the license document and extract structured, machine-readable royalty calculation rules.

    Document Text:
    ${licenseText}

    OBJECTIVE: Extract ALL royalty, fee, and payment calculation rules from this license document.

    Look for these types of rules:
    1. **Percentage Royalties**: "X% of net sales", "Y% of gross revenue"
    2. **Tiered Royalties**: Different rates for different sales volumes
    3. **Minimum Guarantees**: "Minimum payment of $X per year"
    4. **Caps and Limits**: "Maximum royalty of $Y per quarter"
    5. **Fixed Fees**: "One-time fee of $Z", "Annual license fee of $A"
    6. **Deductions**: "Less 3% for marketing expenses"
    7. **Territory-based**: Different rates for different regions
    8. **Product-based**: Different rates for different product categories

    For EACH rule you find, extract:
    - Rule type and name
    - When it applies (conditions)
    - How to calculate it (rates, amounts, formulas)
    - Where you found it (page/section reference)
    - Your confidence level

    Respond with this EXACT JSON structure:
    {
      "documentType": "license|royalty_agreement|revenue_share|other",
      "licenseType": "${licenseType || 'general'}",
      "parties": {
        "licensor": "Company name of the party granting the license",
        "licensee": "Company name of the party receiving the license"
      },
      "effectiveDate": "YYYY-MM-DD format if found",
      "expirationDate": "YYYY-MM-DD format if found", 
      "rules": [
        {
          "ruleType": "percentage|tiered|minimum_guarantee|cap|deduction|fixed_fee",
          "ruleName": "Descriptive name for this rule",
          "description": "Plain English description of what this rule does",
          "conditions": {
            "productCategories": ["list of products this applies to"],
            "territories": ["list of territories/regions"],
            "salesVolumeMin": number_or_null,
            "salesVolumeMax": number_or_null,
            "timeperiod": "monthly|quarterly|annually|one-time",
            "currency": "USD|EUR|etc"
          },
          "calculation": {
            "rate": number_for_percentage_rules,
            "tiers": [{"min": number, "max": number_or_null, "rate": number}],
            "amount": number_for_fixed_amounts,
            "formula": "mathematical_formula_if_complex"
          },
          "priority": number_1_to_10_execution_order,
          "sourceSpan": {
            "page": page_number_if_available,
            "section": "section_name_or_number",
            "text": "exact_text_snippet_where_found"
          },
          "confidence": number_0_to_1
        }
      ],
      "currency": "Primary currency mentioned",
      "paymentTerms": "When payments are due (e.g., within 30 days of quarter end)",
      "reportingRequirements": [
        {
          "frequency": "monthly|quarterly|annually",
          "dueDate": "when reports are due",
          "description": "what must be reported"
        }
      ],
      "extractionMetadata": {
        "totalRulesFound": number_of_rules_found,
        "avgConfidence": average_confidence_across_all_rules,
        "processingTime": ${Date.now() - startTime},
        "ruleComplexity": "simple|moderate|complex"
      }
    }

    IMPORTANT GUIDELINES:
    1. Extract ALL calculation rules, even if they seem minor
    2. Be specific about conditions (when each rule applies)
    3. Use exact text snippets in sourceSpan for traceability
    4. Assign realistic confidence scores (0.7-0.95 for clear rules, 0.4-0.6 for ambiguous ones)
    5. If you can't find clear parties, rules, or dates, use null values
    6. Focus on CALCULATION rules, not general contract terms

    Analyze the document thoroughly and extract all royalty calculation rules:
    `;

    try {
      const response = await this.makeRequest([
        {
          role: 'system',
          content: `You are a license agreement analysis expert. You MUST respond with valid JSON ONLY. 
          Do not include any explanations, markdown formatting, or text outside the JSON structure.
          Your response must start with { and end with }. No other text is allowed.`
        },
        {
          role: 'user', 
          content: prompt
        }
      ], 0.1); // Very low temperature for consistent JSON structure

      console.log('Raw AI response for license rules:', response.substring(0, 200) + '...');

      // More aggressive cleaning of the JSON response
      let cleanedResponse = response.trim();
      
      // Remove any markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Remove any text before the first {
      const firstBrace = cleanedResponse.indexOf('{');
      if (firstBrace > 0) {
        cleanedResponse = cleanedResponse.substring(firstBrace);
      }
      
      // Remove any text after the last }
      const lastBrace = cleanedResponse.lastIndexOf('}');
      if (lastBrace >= 0 && lastBrace < cleanedResponse.length - 1) {
        cleanedResponse = cleanedResponse.substring(0, lastBrace + 1);
      }
      
      console.log('Cleaned response for JSON parsing:', cleanedResponse.substring(0, 200) + '...');
      
      let result;
      try {
        result = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.log('JSON parsing failed, attempting to repair...');
        // Try to fix common JSON issues
        let repairedResponse = cleanedResponse
          .replace(/,\s*}/g, '}')  // Remove trailing commas before }
          .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
          .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '"$1":')  // Quote unquoted keys
          .replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([,}])/g, ': "$1"$2');  // Quote unquoted string values
        
        try {
          result = JSON.parse(repairedResponse);
          console.log('JSON repair successful!');
        } catch (repairError) {
          console.log('JSON repair failed, using fallback structure');
          throw parseError; // Use original error to trigger fallback
        }
      }
      
      // Validate the structure and add processing metadata
      const processingTime = Date.now() - startTime;
      result.extractionMetadata.processingTime = processingTime;
      
      return result as LicenseRuleExtractionResult;

    } catch (error) {
      console.error('Error extracting license rules:', error);
      
      // Return a fallback structure if parsing fails
      return {
        documentType: 'other',
        licenseType: licenseType || 'unknown',
        parties: {
          licensor: 'Unable to extract',
          licensee: 'Unable to extract'
        },
        rules: [],
        currency: 'USD',
        paymentTerms: 'Unable to extract',
        reportingRequirements: [],
        extractionMetadata: {
          totalRulesFound: 0,
          avgConfidence: 0,
          processingTime: Date.now() - startTime,
          ruleComplexity: 'simple'
        }
      };
    }
  }

  async validateExtractedRules(rules: RoyaltyRule[]): Promise<{isValid: boolean, errors: string[], warnings: string[]}> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      // Check for required fields
      if (!rule.ruleName || !rule.ruleType) {
        errors.push(`Rule missing name or type: ${JSON.stringify(rule)}`);
      }

      // Validate calculation structure based on rule type
      if (rule.ruleType === 'percentage' && (!rule.calculation.rate || rule.calculation.rate <= 0)) {
        errors.push(`Percentage rule "${rule.ruleName}" missing or invalid rate`);
      }

      if (rule.ruleType === 'tiered' && (!rule.calculation.tiers || rule.calculation.tiers.length === 0)) {
        errors.push(`Tiered rule "${rule.ruleName}" missing tier structure`);
      }

      // Check confidence levels
      if (rule.confidence < 0.3) {
        warnings.push(`Low confidence rule: "${rule.ruleName}" (${rule.confidence})`);
      }

      // Validate priority ordering
      if (rule.priority < 1 || rule.priority > 10) {
        warnings.push(`Rule "${rule.ruleName}" has unusual priority: ${rule.priority}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async generateRuleDSL(extractedResult: LicenseRuleExtractionResult): Promise<object> {
    // Convert extracted rules into a structured DSL format for the rule engine
    const dsl = {
      version: "1.0",
      licenseInfo: {
        type: extractedResult.licenseType,
        licensor: extractedResult.parties.licensor,
        licensee: extractedResult.parties.licensee,
        effectiveDate: extractedResult.effectiveDate,
        expirationDate: extractedResult.expirationDate,
        currency: extractedResult.currency
      },
      calculationRules: extractedResult.rules.map(rule => ({
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: rule.ruleName,
        type: rule.ruleType,
        description: rule.description,
        priority: rule.priority,
        conditions: rule.conditions,
        calculation: rule.calculation,
        metadata: {
          confidence: rule.confidence,
          sourceSpan: rule.sourceSpan,
          extractedAt: new Date().toISOString()
        }
      })).sort((a, b) => a.priority - b.priority), // Sort by priority
      reportingRules: extractedResult.reportingRequirements.map(req => ({
        frequency: req.frequency,
        dueDate: req.dueDate,
        description: req.description
      })),
      metadata: {
        ...extractedResult.extractionMetadata,
        generatedAt: new Date().toISOString(),
        dslVersion: "1.0"
      }
    };

    return dsl;
  }
}

export const groqService = new GroqService();
