import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EmbeddingProvider {
  getEmbedding(text: string): Promise<number[]>;
  getEmbeddings(texts: string[]): Promise<number[][]>;
  getProviderName(): string;
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private modelName = 'text-embedding-004';
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  public getProviderName(): string {
    return 'Google Gemini Embeddings';
  }

  public async getEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) throw new Error('Gemini API key is not configured.');
    
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  public async getEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.genAI) throw new Error('Gemini API key is not configured.');
    
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const result = await model.batchEmbedContents({
      requests: texts.map(text => ({
        content: { role: 'user', parts: [{ text }] },
        model: `models/${this.modelName}`
      }))
    });
    
    return result.embeddings.map(e => e.values);
  }
}

/**
 * Local dynamic TF-IDF Vectorizer
 * Serves as a robust local vector math fallback in the sandbox when no API key exists.
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  private vocabulary: Set<string> = new Set();
  private docFrequencies: Record<string, number> = {};
  private docCount = 0;

  constructor() {
    // Seed vocabulary with standard procurement terms
    const seed = [
      'purchase', 'order', 'requisition', 'invoice', 'supplier', 'vendor',
      'limit', 'approval', 'director', 'manager', 'signing', 'threshold',
      'contract', 'agreement', 'discrepancy', 'matching', 'tax', 'terms',
      'payment', 'schedule', 'policy', 'audit', 'compliance', 'cfo', 'ceo'
    ];
    seed.forEach(w => this.vocabulary.add(w));
  }

  public getProviderName(): string {
    return 'Local TF-IDF Vectorizer';
  }

  /**
   * Refreshes vocabulary mapping with new document chunk list to improve local semantic accuracy
   */
  public updateVocabulary(texts: string[]) {
    this.docCount = texts.length;
    this.vocabulary = new Set();
    this.docFrequencies = {};

    texts.forEach(text => {
      const words = this.tokenize(text);
      const uniqueInDoc = new Set(words);
      
      uniqueInDoc.forEach(w => {
        this.vocabulary.add(w);
        this.docFrequencies[w] = (this.docFrequencies[w] || 0) + 1;
      });
    });
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2); // filter short filler words
  }

  public async getEmbedding(text: string): Promise<number[]> {
    const tokens = this.tokenize(text);
    const tf: Record<string, number> = {};
    tokens.forEach(t => {
      tf[t] = (tf[t] || 0) + 1;
    });

    const vocabList = Array.from(this.vocabulary);
    const vector = vocabList.map(word => {
      const termFreq = tf[word] || 0;
      if (termFreq === 0) return 0;
      
      // IDF math
      const docFreq = this.docFrequencies[word] || 1;
      const idf = Math.log((1 + this.docCount) / (1 + docFreq)) + 1;
      return termFreq * idf;
    });

    // L2 Normalization
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return new Array(vocabList.length).fill(0);
    return vector.map(v => v / magnitude);
  }

  public async getEmbeddings(texts: string[]): Promise<number[][]> {
    this.updateVocabulary(texts);
    return Promise.all(texts.map(text => this.getEmbedding(text)));
  }
}

export const GeminiEmbeddingInstance = new GeminiEmbeddingProvider();
export const LocalEmbeddingInstance = new LocalEmbeddingProvider();

export const getEmbeddingProvider = (): EmbeddingProvider => {
  const hasKey = !!import.meta.env.VITE_GEMINI_API_KEY;
  return hasKey ? GeminiEmbeddingInstance : LocalEmbeddingInstance;
};
