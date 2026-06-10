import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CircularProgress,
  Container,
  Typography,
  Button as MuiButton,
  Box,
  AlertColor,
} from '@mui/material';
import { serverFunctions } from '../../utils/serverFunctions';
import { buildUrl, compressBase64Image } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/button';
import { showAlertDialog } from '../../utils/alert';
import analytics from '../../../analytics/analytics';
import Toast from '../../components/toast';
import { AccountTreeIcon, FolderOpenIcon, CachedIcon, LogoutIcon } from '../../assets/icons';



interface ChartImage {
  altDescription: string;
  image: string;
}

const Sidebar = () => {
  const [tab, setTab] = useState(0);
  const [tabRefreshCount, setTabRefreshCount] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const [diagramsUrl, setDiagramsUrl] = useState<string>('');
  const [chartImages, setChartImages] = useState<ChartImage[]>([]);
  const [chartImagesState, setChartImagesState] = useState('idle');
  const [createDiagramState, setCreateDiagramState] = useState('idle');
  const [selectDiagramState, setSelectDiagramState] = useState('idle');
  const [updateDiagramsState, setUpdateDiagramsState] = useState('idle');
  const [editingDiagram, setEditingDiagram] = useState<string | null>(null);
  const [removingDiagram, setRemovingDiagram] = useState<string | null>(null);
  const { authState, authStatus, getAuth, signOut } = useAuth();

  // State for background insertion processing
  const [isProcessingInsertion, setIsProcessingInsertion] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<AlertColor>('success');
  const [logoutLoading, setLogoutLoading] = useState(false);
  useEffect(() => {
    if (!authState?.authorized) return;
    const url = buildUrl(
      '/app/plugins/recent?pluginSource=googledocs',
      authState.token
    );
    setDiagramsUrl(url);
    setIframeLoading(true);
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

  // Listen for image list refresh requests from dialogs via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel('diagram_channel');

    channel.onmessage = (e) => {
      if (e.data?.type === 'refreshImages') {
        getImages();
      }
    };

    return () => channel.close();
  }, [getImages]);

  const handleToastClose = () => {
    setToastOpen(false);
  };

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const action = e.data.action;
      const actionData = e.data;

      if (action === 'save') {
        console.log('Received save action from dialog');
        const data = actionData.data;
        if (!data) return;
        const metadata = new URLSearchParams({
          projectID: data.projectID,
          documentID: data.documentID,
          major: data.major,
          minor: data.minor,
        });
        try {
          setIsProcessingInsertion(true);
          setToastMessage('Inserting diagram...');
          setToastSeverity('info');
          setToastOpen(true);

          const compressedImage = await compressBase64Image(data.diagramImage);
          await serverFunctions.insertBase64ImageWithMetadata(
            compressedImage,
            metadata.toString()
          );
          console.log('Diagram inserted successfully from dialog');

          setToastMessage('Diagram inserted successfully!');
          setToastSeverity('success');
          getImages();
        } catch (error) {
          console.error('Error inserting image with metadata', error);
          setToastMessage('Error inserting diagram');
          setToastSeverity('error');
          showAlertDialog('Error inserting image, please try again');
        } finally {
          setIsProcessingInsertion(false);
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

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleTabSwitch = (tabIndex: number) => {
    if (tabIndex === 0 && tab !== 0) {
      setTabRefreshCount((prev) => prev + 1);
      setIframeLoading(true);
    }
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
      analytics.trackLogin();
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
    analytics.trackUpdateAllDiagrams();
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
    analytics.trackBrowseDiagram();
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
    analytics.trackNewDiagram();
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
    analytics.trackEditDiagram();
    try {
      setEditingDiagram(altDescription);
      await serverFunctions.selectChartImage(altDescription);
      await serverFunctions.openEditDiagramDialog();
    } catch (error) {
      console.error('Error editing diagram', error);
      showAlertDialog('Error editing diagram, please try again');
    } finally {
      setEditingDiagram(null);
    }
  };

  const handleRemoveDiagram = async (altDescription: string) => {
    try {
      setRemovingDiagram(altDescription);
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
    } finally {
      setRemovingDiagram(null);
    }
  };

  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <Container
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          overflow: 'hidden',
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
          height: '100vh',
          overflow: 'hidden',
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

  return (
    <div style={{ backgroundColor: '#f0f4f9', height: '100vh', overflow: 'hidden' }}>
      {(overlayEnabled || isProcessingInsertion) && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress size={40} />
          {isProcessingInsertion && (
            <Typography sx={{ mt: 2 }} variant="body2" color="textSecondary">
              Inserting diagram...
            </Typography>
          )}
        </Box>
      )}
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100vh',
          position: 'relative',
          backgroundColor: '#f0f4f9',
          padding: '0 8px',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '100%', flex: 1, overflow: 'hidden' }}>
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
                  fontSize: '24px',
                  marginTop: '12px',
                  fontWeight: 600,
                  color: '#1E1A2E',
                  marginBottom: '14px',
                  lineHeight: '36px',
                  letterSpacing: 'normal',
                }}
              >
                Welcome to the  <br />
                official Mermaid Plugin
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
                Create and edit diagrams in Mermaid and easily synchronize
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
                Sign in
              </MuiButton>
            </Box>
          ) : (
            <>
              <Button
                variant="primary"
                style={{ marginTop: '0px', marginBottom: '12px' }}
                onClick={handleCreateDiagram}
                loading={createDiagramState === 'loading'}
                disabled={isProcessingInsertion}
                icon={<AccountTreeIcon />}
              >
                New diagram
              </Button>
              <Button
                variant="primary"
                style={{ marginBottom: '12px' }}
                onClick={handleSelectDiagram}
                loading={selectDiagramState === 'loading'}
                disabled={isProcessingInsertion}
                icon={<FolderOpenIcon />}
              >
                Browse diagrams
              </Button>
              <Button
                variant="primary"
                style={{ marginBottom: '12px' }}
                onClick={handleDiagramsUpdate}
                loading={updateDiagramsState === 'loading'}
                disabled={isProcessingInsertion}
                icon={<CachedIcon />}
              >
                Update all diagrams
              </Button>
              <Box sx={{ width: '100%' }} mt={4}>
                <Box sx={{
                  height: '42px',
                  padding: '3px',
                  borderRadius: '8px',
                  background: '#F1F8FA',
                  opacity: 1,
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0px',
                }}>
                  <Box
                    onClick={() => handleTabSwitch(0)}
                    sx={{
                      flex: '0 0 auto',
                      padding: '8px 32px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: tab === 0 ? 600 : 400,
                      backgroundColor: tab === 0 ? '#FFFFFF' : 'transparent',
                      color: tab === 0 ? '#1E1A2E' : '#666',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      fontFamily: 'Recursive',
                      lineHeight: '20px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      boxShadow: tab === 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      '&:hover': {
                        backgroundColor: tab === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                        color: '#1E1A2E'
                      }
                    }}
                  >
                    Recent
                  </Box>
                  <Box
                    onClick={() => handleTabSwitch(1)}
                    sx={{
                      flex: '1 1 auto',
                      padding: '8px 8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: tab === 1 ? 600 : 400,
                      backgroundColor: tab === 1 ? '#FFFFFF' : 'transparent',
                      color: tab === 1 ? '#1E1A2E' : '#666',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      fontFamily: 'Recursive',
                      lineHeight: '20px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      boxShadow: tab === 1 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      '&:hover': {
                        backgroundColor: tab === 1 ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                        color: '#1E1A2E'
                      }
                    }}
                  >
                    In this Document
                  </Box>
                </Box>

                {tab === 0 && iframeLoading && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 'calc(100vh - 300px)',
                      backgroundColor: 'transparent',
                      gap: '16px',
                    }}
                  >
                    <CircularProgress
                      size={48}
                      sx={{
                        color: '#1E1A2E',
                      }}
                    />
                    <Typography
                      sx={{
                        fontFamily: 'Recursive',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '24px',
                        color: '#5F5D7A',
                        textAlign: 'center',
                        margin: 0,
                      }}
                    >
                      Loading recent diagrams...
                    </Typography>
                  </Box>
                )}
                <iframe
                  key={tabRefreshCount}
                  src={diagramsUrl}
                  title="diagrams"
                  onLoad={() => setIframeLoading(false)}
                  style={{
                    border: 'none',
                    width: '100%',
                    height: 'calc(100vh - 300px)',
                    backgroundColor: '#ffffff',
                    display: tab === 0 && !iframeLoading ? 'block' : 'none',
                    borderRadius: '16px',
                  }}
                />

                <Container
                  sx={{
                    display: tab === 1 ? 'flex' : 'none',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: chartImages.length === 0 && chartImagesState === 'success' ? 'center' : 'flex-start',
                    backgroundColor: '#f8fafb',
                    gap: '20px',
                    padding: '16px 8px 80px 8px',
                    height: 'calc(100vh - 220px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    margin: '0',
                    maxWidth: 'none',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '3px',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      },
                    },
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent', /* Firefox */
                  }}
                >
                  {chartImagesState === 'loading' &&
                    chartImages.length === 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '300px',
                          backgroundColor: 'transparent',
                          gap: '16px',
                        }}
                      >
                        <CircularProgress
                          size={48}
                          sx={{
                            color: '#1E1A2E',
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: 'Recursive',
                            fontWeight: 500,
                            fontSize: '16px',
                            lineHeight: '24px',
                            color: '#5F5D7A',
                            textAlign: 'center',
                            margin: 0,
                          }}
                        >
                          Loading diagrams...
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'Recursive',
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: '#8B8FA3',
                            textAlign: 'center',
                            margin: 0,
                            maxWidth: '200px',
                          }}
                        >
                          Checking for diagrams in this document
                        </Typography>
                      </Box>
                    )}

                  {chartImages.length > 0 &&
                    chartImages.map((image) => {
                      const isLoading = editingDiagram === image.altDescription || removingDiagram === image.altDescription;
                      return (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <Box
                            key={image.altDescription}
                            sx={{
                              width: '100%',
                              maxWidth: '298px',
                              height: '328px',
                              borderRadius: '16px',
                              border: '2px solid #DCEEF1',
                              backgroundColor: '#ffffff',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              margin: '0 auto',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                              opacity: isLoading ? 0.6 : 1,
                              '& .button-area': {
                                opacity: 0,
                                transition: 'opacity 0.2s ease, background-color 0.2s ease',
                              },
                              '&:hover': {
                                border: isLoading ? '2px solid #DCEEF1' : '2px solid #BEDDE3',
                                '& .button-area': {
                                  opacity: isLoading ? 0 : 1,
                                }
                              }
                            }}
                          >
                            {/* Loading Overlay */}
                            {isLoading && (
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
                                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                  zIndex: 10,
                                  borderRadius: '16px',
                                }}
                              >
                                <CircularProgress
                                  size={32}
                                  sx={{
                                    color: '#1E1A2E',
                                  }}
                                />
                              </Box>
                            )}
                            <Box
                              sx={{
                                width: '100%',
                                height: '280px',
                                minHeight: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '16px',
                                boxSizing: 'border-box',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                handleSelectedImage(image.altDescription)
                              }
                            >
                              <img
                                src={image.image}
                                alt={image.altDescription}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain',
                                }}
                              />
                            </Box>

                            <Box
                              className="button-area"
                              sx={{
                                width: '100%',
                                height: '48px',
                                padding: '8px 16px',
                                boxSizing: 'border-box',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transition: 'opacity 0.2s ease',
                                flexShrink: 0,
                              }}
                            >
                              <Box sx={{ width: '138px', height: '32px', display: 'flex', gap: '8px' }}>
                                <Button
                                  style={{
                                    width: '52px',
                                    height: '32px',
                                    padding: '3px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: '#1E1A2E',
                                    color: '#FFFFFF',
                                    fontFamily: 'Recursive',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    lineHeight: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  onClick={() =>
                                    handleEditDiagram(image.altDescription)
                                  }
                                  disabled={editingDiagram !== null || removingDiagram !== null || isProcessingInsertion}
                                >
                                  Edit
                                </Button>

                                <Button
                                  style={{
                                    width: '78px',
                                    height: '32px',
                                    padding: '3px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: '#FF5449',
                                    color: '#FFFFFF',
                                    fontFamily: 'Recursive',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    lineHeight: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  onClick={() =>
                                    handleRemoveDiagram(image.altDescription)
                                  }
                                  disabled={editingDiagram !== null || removingDiagram !== null || isProcessingInsertion}
                                >
                                  Remove
                                </Button>
                              </Box>
                            </Box>

                          </Box>
                        </Box>
                      );
                    })}

                  {chartImagesState === 'success' &&
                    chartImages.length === 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          gap: '12px',
                          padding: '20px',
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Recursive',
                            fontWeight: 600,
                            fontSize: '16px',
                            lineHeight: '24px',
                            color: '#2B2542',
                            margin: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          No diagrams in document
                        </Typography>

                        <Typography
                          sx={{
                            maxWidth: '250px',
                            fontFamily: 'Recursive',
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '20px',
                            textAlign: 'center',
                            color: '#5F5D7A',
                            margin: 0,
                            '& .clickable': {
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.8,
                              },
                            },
                          }}
                        >
                          <span
                            className="clickable"
                            onClick={handleSelectDiagram}
                          >
                            Insert
                          </span>
                          {' or '}
                          <span
                            className="clickable"
                            onClick={handleCreateDiagram}
                          >
                            create
                          </span>
                          {' diagrams to see them here'}
                        </Typography>
                      </Box>
                    )}
                </Container>
              </Box>
            </>
          )}
        </div>

        {/* Sticky Logout Button */}
        {authState?.authorized && (
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              width: '100%',
              backgroundColor: '#f0f4f9',
              borderTop: '1px solid #f0f0f0',
              zIndex: 10
            }}
          >
            <Button
              onClick={handleLogout}
              variant="logout"
              icon={<LogoutIcon />}
              loading={logoutLoading}
              disabled={logoutLoading}
            >
              Logout
            </Button>
          </Box>
        )}

        {!authState?.authorized && (
          <Container
            sx={{
              textAlign: 'center',
              paddingBottom: '20px',
            }}
          >
            <Typography
              paragraph
              textAlign="center"
              mb={0}
              sx={{
                fontFamily:
                  'Recursive, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '13px',
                color: '#5F5D7A',
              }}
            >
              Brought to you by the Mermaid team.
            </Typography>
          </Container>
        )}
      </Container>
      <Toast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        onClose={handleToastClose}
      />
    </div>
  );
};

export default Sidebar;
