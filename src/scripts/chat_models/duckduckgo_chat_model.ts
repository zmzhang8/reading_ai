import {
  ChatMessage,
  ChatModel,
  ChatModelOptions,
  ChatOptions,
  ChatRole,
} from "./chat_model";

const STATUS_API_ENDPOINT = "https://duckduckgo.com/duckchat/v1/status";
const CHAT_API_ENDPOINT = "https://duckduckgo.com/duckchat/v1/chat";

type MessageParam = { role: string; content: string };

export class DuckDuckGoChatModel implements ChatModel {
  options: ChatModelOptions;
  vqd?: string;

  constructor(options: ChatModelOptions) {
    this.options = options;
  }

  async generate(
    messages: ChatMessage[],
    systemInstruction?: string,
    options?: ChatOptions
  ): Promise<string> {
    const contents = this.constructMessages(messages, systemInstruction);
    const vqd = await this.getVqd();
    const response = await fetchWithTimeout(
      CHAT_API_ENDPOINT,
      {
        headers: { "x-vqd-4": vqd, "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({
          model: this.options.modelName,
          messages: contents,
        }),
      },
      options?.timeoutMs ?? this.options.timeoutMs
    );
    if (!response.ok) {
      throw Error(`Fetch error: ${response.status} ${response.statusText}`);
    }
    this.vqd = response.headers.get("x-vqd-4") ?? undefined;

    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let data = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        data += decoder.decode(value, { stream: true });
      }

      let result = "";
      try {
        for (const line of data.split("\n")) {
          if (line.trim()) {
            const parsed = JSON.parse(line.substring(line.indexOf("{")));
            result += parsed["message"] ?? "";
          }
        }
      } catch (error) {
        if (!result) {
          throw error;
        }
      }
      return result;
    } else {
      throw Error(`Emtpy response`);
    }
  }

  constructMessages(
    messages: ChatMessage[],
    systemInstruction?: string
  ): MessageParam[] {
    const result = messages.map((message) => ({
      role: message.role === ChatRole.Model ? "assistant" : "user",
      content: message.content,
    }));
    if (systemInstruction) {
      result.unshift({ role: "user", content: systemInstruction });
    }
    return result;
  }

  async getVqd(): Promise<string> {
    if (this.vqd) {
      return this.vqd;
    } else {
      const status = await fetch(STATUS_API_ENDPOINT, {
        headers: { "x-vqd-accept": "1" },
      });
      this.vqd = status.headers.get("x-vqd-4") ?? undefined;
      if (!this.vqd) {
        throw Error("Failed to get vqd");
      }
      return this.vqd;
    }
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs?: number
): Promise<Response> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
  );
  const responsePromise = fetch(input, init);
  return Promise.race([responsePromise, timeoutPromise]);
}
