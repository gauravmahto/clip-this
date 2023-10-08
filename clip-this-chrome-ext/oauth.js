import { uploadTokenData } from './utils_module.js';

window.onload = function () {

  chrome.identity.getAuthToken({ interactive: true }, function (token) {

    return uploadTokenData(token)
      .then((data) => {

        if (typeof data.error !== 'undefined') {

          chrome.identity.removeCachedAuthToken({ token: token.token });

          throw new Error(data);

        };

        console.log(`User credentials stored successfully. API response ${JSON.stringify(data)}`);

        const messageDiv = document.getElementById('#message');

        if (null !== messageDiv) {

          messageDiv.style.display = 'block';

        }

      });

  });

};
