// 'use strict';

import { ClipManager } from './clipboard_module.js';
import { getGoogleAuthToken, openAuthTab } from './utils_module.js';

chrome.runtime.onInstalled.addListener(async () => {

  const result = await getGoogleAuthToken();

  console.log(`Token fetched with length ${result}`);
  // console.log(`Token fetched with length ${result?.length}`);

  if (typeof result === 'undefined') {

    await openAuthTab();

  } else {

    console.log('User is already authenticated');

  }

});

(async () => {

  ClipManager.setupConnection();

  await ClipManager.setupOffscreenDocument('off-screen/off-screen.html');

  await ClipManager.startListenClipboard();

})();
