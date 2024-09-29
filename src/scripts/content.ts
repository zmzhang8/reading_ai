import { Readability } from "@mozilla/readability";
import DOMPurify from "dompurify";
import TurndownService from "turndown";

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.action === "getSelectedContent") {
    const selectedContent = window.getSelection()?.toString() ?? "";
    sendResponse(selectedContent);
  } else if (message.action === "getReadableContent") {
    const documentClone = document.cloneNode(true) as Document;
    const article = new Readability(documentClone).parse();
    const readableContentHTML = article?.content
      ? DOMPurify.sanitize(article?.content)
      : "";
    const readableContentMarkdown = new TurndownService().turndown(
      readableContentHTML
    );
    sendResponse(readableContentMarkdown);
  }
});
