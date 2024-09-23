import { Readability } from '@mozilla/readability';

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.action === "getReadableContent") {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';
    if (selectedText) {
      sendResponse({ selected: true, content: selectedText });
    } else {
      const documentClone = document.cloneNode(true) as Document;
      const article = new Readability(documentClone).parse();
      if (article?.content) {
        sendResponse({ selected: false, content: article.content });
      } else {
        sendResponse({ selected: false, content: "" });
      }
    }
  }
  return true;
});
