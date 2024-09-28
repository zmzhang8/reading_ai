import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import {
  ChatModelOptions,
  ChatModel,
  ChatMessage,
  ChatOptions,
  ChatRole,
} from "./chat_model";

export class OpenAIChatModel implements ChatModel {
  client: OpenAI;
  options: ChatModelOptions;

  constructor(options: ChatModelOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      timeout: options.timeoutMs,
      dangerouslyAllowBrowser: true,
    });
    this.options = options;
  }

  async generate(
    messages: ChatMessage[],
    systemInstruction?: string,
    options?: ChatOptions
  ): Promise<string> {
    const contents = this.constructMessages(messages, systemInstruction);
    const result = await this.client.chat.completions.create(
      {
        messages: contents,
        model: this.options.modelName,
        temperature: options?.temperature,
        max_completion_tokens: options?.maxOutputTokens,
        n: options?.n_candidates ?? this.options.n_candidates ?? 1,
        stream: false,
      },
      { timeout: options?.timeoutMs ?? this.options.timeoutMs }
    );
    return result.choices[0]?.message.content ?? "";
  }

  constructMessages(
    messages: ChatMessage[],
    systemInstruction?: string
  ): ChatCompletionMessageParam[] {
    const result: ChatCompletionMessageParam[] = messages.map((message) => ({
      role: message.role === ChatRole.Model ? "assistant" : "user",
      content: message.content,
    }));
    if (systemInstruction) {
      result.unshift({ role: "system", content: systemInstruction });
    }
    return result;
  }
}
