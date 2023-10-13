import { getFile, updateFileData, uploadData, deleteFile as deleteDriveFile, getFilesList } from './drive-api-module.js';
import { GDriveAPIKey } from './sensitive-module.js';

export { GDriveAPIKey } from './sensitive-module.js';

let creating; // A global promise to avoid concurrency issues

export const GDriveToken = 'GDrive-Token';
export const GDriveClipboardIdKey = 'GDriveClipboardIdKeyName';

export const ClipboardMessagePortName = 'Clipboard';

export const ChromeAlarms = {
  SetupOffscreenDocument: 'ClipManager.setupOffscreenDocument',
  StartListenClipboard: 'ClipManager.startListenClipboard'
};

export const Message = {

  Type: {
    RuntimeConnected: 'runtime-connected',
    Response: 'response',
    CopyDataToClipboard: 'copy-data-to-clipboard',
    CopyDataFromClipboard: 'copy-data-from-clipboard'
  },
  Target: {
    ServiceWorker: 'service-worker',
    OffscreenDoc: 'offscreen-doc'
  }

};

export const DriveFileName = {

  Clipboard: 'clipboard.txt',
  Token: 'token.txt'

};

export const DriveKind = {

  File: 'drive#file'

};

export const firebase = {

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  config: {
    apiKey: 'AIzaSyAQ47aI8WoPO4Q9mTYv7JRS3G6oNwRIU90',
    authDomain: 'clipthis-401016.firebaseapp.com',
    projectId: 'clipthis-401016',
    storageBucket: 'clipthis-401016.appspot.com',
    messagingSenderId: '759693837281',
    appId: '1:759693837281:web:2346aa1e3b7a628c9f88a0',
    measurementId: 'G-TDXZMDYETC'
  }

};

// ----------------------------- Utils

export function isNotUndefinedAndNull(obj) {

  return (typeof obj !== 'undefined' &&
    null !== obj);

}

// ----------------------------- Utils

/**
 * 
 * @param {string} path 
 * @param {Array<string>} reasons
 * @returns 
 */
export async function setupOffscreenDocument(path, reasons) {

  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {

    return;

  }

  // create offscreen document
  if (creating) {

    await creating;

  } else {

    creating = chrome.offscreen.createDocument({
      url: path,
      reasons,
      justification: 'Access and write clipboard data'
    });

    await creating;
    creating = null;

  }

}

export async function uploadTokenData(token) {

  const dataToSave = {
    GDriveToken: token
  };

  const output = await uploadData({
    token: token,
    apiKey: GDriveAPIKey,
    strData: JSON.stringify(dataToSave),
    fileName: DriveFileName.Token,
    fileMimeType: 'text/plain',
  });

  return output;

}

export async function uploadClipboardData(token, clip) {

  let output;

  const fileId = await getClipboardFileId();

  if (typeof fileId !== 'undefined') {

    output = updateClipboardDataFile(token, fileId, clip);

  } else {

    output = createClipboardDataFile(token, clip);

  }

  return output;

}

export async function createClipboardDataFile(token, clip) {

  const output = await callDriveApiWithRetry(uploadData, {
    token: token,
    apiKey: GDriveAPIKey,
    strData: clip,
    fileName: DriveFileName.Clipboard,
    fileMimeType: 'text/plain',
  });

  if (typeof output.id === 'string') {

    await saveClipboardFileId(output.id);

  }

  return output;

}

export async function updateClipboardDataFile(token, fileId, clip) {

  const output = await callDriveApiWithRetry(updateFileData, {
    token: token,
    apiKey: GDriveAPIKey,
    strData: clip,
    fileId,
    fileName: DriveFileName.Clipboard,
    fileMimeType: 'text/plain',
  });

  if (typeof output.id === 'string') {

    await saveClipboardFileId(output.id);

  }

  return output;

}

export async function saveClipboardFileId(fileId) {

  return chrome.storage.local.set({ [GDriveClipboardIdKey]: fileId });

}

export async function getClipboardFileId() {

  return (await chrome.storage.local.get([GDriveClipboardIdKey]))?.[GDriveClipboardIdKey];

}

export async function getClipboardFile(token, fileId) {

  return await callDriveApiWithRetry(getFile, {
    token,
    apiKey: GDriveAPIKey,
    fileId
  });

}

export async function getFileList(token) {

  const fileList = await callDriveApiWithRetry(getFilesList, {
    token: token,
    apiKey: GDriveAPIKey,
    fileName: DriveFileName.Clipboard
  });

  return fileList.files ?? void 0;

}

export async function deleteFile(token, fileId) {

  return await callDriveApiWithRetry(deleteDriveFile, {
    token,
    apiKey: GDriveAPIKey,
    fileId
  });

}

export async function getRawGoogleAuthToken() {

  try {

    return await chrome.identity.getAuthToken();

  } catch {

    return void 0;

  }

}

export async function getGoogleAuthToken() {

  try {

    return (await chrome.identity.getAuthToken()).token;

  } catch {

    return void 0;

  }

}

export async function openAuthTab() {

  return chrome.tabs.create({ url: 'index.html' });

}

export async function callDriveApiWithRetry(apiFn, ...args) {

  try {

    let result = await apiFn(...args);

    if (typeof result.error === 'object') {

      console.warn(`Api call failed. Retrying 1 more time. Error ${JSON.stringify(result)}`);

      if ('4' === result.error.code.toString()[0]) {

        // HTTP status code 4xx

        await chrome.identity.removeCachedAuthToken({ token: await getGoogleAuthToken() });

        await openAuthTab();

        result = await apiFn(...args);

      }

    }

    return result;

  } catch (err) {

    console.error(`Api call failed. Fatal error can't retry ${err}`);

    await chrome.identity.removeCachedAuthToken({ token: await getGoogleAuthToken() });

  }

}
