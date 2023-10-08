'use strict';

import {
  setupOffscreenDocument, ChromeAlarms, ClipboardMessagePortName, Message,
  uploadClipboardData, getGoogleAuthToken, GDriveAPIKey, DriveFileName, callDriveApiWithRetry,
  getClipboardFileId, getClipboardFile
} from './utils_module.js';
import { CircularQueue } from './circular-queue-module.js';
import { getFilesList } from './drive-api-module.js';

// In order to reduce the load on the user's machine, Chrome limits alarms to at most once every 1 minute but may delay them an arbitrary amount more. 
// That is, setting delayInMinutes or periodInMinutes to less than 1 will not be honored and will cause a warning. 
// when can be set to less than 1 minute after "now" without warning but won't actually cause the alarm to fire for at least 1 minute.
// To help you debug your app or extension, when you've loaded it unpacked, there's no limit to how often the alarm can fire.

export class ClipManager {

  static #listenId = undefined;
  static #lastContent = '';
  static _skipListening = true;
  static #listenResumeId = undefined;
  static #messagePort = void 0;
  static #promiseResCb = void 0;
  static #queue = new CircularQueue(10);

  static #waitForMessagePort() {

    return new Promise(async (res, rej) => {

      const waitForMessagePort = async () => {

        if (typeof this.#messagePort === 'undefined') {

          rej('Connection not established .. retrying in 500ms');

          chrome.alarms.onAlarm.removeListener(actionCb);
          await chrome.alarms.clear(ChromeAlarms.SetupOffscreenDocument);

        } else {

          res(void 0);

          chrome.alarms.onAlarm.removeListener(actionCb);
          await chrome.alarms.clear(ChromeAlarms.SetupOffscreenDocument);

        }

      };

      const actionCb = async (alarm) => {

        // console.log(alarm.name);

        if (alarm.name === ChromeAlarms.SetupOffscreenDocument) {

          await waitForMessagePort();

        }

      };

      chrome.alarms.onAlarm.addListener(actionCb);

      await chrome.alarms.create(ChromeAlarms.SetupOffscreenDocument, {
        periodInMinutes: 1 / 120
      });

    });

  }

  static async setupOffscreenDocument(path) {

    await setupOffscreenDocument(path);

    await this.#waitForMessagePort();

  }

  static setupConnection() {

    chrome.runtime.onConnect.addListener((port) => {

      console.assert(port.name === ClipboardMessagePortName);
      this.#messagePort = port;

      port.onDisconnect.addListener(() => {

        console.log('Port disconnected');

        this.#messagePort = void 0;

      });

      port.onMessage.addListener((message) => {

        if (message.target !== Message.Target.ServiceWorker) {
          return;
        }

        switch (message.type) {

          case Message.Type.RuntimeConnected:
            console.log('Runtime connected');
            break;

          case Message.Type.Response:
            if (typeof this.#promiseResCb === 'function') {
              this.#promiseResCb(message.value);
              this.#promiseResCb = void 0;
            }
            break;

          default:
            console.warn(
              `Unexpected message type received: '${message.type}'.`
            );

        }

      });

    });

  }

  static async sendReadMessage() {

    // Now that we have an offscreen document, we can dispatch the
    // message.
    console.assert(typeof this.#messagePort !== 'undefined');

    return new Promise((res, rej) => {

      if (typeof this.#messagePort === 'undefined') {

        return rej('Connection not established');

      }

      this.#messagePort.postMessage({
        type: Message.Type.CopyDataFromClipboard,
        target: Message.Target.OffscreenDoc
      });

      this.#promiseResCb = res;

    });

  }

  static async #updateDriveData() {

    const token = await getGoogleAuthToken();

    console.assert(typeof token !== 'undefined');

    const output = await uploadClipboardData(token, JSON.stringify(this.#queue));

    console.log(output);

  }

  static async #listDriveFiles() {

    const token = await getGoogleAuthToken();

    console.assert(typeof token !== 'undefined');

    const output = await callDriveApiWithRetry(getFilesList, { token: token, apiKey: GDriveAPIKey, fileName: DriveFileName.Clipboard });

  }

  static async #pollCopiedData() {

    let clip;

    try {

      clip = await ClipManager.sendReadMessage();

    } catch (err) {

      console.error(err);

      return;

    }

    if (
      !clip ||
      clip.trim().length === 0 ||
      (ClipManager.#lastContent &&
        clip.trim() === ClipManager.#lastContent.trim())
    ) {

      // Same data or empty
      return;

    }

    ClipManager.#lastContent = clip;

    // Skip the first time
    if (ClipManager._skipListening) {

      ClipManager._skipListening = false;

      return;

    }

    console.log(ClipManager.#lastContent);

    this.#queue.enqueue(ClipManager.#lastContent);

    await this.#updateDriveData();

    console.log(await this.#listDriveFiles());

    // const fileType = 'text/plain';
    // if (validURL(ClipManager.#lastContent)) {
    //   fileType = 'text/link';
    // }

    // gaSendEvent({
    //   'eventCategory': 'send',
    //   'eventAction': 'desktop_txt_native',
    //   'eventLabel': fileType
    // });

    // DriveManager.uploadText(fileType, ClipManager.#lastContent)
    //   .then((fileId) => {
    //     return BackendManager.send(fileType, fileId);
    //   });

  }

  static async startListenClipboard() {

    console.log(`ClipManager.startListenClipboard()`);

    if (this.#listenId) {

      return;

    }

    // if (typeof (await chrome.alarms.get(CHROME_ALARMS.StartListenClipboard)) !== 'undefined') {

    //   console.warn(`Alarm already exists - ${CHROME_ALARMS.StartListenClipboard}`);
    //   return;

    // }

    // if (ClipManager.#listenResumeId) {

    //   clearInterval(ClipManager.#listenResumeId);
    //   ClipManager.#listenResumeId = undefined;

    // }

    const fileId = await getClipboardFileId();
    const token = await getGoogleAuthToken();

    if (typeof fileId !== 'undefined') {

      const file = await getClipboardFile(token, fileId);

      if (null !== file) {

        const fileStr = await file.text();

        this.#queue.deserialize(fileStr);

      }

    }

    const actionCb = (alarm) => {

      // console.log(alarm.name);

      if (alarm.name === ChromeAlarms.StartListenClipboard) {

        this.#pollCopiedData();

      }

    };

    chrome.alarms.onAlarm.addListener(actionCb);

    await chrome.alarms.create(ChromeAlarms.StartListenClipboard, {
      periodInMinutes: 1 / 60
    });

    this.#listenId = 1;

  }

  static stopListenClipboard(listenResume = false) {
    console.log(`ClipManager.stopListenClipboard()`);
    // Check auto copy needs resume for every 2 mins.
    if (listenResume && !ClipManager.#listenResumeId) {
      console.log(`ClipManager.stopListenClipboard().listenResume`);
      ClipManager.#listenResumeId = setInterval(async function () {
        console.log(`ClipManager.stopListenClipboard().listenResume.check`);
        let isAutoCopy = await PersistenceManager.isAutoCopyOn();
        if (isAutoCopy) {
          let selfNode = await BackendManager.getSelfNode();
          if (selfNode != null && selfNode.is_enable) {
            ClipManager.startListenClipboard();
          }
        }
      }, 120000);
    }

    if (!ClipManager.#listenId) return;
    clearInterval(ClipManager.#listenId);
    ClipManager.#listenId = undefined;
    ClipManager._skipListening = true;
  }

  static async writeText(text) {
    ClipManager.#lastContent = text;
    await navigator.clipboard.writeText(text);
  }

  static getLastContent() {
    return ClipManager.#lastContent;
  }

  static async readText() {
    return navigator.clipboard.readText();
  }

  static writeTextClassic(text) {
    // console.log(`ClipManager.writeTextClassic()`);
    let textArea = document.createElement('textarea');
    document.body.appendChild(textArea);
    textArea.value = text;
    textArea.select();
    if (!document.execCommand('cut')) {
      console.error('Copy Failure.');
    }
    textArea.blur();
    document.body.removeChild(textArea);

    // Update lastContent
    ClipManager.#lastContent = text;
  }

  static readTextClassic() {
    // console.log(`ClipManager.readTextClassic()`);
    let textArea = document.createElement('textarea');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.value = '';
    if (!document.execCommand('paste')) {
      console.error('Read Failure.');
      return '';
    }
    var testContent = textArea.value || '';
    document.body.removeChild(textArea);
    return testContent.trim();
  }

  static writeImageClassic(src) {
    var img = document.createElement('img');
    img.src = src;

    img.onload = () => {
      window.getSelection().removeAllRanges();
      document.body.appendChild(img);
      var r = document.createRange();
      r.setStartBefore(img);
      r.setEndAfter(img);
      r.selectNode(img);
      var sel = window.getSelection();
      sel.addRange(r);
      document.execCommand('copy');
      document.body.removeChild(img);
      window.getSelection().removeAllRanges();
    };
  }

}
