import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, CircularProgress, Container, Typography } from '@mui/material';
import { serverFunctions } from '../../utils/serverFunctions';
import LoadingOverlay from './LoadingOverlay';
import { buildUrl } from '../../utils/helpers';

interface AuthState {
  authorized: boolean;
  token?: string;
  message?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const Sidebar = () => {
  const [authState, setAuthState] = useState<null | AuthState>(null);
  const [authStatus, setAuthStatus] = useState<Status>('idle');
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const [diagramsUrl, setDiagramsUrl] = useState<string>('');

  const getAuth = useCallback(async () => {
    setAuthStatus('loading');
    try {
      const state = await serverFunctions.getAuthorizationState();
      setAuthState(state);
      setAuthStatus('success');
      if (intervalRef.current !== null && state.authorized) {
        clearInterval(intervalRef?.current);
        intervalRef.current = null;
        setOverlayEnabled(false);
      }

      if (state.authorized) {
        const url = buildUrl('/app/plugins/confluence/select', state.token);
        setDiagramsUrl(url);
        localStorage.setItem('url', url);
      }
    } catch (error) {
      console.log('Error getting auth data', error);
      setAuthStatus('error');
    }
  }, []);

  useEffect(() => {
    getAuth();
  }, [getAuth]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const action = e.data.action;
      console.log('action', action, e.data);
      if (action === 'save') {
        const data = e.data.data;
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

  const handleLoginClick = async () => {
    const width = 500;
    const height = 650;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;
    let options = 'width=' + width;
    options += ',height=' + height;
    options += ',top=' + top;
    options += ',left=' + left;

    try {
      const authUrl = await serverFunctions.getOAuthURL();
      const windowObjectReference = window.open(
        authUrl,
        'loginWindow',
        options
      );
      windowObjectReference?.focus();
      setOverlayEnabled(true);
      intervalRef.current = setInterval(getAuth, 3000);
    } catch (error) {
      console.error('Error fetching OAuth URL:', error);
    }
  };

  const handleLogOut = async () => {
    serverFunctions.resetOAuth();
    setTimeout(getAuth, 2000);
  };

  const handleDialogOpen = () => {
    serverFunctions.openDialog();
  };

  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 114px)',
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (authStatus === 'error') {
    return (
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 114px)',
        }}
      >
        <Typography variant="h5" gutterBottom my={2} textAlign="center">
          Error
        </Typography>
        <Typography paragraph textAlign="center">
          Something went wrong. Please try again later.
        </Typography>
      </Container>
    );
  }

  return (
    <>
      {overlayEnabled && <LoadingOverlay />}
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingLeft: '0px',
          paddingRight: '0px',
        }}
      >
        <img
          src="https://jiratest.mermaidchart.com/icon_80x80.png"
          alt="mc"
          width={80}
          height={80}
          style={{ marginTop: '20px' }}
        />
        <Typography variant="h5" gutterBottom my={2} textAlign="center">
          Welcome to Mermaid Chart
        </Typography>
        {authState?.authorized ? (
          <>
            <Typography paragraph textAlign="center">
              You are logged in, click the button below to logout
            </Typography>
            <Button onClick={handleLogOut} color="primary" variant="text">
              Logout
            </Button>
            <iframe
              src={diagramsUrl}
              title="diagrams"
              style={{
                border: 'none',
                marginTop: '20px',
                width: '100%',
                height: 'calc(100vh - 345px)',
              }}
            />
          </>
        ) : (
          <>
            <Typography paragraph textAlign="center">
              To access your diagrams, log into your Mermaid Chart account
            </Typography>
            <Button
              onClick={handleLoginClick}
              color="primary"
              variant="text"
              disabled={!authState}
            >
              Connect to Mermaid Chart
            </Button>
            <Button onClick={handleDialogOpen} color="primary" variant="text">
              Open Dialog
            </Button>
          </>
        )}
      </Container>
    </>
  );
};

export default Sidebar;
