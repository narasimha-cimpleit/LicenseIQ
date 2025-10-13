/**
 * RAG (Retrieval Augmented Generation) Service
 * Combines semantic search with Groq LLaMA for intelligent contract Q&A
 */

import { HuggingFaceEmbeddingService } from './huggingFaceEmbedding';
import { SemanticSearchService } from './semanticSearchService';
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
      
      // Step 1: Generate embedding for the question
      const { embedding } = await HuggingFaceEmbeddingService.generateEmbedding(question);
      
      // Step 2: Find relevant contract sections using semantic search
      const matches = await SemanticSearchService.findMatchingContracts(question, {
        minSimilarity: 0.3,
        limit: 5,
      });
      
      // Filter by contract if specified
      const filteredMatches = contractId
        ? matches.filter(m => m.contractId === contractId)
        : matches;
      
      if (filteredMatches.length === 0) {
        return {
          answer: "I couldn't find any relevant information in the contracts to answer your question.",
          sources: [],
          confidence: 0,
        };
      }
      
      // Step 3: Get contract details for context
      const contractIds = Array.from(new Set(filteredMatches.map(m => m.contractId)));
      const contractDetails = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, contractIds[0])); // For now, use the most relevant contract
      
      // Step 4: Build context from relevant sections
      const context = filteredMatches
        .slice(0, 3)
        .map((match, i) => `[${i + 1}] ${match.sourceText}`)
        .join('\n\n');
      
      // Step 5: Generate answer using Groq LLaMA
      const answer = await this.generateAnswer(question, context);
      
      // Step 6: Build response with sources
      const sources = filteredMatches.slice(0, 3).map(match => ({
        contractId: match.contractId,
        contractName: contractDetails.find(c => c.id === match.contractId)?.originalName || 'Unknown Contract',
        relevantText: match.sourceText.substring(0, 200) + '...',
        similarity: match.similarity,
      }));
      
      const avgConfidence = sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length;
      
      console.log(`✅ [RAG] Answer generated with ${sources.length} sources (avg confidence: ${(avgConfidence * 100).toFixed(1)}%)`);
      
      return {
        answer,
        sources,
        confidence: avgConfidence,
      };
      
    } catch (error: any) {
      console.error('RAG query error:', error);
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }
  
  /**
   * Generate answer using Groq LLaMA based on retrieved context
   */
  private static async generateAnswer(question: string, context: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }
    
    const systemPrompt = `You are an expert contract analyst assistant. Answer questions about contracts based ONLY on the provided context. 

Rules:
1. Use ONLY information from the provided context
2. If the context doesn't contain the answer, say "I don't have enough information to answer that"
3. Be concise and precise
4. Cite specific sections when possible (e.g., "According to the agreement...")
5. If you're uncertain, indicate that clearly`;

    const userPrompt = `Context from contracts:
${context}

Question: ${question}

Answer:`;

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
        temperature: 0.3,
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
}
