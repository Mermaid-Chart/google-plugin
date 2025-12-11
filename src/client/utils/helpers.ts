import { baseURL } from '../../config/urls';

export const buildUrl = (pathname: string, accessToken: string) => {
  return `${baseURL}/oauth/frame?token=${accessToken}&redirect=${pathname}`;
};

export const handleDialogClose = () => {
  if ((window as any).google) {
    (window as any).google.script.host.close();
  } else {
    window.parent?.postMessage('closeDialog', '*');
  }
};

/**
 * Resizes a base64 image if it exceeds the maximum dimension limit.
 * Enforces a maximum dimension of 4000px to prevent canvas issues.
 * @param base64Image - The base64 encoded image string (with or without data URI prefix)
 * @returns Promise<string> - The processed base64 image string (without data URI prefix)
 */
export const compressBase64Image = async (
  base64Image: string
): Promise<string> => {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const img = new Image();
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

    img.src = `data:image/png;base64,${base64Data}`;
    await loadPromise;

    const maxDimension = 4000;

    if (img.width <= maxDimension && img.height <= maxDimension) {
      return base64Data;
    }

    const scale = maxDimension / Math.max(img.width, img.height);
    const newWidth = Math.floor(img.width * scale);
    const newHeight = Math.floor(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    const resizedDataUrl = canvas.toDataURL('image/png');
    let resizedBase64 = resizedDataUrl.replace(/^data:image\/\w+;base64,/, '');

    while (resizedBase64.length % 4 !== 0) {
      resizedBase64 += '=';
    }

    return resizedBase64;
  } catch (error) {
    console.error('Error processing image:', error);
    let original = base64Image.replace(/^data:image\/\w+;base64,/, '');
    while (original.length % 4 !== 0) {
      original += '=';
    }
    return original;
  }
};
