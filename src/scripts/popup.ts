import { marked } from "marked";
import DOMPurify from "dompurify";
import { LanguageAgent } from "./agents/language_agent";
import { createChatModel } from "./utils/model_helper";
import { loadOptionsFromStorage, LANGUAGES } from "./utils/options";

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
          if (selectedContent) {
            (
              document.getElementById("lookup-input") as HTMLInputElement
            ).value = selectedContent;
            setupAndLookup(selectedContent);
          }
        }
      );
    } else {
      (document.getElementById("lookup-input") as HTMLInputElement).focus();
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
  const lookupButton = document.getElementById(
    "lookup-button"
  ) as HTMLButtonElement;
  lookupInput.addEventListener("input", () => {
    if (lookupInput.value.trim()) {
      lookupButton.classList.remove("inactive");
    } else {
      lookupButton.classList.add("inactive");
    }
  });
}

function setupLookupButton() {
  const lookupInput = document.getElementById(
    "lookup-input"
  ) as HTMLInputElement;
  const lookupButton = document.getElementById(
    "lookup-button"
  ) as HTMLButtonElement;

  lookupButton.addEventListener("click", () => {
    if (lookupInput.value.trim()) {
      setupAndLookup(lookupInput.value.trim());
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
    if (event.key == "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (lookupInput.value.trim()) {
        setupAndLookup(lookupInput.value.trim());
      }
    } else if (event.key == "Enter" && event.shiftKey) {
      event.preventDefault();
      aiQuery = lookupInput.value.trim();
      openSidePanel(tabId);
    }
  });
}

let languageAgent: LanguageAgent;
let language: string;

function setupAndLookup(text: string) {
  (document.getElementById("lookup-result") as HTMLDivElement).innerHTML = "";
  if (languageAgent && language) {
    lookup(text);
  } else {
    loadOptionsFromStorage((options) => {
      if (options && options.apiKey) {
        language = options.language;
        const model = createChatModel(options.provider, {
          apiKey: options.apiKey,
          modelName: options.model,
          timeoutMs: 3000,
        });
        languageAgent = new LanguageAgent(model);
        lookup(text);
      } else {
        chrome.runtime.openOptionsPage();
      }
    });
  }
}

async function lookup(text: string) {
  const loaderContainer = document.getElementById(
    "loader-container"
  ) as HTMLDivElement;
  const lookupResult = document.getElementById(
    "lookup-result"
  ) as HTMLDivElement;
  loaderContainer.classList.remove("hidden");

  const languageName = LANGUAGES[language];
  await languageAgent
    .generate({ language: languageName, text: text })
    .then(async (value) => {
      loaderContainer.classList.add("hidden");
      const htmlString = DOMPurify.sanitize(await marked(value));
      lookupResult.innerHTML = htmlString;
    })
    .catch((reason) => {
      loaderContainer.classList.add("hidden");
      lookupResult.textContent = reason.toString();
    });
}
