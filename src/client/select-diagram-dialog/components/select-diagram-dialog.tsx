import { useEffect, useState } from 'react';
import { buildUrl, handleDialogClose } from '../../utils/helpers';
import { serverFunctions } from '../../utils/serverFunctions';
import useAuth from '../../hooks/useAuth';
import { CircularProgress, Container, Typography, Box } from '@mui/material';
import { showAlertDialog } from '../../utils/alert';
import LoadingOverlay from '../../components/loading-overlay';

const editUrl = localStorage.getItem('editUrl');

const SelectDiagramDialog = () => {
  const { authState, authStatus } = useAuth();
  const [diagramsUrl, setDiagramsUrl] = useState('');
  const [isInserting, setIsInserting] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (!authState?.authorized) return;

    if (editUrl) {
      const url = buildUrl(editUrl, authState.token);
      setDiagramsUrl(url);
      localStorage.removeItem('editUrl');
      return;
    }
    const url = buildUrl(
      '/app/plugins/select?pluginSource=googledocs',
      authState.token
    );
    setDiagramsUrl(url);
  }, [authState]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const action = e.data.action;
      if (action === 'save') {
        if (isInserting) {
          console.log('Already inserting diagram, ignoring duplicate click');
          return;
        }

        setIsInserting(true);

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
          handleDialogClose();
        } catch (error) {
          showAlertDialog('Error inserting image, please try again');
          console.error('Error inserting image with metadata', error);
          setIsInserting(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isInserting]);

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
      {isInserting && <LoadingOverlay />}
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
            opacity: isInserting ? 0.5 : 1,
            pointerEvents: isInserting ? 'none' : 'auto',
          }}
          onLoad={handleIframeLoad}
        />
      </div>
    </>
  );
};

export default SelectDiagramDialog;
