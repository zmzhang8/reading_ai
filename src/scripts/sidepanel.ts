import DOMPurify from "dompurify";
import { marked } from "marked";
import { ChatRole } from "./chat_models/chat_model";
import { AgentType, getAgent } from "./utils/agent_helper";
import { ChatMessage, ChatSession } from "./utils/chat_session";

const greetingsWithPage = "I have read the page. How can I assist you?";
const greetingsWithoutPage =
  "I'm unable to read the page. How can I assist you?";
const chatSession = new ChatSession();
let disabledInteraction = false;
let pageContent: string | undefined;

document.addEventListener("DOMContentLoaded", () => {
  setupInput();
  setupSendButton();
  setupKeyboardShortcuts();

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getReadableContent" },
        (readableContent: string) => {
          pageContent = readableContent;
          addMessage({
            role: ChatRole.Model,
            content: readableContent ? greetingsWithPage : greetingsWithoutPage,
            userVisible: true,
            modelVisible: false,
          });

          chrome.runtime.sendMessage({ action: "getAIQuery" }, (query) => {
            if (query) {
              agentCompletion(AgentType.DocumentAgent, query);
            }
          });
        }
      );
    } else {
      console.error("No active tab found");
    }
  });
});

function resizeInputHeight() {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  userInput.style.height = "auto";
  userInput.style.height = userInput.scrollHeight + "px";
}

function setupInput() {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  userInput.addEventListener("input", resizeInputHeight);
}

function setupSendButton() {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  const sendButton = document.getElementById(
    "send-button"
  ) as HTMLButtonElement;

  sendButton.addEventListener("click", () => {
    if (!disabledInteraction && userInput.value.trim()) {
      agentCompletion(AgentType.DocumentAgent, userInput.value.trim());
    }
  });

  userInput.addEventListener("input", () => {
    if (userInput.value.trim()) {
      sendButton.classList.remove("inactive");
    } else {
      sendButton.classList.add("inactive");
    }
  });
}

function setupKeyboardShortcuts() {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  userInput.addEventListener("keydown", (event) => {
    if (event.key == "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabledInteraction && userInput.value.trim()) {
        agentCompletion(AgentType.DocumentAgent, userInput.value.trim());
      }
    }
  });
}

async function addMessage(message: ChatMessage) {
  chatSession.addMessage(message);
  if (message.userVisible) {
    const content = DOMPurify.sanitize(await marked(message.content));
    const chatMessages = document.getElementById(
      "chat-messages"
    ) as HTMLDivElement;
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.classList.add(
      message.role == ChatRole.User ? "user-message" : "ai-message"
    );
    messageElement.innerHTML = content;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function agentCompletion(type: AgentType, message: string) {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;

  userInput.value = "";
  resizeInputHeight();
  addMessage({
    role: ChatRole.User,
    content: message,
    userVisible: true,
    modelVisible: true,
  });

  getAgent(type, pageContent, (agent) => {
    if (agent) {
      disabledInteraction = true;
      agent
        .generate(chatSession.getModelVisibleMessages(), 5000)
        .then(async (result) => {
          addMessage({
            role: ChatRole.Model,
            content: result,
            userVisible: true,
            modelVisible: true,
          });
        })
        .catch((reason) => {
          addMessage({
            role: ChatRole.Model,
            content: reason.toString(),
            userVisible: true,
            modelVisible: false,
          });
        })
        .finally(() => {
          disabledInteraction = false;
        });
    } else {
      chrome.runtime.openOptionsPage();
    }
  });
}
