import { useCallback, useEffect, useState } from 'react';
import { serverFunctions } from '../utils/serverFunctions';

interface AuthState {
  authorized: boolean;
  token?: string;
  message?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const useAuth = () => {
  const [authState, setAuthState] = useState<null | AuthState>(null);
  const [authStatus, setAuthStatus] = useState<Status>('idle');

  const getAuth = useCallback(async () => {
    setAuthStatus('loading');
    try {
      const state = await serverFunctions.getAuthorizationState();
      setAuthState(state);
      setAuthStatus('success');
    } catch (error) {
      console.log('Error getting auth data', error);
      setAuthStatus('error');
    }
  }, []);

  useEffect(() => {
    getAuth();
  }, [getAuth]);

  const signOut = async () => {
    serverFunctions.resetOAuth();
    setTimeout(getAuth, 2000);
  };

  return { authState, authStatus, signOut };
};

export default useAuth;
