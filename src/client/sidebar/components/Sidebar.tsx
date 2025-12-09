import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CircularProgress,
  Container,
  Typography,
  Button as MuiButton,
  Divider,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { serverFunctions } from '../../utils/serverFunctions';
import LoadingOverlay from '../../components/loading-overlay';
import { buildUrl } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/button';
import { showAlertDialog } from '../../utils/alert';

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
  const [chartImagesState, setChartImagesState] = useState('idle');
  const [createDiagramState, setCreateDiagramState] = useState('idle');
  const [selectDiagramState, setSelectDiagramState] = useState('idle');
  const [updateDiagramsState, setUpdateDiagramsState] = useState('idle');
  const { authState, authStatus, getAuth, signOut } = useAuth();

  useEffect(() => {
    if (!authState?.authorized) return;
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
      setChartImagesState('loading');
      const images = await serverFunctions.getChartImages();
      setChartImages(images);
      setChartImagesState('success');
    } catch (error) {
      console.error('Error getting images', error);
      setChartImagesState('error');
      showAlertDialog('Error getting images, please try again');
    }
  }, []);

  useEffect(() => {
    getImages();
  }, [getImages]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const action = e.data.action;
      const actionData = e.data;

      if (action === 'save') {
        const data = actionData.data;
        if (!data) return;
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
          getImages();
        } catch (error) {
          console.error('Error inserting image with metadata', error);
          showAlertDialog('Error inserting image, please try again');
        }
        return;
      }
      if (action === 'edit') {
        const editUrl = actionData.editUrl;
        if (!editUrl) return;
        try {
          localStorage.setItem('editUrl', editUrl);
          await serverFunctions.openSelectDiagramDialog();
        } catch (error) {
          console.error('Error opening edit dialog', error);
        }
        return;
      }
      if (action === 'view') {
        const viewUrl = actionData.url;
        if (!viewUrl) return;
        try {
          localStorage.setItem('previewUrl', viewUrl);
          await serverFunctions.openPreviewDiagramDialog();
        } catch (error) {
          console.error('Error opening view dialog', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [getImages]);

  const handleTabSwitch = (tabIndex: number) => {
    setTab(tabIndex);
    if (chartImagesState !== 'loading') {
      getImages();
    }
  };

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

  const handleDiagramsUpdate = async () => {
    try {
      setUpdateDiagramsState('loading');
      await serverFunctions.syncImages();
      setUpdateDiagramsState('success');
    } catch (error) {
      console.error('Error updating all diagrams', error);
      setUpdateDiagramsState('error');
      showAlertDialog('Error updating diagrams, please try again');
    }
  };

  const handleSelectDiagram = async () => {
    try {
      setSelectDiagramState('loading');
      await serverFunctions.openSelectDiagramDialog();
      setSelectDiagramState('success');
    } catch (error) {
      console.error('Error inserting diagram', error);
      setSelectDiagramState('error');
      showAlertDialog('Error inserting diagram, please try again');
    }
  };

  const handleCreateDiagram = async () => {
    try {
      setCreateDiagramState('loading');
      await serverFunctions.openCreateDiagramDialog();
      setCreateDiagramState('success');
    } catch (error) {
      console.error('Error creating new diagram', error);
      setCreateDiagramState('error');
      showAlertDialog('Error creating new diagram, please try again');
    }
  };

  const handleSelectedImage = async (altDescription: string) => {
    try {
      await serverFunctions.selectChartImage(altDescription);
    } catch (error) {
      console.error('Error selecting image', error);
    }
  };

  const handleEditDiagram = async (altDescription: string) => {
    try {
      await serverFunctions.selectChartImage(altDescription);
      await serverFunctions.openEditDiagramDialog();
    } catch (error) {
      console.error('Error editing diagram', error);
      showAlertDialog('Error editing diagram, please try again');
    }
  };

  const handleRemoveDiagram = async (altDescription: string) => {
    try {
      const result = await serverFunctions.removeDiagramByAltDescription(
        altDescription
      );
      if (result.success) {
        // Refresh the diagrams list after successful removal
        getImages();
      } else {
        showAlertDialog(result.message || 'Failed to remove diagram');
      }
    } catch (error) {
      console.error('Error removing diagram', error);
      showAlertDialog('Error removing diagram, please try again');
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
      ></Container>

      <Divider />

      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 'calc(100vh - 69px)',
        }}
      >
        <div>
          {!authState?.authorized ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'calc(100vh - 80px)',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 20,
                }}
              >
                <img
                  src="https://jiratest.mermaidchart.com/icon_80x80.png"
                  alt="logo"
                  width={80}
                  height={80}
                />
              </Box>
              <Typography
                sx={{
                  maxWidth: '344px',
                  fontFamily: 'Recursive',
                  fontSize: '20px',
                  marginTop: '12px',
                  fontWeight: 420,
                  color: '#1E1A2E',
                  marginBottom: '14px',
                  lineHeight: '28px',
                  letterSpacing: 'normal',
                }}
              >
                Welcome to <br />
                the Mermaid
              </Typography>

              <Typography
                sx={{
                  fontFamily: 'Recursive',
                  fontWeight: 400,
                  fontSize: '16px',
                  color: '#1E1A2E',
                  lineHeight: '24px',
                  marginBottom: '28px',
                }}
              >
                Create and edit diagrams in Mermaid Chart and easily synchronize
                documents with Google Docs.
              </Typography>

              <MuiButton
                onClick={handleLoginClick}
                sx={{
                  fontFamily: 'Recursive',
                  width: '100%',
                  maxWidth: '240px',
                  backgroundColor: '#E80962',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  height: '46px',
                  borderRadius: '10px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#B20E45',
                  },
                }}
              >
                Login
              </MuiButton>

              <Typography
                sx={{
                  fontFamily: 'Recursive',
                  marginTop: '22px',
                  fontSize: '14px',
                  color: '#343434',
                }}
              >
                Don’t have an account?
              </Typography>

              <MuiButton
                onClick={() =>
                  window.open('https://mermaidchart.com/app/sign-up', '_blank')
                }
                sx={{
                  textTransform: 'none',
                  color: '#0071e3',
                  padding: 0,
                  minWidth: 'auto',
                  fontSize: '14px',
                  marginTop: '4px',
                  fontFamily:
                    'Recursive, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  '&:hover': {
                    textDecoration: 'underline',
                    background: 'none',
                  },
                }}
              >
                Sign up
              </MuiButton>
            </Box>
          ) : (
            <>
              <Typography
                title="h3"
                color={'#1E1A2E'}
                mb={1}
                sx={{
                  fontFamily:
                    'Recursive, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                Create a new diagram
              </Typography>
              <Button
                style={{ marginBottom: '16px' }}
                onClick={handleCreateDiagram}
                loading={createDiagramState === 'loading'}
              >
                New diagram
              </Button>
              <Typography title="h3" color={'#1E1A2E'} mb={1}>
                Insert a diagram from Mermaid Chart
              </Typography>
              <Button
                style={{ marginBottom: '16px' }}
                onClick={handleSelectDiagram}
                loading={selectDiagramState === 'loading'}
              >
                Browse diagrams
              </Button>
              <Typography title="h3" color={'#1E1A2E'} mb={1}>
                Update all diagrams in document to most recent version
              </Typography>
              <Button
                onClick={handleDiagramsUpdate}
                loading={updateDiagramsState === 'loading'}
              >
                Update all diagrams
              </Button>
              <Box sx={{ width: '100%' }} mt={2}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tab}
                    onChange={(_, newValue) => handleTabSwitch(newValue)}
                  >
                    <Tab
                      label="Recent diagrams"
                      sx={{ textTransform: 'initial' }}
                    />
                    <Tab
                      label="In this document"
                      sx={{ textTransform: 'initial' }}
                    />
                  </Tabs>
                </Box>
                <iframe
                  src={diagramsUrl}
                  title="diagrams"
                  style={{
                    border: 'none',
                    marginTop: '20px',
                    width: '260px',
                    height: 'calc(100vh - 440px)',
                    display: tab === 0 ? 'block' : 'none',
                  }}
                />

                <Container
                  sx={{
                    display: tab === 1 ? 'grid' : 'none',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    marginTop: '20px',
                    height: 'calc(100vh - 440px)',
                    overflowY: 'auto',
                  }}
                >
                  {chartImagesState === 'loading' &&
                    chartImages.length === 0 && (
                      <CircularProgress sx={{ justifySelf: 'center' }} />
                    )}

                  {chartImages.length > 0 &&
                    chartImages.map((image) => (
                      <Box
                        key={image.altDescription}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          backgroundColor: '#fafafa',
                        }}
                      >
                        <img
                          src={image.image}
                          alt={image.altDescription}
                          style={{
                            width: '200px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            handleSelectedImage(image.altDescription)
                          }
                        />

                        <Box sx={{ display: 'flex', gap: '8px' }}>
                          <Button
                            style={{
                              fontSize: '12px',
                              padding: '4px 12px',
                            }}
                            onClick={() =>
                              handleEditDiagram(image.altDescription)
                            }
                          >
                            Edit
                          </Button>

                          <Button
                            style={{
                              fontSize: '12px',
                              padding: '4px 12px',
                              backgroundColor: '#d32f2f',
                              color: 'white',
                            }}
                            onClick={() =>
                              handleRemoveDiagram(image.altDescription)
                            }
                          >
                            Remove
                          </Button>
                        </Box>
                      </Box>
                    ))}

                  {chartImagesState === 'success' &&
                    chartImages.length === 0 && (
                      <Typography
                        title="h4"
                        textAlign="center"
                        sx={{
                          fontFamily:
                            'Recursive, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        }}
                      >
                        No selected diagrams
                      </Typography>
                    )}
                </Container>
              </Box>

              {authState?.authorized && (
                <Box sx={{ marginTop: '20px', textAlign: 'left' }}>
                  <Button onClick={signOut}>Logout</Button>
                </Box>
              )}
            </>
          )}
        </div>
        {!authState?.authorized && (
          <Container
            sx={{
              textAlign: 'center',
            }}
          >
            <Typography
              paragraph
              textAlign="center"
              mb={0}
              sx={{
                fontFamily:
                  'Recursive, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              <a
                href="https://mermaidchart.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#1E1A2E' }}
              >
                Copyright © 2025 Mermaid Chart
              </a>
            </Typography>
          </Container>
        )}
      </Container>
    </>
  );
};

export default Sidebar;
