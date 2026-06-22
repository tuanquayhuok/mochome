import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api-url';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  time?: string;
}

export interface ChatResponse {
  reply: string;
  suggestions: string[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  send(message: string, history: ChatMessage[] = []) {
    return this.http.post<ChatResponse>(`${API_URL}/public/chat`, {
      message,
      history: history.slice(-6).map((m) => ({ role: m.role, content: m.content }))
    });
  }
}
