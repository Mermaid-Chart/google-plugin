import { useEffect, useState } from 'react';
import {
  buildUrl,
  handleDialogClose,
  compressBase64Image,
} from '../../utils/helpers';

import useAuth from '../../hooks/useAuth';
import { serverFunctions } from '../../utils/serverFunctions';
import { CircularProgress, Container, Typography, Box } from '@mui/material';
import { showAlertDialog } from '../../utils/alert';

const editUrl = localStorage.getItem('editUrl');

const SelectDiagramDialog = () => {
  const { authState, authStatus } = useAuth();
  const [diagramsUrl, setDiagramsUrl] = useState('');
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isInserting, setIsInserting] = useState(false);

  useEffect(() => {
    if (!authState?.authorized) return;

    if (editUrl) {
      const url = buildUrl(editUrl, authState.token);
      setDiagramsUrl(url);
      localStorage.removeItem('editUrl');
      return;
    }
    const url = buildUrl(
      '/app/plugins/confluence/select?pluginSource=googledocs',
      authState.token
    );
    setDiagramsUrl(url);
  }, [authState]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const action = e.data.action;
      const type = e.data.type;

      if (action === 'save') {
        const data = e.data.data;
        const metadata = new URLSearchParams({
          projectID: data.projectID,
          documentID: data.documentID,
          major: data.major,
          minor: data.minor,
        });

        try {
          setIsInserting(true);
          const compressedImage = await compressBase64Image(data.diagramImage);

          // Insert directly from this dialog — works whether sidebar is open or closed
          await serverFunctions.insertBase64ImageWithMetadata(
            compressedImage,
            metadata.toString()
          );

          // Notify sidebar to refresh its image list if it happens to be open
          const channel = new BroadcastChannel('diagram_channel');
          channel.postMessage({ type: 'refreshImages' });
          channel.close();
          handleDialogClose();
        } catch (error) {
          setIsInserting(false);
          showAlertDialog('Error preparing diagram, please try again');
          console.error('Error preparing diagram insertion', error);
        }
      } else if (
        type === 'mermaid-chart-google-docs-back' &&
        action === 'navigateBack'
      ) {
        // Handle back navigation from the iframe - close the dialog
        handleDialogClose();
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
      {isInserting && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 2000,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Inserting diagram...
          </Typography>
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

export default SelectDiagramDialog;
