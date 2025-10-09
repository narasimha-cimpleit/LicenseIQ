/**
 * Hugging Face Embedding Service
 * Uses sentence-transformers/all-MiniLM-L6-v2 model (384 dimensions)
 * 100% FREE with Hugging Face Inference API
 */

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export class HuggingFaceEmbeddingService {
  private static readonly API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';
  private static readonly MODEL_DIMENSIONS = 384;

  /**
   * Generate embedding for a single text using Hugging Face
   * Returns 384-dimensional vector
   */
  static async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const apiKey = process.env.HUGGINGFACE_API_KEY;
      if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY is not set');
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
      }

      const embedding = await response.json();

      // HuggingFace returns the embedding directly as an array
      return {
        embedding: Array.isArray(embedding) ? embedding : embedding[0],
        tokens: Math.ceil(text.length / 4), // Rough token estimate
      };
    } catch (error: any) {
      console.error('HuggingFace embedding error:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  static async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    // HuggingFace free tier processes sequentially to avoid rate limits
    const results: EmbeddingResult[] = [];
    
    for (const text of texts) {
      const result = await this.generateEmbedding(text);
      results.push(result);
      // Small delay to respect rate limits (1000 requests/hour = 1 per 3.6 seconds)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Prepare text for embedding by cleaning and normalizing
   */
  static prepareText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,;:!?-]/g, '') // Remove special characters but keep punctuation
      .slice(0, 5000); // Keep it reasonable for the model
  }

  /**
   * Create searchable text from contract data
   */
  static createContractSearchText(data: {
    productDescription?: string;
    productCategories?: string[];
    territories?: string[];
    contractType?: string;
    additionalTerms?: string[];
  }): string {
    const parts: string[] = [];

    if (data.productDescription) {
      parts.push(data.productDescription);
    }

    if (data.productCategories && data.productCategories.length > 0) {
      parts.push(`Products: ${data.productCategories.join(', ')}`);
    }

    if (data.territories && data.territories.length > 0) {
      parts.push(`Territories: ${data.territories.join(', ')}`);
    }

    if (data.contractType) {
      parts.push(`Type: ${data.contractType}`);
    }

    if (data.additionalTerms && data.additionalTerms.length > 0) {
      parts.push(data.additionalTerms.join('; '));
    }

    return parts.join('. ');
  }

  /**
   * Create searchable text from sales data
   */
  static createSalesSearchText(data: {
    productCode?: string;
    productName?: string;
    category?: string;
    territory?: string;
  }): string {
    const parts: string[] = [];

    if (data.productName) {
      parts.push(data.productName);
    }

    if (data.productCode) {
      parts.push(`Code: ${data.productCode}`);
    }

    if (data.category) {
      parts.push(`Category: ${data.category}`);
    }

    if (data.territory) {
      parts.push(`Territory: ${data.territory}`);
    }

    return parts.join('. ');
  }

  /**
   * Get the embedding dimensions for this model
   */
  static getDimensions(): number {
    return this.MODEL_DIMENSIONS;
  }
}
