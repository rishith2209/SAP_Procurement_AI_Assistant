export interface AIMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface AIAttachment {
  name: string;
  size: string;
  type: string;
  base64Data?: string; // Optional raw file data for image multimodality
}

export interface AIProvider {
  /**
   * Sends a message to the model and returns the completed text response.
   */
  sendMessage(
    prompt: string,
    history: AIMessage[],
    systemInstruction?: string,
    attachments?: AIAttachment[]
  ): Promise<string>;

  /**
   * Sends a message and triggers the callback for every streamed chunk of text.
   */
  streamMessage(
    prompt: string,
    history: AIMessage[],
    onChunk: (chunk: string) => void,
    systemInstruction?: string,
    attachments?: AIAttachment[]
  ): Promise<string>;

  /**
   * Returns the configuration ID of the provider.
   */
  getProviderName(): string;
}
