// 'use strict';

import { ClipManager } from './clipboard_module.js';
import { getGoogleAuthToken, openAuthTab, setupOffscreenDocument } from './utils_module.js';

chrome.runtime.onInstalled.addListener(async () => {

  const result = await getGoogleAuthToken();

  console.log(`Token fetched with length ${result}`);
  // console.log(`Token fetched with length ${result?.length}`);

  if (typeof result === 'undefined') {

    await openAuthTab();

  } else {

    console.log('User is already authenticated');

  }

  await start();

  chrome.gcm.register(['759693837281'], (registrationId) => {

    console.log('GCM registration ID: ' + registrationId);

    if (chrome.runtime.lastError) {

      console.error('GCM registration failed');

      return;

    }

    chrome.gcm.onMessage.addListener((message) => {

      console.log('message', message);

    });

  });

});

async function start() {

  ClipManager.setupConnection();

  await ClipManager.setupOffscreenDocument('off-screen/index.html');

  await ClipManager.initialize();

  await ClipManager.startListenClipboard();

}
