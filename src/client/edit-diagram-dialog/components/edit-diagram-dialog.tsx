import { useEffect, useState } from 'react';
import { serverFunctions } from '../../utils/serverFunctions';
import { buildUrl, handleDialogClose } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';
import { showAlertDialog } from '../../utils/alert';
import LoadingOverlay from '../../components/loading-overlay';

const EditDiagramDialog = () => {
  const { authState, authStatus } = useAuth();
  const [diagramsUrl, setDiagramsUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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
          await serverFunctions.replaceSelectedImageWithBase64AndSize(
            data.diagramImage,
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

  if (authStatus !== 'success' || !diagramsUrl) {
    return null;
  }

  return (
    <>
      {isUpdating && <LoadingOverlay />}
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
        />
      </div>
    </>
  );
};

export default EditDiagramDialog;
