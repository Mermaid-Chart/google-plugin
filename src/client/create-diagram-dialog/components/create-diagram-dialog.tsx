import { useEffect, useState } from 'react';
import { buildUrl, handleDialogClose } from '../../utils/helpers';
import { serverFunctions } from '../../utils/serverFunctions';
import useAuth from '../../hooks/useAuth';
import { CircularProgress, Container, Typography } from '@mui/material';
import { showAlertDialog } from '../../utils/alert';
import LoadingOverlay from '../../components/loading-overlay';

const CreateDiagramDialog = () => {
  const { authState, authStatus } = useAuth();
  const [diagramsUrl, setDiagramsUrl] = useState('');
  const [isInserting, setIsInserting] = useState(false);

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
          console.error('Error inserting image with metadata', error);
          showAlertDialog('Error inserting image, please try again');
          setIsInserting(false); 
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isInserting]);

  if (authStatus === 'idle' || authStatus === 'loading') {
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
          height: '96.5vh',
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
      {isInserting && <LoadingOverlay />}
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
        />
      </div>
    </>
  );
};

export default CreateDiagramDialog;
