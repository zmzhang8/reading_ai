import { createChatModel } from "./models/chat_model";
import { LanguageExpert } from "./models/language_expert";
import { loadOptionsFromStorage, Options, LANGUAGES } from "./models/options";
import { marked } from "marked";
import DOMPurify from "dompurify";

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

function setupAndLookup(text: string) {
  (document.getElementById("lookup-result") as HTMLDivElement).innerHTML = "";
  loadOptionsFromStorage((options) => {
    if (options?.apiKey) {
      const model = createChatModel(
        options.provider,
        options.model,
        options.apiKey,
      );
      const languageExpert = new LanguageExpert(model);
      lookup(languageExpert, options.language, text);
    } else {
      chrome.runtime.openOptionsPage();
    }
  });
}

async function lookup(
  languageExpert: LanguageExpert,
  language: string,
  text: string
) {
  const lookupResult = document.getElementById(
    "lookup-result"
  ) as HTMLDivElement;
  const languageName = LANGUAGES[language];
  await languageExpert
    .invoke({ language: languageName, text: text })
    .then(async (value) => {
      const htmlString = DOMPurify.sanitize(await marked(value));
      lookupResult.innerHTML = htmlString;
    })
    .catch((reason) => {
      lookupResult.textContent = reason.toString();
    });
}
