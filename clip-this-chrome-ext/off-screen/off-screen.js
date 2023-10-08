// Once the message has been posted from the service worker, checks are made to
// confirm the message type and target before proceeding. This is so that the
// module can easily be adapted into existing workflows where secondary uses for
// the document (or alternate offscreen documents) might be implemented.

import { ClipboardMessagePortName, Message } from '../utils_module.js';

// Registering this listener when the script is first executed ensures that the
// offscreen document will be able to receive messages when the promise returned
// by `offscreen.createDocument()` resolves.
// chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the
// message to a more specific message handler.
// async function handleMessages(message, sender, sendResponse) {
//   // Return early if this message isn't meant for the offscreen document.
//   if (message.target !== Message.Target.OffscreenDoc) {
//     return;
//   }

//   // Dispatch the message to an appropriate handler.
//   switch (message.type) {
//     case Message.Type.CopyDataToClipboard:
//       await handleClipboardWrite(message.data);
//       break;
//     case Message.Type.CopyDataFromClipboard:
//       sendResponse(await handleClipboardRead());
//       break;
//     default:
//       console.warn(`Unexpected message type received: '${message.type}'.`);
//   }
// }

const port = chrome.runtime.connect({ name: ClipboardMessagePortName });

port.postMessage({
  type: Message.Type.RuntimeConnected,
  target: Message.Target.ServiceWorker
});

port.onMessage.addListener(async function (message) {

  if (message.target !== Message.Target.OffscreenDoc) {

    return;

  }

  switch (message.type) {

    case Message.Type.CopyDataToClipboard:
      await handleClipboardWrite(message.data);
      break;

    case Message.Type.CopyDataFromClipboard:
      port.postMessage({
        target: Message.Target.ServiceWorker,
        type: Message.Type.Response,
        value: await handleClipboardRead()
      });
      break;

    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);

  }

});

// We use a <textarea> element for two main reasons:
//  1. preserve the formatting of multiline text,
//  2. select the node's content using this element's `.select()` method.
const textEl = document.querySelector('#text');

// Use the offscreen document's `document` interface to write a new value to the
// system clipboard.
//
// At the time this demo was created (Jan 2023) the `navigator.clipboard` API
// requires that the window is focused, but offscreen documents cannot be
// focused. As such, we have to fall back to `document.execCommand()`.
async function handleClipboardWrite(data) {

  console.assert(textEl !== null);

  try {

    // Error if we received the wrong kind of data.
    if (typeof data !== 'string') {

      throw new TypeError(
        `Value provided must be a 'string', got '${typeof data}'`
      );

    }

    // `document.execCommand('copy')` works against the user's selection in a web
    // page. As such, we must insert the string we want to copy to the web page
    // and to select that content in the page before calling `execCommand()`.
    textEl.value = data;
    textEl.select();
    document.execCommand('copy');

  } finally {
    // Job's done! Close the offscreen document.
    // window.close();
  }

}

async function handleClipboardRead() {

  console.assert(textEl !== null);

  try {

    textEl.focus();
    textEl.value = '';

    if (!document.execCommand('paste')) {

      throw new TypeError(`Read failure`);

      return '';

    }

    const testContent = textEl.value || '';

    return testContent.trim();

  } finally {
    // Job's done! Close the offscreen document.
    // window.close();
  }

}
