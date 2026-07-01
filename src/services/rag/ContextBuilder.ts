import { SimilarityResult } from './VectorStore';

export class ContextBuilder {
  /**
   * Constructs the injected context prompt block
   */
  public buildContext(
    retrievedChunks: SimilarityResult[],
    sapErpData?: string
  ): string {
    let contextBlock = '';

    // 1. Append Document Context
    if (retrievedChunks.length > 0) {
      contextBlock += `### 📄 RETRIEVED DOCUMENT CONTEXT (RAG):
The following excerpts were parsed from relevant corporate compliance contracts and policy documents:

`;
      retrievedChunks.forEach((res, index) => {
        contextBlock += `SOURCE [${index + 1}]: "${res.chunk.filename}" (Page ${res.chunk.pageNumber}, Section: "${res.chunk.section}", Confidence Score: ${(res.score * 100).toFixed(0)}%)
MATCHED EXCERPT:
"""
${res.chunk.text}
"""

`;
      });
    }

    // 2. Append ERP database records context
    if (sapErpData) {
      contextBlock += `### 📊 S/4HANA ERP DATABASE RECORDS CONTEXT:
The following live database values were extracted from active ERP tables:
${sapErpData}

`;
    }

    return contextBlock;
  }

  /**
   * Assembles the optimized prompt for model submission
   */
  public assemblePrompt(
    userQuery: string,
    retrievedChunks: SimilarityResult[],
    sapErpData?: string
  ): string {
    const context = this.buildContext(retrievedChunks, sapErpData);
    
    if (!context) return userQuery;

    return `${context}
---
### INSTRUCTION FOR THE RESPONSE:
Answer the user's inquiry using the retrieved context blocks and ERP transaction records provided above. 
If the retrieved documents contain information to answer the question, prioritize it. 
If the records are insufficient, specify that clearly.

USER INQUIRY:
"${userQuery}"`;
  }
}
export const ContextBuilderInstance = new ContextBuilder();
