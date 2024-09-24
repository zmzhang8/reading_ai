import { Readability } from '@mozilla/readability';

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.action === 'getSelectedContent') {
    const selectedContent = window.getSelection()?.toString() ?? '';
    sendResponse(selectedContent);
  } else if (message.action === 'getReadableContent') {
    const documentClone = document.cloneNode(true) as Document;
    const article = new Readability(documentClone).parse();
    const readableContent = article?.content ?? '';
    sendResponse(readableContent);
  }
});
