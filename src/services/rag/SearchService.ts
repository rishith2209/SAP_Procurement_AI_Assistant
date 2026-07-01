import { RetrieverInstance } from './Retriever';
import { SimilarityResult } from './VectorStore';

export class SearchService {
  /**
   * Performs semantic query lookup over indexed chunks
   */
  public async searchIndex(queryText: string, topK = 4): Promise<SimilarityResult[]> {
    return RetrieverInstance.retrieve(queryText, topK);
  }
}
export const SearchServiceInstance = new SearchService();
