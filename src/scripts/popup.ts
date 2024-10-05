import DOMPurify from "dompurify";
import { marked } from "marked";
import { AgentType, getAgent } from "./utils/agent_helper";

let disabledInteraction = false;
let aiQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  setupInput();
  setupLookupButton();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getAIQuery") {
      sendResponse(aiQuery);
      window.close();
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.id) {
      setupAIButton(tab.id);
      setupKeyboardShortcuts(tab.id);

      chrome.tabs.sendMessage(
        tab.id,
        { action: "getSelectedContent" },
        (selectedContent: string) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error getting selected content: ",
              chrome.runtime.lastError.message
            );
          } else {
            if (selectedContent) {
              (
                document.getElementById("lookup-input") as HTMLInputElement
              ).value = selectedContent;
              updateLookupButtonStatus();
              agentCompletion(selectedContent);
            }
          }
        }
      );
    } else {
      (document.getElementById("lookup-input") as HTMLInputElement).focus();
      updateLookupButtonStatus();
    }
  });
});

async function openSidePanel(tabId: number) {
  await chrome.sidePanel.setOptions({
    tabId: tabId,
    path: "sidepanel.html",
    enabled: true,
  });
  await chrome.sidePanel.open({ tabId: tabId });
}

function setupInput() {
  const lookupInput = document.getElementById(
    "lookup-input"
  ) as HTMLInputElement;
  lookupInput.addEventListener("input", updateLookupButtonStatus);
}

function updateLookupButtonStatus() {
  const lookupInput = document.getElementById(
    "lookup-input"
  ) as HTMLInputElement;
  const lookupButton = document.getElementById(
    "lookup-button"
  ) as HTMLButtonElement;
  if (lookupInput.value.trim()) {
    lookupButton.classList.remove("inactive");
  } else {
    lookupButton.classList.add("inactive");
  }
}

function setupLookupButton() {
  const lookupInput = document.getElementById(
    "lookup-input"
  ) as HTMLInputElement;
  const lookupButton = document.getElementById(
    "lookup-button"
  ) as HTMLButtonElement;

  lookupButton.addEventListener("click", () => {
    if (!disabledInteraction && lookupInput.value.trim()) {
      agentCompletion(lookupInput.value.trim());
    }
  });
}

function setupAIButton(tabId: number) {
  const aiButton = document.getElementById("ai-button") as HTMLButtonElement;
  aiButton.addEventListener("click", () => {
    openSidePanel(tabId);
    window.close();
  });
}

function setupKeyboardShortcuts(tabId: number) {
  const lookupInput = document.getElementById(
    "lookup-input"
  ) as HTMLInputElement;
  lookupInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabledInteraction && lookupInput.value.trim()) {
        agentCompletion(lookupInput.value.trim());
      }
    } else if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      aiQuery = lookupInput.value.trim();
      openSidePanel(tabId);
    }
  });
}

function agentCompletion(text: string) {
  const loaderContainer = document.getElementById(
    "loader-container"
  ) as HTMLDivElement;
  const lookupResult = document.getElementById(
    "lookup-result"
  ) as HTMLDivElement;

  lookupResult.innerHTML = "";
  getAgent(AgentType.LanguageAgent, text, (agent) => {
    if (agent) {
      disabledInteraction = true;
      loaderContainer.classList.remove("hidden");
      agent
        .generate([], 10000)
        .then(async (result) => {
          const htmlString = DOMPurify.sanitize(await marked(result));
          lookupResult.innerHTML = htmlString;
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
  const errorMessage = document.getElementById("error-message") as HTMLDivElement;
  errorMessage.textContent = text;
  errorMessage.classList.remove("hidden");
  setTimeout(() => {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
  }, 5000);
}
