export enum ChatRole {
  Model,
  User,
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  n_candidates?: number;
}

export interface ChatModelOptions {
  apiKey: string;
  modelName: string;
  timeoutMs?: number,
  n_candidates?: number;
}

export interface ChatModel {
  generate(
    messages: ChatMessage[],
    systemInstruction?: string,
    options?: ChatOptions
  ): Promise<string>;
}
