import { useEffect, useState } from 'react';
import { MermaidChart } from '../../../utils/MermaidChart';
import { Button, Container, Typography } from '@mui/material';
import { serverFunctions } from '../../utils/serverFunctions';
import { useURLChange } from '../hooks/useURLChange';

const MC_BASE_URL = 'https://test.mermaidchart.com';
const MC_CLIENT_ID = '6643413f-36fe-41f5-83b6-18674ec599f0';
const localBaseUrl = 'https://localhost:3000';

const mermaidAPI = new MermaidChart({
  baseURL: MC_BASE_URL,
  clientID: MC_CLIENT_ID,
  redirectURI: `${localBaseUrl}/callback`,
  addon: {},
});

interface AuthData {
  url: string;
  state: any;
  scope: any;
}

const Sidebar = () => {
  const [auth, setAuth] = useState<null | AuthData>(null);
  console.log(auth);

  useEffect(() => {
    const getAuth = async () => {
      try {
        const auth = await mermaidAPI.getAuthorizationData();
        setAuth(auth);
      } catch (error) {
        console.log('Error getting auth data', error);
      }
    };

    getAuth();
  }, []);

  useURLChange((newURL) => {
    console.log('URL changed to:', newURL);
  });

  const handleLoginClick = () => {
    const loginUrl = auth?.url || '';
    const width = 500;
    const height = 650;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;
    let options = 'width=' + width;
    options += ',height=' + height;
    options += ',top=' + top;
    options += ',left=' + left;

    const windowObjectReference = window.open(loginUrl, 'loginWindow', options);
    windowObjectReference?.focus();
  };

  const handleDialogOpen = () => {
    serverFunctions.openDialog();
  };

  return (
    <Container
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <img
        src="https://jiratest.mermaidchart.com/icon_80x80.png"
        alt="mc"
        width={80}
        height={80}
        style={{ marginTop: '20px' }}
      />
      <Typography variant="h5" gutterBottom my={2} textAlign="center">
        Welcome to Mermaid Chart
      </Typography>
      <Typography paragraph textAlign="center">
        To access your diagrams, log into your Mermaid Chart account
      </Typography>
      <Button
        onClick={handleLoginClick}
        color="primary"
        variant="text"
        disabled={!auth}
      >
        Connect to Mermaid Chart
      </Button>
      <Button onClick={handleDialogOpen} color="primary" variant="text">
        Open Dialog
      </Button>
    </Container>
  );
};

export default Sidebar;
