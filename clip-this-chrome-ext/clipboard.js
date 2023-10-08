"use strict";

class ClipManager {
  static #listenId = undefined;
  static #lastContent = '';
  static _skipListening = true;
  static #listenResumeId = undefined;

  static startListenClipboard() {
    console.log(`ClipManager.startListenClipboard()`);

    if (ClipManager.#listenId) return;

    if (ClipManager.#listenResumeId) {
      clearInterval(ClipManager.#listenResumeId);
      ClipManager.#listenResumeId = undefined;
    }

    ClipManager.#listenId = setInterval(function () {
      const clip = ClipManager.readTextClassic();
      if (!clip || clip.trim().length === 0 ||
        (ClipManager.#lastContent && clip.trim() === ClipManager.#lastContent.trim())) {
        return;
      }

      ClipManager.#lastContent = clip;

      // Skip the first time
      if (ClipManager._skipListening) {
        ClipManager._skipListening = false;
        return;
      }

      console.log(ClipManager.#lastContent);

      var fileType = 'text/plain';
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
    }, 1000);
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
    let textArea = document.createElement("textarea");
    document.body.appendChild(textArea);
    textArea.value = text;
    textArea.select();
    if (!document.execCommand("cut")) {
      console.error("Copy Failure.");
    }
    textArea.blur();
    document.body.removeChild(textArea);

    // Update lastContent
    ClipManager.#lastContent = text;
  }

  static readTextClassic() {
    // console.log(`ClipManager.readTextClassic()`);
    let textArea = document.createElement("textarea");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.value = '';
    if (!document.execCommand("paste")) {
      console.error("Read Failure.");
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
