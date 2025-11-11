/**
 * RAG (Retrieval Augmented Generation) Service
 * Combines semantic search with Groq LLaMA for intelligent contract Q&A
 */

import { HuggingFaceEmbeddingService } from './huggingFaceEmbedding';
import { SemanticSearchService } from './semanticSearchService';
import { SystemSearchService } from './systemSearchService';
import { db } from '../db';
import { contracts } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface RAGQueryResult {
  answer: string;
  sources: Array<{
    contractId: string;
    contractName: string;
    relevantText: string;
    similarity: number;
  }>;
  confidence: number;
}

export class RAGService {
  /**
   * Answer a question about contracts using RAG
   */
  static async answerQuestion(
    question: string,
    contractId?: string
  ): Promise<RAGQueryResult> {
    try {
      console.log(`🤖 [RAG] Answering question: "${question}"`);
      
      // Step 1: Search both contract documents AND system documentation
      const [contractMatches, systemMatches] = await Promise.all([
        SemanticSearchService.findMatchingContracts(question, {
          minSimilarity: 0.4,
          limit: 8,
        }),
        SystemSearchService.findMatchingDocumentation(question, {
          minSimilarity: 0.5,
          limit: 5,
        }),
      ]);
      
      console.log(`📊 [RAG] Found ${contractMatches.length} contract matches, ${systemMatches.length} system docs matches`);
      
      // Step 2: Determine if this is a platform question or contract question
      // Use platform docs if: (1) no contract matches exist, OR (2) system match is strong (>0.7), OR (3) system similarity beats contract similarity
      const isPlatformQuestion = systemMatches.length > 0 && 
        (contractMatches.length === 0 || 
         systemMatches[0].similarity > 0.7 || 
         systemMatches[0].similarity > (contractMatches[0]?.similarity || 0));
      
      // Step 3: Build context from the most relevant source
      let context: string;
      let sources: any[];
      let confidence: number;
      
      if (isPlatformQuestion) {
        // Answer about the LicenseIQ platform itself
        console.log(`🏢 [RAG] Platform question detected - using system documentation`);
        context = systemMatches
          .slice(0, 5)
          .map((match, i) => `[${match.title}] ${match.sourceText}`)
          .join('\n\n');
        
        sources = systemMatches.slice(0, 3).map(match => ({
          contractId: 'system',
          contractName: `LicenseIQ Platform: ${match.category}`,
          relevantText: match.sourceText.substring(0, 200) + '...',
          similarity: match.similarity,
        }));
        
        confidence = systemMatches[0]?.similarity || 0.8;
      } else {
        // Answer about uploaded contracts
        console.log(`📄 [RAG] Contract question detected - using contract documents`);
        
        // Filter by contract if specified
        const filteredMatches = contractId
          ? contractMatches.filter(m => m.contractId === contractId)
          : contractMatches;
        
        if (filteredMatches.length === 0) {
          return {
            answer: "I couldn't find any relevant information in the contracts to answer your question.",
            sources: [],
            confidence: 0,
          };
        }
        
        context = filteredMatches
          .slice(0, 8)
          .map((match, i) => `[Section ${i + 1}] ${match.sourceText}`)
          .join('\n\n');
        
        // Get contract details for sources
        const contractIds = Array.from(new Set(filteredMatches.map(m => m.contractId)));
        const contractDetails = await db
          .select()
          .from(contracts)
          .where(eq(contracts.id, contractIds[0]));
        
        sources = filteredMatches.slice(0, 3).map(match => {
          let textContent = '';
          if (typeof match.sourceText === 'string') {
            textContent = match.sourceText;
          } else if (match.sourceText && typeof match.sourceText === 'object') {
            textContent = JSON.stringify(match.sourceText);
          }
          
          return {
            contractId: match.contractId,
            contractName: contractDetails.find(c => c.id === match.contractId)?.originalName || 'Unknown Contract',
            relevantText: textContent ? textContent.substring(0, 200) + '...' : 'No text available',
            similarity: match.similarity,
          };
        });
        
        confidence = sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length;
      }
      
      // Step 4: Generate answer using Groq LLaMA
      const answer = await this.generateAnswer(question, context);
      
      console.log(`✅ [RAG] Answer generated with ${sources.length} sources (confidence: ${(confidence * 100).toFixed(1)}%)`);
      
      return {
        answer,
        sources,
        confidence,
      };
      
    } catch (error: any) {
      console.error('RAG query error:', error);
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }
  
  /**
   * Fallback: Generate answer from full contract when RAG confidence is low
   */
  private static async generateAnswerFromFullContract(question: string, contractId: string): Promise<string> {
    try {
      console.log(`📄 [RAG-FALLBACK] Starting full contract analysis for contract: ${contractId}`);
      
      // Import needed here to avoid circular dependency
      const { contractAnalysis } = await import('@shared/schema');
      
      // Get the full contract analysis
      const contractDetails = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, contractId))
        .limit(1);
      
      console.log(`📄 [RAG-FALLBACK] Found ${contractDetails.length} contracts`);
      
      if (contractDetails.length === 0) {
        console.log(`❌ [RAG-FALLBACK] Contract not found: ${contractId}`);
        return "I couldn't find the contract to answer your question.";
      }
      
      const contract = contractDetails[0];
      console.log(`📄 [RAG-FALLBACK] Contract name: ${contract.originalName}`);
      
      // Get the analysis data
      const analysisData = await db
        .select()
        .from(contractAnalysis)
        .where(eq(contractAnalysis.contractId, contractId))
        .limit(1);
      
      console.log(`📄 [RAG-FALLBACK] Found ${analysisData.length} analysis records`);
      
      if (analysisData.length === 0) {
        console.log(`❌ [RAG-FALLBACK] No analysis found for contract: ${contractId}`);
        return "The contract hasn't been analyzed yet. Please wait for the analysis to complete.";
      }
      
      const analysis = analysisData[0];
      
      // Build comprehensive context from analysis
      const fullContext = `
Contract: ${contract.originalName}
Summary: ${analysis.summary || 'N/A'}
Key Terms: ${typeof analysis.keyTerms === 'string' ? analysis.keyTerms : JSON.stringify(analysis.keyTerms)}
Insights: ${typeof analysis.insights === 'string' ? analysis.insights : JSON.stringify(analysis.insights)}
      `.trim();
      
      console.log(`📄 [RAG-FALLBACK] Context length: ${fullContext.length} chars`);
      console.log(`📄 [RAG-FALLBACK] Asking Groq with full contract context...`);
      
      // Ask Groq with full contract context using a more lenient prompt
      const answer = await this.generateFallbackAnswer(question, fullContext);
      console.log(`✅ [RAG-FALLBACK] Answer generated: ${answer.substring(0, 100)}...`);
      
      return answer;
      
    } catch (error: any) {
      console.error('❌ [RAG-FALLBACK] Error:', error);
      console.error('❌ [RAG-FALLBACK] Stack:', error.stack);
      return "I encountered an error while analyzing the contract. Please try again.";
    }
  }
  
  /**
   * Generate answer from full contract (fallback mode - more lenient)
   */
  private static async generateFallbackAnswer(question: string, context: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }
    
    const systemPrompt = `You are an expert contract analyst assistant. You have been provided with comprehensive information from a contract analysis. Answer the user's question using the available information.

Rules:
1. Use all relevant information from the provided context to answer the question
2. Be helpful and provide the best answer possible based on the available information
3. If the exact answer isn't available, provide related information that might help
4. Be concise but thorough
5. Cite specific sections when possible (e.g., "According to the contract summary...")`;

    const userPrompt = `Complete Contract Information:
${context}

User Question: ${question}

Provide a helpful answer based on the contract information above:`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
  
  /**
   * Generate answer using Groq LLaMA based on retrieved context
   */
  private static async generateAnswer(question: string, context: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }
    
    const systemPrompt = `You are an expert contract analyst assistant with deep knowledge of licensing agreements, royalty structures, and contract terms. Your job is to provide accurate, helpful answers based ONLY on the contract information provided.

CRITICAL RULES:
1. ONLY use information explicitly stated in the provided contract sections
2. If the provided sections don't contain enough information to answer the question, clearly state: "I don't have enough information in the provided contract sections to answer that question accurately"
3. DO NOT speculate or infer beyond what is explicitly written in the contract
4. Be specific - cite exact numbers, percentages, dates, and terms from the contract sections
5. If information spans multiple sections, synthesize them into a comprehensive answer
6. Clearly distinguish between direct quotes from the contract and your interpretation
7. Format your answer in a clear, professional manner with specific citations`;

    const userPrompt = `I have extracted the following relevant sections from the contract documents:

${context}

Based ONLY on the information in these contract sections, please answer the following question:
${question}

IMPORTANT: Only provide information that is explicitly stated in the sections above. If the answer is not in these sections, clearly state that you don't have enough information. Cite specific sections when possible.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
}
