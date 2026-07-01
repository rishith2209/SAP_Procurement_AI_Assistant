import { DocumentChunk } from './ChunkingService';

export interface IndexedRecord {
  chunk: DocumentChunk;
  vector: number[];
}

export interface SimilarityResult {
  chunk: DocumentChunk;
  score: number;
}

export class VectorStore {
  private index: Record<string, IndexedRecord> = {};
  // Cache to avoid recalculating unchanged document embeddings
  private embeddingCache: Record<string, { hash: string; vectors: number[][] }> = {};

  /**
   * Generates a simple checksum hash for a string to identify modified files
   */
  public generateHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  public getCachedIndex(docId: string, currentHash: string): number[][] | null {
    const cached = this.embeddingCache[docId];
    if (cached && cached.hash === currentHash) {
      return cached.vectors;
    }
    return null;
  }

  public setCacheIndex(docId: string, hash: string, vectors: number[][]) {
    this.embeddingCache[docId] = { hash, vectors };
  }

  /**
   * Adds parsed chunks and their corresponding vectors to the index.
   */
  public addRecord(chunk: DocumentChunk, vector: number[]) {
    this.index[chunk.id] = { chunk, vector };
  }

  /**
   * Clear indexed chunks corresponding to a deleted or re-indexed document
   */
  public removeDocument(docId: string) {
    Object.keys(this.index).forEach(key => {
      if (this.index[key].chunk.documentId === docId) {
        delete this.index[key];
      }
    });
  }

  /**
   * Core cosine similarity search using dot product of L2 normalized vectors
   */
  public search(queryVector: number[], topK = 4): SimilarityResult[] {
    const results: SimilarityResult[] = [];
    const indexRecords = Object.values(this.index);

    if (indexRecords.length === 0 || queryVector.length === 0) {
      return [];
    }

    indexRecords.forEach(record => {
      const docVector = record.vector;
      
      // Calculate dot product (L2 vectors require no magnitude division)
      let dotProduct = 0;
      const len = Math.min(queryVector.length, docVector.length);
      
      for (let i = 0; i < len; i++) {
        dotProduct += queryVector[i] * docVector[i];
      }

      results.push({
        chunk: record.chunk,
        score: dotProduct
      });
    });

    // Sort descending by score
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  public clearAll() {
    this.index = {};
    this.embeddingCache = {};
  }
}
export const VectorStoreInstance = new VectorStore();
