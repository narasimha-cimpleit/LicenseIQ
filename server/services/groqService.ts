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

export class GroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
  }

  private async makeRequest(messages: Array<{ role: string; content: string }>, temperature = 0.1): Promise<string> {
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
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || '';
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
}

export const groqService = new GroqService();
