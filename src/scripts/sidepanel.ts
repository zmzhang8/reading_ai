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
          console.log("Received readableContent");

          chrome.runtime.sendMessage({ action: "getAIQuery" }, (query) => {
            if (query) {
              sendMessage(query);
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

function setupKeyboardShortcuts() {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  userInput.addEventListener("keydown", (event) => {
    if (event.key == "Enter" && !event.shiftKey) {
      if (userInput.value.trim()) {
        sendMessage(userInput.value.trim());
      }
    }
  });
}

function setupSendButton() {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  const sendButton = document.getElementById(
    "send-button"
  ) as HTMLButtonElement;

  sendButton.addEventListener("click", () => {
    if (userInput.value.trim()) {
      sendMessage(userInput.value.trim());
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

function sendMessage(message: string) {
  const userInput = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement;
  addMessage(message, true);
  userInput.value = "";
  resizeInputHeight();

  setTimeout(() => {
    addMessage("Received your message.", false);
  }, 1000);
}

function addMessage(message: string, isUser: boolean) {
  const chatMessages = document.getElementById(
    "chat-messages"
  ) as HTMLDivElement;
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.classList.add(isUser ? "user-message" : "ai-message");
  messageElement.textContent = message;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
