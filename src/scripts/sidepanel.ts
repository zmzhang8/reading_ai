import DOMPurify from "dompurify";
import { marked } from "marked";
import { ChatRole } from "./chat_models/chat_model";
import { AgentType, getAgent } from "./utils/agent_helper";
import { ChatMessage, ChatSession } from "./utils/chat_session";
import { PROMPTS } from "./utils/prompts";

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
  setupQuickMessages();

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getReadableContent" },
        (readableContent: string) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error getting readable content: ",
              chrome.runtime.lastError.message
            );
          }

          pageContent = readableContent;
          addMessage({
            role: ChatRole.Model,
            content: readableContent ? greetingsWithPage : greetingsWithoutPage,
            userVisible: true,
            modelVisible: false,
          });

          chrome.runtime.sendMessage({ action: "getAIQuery" }, (query) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error getting ai query: ",
                chrome.runtime.lastError.message
              );
            } else {
              if (query) {
                agentCompletion(AgentType.DocumentAgent, query);
              }
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
  userInput.addEventListener("input", () => {
    resizeInputHeight();
    updateSendButtonStatus();
    updateQuickMessagesStatus();
  });
}

function updateSendButtonStatus() {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  const sendButton = document.getElementById(
    "send-button"
  ) as HTMLButtonElement;
  if (userInput.value.trim()) {
    sendButton.classList.remove("inactive");
  } else {
    sendButton.classList.add("inactive");
  }
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
}

function setupKeyboardShortcuts() {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabledInteraction && userInput.value.trim()) {
        agentCompletion(AgentType.DocumentAgent, userInput.value.trim());
      }
    }
  });
}

function updateQuickMessagesStatus() {
  const quickMessageContainer = document.getElementById(
    "quick-message-container"
  ) as HTMLDivElement;
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  if (userInput.value.trim() || chatSession.count() > 1) {
    quickMessageContainer.classList.add("hidden");
  } else {
    quickMessageContainer.classList.remove("hidden");
  }
}

function setupQuickMessages() {
  const quickMessageContainer = document.getElementById(
    "quick-message-container"
  ) as HTMLDivElement;
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  for (const [name, prompt] of Object.entries(PROMPTS)) {
    const button = document.createElement("button");
    button.value = name;
    button.textContent = name;
    button.classList.add("quick-message-button");
    button.addEventListener("click", () => {
      userInput.value = prompt;
      updateSendButtonStatus();
      resizeInputHeight();
      updateQuickMessagesStatus();
    });
    quickMessageContainer.appendChild(button);
  }
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
      message.role === ChatRole.User ? "user-message" : "ai-message"
    );
    messageElement.innerHTML = content;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function agentCompletion(type: AgentType, message: string) {
  const loaderContainer = document.getElementById(
    "loader-container"
  ) as HTMLDivElement;
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;

  userInput.value = "";
  updateSendButtonStatus();
  resizeInputHeight();
  addMessage({
    role: ChatRole.User,
    content: message,
    userVisible: true,
    modelVisible: true,
  });
  updateQuickMessagesStatus();

  getAgent(type, pageContent, (agent) => {
    if (agent) {
      disabledInteraction = true;
      loaderContainer.classList.remove("hidden");
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
          showErrorMessage(reason.toString());
        })
        .finally(() => {
          loaderContainer.classList.add("hidden");
          disabledInteraction = false;
        });
    } else {
      chrome.runtime.openOptionsPage();
    }
  });
}

function showErrorMessage(text: string) {
  const errorMessage = document.getElementById(
    "error-message"
  ) as HTMLDivElement;
  errorMessage.textContent = text;
  errorMessage.classList.remove("hidden");
  setTimeout(() => {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
  }, 5000);
}
