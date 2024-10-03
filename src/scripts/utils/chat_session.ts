import { ChatMessage as Message } from "../chat_models/chat_model";

export interface ChatMessage extends Message {
  userVisible: boolean;
  modelVisible: boolean;
}

export class ChatSession {
  messages: ChatMessage[];

  constructor() {
    this.messages = [];
  }

  addMessage(message: ChatMessage) {
    this.messages.push(message);
  }

  getModelVisibleMessages(): Message[] {
    return this.messages.filter((value) => {
      return value.modelVisible;
    });
  }

  count (): number {
    return this.messages.length;
  }
}
