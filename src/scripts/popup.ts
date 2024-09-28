import { marked } from "marked";
import DOMPurify from "dompurify";
import { LanguageAgent } from "./agents/language_agent";
import { createChatModel } from "./utils/model_helper";
import { loadOptionsFromStorage, LANGUAGES } from "./utils/options";

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab.id) {
      setupAIButton(tab.id);

      chrome.tabs.sendMessage(
        tab.id,
        { action: "getSelectedContent" },
        (selectedContent: string) => {
          if (selectedContent) {
            (
              document.getElementById("lookup-input") as HTMLInputElement
            ).value = selectedContent;
            setupAndLookup(selectedContent);
          } else {
            (
              document.getElementById("lookup-input") as HTMLInputElement
            ).focus();
          }
        }
      );
    } else {
      (document.getElementById("lookup-input") as HTMLInputElement).focus();
    }
  });

  setupLookupButton();
});

function setupAIButton(tabId: number) {
  const aiButton = document.getElementById("ai-button") as HTMLButtonElement;
  aiButton.classList.add("active");
  aiButton.addEventListener("click", () => {
    chrome.sidePanel
      .setOptions({
        tabId: tabId,
        path: "sidepanel.html",
        enabled: true,
      })
      .then(() => {
        chrome.sidePanel.open({ tabId: tabId });
      });
    window.close();
  });
}

function setupLookupButton() {
  const lookupInput = document.getElementById(
    "lookup-input"
  ) as HTMLInputElement;
  const lookupButton = document.getElementById(
    "lookup-button"
  ) as HTMLButtonElement;

  lookupInput.addEventListener("input", () => {
    if (lookupInput.value.trim()) {
      lookupInput.addEventListener("keyup", (event) => {
        if (event.key == "Enter") {
          setupAndLookup(lookupInput.value.trim());
        }
      });
      lookupButton.addEventListener("click", () => {
        setupAndLookup(lookupInput.value.trim());
      });
      lookupButton.classList.remove("inactive");
    } else {
      lookupButton.classList.add("inactive");
      lookupButton.removeEventListener("click", () => {});
      lookupInput.removeEventListener("keyup", () => {});
    }
  });
}

let languageAgent: LanguageAgent;
let language: string;

function setupAndLookup (text: string) {
  (document.getElementById("lookup-result") as HTMLDivElement).innerHTML = "";
  if (languageAgent && language) {
    lookup(text);
  } else {
    loadOptionsFromStorage((options) => {
      if (options.apiKey) {
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

async function lookup (text: string) {
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
