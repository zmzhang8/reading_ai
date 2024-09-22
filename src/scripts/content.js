const { Readability } = require('@mozilla/readability');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getReadableContent") {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      sendResponse({ selected: true, content: selectedText });
    } else {
      const documentClone = document.cloneNode(true);
      const article = new Readability(documentClone).parse();
      if (article && article.content) {
        sendResponse({ selected: false, content: article.content });
      } else {
        sendResponse({ selected: false, content: "" });
      }
    }
  }
  return true;
});
