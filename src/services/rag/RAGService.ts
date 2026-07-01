import { DocProcessorInstance } from './DocumentProcessor';
import { ChunkingInstance, DocumentChunk } from './ChunkingService';
import { getEmbeddingProvider } from './EmbeddingService';
import { VectorStoreInstance, SimilarityResult } from './VectorStore';
import { ContextBuilderInstance } from './ContextBuilder';
import { RetrieverInstance } from './Retriever';

export class RAGService {
  private isProcessing = false;
  private currentProgress = 0;

  public getStatus(): { isProcessing: boolean; progress: number } {
    return { isProcessing: this.isProcessing, progress: this.currentProgress };
  }

  /**
   * Main entry point to index a new or changed document
   */
  public async indexDocument(
    file: File,
    category: 'Purchase Orders' | 'Invoices' | 'Vendors' | 'Reports' | 'Unsorted'
  ): Promise<DocumentChunk[]> {
    this.isProcessing = true;
    this.currentProgress = 10; // Start progress indicator

    try {
      // 1. Extract structured text from file
      const doc = await DocProcessorInstance.extractText(file);
      this.currentProgress = 30;

      const textHash = VectorStoreInstance.generateHash(doc.text);

      // 2. Check if identical document content is already cached to avoid redundant embedding calls
      const cachedVectors = VectorStoreInstance.getCachedIndex(doc.id, textHash);
      
      // Chunk document
      const chunks = ChunkingInstance.chunkDocument(
        doc.id,
        doc.name,
        category,
        doc.uploadedAt,
        doc.pages,
        doc.sections
      );
      this.currentProgress = 50;

      // Clear any legacy indexing for this file to handle re-indexes cleanly
      VectorStoreInstance.removeDocument(doc.id);

      if (cachedVectors && cachedVectors.length === chunks.length) {
        // Hydrate from cache immediately
        chunks.forEach((chunk, index) => {
          VectorStoreInstance.addRecord(chunk, cachedVectors[index]);
        });
        this.currentProgress = 100;
        this.isProcessing = false;
        return chunks;
      }

      // 3. Compute vector embeddings for all chunks
      const chunkTexts = chunks.map(c => c.text);
      const embeddingProvider = getEmbeddingProvider();
      
      this.currentProgress = 70;
      const vectors = await embeddingProvider.getEmbeddings(chunkTexts);
      
      this.currentProgress = 90;

      // 4. Index records in VectorStore
      chunks.forEach((chunk, index) => {
        VectorStoreInstance.addRecord(chunk, vectors[index]);
      });

      // 5. Cache calculated vectors to optimize subsequent re-indexes
      VectorStoreInstance.setCacheIndex(doc.id, textHash, vectors);

      this.currentProgress = 100;
      this.isProcessing = false;
      return chunks;
    } catch (err) {
      this.isProcessing = false;
      this.currentProgress = 0;
      console.error(`RAG Indexing failure on ${file.name}:`, err);
      throw err;
    }
  }

  /**
   * Removes a document from the indexed vector store
   */
  public deleteDocument(docId: string): void {
    VectorStoreInstance.removeDocument(docId);
  }

  /**
   * Search vector store and build the combined context window prompt
   */
  public async retrieveAndBuildPrompt(
    userQuery: string,
    sapErpData?: string
  ): Promise<{ assembledPrompt: string; retrievedChunks: SimilarityResult[] }> {
    // Search top 3 relevant chunks
    const retrievedChunks = await RetrieverInstance.retrieve(userQuery, 3);
    
    // Assemble context window prompt
    const assembledPrompt = ContextBuilderInstance.assemblePrompt(
      userQuery,
      retrievedChunks,
      sapErpData
    );

    return { assembledPrompt, retrievedChunks };
  }
}
export const RAGInstance = new RAGService();
