const baseURL = 'https://test.mermaidchart.com';

export const onOpen = () => {
  const menu = DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Add Chart', 'openDialog')
    .addItem('Edit Chart', 'openEditDialog')
    .addItem('Open Sidebar', 'openSidebar');

  menu.addToUi();
};

export const openDialog = () => {
  const html = HtmlService.createHtmlOutputFromFile('dialog')
    .append(
      `<script>
      window.addEventListener('message', function(event) {
        if (event.data === "closeDialog") {
            google.script.host.close();
        }
      }, false);
    </script>`
    )
    .setWidth(1366)
    .setHeight(768);
  DocumentApp.getUi().showModalDialog(html, 'Medmaid Chart Dialog');
};

export const openEditDialog = () => {
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();

  if (!selection) {
    DocumentApp.getUi().alert('No selection found. Please select an image.');
    return;
  }
  const html = HtmlService.createHtmlOutputFromFile('edit-dialog')
    .append(
      `<script>
      window.addEventListener('message', function(event) {
        if (event.data === "closeDialog") {
            google.script.host.close();
        }
      }, false);
    </script>`
    )
    .setWidth(1366)
    .setHeight(768);
  DocumentApp.getUi().showModalDialog(html, 'Edit Medmaid Chart Dialog');
};

export const openSidebar = () => {
  const html =
    HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Mermaid Chart');
  DocumentApp.getUi().showSidebar(html);
};

export function handleCallback(callbackRequest) {
  var service = getOAuthService();
  var authorized = service.handleCallback(callbackRequest);
  if (authorized) {
    return HtmlService.createHtmlOutput(
      '<html><body>Success! You can close this window.<script>window.setTimeout(function() { google.script.host.close(); }, 1000);</script></body></html>'
    );
  } else {
    return HtmlService.createHtmlOutput(
      '<html><body>Denied. You can close this window.<script>window.setTimeout(function() { google.script.host.close(); }, 1000);</script></body></html>'
    );
  }
}

function getOAuthService() {
  pkceChallengeVerifier();
  const userProps = PropertiesService.getUserProperties();

  return OAuth2.createService('Mermaid Chart')
    .setAuthorizationBaseUrl(baseURL + '/oauth/authorize')
    .setTokenUrl(baseURL + '/oauth/token')
    .setClientId('f88f1365-dea8-466e-8880-e22211e145bd')
    .setScope('email')
    .setCallbackFunction('handleCallback')
    .setCache(CacheService.getUserCache())
    .setPropertyStore(PropertiesService.getUserProperties())
    .setTokenPayloadHandler((payload) => {
      payload['code_verifier'] = userProps.getProperty('code_verifier');
      return payload;
    })
    .setParam('response_type', 'code')
    .setParam('code_challenge_method', 'S256')
    .setParam('code_challenge', userProps.getProperty('code_challenge') ?? '');
}

export function getOAuthURL() {
  var service = getOAuthService();
  return service.getAuthorizationUrl();
}

export function getAuthorizationState() {
  const service = getOAuthService();

  if (service.hasAccess()) {
    return {
      authorized: true,
      token: service.getAccessToken(),
    };
  }
  return {
    authorized: false,
    message: 'User is not authorized',
  };
}

export function resetOAuth() {
  getOAuthService().reset();
  PropertiesService.getUserProperties()
    .deleteProperty('code_challenge')
    .deleteProperty('code_verifier');
}

function pkceChallengeVerifier() {
  const userProps = PropertiesService.getUserProperties();
  if (!userProps.getProperty('code_verifier')) {
    let verifier = '';
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 128; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    const sha256Hash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      verifier,
      Utilities.Charset.US_ASCII
    );
    let challenge = Utilities.base64EncodeWebSafe(sha256Hash);
    challenge = challenge.slice(0, challenge.indexOf('='));
    userProps.setProperty('code_verifier', verifier);
    userProps.setProperty('code_challenge', challenge);
  }
}

function setElementSize(element, maxWidth) {
  if (!element) {
    throw new Error('Element is not defined.');
  }
  const originalHeight = element.getHeight();
  const originalWidth = element.getWidth();

  // Calculate new width while preserving aspect ratio
  let newWidth = originalWidth;
  if (originalWidth > maxWidth) {
    newWidth = maxWidth;
  }

  element.setWidth(newWidth);
  element.setHeight((originalHeight / originalWidth) * newWidth);
}

/**
 * Inserts a base64 image into the Google Document with metadata.
 * @param {string} base64Image - The base64 encoded image string.
 * @param {string} metadata - A string containing metadata to store with the image.
 * @param {number} maxWidth - Max height to set for the new image.
 */
export function insertBase64ImageWithMetadata(
  base64Image,
  metadata,
  maxWidth = 400
) {
  // Decode the base64 string to a byte array
  const decodedBytes = Utilities.base64Decode(base64Image);

  // Create a Blob from the byte array
  const blob = Utilities.newBlob(decodedBytes, 'image/x-png', 'image');

  // Get the active document
  const doc = DocumentApp.getActiveDocument();

  // Get the cursor position
  const cursor = doc.getCursor();
  if (!cursor) {
    throw new Error('Cannot find a cursor in the document.');
  }

  // Insert the image at the cursor position
  const element = cursor.insertInlineImage(blob);
  setElementSize(element, maxWidth);

  element.setAltDescription(metadata);
}

/**
 * Reads metadata from the selected image in the Google Document and returns it.
 * @returns {string | null} String containing metadata for the selected image, or null if no image is selected.
 */
export function readSelectedImageMetadata() {
  // Get the active document
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();

  if (!selection) {
    DocumentApp.getUi().alert('No selection found. Please select an image.');
    return null;
  }

  const elements = selection.getRangeElements();
  let image = null;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i].getElement();
    if (element.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
      image = element.asInlineImage();
      break;
    }
  }

  if (!image) {
    DocumentApp.getUi().alert('Please select an image.');
    return null;
  }

  const metadata = image.getAltDescription();

  return metadata;
}

/**
 * Replaces the selected image in the Google Document with a new one provided as a Base64 string,
 * and sets the new image size.
 * @param {string} base64Image - The new image as a Base64-encoded string.
 * @param {string} metadata - A string containing metadata to store with the image.
 * @param {number} maxWidth - Max height to set for the new image.
 */
export function replaceSelectedImageWithBase64AndSize(
  base64Image,
  metadata,
  maxWidth = 400
) {
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();

  if (!selection) {
    DocumentApp.getUi().alert('No selection found. Please select an image.');
    return;
  }

  const elements = selection.getRangeElements();
  let imageParent = null;
  let imageChildIndex = null;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i].getElement();
    if (element.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
      // Get the parent of the image to replace it
      imageParent = element.getParent();
      imageChildIndex = imageParent.getChildIndex(element);
      break;
    }
  }

  if (!imageParent || imageChildIndex === null) {
    DocumentApp.getUi().alert('Please select an image.');
    return;
  }

  // Decode the Base64 image string to a Blob
  const decodedImage = Utilities.newBlob(
    Utilities.base64Decode(base64Image),
    'image/x-png',
    'image'
  );

  // Remove the old image
  imageParent.removeChild(imageParent.getChild(imageChildIndex));

  // Insert the new image at the same position and set its size
  const insertedImage = imageParent.insertInlineImage(
    imageChildIndex,
    decodedImage
  );
  setElementSize(insertedImage, maxWidth);
  insertedImage.setAltDescription(metadata);
}
