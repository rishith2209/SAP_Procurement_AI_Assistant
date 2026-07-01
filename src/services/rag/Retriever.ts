import { VectorStoreInstance, SimilarityResult } from './VectorStore';
import { getEmbeddingProvider } from './EmbeddingService';

export class Retriever {
  private minConfidence: number;

  constructor(minConfidence = 0.15) {
    this.minConfidence = minConfidence;
  }

  /**
   * Retrieves relevant chunks matching semantic query string
   */
  public async retrieve(queryText: string, topK = 4): Promise<SimilarityResult[]> {
    try {
      const provider = getEmbeddingProvider();
      
      // Calculate query vector
      const queryVector = await provider.getEmbedding(queryText);
      
      // Query index store
      const results = VectorStoreInstance.search(queryVector, topK);
      
      // Filter out records below minimum threshold
      return results.filter(res => res.score >= this.minConfidence);
    } catch (err) {
      console.error('Error during semantic chunk retrieval:', err);
      return [];
    }
  }
}
export const RetrieverInstance = new Retriever();
