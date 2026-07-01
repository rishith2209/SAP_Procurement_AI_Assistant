export interface DocumentChunk {
  id: string;
  documentId: string;
  filename: string;
  pageNumber: number;
  section: string;
  text: string;
  uploadDate: string;
  category: string;
  metadata: Record<string, any>;
}

export class ChunkingService {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize = 600, chunkOverlap = 120) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  /**
   * Slices extracted document pages into semantic overlap chunks
   */
  public chunkDocument(
    docId: string,
    filename: string,
    category: string,
    uploadDate: string,
    pages: { pageNumber: number; text: string }[],
    sections: { title: string; text: string }[]
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let chunkCount = 1;

    // Process page by page
    pages.forEach(page => {
      const pageText = page.text;
      const length = pageText.length;
      
      // Locate section heading active in this page
      let activeSection = 'Overview';
      for (const sec of sections) {
        if (sec.text.includes(pageText.slice(0, 100))) {
          activeSection = sec.title;
          break;
        }
      }

      let start = 0;
      while (start < length) {
        const end = Math.min(start + this.chunkSize, length);
        let chunkText = pageText.slice(start, end).trim();

        // Adjust boundaries to end at nearest word boundary
        if (end < length) {
          const nextSpace = pageText.indexOf(' ', end);
          if (nextSpace !== -1 && nextSpace - end < 15) {
            chunkText = pageText.slice(start, nextSpace).trim();
          }
        }

        const chunkId = `${docId}-CHUNK-${chunkCount++}`;

        chunks.push({
          id: chunkId,
          documentId: docId,
          filename,
          pageNumber: page.pageNumber,
          section: activeSection,
          text: chunkText,
          uploadDate,
          category,
          metadata: {
            chunkSizeRaw: chunkText.length,
            startCharOffset: start,
          }
        });

        // Advance start by window size minus overlap
        start += this.chunkSize - this.chunkOverlap;
        if (start >= length) break;
      }
    });

    return chunks;
  }
}
export const ChunkingInstance = new ChunkingService();
