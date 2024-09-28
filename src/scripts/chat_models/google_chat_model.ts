import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
} from "@google/generative-ai";
import {
  ChatMessage,
  ChatModel,
  ChatModelOptions,
  ChatOptions,
  ChatRole,
} from "./chat_model";

export class GoogleChatModel implements ChatModel {
  model: GenerativeModel;
  options: ChatModelOptions;

  constructor(options: ChatModelOptions) {
    const genAI = new GoogleGenerativeAI(options.apiKey);
    this.model = genAI.getGenerativeModel({ model: options.modelName });
    this.options = options;
  }

  async generate(
    messages: ChatMessage[],
    systemInstruction?: string,
    options?: ChatOptions,
  ): Promise<string> {
    const generationConfig = {
      temperature: options?.temperature,
      maxOutputTokens: options?.maxOutputTokens,
      candidateCount: options?.n_candidates ?? this.options.n_candidates ?? 1,
    };
    const contents = this.constructMessages(messages);
    const result = await this.model.generateContent(
      {
        generationConfig: generationConfig,
        contents: contents,
        systemInstruction: systemInstruction,
      },
      {
        timeout: options?.timeoutMs ?? this.options.timeoutMs,
      }
    );
    return result.response.text();
  }

  constructMessages(messages: ChatMessage[]): Content[] {
    return messages.map((message) => {
      return {
        role: message.role === ChatRole.Model ? "model" : "user",
        parts: [{ text: message.content }],
      };
    });
  }
}
