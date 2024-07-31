import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  CircularProgress,
  Container,
  Typography,
  Divider,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { serverFunctions } from '../../utils/serverFunctions';
import LoadingOverlay from '../../components/loading-overlay';
import { buildUrl } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';

interface ChartImage {
  altDescription: string;
  image: string;
}

const Sidebar = () => {
  const [tab, setTab] = useState(0);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const [diagramsUrl, setDiagramsUrl] = useState<string>('');
  const [chartImages, setChartImages] = useState<ChartImage[]>([]);
  const { authState, authStatus, getAuth, signOut } = useAuth();

  useEffect(() => {
    if (!authState?.authorized) return;
    // const url = buildUrl('/app/plugins/confluence/select', state.token);
    const url = buildUrl(
      '/app/plugins/recent?pluginSource=googledocs',
      authState.token
    );
    setDiagramsUrl(url);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef?.current);
      intervalRef.current = null;
      setOverlayEnabled(false);
    }
  }, [authState]);

  const getImages = useCallback(async () => {
    try {
      const images = await serverFunctions.getChartImages();
      setChartImages(images);
    } catch (error) {
      console.error('Error getting images', error);
    }
  }, []);

  useEffect(() => {
    getImages();
  }, [getImages]);

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

  // const handleLogOut = async () => {
  //   try {
  //     await serverFunctions.revokeOAuth();
  //     setTimeout(getAuth, 500);
  //   } catch (error) {
  //     console.error('Error revoking OAuth:', error);
  //   }
  // };

  const handleDiagramsUpdate = async () => {
    try {
      await serverFunctions.syncImages();
    } catch (error) {
      console.error('Error updating all diagrams', error);
    }
  };

  const handleSelectDiagram = async () => {
    try {
      await serverFunctions.openSelectDiagramDialog();
    } catch (error) {
      console.error('Error inserting diagram', error);
    }
  };

  const handleCreateDiagram = async () => {
    try {
      await serverFunctions.openCreateDiagramDialog();
    } catch (error) {
      console.error('Error creating new diagram', error);
    }
  };

  const handleSelectedImage = async (altDescription: string) => {
    try {
      await serverFunctions.selectChartImage(altDescription);
    } catch (error) {
      console.error('Error selecting image', error);
    }
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
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px 20px',
        }}
      >
        <img
          src="https://jiratest.mermaidchart.com/icon_80x80.png"
          alt="mc"
          width={30}
          height={30}
        />
        <>
          {authState?.authorized ? (
            <Button
              onClick={signOut}
              color="primary"
              variant="outlined"
              sx={{
                textTransform: 'initial',
              }}
            >
              Logout
            </Button>
          ) : (
            <Button
              onClick={handleLoginClick}
              color="primary"
              variant="outlined"
              sx={{
                textTransform: 'initial',
              }}
            >
              Login
            </Button>
          )}
        </>
      </Container>
      <Divider />
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          height: 'calc(100vh - 68px)',
        }}
      >
        <div>
          {authState?.authorized ? (
            <>
              <Typography title="h3" color={'#883a79'} mb={1}>
                Create a new diagram
              </Typography>
              <Button
                color="primary"
                variant="outlined"
                sx={{
                  marginBottom: 2,
                  textTransform: 'initial',
                }}
                onClick={handleCreateDiagram}
              >
                New diagram
              </Button>
              <Typography title="h3" color={'#883a79'} mb={1}>
                Insert a diagram from Mermaid Chart
              </Typography>
              <Button
                color="primary"
                variant="outlined"
                sx={{
                  marginBottom: 2,
                  textTransform: 'initial',
                }}
                onClick={handleSelectDiagram}
              >
                Browse diagrams
              </Button>
              <Typography title="h3" color={'#883a79'} mb={1}>
                Update all diagrams in document to most recent version
              </Typography>
              <Button
                color="primary"
                variant="outlined"
                sx={{
                  textTransform: 'initial',
                }}
                onClick={handleDiagramsUpdate}
              >
                Update all diagrams
              </Button>
              <Box sx={{ width: '100%' }} mt={2}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tab}
                    onChange={(_, newValue) => setTab(newValue)}
                    aria-label="basic tabs example"
                  >
                    <Tab
                      label="Recent diagrams"
                      sx={{
                        textTransform: 'initial',
                        padding: '12px 6px',
                      }}
                    />
                    <Tab
                      label="In this document"
                      sx={{
                        textTransform: 'initial',
                        padding: '12px',
                      }}
                    />
                  </Tabs>
                </Box>
                {tab === 0 ? (
                  <iframe
                    src={diagramsUrl}
                    title="diagrams"
                    style={{
                      border: 'none',
                      marginTop: '20px',
                      width: '100%',
                      height: 'calc(100vh - 520px)',
                    }}
                  />
                ) : (
                  <Container
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '20px',
                      marginTop: '20px',
                    }}
                  >
                    {chartImages.map((image) => (
                      <div
                        key={image.altDescription}
                        onClick={() =>
                          handleSelectedImage(image.altDescription)
                        }
                      >
                        <img
                          src={image.image}
                          alt={image.altDescription}
                          style={{
                            width: '200px',
                            height: 'auto',
                            marginBottom: '10px',
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                    ))}
                  </Container>
                )}
              </Box>
            </>
          ) : (
            <>
              <Typography title="h3" textAlign="center" color={'#883a79'}>
                Create and edit diagrams in Mermaid Chart and easily synchronize
                documents with Google Docs.
              </Typography>
              <Typography paragraph textAlign="center" mt={4} color={'#883a79'}>
                Don't have an account?{' '}
                <Button
                  sx={{
                    textTransform: 'initial',
                    color: 'inherit',
                    padding: 0,
                    minWidth: 'auto',
                    fontSize: 'inherit',
                    '&:hover': {
                      textDecoration: 'underline',
                      backgroundColor: 'white',
                    },
                  }}
                >
                  Sign up
                </Button>{' '}
              </Typography>
            </>
          )}
        </div>
        <Container
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0',
          }}
        >
          <Typography paragraph textAlign="center" mb={0}>
            <a
              href="https://mermaidchart.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#883a79' }}
            >
              Copyright © 2024 Mermaid Chart
            </a>
          </Typography>
        </Container>
      </Container>
    </>
  );
};

export default Sidebar;
