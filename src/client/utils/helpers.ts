import { baseURL } from '../../utils/urls';

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
