import { ChatMessage, ChatConversation } from '../types';

const BASE_URL = 'http://localhost:5000/api/v1';

const getHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('sap_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export interface CoPilotServiceInterface {
  sendMessage(
    conversationId: string,
    content: string,
    attachments?: { name: string; size: string; type: string; base64Data?: string }[]
  ): Promise<ChatMessage>;
  getConversations(): Promise<ChatConversation[]>;
  createConversation(title?: string): Promise<ChatConversation>;
}

export const CoPilotService: CoPilotServiceInterface = {
  getConversations: async (): Promise<ChatConversation[]> => {
    try {
      const res = await fetch(`${BASE_URL}/chats/conversations`, {
        method: 'GET',
        headers: getHeaders()
      });
      const json = await res.json();
      if (!res.ok || json.status === 'error') {
        throw new Error(json.message || 'Failed to fetch conversations.');
      }
      return json.data as ChatConversation[];
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return [];
    }
  },

  createConversation: async (title = 'New Inquiry'): Promise<ChatConversation> => {
    try {
      const res = await fetch(`${BASE_URL}/chats/conversations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title })
      });
      const json = await res.json();
      if (!res.ok || json.status === 'error') {
        throw new Error(json.message || 'Failed to create conversation.');
      }
      return json.data as ChatConversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    attachments?: { name: string; size: string; type: string; base64Data?: string }[]
  ): Promise<ChatMessage> => {
    try {
      const res = await fetch(`${BASE_URL}/chats/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content, attachments })
      });
      const json = await res.json();
      if (!res.ok || json.status === 'error') {
        throw new Error(json.message || 'Failed to send message.');
      }
      return json.data as ChatMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }
};
export const AssistantService = CoPilotService;
