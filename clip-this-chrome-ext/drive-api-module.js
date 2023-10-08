export async function uploadData({ token, apiKey, strData, fileName, fileMimeType }) {

  const file = new File([strData], fileName, {
    type: fileMimeType,
  });

  const metadata = {
    name: fileName,
    mimeType: fileMimeType,
    parents: ['appDataFolder']
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const init = {
    method: 'POST',
    async: true,
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  };

  return fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${apiKey}`,
    init)
    .then((response) => response.json());

}

export async function updateFileData({ token, apiKey, strData, fileId, fileName, fileMimeType }) {

  const file = new File([strData], fileName, {
    type: fileMimeType,
  });

  const metadata = {
    name: fileName,
    mimeType: fileMimeType
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const init = {
    method: 'PATCH',
    async: true,
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  };

  return fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&key=${apiKey}`,
    init)
    .then((response) => response.json());

}

export async function getFilesList({ token, apiKey, fileName }) {

  const init = {
    method: 'GET',
    async: true,
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  return fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${fileName}'`)}&spaces=appDataFolder&key=${apiKey}`,
    init)
    .then((response) => response.json());

}
