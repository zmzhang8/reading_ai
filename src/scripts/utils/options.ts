export interface Options {
  language: string;
  provider: string;
  model: string;
  apiKey?: string;
}

export function loadOptionsFromStorage(callback: (options?: Options) => void) {
  chrome.storage.local.get(
    ["language", "provider", "model", "apiKey"],
    (result) => {
      if (chrome.runtime.lastError) {
        callback();
      } else {
        callback(result as Options);
      }
    }
  );
}

export function saveOptionsToStorage(options: Options, callback: () => void) {
  chrome.storage.local.set(options, callback);
}

export const DEFAULT_OPTIONS: Options = {
  language: "en",
  provider: "Default",
  model: "gpt-4o-mini",
};

export const LANGUAGES: Readonly<{ [key: string]: string }> = {
  en: "English",
  ar: "العربية",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  hi: "हिन्दी",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
  ru: "Русский",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
};

export const PROVIDERS_TO_MODELS: Readonly<{
  [key: string]: Readonly<{ [key: string]: string }>;
}> = {
  Default: {
    "gpt-4o-mini": "gpt-4o-mini",
  },
  Google: {
    "gemini-1.5-flash": "gemini-1.5-flash (fast for everyday use)",
    "gemini-1.5-pro": "gemini-1.5-pro (great for complex use)",
  },
  OpenAI: {
    "gpt-4o-mini": "gpt-4o-mini (fast for everyday use)",
    "gpt-4o": "gpt-4o (great for complex use)",
  },
};

export const PROVIDERS_TO_API_KEY_URL: Readonly<{ [key: string]: string }> = {
  Google: "https://aistudio.google.com/app/apikey",
  OpenAI: "https://platform.openai.com/api-keys",
};

export const PROVIDERS_TO_API_PRICING_URL: Readonly<{ [key: string]: string }> =
  {
    Google: "https://ai.google.dev/pricing",
    OpenAI: "https://openai.com/api/pricing",
  };
