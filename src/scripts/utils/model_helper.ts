import { ChatModel, ChatModelOptions } from "../chat_models/chat_model";
import { DuckDuckGoChatModel } from "../chat_models/duckduckgo_chat_model";
import { GoogleChatModel } from "../chat_models/google_chat_model";
import { OpenAIChatModel } from "../chat_models/openai_chat_model";

export function createChatModel(
  provider: string,
  options: ChatModelOptions
): ChatModel {
  if (provider === "Default") {
    return new DuckDuckGoChatModel(options);
  } else if (provider === "Google") {
    return new GoogleChatModel(options);
  } else if (provider === "OpenAI") {
    return new OpenAIChatModel(options);
  } else {
    throw Error(`Unsupported provider ${provider}.`);
  }
}
