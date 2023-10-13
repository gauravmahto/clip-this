// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

import { firebase } from '../utils_module.js';

(async () => {

  try {

    // Initialize Firebase
    const app = initializeApp(firebase.config);

    const messaging = getMessaging(app);

    // var credential = GoogleAuthProvider.credential(null, await getRawGoogleAuthToken());
    // firebase.auth().signInWithCredential(credential);

  } catch (err) {

    console.error(`Messaging: ${err}`);
    console.error(err);

  }

})();
