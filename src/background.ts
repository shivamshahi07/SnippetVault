// This is a basic background script that can be extended later
// for features like notifications, sync, etc.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Snippet Organizer extension installed");
});
