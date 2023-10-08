// 'use strict';

navigator.serviceWorker.addEventListener('message', async function (event) {
  console.log(`onEvent.event.data = ${JSON.stringify(event.data)}`);
});

// window.onerror = function (message, source, lineno, colno, error) {
//   console.log(`window.onerror = ${error}`);
//   if (error) {
//     console.error(error);
//   }
//   return true;
// };

// try {
//   importScripts('clipboard.js');
// } catch (e) {
//   console.error(e);
// }

ClipManager.startListenClipboard();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(`onMessage.request.action = ${request.action}`);

  ClipManager.startListenClipboard();

  // switch (request.action) {

  // }
  return true;
});

chrome.runtime.onMessageExternal.addListener(async function (
  request,
  sender,
  sendResponse
) {
  try {
    var dataObj = JSON.parse(request.content);
  } catch (error) {
    alert('Sign in failed. Please try again.');
  }
});

chrome.runtime.onInstalled.addListener(async function () {
  // let isSignedIn = await BackendManager.isSignedIn()
  if (true) {
    chrome.tabs.create({ url: chrome.extension.getURL('index.html') });
  }
});
