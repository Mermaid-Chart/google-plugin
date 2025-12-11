import { useEffect, useState } from 'react';
import { serverFunctions } from '../../utils/serverFunctions';
import {
  buildUrl,
  handleDialogClose,
  compressBase64Image,
} from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';
import { showAlertDialog } from '../../utils/alert';
import LoadingOverlay from '../../components/loading-overlay';
import { CircularProgress, Container, Typography, Box } from '@mui/material';

const EditDiagramDialog = () => {
  const { authState, authStatus } = useAuth();
  const [diagramsUrl, setDiagramsUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (!authState?.authorized) return;

    const getMetadata = async () => {
      try {
        const metadata = await serverFunctions.readSelectedImageMetadata();
        if (typeof metadata !== 'string') return;

        const params = new URLSearchParams(metadata);
        const projectID = params.get('projectID');
        const documentID = params.get('documentID');
        const major = params.get('major');
        const minor = params.get('minor');
        if (projectID && documentID && major && minor) {
          const iframeUrl = buildUrl(
            `/app/projects/${projectID}/diagrams/${documentID}/version/v.${major}.${minor}/edit`,
            authState.token
          );
          setDiagramsUrl(iframeUrl);
        }
      } catch (error) {
        console.log(error);
      }
    };

    getMetadata();
  }, [authState]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const action = e.data.action;
      console.log('action', action);
      if (action === 'save') {
        if (isUpdating) {
          return;
        }

        setIsUpdating(true);

        const data = e.data.data;
        const metadata = new URLSearchParams({
          projectID: data.projectID,
          documentID: data.documentID,
          major: data.major,
          minor: data.minor,
        });
        try {
          const compressedImage = await compressBase64Image(data.diagramImage);

          await serverFunctions.replaceSelectedImageWithBase64AndSize(
            compressedImage,
            metadata.toString()
          );
          handleDialogClose();
        } catch (error) {
          console.error('Error updating image with metadata', error);
          showAlertDialog('Error updating image, please try again');
          setIsUpdating(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isUpdating]);

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
      {isUpdating && <LoadingOverlay />}
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
            opacity: isUpdating ? 0.5 : 1,
            pointerEvents: isUpdating ? 'none' : 'auto',
          }}
          onLoad={handleIframeLoad}
        />
      </div>
    </>
  );
};

export default EditDiagramDialog;
