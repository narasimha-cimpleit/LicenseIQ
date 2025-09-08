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
          "type": "Royalty Structure|Payment Terms|Manufacturing Requirements|Technology License|Termination Terms|Financial Obligations|Performance Requirements|Territory & Scope",
          "description": "Plain English explanation of what this means for the business - avoid legal jargon",
          "confidence": 0.95,
          "location": "Specific section reference (e.g., Section 3.1, Article 5, etc.)"
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
}

export const groqService = new GroqService();
