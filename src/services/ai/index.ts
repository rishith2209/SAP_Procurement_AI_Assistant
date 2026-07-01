import { AIProvider, AIMessage, AIAttachment } from './AIProvider';
import { GeminiProviderInstance } from './GeminiService';

export * from './AIProvider';
export * from './PromptTemplates';
export * from './ConversationMemory';
export * from './GeminiService';

// Placeholder OpenAI Provider
class OpenAIProvider implements AIProvider {
  public getProviderName(): string {
    return 'OpenAI GPT-4';
  }

  public async sendMessage(): Promise<string> {
    return '### 🟡 OpenAI Provider Blocked\nOpenAI GPT-4 integration is configured but not active. Please switch the provider in configuration classes.';
  }

  public async streamMessage(prompt: string, history: AIMessage[], onChunk: (chunk: string) => void): Promise<string> {
    const text = '### 🟡 OpenAI Provider Blocked\nOpenAI GPT-4 integration is configured but not active.';
    onChunk(text);
    return text;
  }
}

// Placeholder SAP Generative AI Hub Provider
class SAPGenerativeAIHubProvider implements AIProvider {
  public getProviderName(): string {
    return 'SAP Generative AI Hub';
  }

  public async sendMessage(): Promise<string> {
    return '### 🟡 SAP Generative AI Hub Blocked\nSAP Generative AI Hub integration is configured but not active. Ensure connection routes are mapped.';
  }

  public async streamMessage(prompt: string, history: AIMessage[], onChunk: (chunk: string) => void): Promise<string> {
    const text = '### 🟡 SAP Generative AI Hub Blocked\nSAP Generative AI Hub integration is configured but not active.';
    onChunk(text);
    return text;
  }
}

export const OpenAIProviderInstance = new OpenAIProvider();
export const SAPHubProviderInstance = new SAPGenerativeAIHubProvider();

// Active provider registry
const PROVIDERS: Record<string, AIProvider> = {
  gemini: GeminiProviderInstance,
  openai: OpenAIProviderInstance,
  sap_hub: SAPHubProviderInstance,
};

/**
 * AI Provider Factory to swap providers at runtime
 */
export const getAIProvider = (providerId = 'gemini'): AIProvider => {
  const provider = PROVIDERS[providerId];
  if (!provider) {
    throw new Error(`AI Provider "${providerId}" is not registered in the system registry.`);
  }
  return provider;
};
