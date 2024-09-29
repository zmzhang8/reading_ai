import { ChatMessage } from "../chat_models/chat_model";

export interface Agent {
  generate(messages: ChatMessage[], timeoutMs?: number): Promise<string>;
}
