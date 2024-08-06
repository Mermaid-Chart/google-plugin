import { useEffect, useState } from 'react';
import { buildUrl } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';
import { CircularProgress, Container, Typography } from '@mui/material';

const previewUrl = localStorage.getItem('previewUrl');

const PreviewDiagramDialog = () => {
  const { authState, authStatus } = useAuth();
  const [diagramsUrl, setDiagramsUrl] = useState('');

  useEffect(() => {
    if (!authState?.authorized || !previewUrl) return;
    const url = buildUrl(previewUrl, authState.token);
    setDiagramsUrl(url);
  }, [authState, previewUrl]);

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

export default PreviewDiagramDialog;
