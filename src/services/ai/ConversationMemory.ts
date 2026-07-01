import { AIMessage } from './AIProvider';

export class ConversationMemory {
  private maxMessages: number;

  constructor(maxMessages = 20) {
    this.maxMessages = maxMessages;
  }

  /**
   * Cleans and truncates a conversation history list to prevent context-window overflow.
   */
  public getBufferedHistory(history: AIMessage[]): AIMessage[] {
    // Truncate if history exceeds maximum context buffer limit
    if (history.length <= this.maxMessages) {
      return history;
    }
    // Always preserve initial system instructions if any, then take the last N messages
    const systemMsgs = history.filter(m => m.role === 'system');
    const conversationMsgs = history.filter(m => m.role !== 'system');
    const truncated = conversationMsgs.slice(-this.maxMessages);

    return [...systemMsgs, ...truncated];
  }

  /**
   * Formats the generic AIMessage history list specifically for Google Gemini SDK.
   * Gemini expects roles: 'user' or 'model' (it does not support 'assistant' or 'system' in Content array).
   * Note: System instructions are passed separately in the configuration options object.
   */
  public formatForGemini(history: AIMessage[]): { role: 'user' | 'model'; parts: { text: string }[] }[] {
    const buffered = this.getBufferedHistory(history);
    
    return buffered
      .filter(msg => msg.role !== 'system') // Filter out system messages as they go in model options
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
  }

  /**
   * Formats history for standard OpenAI ChatCompletion messages format (user, assistant, system).
   */
  public formatForOpenAI(history: AIMessage[]): { role: 'user' | 'assistant' | 'system'; content: string }[] {
    const buffered = this.getBufferedHistory(history);
    return buffered.map(msg => ({
      role: msg.role === 'user' ? 'user' : msg.role === 'system' ? 'system' : 'assistant',
      content: msg.content
    }));
  }
}
