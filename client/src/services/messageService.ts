import { io } from 'socket.io-client';

import { API_URL, API_BASE_URL } from '@/config';

export const messageService = {
  async getConversations(jwt: string, archived: boolean = false) {
    const response = await fetch(`${API_URL}/messages/conversations?archived=${archived}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async archiveConversation(id: string, jwt: string) {
    const response = await fetch(`${API_URL}/messages/conversations/${id}/archive`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async markAsSold(id: string, jwt: string) {
    const response = await fetch(`${API_URL}/messages/conversations/${id}/mark-sold`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async getConversation(id: string, jwt: string) {
    const response = await fetch(`${API_URL}/messages/conversations/${id}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async getMessages(conversationId: string, jwt: string) {
    const response = await fetch(`${API_URL}/messages/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async sendMessage(conversationId: string, content: string, jwt: string, messageType: string = 'text', fileData?: any) {
    const body = {
      conversation_id: conversationId,
      content,
      message_type: messageType,
      ...fileData
    };

    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(body)
    });
    return response.json();
  },

  async editMessage(id: string, content: string, jwt: string) {
    const response = await fetch(`${API_URL}/messages/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ content })
    });
    return response.json();
  },

  async deleteMessage(id: string, jwt: string) {
    const response = await fetch(`${API_URL}/messages/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async markAsRead(conversationId: string, jwt: string, senderId?: string) {
    const response = await fetch(`${API_URL}/messages/read/${conversationId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}` 
      },
      body: JSON.stringify({ sender_id: senderId })
    });
    return response.json();
  },

  async updateMeetupStatus(messageId: string, status: 'accepted' | 'declined', jwt: string) {
    const response = await fetch(`${API_URL}/messages/${messageId}/meetup`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  async reportMessage(messageId: string, reason: string, jwt: string) {
    const response = await fetch(`${API_URL}/messages/${messageId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  },

  async uploadFile(file: File, jwt: string) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/messages/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` },
      body: formData
    });
    return response.json();
  },

  async muteConversation(conversationId: string, jwt: string) {
    const response = await fetch(`${API_URL}/messages/mute/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async clearChat(conversation_id: string, jwt: string) {
    const response = await fetch(`${API_URL}/messages/clear/${conversation_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async getUnreadCount(jwt: string) {
    const response = await fetch(`${API_URL}/messages/unread-count`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },
  
  async heartbeat(jwt: string) {
    await fetch(`${API_URL}/messages/heartbeat`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
  },

  async blockUser(userId: string, jwt: string) {
    const response = await fetch(`${API_URL}/users/${userId}/block`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    return response.json();
  },

  async reportUser(userId: string, reason: string, details: string, jwt: string) {
    const response = await fetch(`${API_URL}/users/${userId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ reason, details })
    });
    return response.json();
  },

  async checkinMeetup(meetupId: string, status: 'completed', jwt: string) {
    const response = await fetch(`${API_URL}/users/meetups/${meetupId}/checkin`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  }
};

let socket: any = null;

export const initSocket = (jwt: string, convId?: string | null) => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      auth: { token: jwt },
      withCredentials: true,
      transports: ['websocket', 'polling'], // Allow polling as fallback for mobile networks
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
    });
  } else if (socket.auth.token !== jwt) {
    socket.auth.token = jwt;
    socket.disconnect().connect();
  }

  if (convId) {
    socket.emit('join_room', convId);
  }

  return socket;
};

export const getSocket = () => socket;
