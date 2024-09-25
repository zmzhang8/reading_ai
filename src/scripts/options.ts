const LANGUAGES: { readonly [key: string]: string } = {
  ar: 'العربية',
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  hi: 'हिन्दी',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  ru: 'Русский',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
}

const PROVIDERS_TO_MODELS: { readonly [key: string]: readonly string[] } = {
  Google: ['gemini-1.5-flash', 'gemini-1.5-pro'],
  OpenAI: ['gpt-4o-mini', 'gpt-4o'],
};

document.addEventListener('DOMContentLoaded', () => {
  populateLanguages();
  populateProvidersAndModels();
  loadSavedOptions();
  setupSaveButton();
});

function populateLanguages () {
  const languageSelect = document.getElementById('option-language') as HTMLSelectElement;

  for (const language in LANGUAGES) {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = LANGUAGES[language];
    languageSelect.appendChild(option);
  }
}

function populateProvidersAndModels () {
  const providerSelect = document.getElementById('option-provider') as HTMLSelectElement;

  for (const provider in PROVIDERS_TO_MODELS) {
    const option = document.createElement('option');
    option.value = provider;
    option.textContent = provider;
    providerSelect.appendChild(option);
  }

  updateModelOptions();
  providerSelect.addEventListener('change', () => {
    updateModelOptions();
  });
}

function updateModelOptions () {
  const providerSelect = document.getElementById('option-provider') as HTMLSelectElement;
  const modelSelect = document.getElementById('option-model') as HTMLSelectElement;

  modelSelect.innerHTML = '';

  const selectedProvider = providerSelect.value;
  const models = PROVIDERS_TO_MODELS[selectedProvider] || [];
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    modelSelect.appendChild(option);
  });
}

function loadSavedOptions () {
  chrome.storage.local.get(['language', 'provider', 'model', 'apiKey'],
    (result) => {
      if (result.apiKey) {
        (document.getElementById('option-language') as HTMLSelectElement).value = (result.language as string);
        (document.getElementById('option-provider') as HTMLSelectElement).value = (result.provider as string);
        updateModelOptions();
        (document.getElementById('option-model') as HTMLSelectElement).value = (result.model as string);
        (document.getElementById('option-api-key') as HTMLInputElement).value = (result.apiKey as string);
      }
    }
  );
}

function saveOptions () {
  const language = (document.getElementById('option-language') as HTMLSelectElement).value;
  const provider = (document.getElementById('option-provider') as HTMLSelectElement).value;
  const model = (document.getElementById('option-model') as HTMLSelectElement).value;
  const apiKey = (document.getElementById('option-api-key') as HTMLInputElement).value.trim();

  if (apiKey) {
    chrome.storage.local.clear();
    chrome.storage.local.set(
      {
        language: language,
        provider: provider,
        model: model,
        apiKey: apiKey,
      },
      () => {
        showSaveMessage('Configuration is saved.', 'success');
      }
    );
  } else {
    showSaveMessage('API key is required.', 'error');
  }
}

function showSaveMessage (text: string, type: string) {
  const saveMessage = (document.getElementById('save-message') as HTMLDivElement);
  saveMessage.textContent = text;
  saveMessage.className = type;
  setTimeout(() => {
    saveMessage.textContent = '';
    saveMessage.className = '';
  }, 3000);
}

function setupSaveButton () {
  const saveButton = document.getElementById('save-button') as HTMLButtonElement;
  saveButton.addEventListener('click', saveOptions);
}
