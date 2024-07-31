import { useCallback, useEffect, useState } from 'react';
import { serverFunctions } from '../utils/serverFunctions';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface AuthorizedState {
  authorized: true;
  token: string;
}

interface UnauthorizedState {
  authorized: false;
}

type AuthState = AuthorizedState | UnauthorizedState;

const useAuth = () => {
  const [authState, setAuthState] = useState<null | AuthState>(null);
  const [authStatus, setAuthStatus] = useState<Status>('idle');

  const getAuth = useCallback(async () => {
    setAuthStatus('loading');
    try {
      const state = await serverFunctions.getAuthorizationState();
      setAuthState(state as AuthState);
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
    try {
      await serverFunctions.resetOAuth();
      setTimeout(getAuth, 500);
    } catch (error) {
      console.error('Error revoking OAuth:', error);
    }
  };

  return { authState, authStatus, getAuth, signOut };
};

export default useAuth;
