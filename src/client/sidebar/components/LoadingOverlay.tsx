import { CircularProgress, Box } from '@mui/material';

const LoadingOverlay = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}
  >
    <CircularProgress />
  </Box>
);

export default LoadingOverlay;
