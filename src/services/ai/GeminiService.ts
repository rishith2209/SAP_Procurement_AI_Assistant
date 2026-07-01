import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIMessage, AIAttachment } from './AIProvider';
import { ConversationMemory } from './ConversationMemory';

export class GeminiService implements AIProvider {
  private apiKey: string | undefined;
  private genAI: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-1.5-flash';
  private memory: ConversationMemory;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
    this.memory = new ConversationMemory();
  }

  public getProviderName(): string {
    return 'Google Gemini';
  }

  /**
   * Helper to format attachments into Gemini base64 part objects
   */
  private formatAttachments(attachments?: AIAttachment[]): any[] {
    if (!attachments) return [];
    return attachments
      .filter(att => att.base64Data)
      .map(att => {
        // Remove data URL prefix if present e.g. "data:application/pdf;base64,"
        const base64Clean = att.base64Data!.replace(/^data:.*?;base64,/, '');
        return {
          inlineData: {
            data: base64Clean,
            mimeType: att.type
          }
        };
      });
  }

  /**
   * Safe check for active API Key.
   */
  private hasKey(): boolean {
    return !!this.genAI;
  }

  /**
   * Return sandbox fallback warning instructions
   */
  private getFallbackWarning(prompt: string): string {
    return `### 🟢 ERP Simulation Sandbox Mode
**System Note:** To unlock live AI responses, configure your Google Gemini API Key in the environment:
1. Create a \`.env\` file in the project root directory.
2. Define the key: \`VITE_GEMINI_API_KEY=your_gemini_api_key_here\`
3. Restart the server.

---

*Executing query against ERP local catalogs (Simulation Mode)...*

`;
  }

  public async sendMessage(
    prompt: string,
    history: AIMessage[],
    systemInstruction?: string,
    attachments?: AIAttachment[]
  ): Promise<string> {
    if (!this.hasKey()) {
      // Graceful fallback
      return this.getFallbackWarning(prompt) + "No API Key configured. Please verify your .env file.";
    }

    try {
      const model = this.genAI!.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemInstruction,
      });

      const formattedHistory = this.memory.formatForGemini(history);
      
      // Separate base64 files
      const fileParts = this.formatAttachments(attachments);

      const chat = model.startChat({
        history: formattedHistory,
      });

      // Send the message combined with base64 file parts if present
      const result = await chat.sendMessage([prompt, ...fileParts]);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      return `🔴 **API Error:** Failed to fetch Gemini response. Check network connection or API key validity.\n\n*Error details: ${err?.message || err}*`;
    }
  }

  public async streamMessage(
    prompt: string,
    history: AIMessage[],
    onChunk: (chunk: string) => void,
    systemInstruction?: string,
    attachments?: AIAttachment[]
  ): Promise<string> {
    if (!this.hasKey()) {
      // Simulate streaming fallback delay
      const warn = this.getFallbackWarning(prompt);
      const simulatedText = `I processed your request concerning: *"${prompt}"*. All ERP items are checked.`;
      
      // Emit warning first
      onChunk(warn);
      
      // Stream characters gradually
      let current = '';
      for (let i = 0; i < simulatedText.length; i += 3) {
        const chunk = simulatedText.slice(i, i + 3);
        current += chunk;
        onChunk(warn + current);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      return warn + simulatedText;
    }

    try {
      const model = this.genAI!.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemInstruction,
      });

      const formattedHistory = this.memory.formatForGemini(history);
      const fileParts = this.formatAttachments(attachments);

      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessageStream([prompt, ...fileParts]);
      let completeResponse = '';

      for await (const chunk of result.stream) {
        const text = chunk.text();
        completeResponse += text;
        onChunk(completeResponse);
      }

      return completeResponse;
    } catch (err: any) {
      console.error('Gemini Stream Error:', err);
      const errText = `🔴 **API Streaming Error:** Connection aborted.\n\n*Details: ${err?.message || err}*`;
      onChunk(errText);
      return errText;
    }
  }
}
export const GeminiProviderInstance = new GeminiService();
