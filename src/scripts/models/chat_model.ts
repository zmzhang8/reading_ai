import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

export function createChatModel(
  provider: string,
  modelName: string,
  apiKey: string,
  maxOutputTokens: number | undefined = undefined,
  temperature: number | undefined = undefined,
): BaseChatModel {
  if (provider === "Google") {
    return new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      modelName: modelName,
      maxOutputTokens: maxOutputTokens,
      temperature: temperature,
    });
  } else if (provider === "OpenAI") {
    return new ChatOpenAI({
      apiKey: apiKey,
      modelName: modelName,
      maxTokens: maxOutputTokens,
      temperature: temperature,
    });
  } else {
    throw Error(`Unsupported provider ${provider} with model ${modelName}.`);
  }
}
