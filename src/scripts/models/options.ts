export interface Options {
  language: string;
  provider: string;
  model: string;
  apiKey: string;
}

export function loadOptionsFromStorage(callback: (options: Options) => void) {
  chrome.storage.local.get(
    ["language", "provider", "model", "apiKey"],
    (result) => {
      callback(result as Options);
    }
  );
}

export function saveOptionsToStorage(options: Options, callback: () => void) {
  chrome.storage.local.set(options, callback);
}

export const LANGUAGES: { readonly [key: string]: string } = {
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

export const PROVIDERS_TO_MODELS: {
  readonly [key: string]: readonly string[];
} = {
  Google: ["gemini-1.5-flash", "gemini-1.5-pro"],
  OpenAI: ["gpt-4o-mini", "gpt-4o"],
};

export const PROVIDERS_TO_API_KEY_URL: { readonly [key: string]: string } = {
  Google: "https://aistudio.google.com/app/apikey",
  OpenAI: "https://platform.openai.com/api-keys",
};

export const PROVIDERS_TO_API_PRICING_URL: { readonly [key: string]: string } =
  {
    Google: "https://ai.google.dev/pricing",
    OpenAI: "https://openai.com/api/pricing",
  };
