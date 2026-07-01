import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface AIAttachment {
  name: string;
  size: string;
  type: string;
  base64Data?: string;
}

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-1.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  private hasKey(): boolean {
    return !!this.genAI;
  }

  private getFallbackWarning(prompt: string): string {
    return `### 🟢 ERP Simulation Sandbox Mode
**System Note:** To unlock live backend AI responses, configure your Gemini API Key in the server environment:
1. Define the key in the backend \`.env\` file: \`GEMINI_API_KEY=your_gemini_api_key_here\`
2. Restart the Node server.

---

*Executing query against ERP local catalogs (Simulation Mode)...*

`;
  }

  /**
   * Helper to format attachments into Gemini base64 part objects
   */
  private formatAttachments(attachments?: AIAttachment[]): any[] {
    if (!attachments) return [];
    return attachments
      .filter(att => att.base64Data)
      .map(att => {
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
   * Formats chat history into Gemini parts array
   */
  private formatHistory(history: AIMessage[]): { role: 'user' | 'model'; parts: { text: string }[] }[] {
    return history
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
  }

  public async sendMessage(
    prompt: string,
    history: AIMessage[],
    systemInstruction?: string,
    attachments?: AIAttachment[]
  ): Promise<string> {
    if (!this.hasKey()) {
      return this.getFallbackWarning(prompt) + `Mock AI result for prompt: *"${prompt}"*. Verify your API configs.`;
    }

    try {
      const model = this.genAI!.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemInstruction,
      });

      const formattedHistory = this.formatHistory(history);
      const fileParts = this.formatAttachments(attachments);

      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessage([prompt, ...fileParts]);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      console.error('Gemini Backend API Error:', err);
      return `🔴 **API Error:** Failed to fetch Gemini response.\n\n*Error details: ${err?.message || err}*`;
    }
  }
}

export const aiServiceInstance = new AIService();
