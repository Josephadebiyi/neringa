import api from './api';
import { API_ENDPOINTS } from './config';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  packageId?: string;
  tripId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageData {
  conversationId?: string;
  receiverId?: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  packageId?: string;
  tripId?: string;
}

class MessageService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await api.get(API_ENDPOINTS.CONVERSATIONS);
      return response.data.conversations;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await api.get(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}`);
      return response.data.conversation;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conversation');
    }
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<{
    messages: Message[];
    total: number;
    page: number;
    hasMore: boolean;
  }> {
    try {
      const response = await api.get(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch messages');
    }
  }

  /**
   * Send a message
   */
  async sendMessage(data: SendMessageData): Promise<Message> {
    try {
      const response = await api.post(API_ENDPOINTS.SEND_MESSAGE, data);
      return response.data.message;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  }

  /**
   * Send a message with file attachment
   */
  async sendMessageWithFile(
    data: Omit<SendMessageData, 'content'> & { content?: string },
    file: {
      uri: string;
      type: string;
      name: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<Message> {
    try {
      const formData = new FormData();

      if (data.conversationId) formData.append('conversationId', data.conversationId);
      if (data.receiverId) formData.append('receiverId', data.receiverId);
      if (data.content) formData.append('content', data.content);
      if (data.packageId) formData.append('packageId', data.packageId);
      if (data.tripId) formData.append('tripId', data.tripId);

      formData.append('type', data.type || 'file');
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      const response = await api.uploadFile(API_ENDPOINTS.SEND_MESSAGE, formData, onProgress);
      return response.data.message;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send message with file');
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, messageIds?: string[]): Promise<{ success: boolean }> {
    try {
      const response = await api.post(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}/read`, {
        messageIds
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark messages as read');
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`${API_ENDPOINTS.MESSAGES}/${messageId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete message');
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete conversation');
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await api.get(API_ENDPOINTS.UNREAD_MESSAGES);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }

  /**
   * Start or get conversation with a user
   */
  async getOrCreateConversation(
    receiverId: string,
    context?: { packageId?: string; tripId?: string }
  ): Promise<Conversation> {
    try {
      const response = await api.post(API_ENDPOINTS.CREATE_CONVERSATION, {
        receiverId,
        ...context
      });
      return response.data.conversation;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create conversation');
    }
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(conversationId: string, query: string): Promise<Message[]> {
    try {
      const response = await api.get(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}/search`, {
        params: { query }
      });
      return response.data.messages;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search messages');
    }
  }
}

export default new MessageService();
