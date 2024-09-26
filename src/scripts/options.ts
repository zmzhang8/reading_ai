import { createChatModel } from "./models/chat_model";
import {
  LANGUAGES,
  PROVIDERS_TO_MODELS,
  PROVIDERS_TO_API_KEY_URL,
  PROVIDERS_TO_API_PRICING_URL,
  loadOptionsFromStorage,
  saveOptionsToStorage,
} from "./models/options";

document.addEventListener("DOMContentLoaded", () => {
  populateLanguages();
  populateProvidersAndModels();
  loadSavedOptions();
  setupSaveButton();
});

function populateLanguages() {
  const languageSelect = document.getElementById(
    "option-language"
  ) as HTMLSelectElement;

  for (const language in LANGUAGES) {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = LANGUAGES[language];
    languageSelect.appendChild(option);
  }
}

function populateProvidersAndModels() {
  const providerSelect = document.getElementById(
    "option-provider"
  ) as HTMLSelectElement;

  for (const provider in PROVIDERS_TO_MODELS) {
    const option = document.createElement("option");
    option.value = provider;
    option.textContent = provider;
    providerSelect.appendChild(option);
  }

  updateModelOptions();
  updateAPIUrls();
  providerSelect.addEventListener("change", () => {
    updateModelOptions();
    updateAPIUrls();
  });
}

function updateModelOptions() {
  const providerSelect = document.getElementById(
    "option-provider"
  ) as HTMLSelectElement;
  const modelSelect = document.getElementById(
    "option-model"
  ) as HTMLSelectElement;

  modelSelect.innerHTML = "";

  const selectedProvider = providerSelect.value;
  const models = PROVIDERS_TO_MODELS[selectedProvider] || [];
  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    modelSelect.appendChild(option);
  });
}

function updateAPIUrls() {
  const providerSelect = document.getElementById(
    "option-provider"
  ) as HTMLSelectElement;
  const apiKeyUrl = document.getElementById("api-key-url") as HTMLAnchorElement;
  const apiPricingUrl = document.getElementById(
    "api-pricing-url"
  ) as HTMLAnchorElement;
  const googleFreeTierText = document.getElementById(
    "google-free-tier-text"
  ) as HTMLSpanElement;

  const selectedProvider = providerSelect.value;
  apiKeyUrl.href = PROVIDERS_TO_API_KEY_URL[selectedProvider];
  apiPricingUrl.href = PROVIDERS_TO_API_PRICING_URL[selectedProvider];
  googleFreeTierText.className = selectedProvider === "Google" ? "" : "hidden";
}

function loadSavedOptions() {
  loadOptionsFromStorage((options) => {
    if (options.apiKey) {
      (document.getElementById("option-language") as HTMLSelectElement).value =
        options.language;
      (document.getElementById("option-provider") as HTMLSelectElement).value =
        options.provider;
      updateModelOptions();
      updateAPIUrls();
      (document.getElementById("option-model") as HTMLSelectElement).value =
        options.model;
      (document.getElementById("option-api-key") as HTMLInputElement).value =
        options.apiKey;
    }
  });
}

function saveOptions() {
  const language = (
    document.getElementById("option-language") as HTMLSelectElement
  ).value;
  const provider = (
    document.getElementById("option-provider") as HTMLSelectElement
  ).value;
  const model = (document.getElementById("option-model") as HTMLSelectElement)
    .value;
  const apiKey = (
    document.getElementById("option-api-key") as HTMLInputElement
  ).value.trim();

  if (apiKey) {
    testModelConnection(provider, model, apiKey)
      .then(() => {
        saveOptionsToStorage(
          {
            language: language,
            provider: provider,
            model: model,
            apiKey: apiKey,
          },
          () => {
            window.close();
          }
        );
      })
      .catch((reason) => {
        showSaveMessage(reason.toString(), false);
      });
  } else {
    showSaveMessage("API key is required.", false);
  }
}

function showSaveMessage(text: string, success: boolean) {
  const saveMessage = document.getElementById("save-message") as HTMLDivElement;
  saveMessage.textContent = text;
  saveMessage.className = success ? "success" : "error";
  setTimeout(() => {
    saveMessage.textContent = "";
    saveMessage.className = "";
  }, 3000);
}

function setupSaveButton() {
  const saveButton = document.getElementById(
    "save-button"
  ) as HTMLButtonElement;
  saveButton.addEventListener("click", saveOptions);
}

async function testModelConnection(
  provider: string,
  modelName: string,
  apiKey: string
) {
  const llm = createChatModel(provider, modelName, apiKey, 1)!;
  return await withTimeout(
    llm?.invoke('Say "Hi"', { timeout: 3 }),
    3000,
    "Cannot verify API key."
  );
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  error: string
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(error));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}
