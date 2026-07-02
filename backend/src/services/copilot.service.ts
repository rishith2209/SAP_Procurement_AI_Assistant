import { GoogleGenerativeAI } from '@google/generative-ai';

export interface CoPilotMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface CoPilotAttachment {
  name: string;
  size: string;
  type: string;
  base64Data?: string;
}

export class CoPilotService {
  private modelClient: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-1.5-flash';

  constructor() {
    const apiKey = process.env.COPILOT_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.modelClient = new GoogleGenerativeAI(apiKey);
    }
  }

  private hasKey(): boolean {
    return !!this.modelClient;
  }

  private getFallbackWarning(prompt: string): string {
    return `### 🟢 ERP Simulation Sandbox Mode
**System Note:** To unlock live backend responses, configure your API Key in the server environment:
1. Define the key in the backend \`.env\` file: \`COPILOT_API_KEY=your_api_key_here\`
2. Restart the Node server.

---

*Executing query against ERP local catalogs (Simulation Mode)...*

`;
  }

  private formatAttachments(attachments?: CoPilotAttachment[]): any[] {
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

  private formatHistory(history: CoPilotMessage[]): { role: 'user' | 'model'; parts: { text: string }[] }[] {
    return history
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
  }

  public async sendMessage(
    prompt: string,
    history: CoPilotMessage[],
    systemInstruction?: string,
    attachments?: CoPilotAttachment[]
  ): Promise<string> {
    if (!this.hasKey()) {
      return this.getFallbackWarning(prompt) + `Mock result for prompt: *"${prompt}"*. Verify your API configs.`;
    }

    try {
      const model = this.modelClient!.getGenerativeModel({
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
      console.error('Co-pilot Backend API Error:', err);
      return `🔴 **API Error:** Failed to fetch response.\n\n*Error details: ${err?.message || err}*`;
    }
  }
}

export const coPilotServiceInstance = new CoPilotService();
