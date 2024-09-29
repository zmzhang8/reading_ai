import { Agent } from "../agents/agent";
import { DocumentAgent } from "../agents/document_agent";
import { ChatModel } from "../chat_models/chat_model";
import { createChatModel } from "./model_helper";
import { loadOptionsFromStorage, Options } from "./options";

let language: string;
let model: ChatModel;

export enum AgentType {
  LanguageAgent,
  DocumentAgent,
}

export function getAgent(
  type: AgentType,
  document?: string,
  callback?: (agent?: Agent) => void
) {
  if (language && model) {
    const agent = createAgent(type, document);
    callback?.(agent);
  } else {
    loadOptionsFromStorage((options) => {
      if (options && options.apiKey) {
        language = options.language;
        model = createChatModel(options.provider, {
          apiKey: options.apiKey,
          modelName: options.model,
        });
        const agent = createAgent(type, document);
        callback?.(agent);
      } else {
        callback?.();
      }
    });
  }
}

function createAgent(type: AgentType, document?: string): Agent {
  if (type === AgentType.DocumentAgent) {
    return new DocumentAgent(model, { language: language, document: document });
  } else {
    throw Error(`Unsupport agent type ${type}`);
  }
}
