import { useEffect, useState } from 'react';
import { buildUrl, handleDialogClose } from '../../utils/helpers';
import { serverFunctions } from '../../utils/serverFunctions';

interface AuthState {
  authorized: boolean;
  token?: string;
  message?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const Dialog = () => {
  const [diagramsUrl, setDiagramsUrl] = useState('');
  const [, setAuthState] = useState<null | AuthState>(null);
  const [authStatus, setAuthStatus] = useState<Status>('idle');

  useEffect(() => {
    const getAuth = async () => {
      setAuthStatus('loading');
      try {
        const state = await serverFunctions.getAuthorizationState();
        setAuthState(state);
        setAuthStatus('success');

        if (state.authorized) {
          const url = buildUrl('/app/plugins/confluence/select', state.token);
          setDiagramsUrl(url);
        }
      } catch (error) {
        console.log('Error getting auth data', error);
        setAuthStatus('error');
      }
    };

    getAuth();
  }, []);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const action = e.data.action;
      console.log('action', action, e.data);
      if (action === 'save') {
        const data = e.data.data;
        console.log(data);
        const metadata = new URLSearchParams({
          projectID: data.projectID,
          documentID: data.documentID,
          major: data.major,
          minor: data.minor,
        });
        try {
          await serverFunctions.insertBase64ImageWithMetadata(
            data.diagramImage,
            metadata.toString()
          );
          handleDialogClose();
        } catch (error) {
          console.error('Error inserting image with metadata', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (authStatus !== 'success') {
    return null;
  }

  return (
    <div style={{ padding: '3px', overflowX: 'hidden', height: '100%' }}>
      <iframe
        src={diagramsUrl}
        title="diagrams"
        style={{
          border: 'none',
          width: '100%',
          height: '96.5vh',
        }}
      />
    </div>
  );
};

export default Dialog;
