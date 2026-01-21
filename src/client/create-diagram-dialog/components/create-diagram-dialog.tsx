import { useEffect, useState } from 'react';
import {
  buildUrl,
  handleDialogClose,
  compressBase64Image,
} from '../../utils/helpers';

import useAuth from '../../hooks/useAuth';
import { CircularProgress, Container, Typography, Box } from '@mui/material';
import { showAlertDialog } from '../../utils/alert';

const CreateDiagramDialog = () => {
  const { authState, authStatus } = useAuth();
  const [diagramsUrl, setDiagramsUrl] = useState('');
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (!authState?.authorized) return;
    const url = buildUrl(
      '/app/diagrams/new?pluginSource=googledocs',
      authState.token
    );
    setDiagramsUrl(url);
  }, [authState]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const action = e.data.action;
      if (action === 'save') {
        const data = e.data.data;
        const metadata = new URLSearchParams({
          projectID: data.projectID,
          documentID: data.documentID,
          major: data.major,
          minor: data.minor,
        });

        try {
          const compressedImage = await compressBase64Image(data.diagramImage);

          // Pass data to sidebar via BroadcastChannel and close immediately
          const channel = new BroadcastChannel('diagram_channel');
          channel.postMessage({
            type: 'pendingInsertion',
            payload: {
              image: compressedImage,
              metadata: metadata.toString(),
              operation: 'insert',
            },
          });
          channel.close();
          handleDialogClose();
        } catch (error) {
          console.error('Error preparing diagram insertion', error);
          showAlertDialog('Error preparing diagram, please try again');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <Container
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '96.5vh',
        }}
      >
        <CircularProgress size={40} />
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
          height: '96.5vh',
        }}
      >
        <Typography variant="h6" gutterBottom textAlign="center">
          Error
        </Typography>
        <Typography variant="body2" textAlign="center">
          Something went wrong. Please try again later.
        </Typography>
      </Container>
    );
  }

  if (!diagramsUrl) {
    return (
      <Container
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '96.5vh',
        }}
      >
        <CircularProgress size={40} />
      </Container>
    );
  }

  return (
    <>
      {iframeLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 1000,
          }}
        >
          <CircularProgress size={40} />
        </Box>
      )}
      <div style={{ padding: '3px', overflowX: 'hidden', height: '100%' }}>
        <iframe
          src={diagramsUrl}
          title="diagrams"
          style={{
            border: 'none',
            width: '100%',
            height: '96.5vh',
            opacity: 1,
          }}
          onLoad={handleIframeLoad}
        />
      </div>
    </>
  );
};

export default CreateDiagramDialog;
