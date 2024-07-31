import { baseURL } from '../../utils/urls';

interface Document {
  documentID: string;
  major: string;
  minor: string;
}

export const buildUrl = (pathname: string, accessToken: string) => {
  return `${baseURL}/oauth/frame?token=${accessToken}&redirect=${pathname}`;
};

export const buildRawUrl = (document: Document, theme = 'light') => {
  return `${baseURL}/raw/${document.documentID}?version=v${document.major}.${document.minor}&theme=${theme}&format=png`;
};

export const handleDialogClose = () => {
  if ((window as any).google) {
    (window as any).google.script.host.close();
  } else {
    window.parent?.postMessage('closeDialog', '*');
  }
};
