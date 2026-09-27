import { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe, getStoredUser, getToken, login as apiLogin, logout as apiLogout } from '../lib/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const me = await fetchMe();
    setProfile(me);
    if (me) {
      setUser({ id: me.id, email: me.email });
      setSessionState({ access_token: getToken() });
    } else {
      setUser(null);
      setSessionState(null);
    }
    return me;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const token = getToken();
      if (!token) {
        if (active) setLoading(false);
        return;
      }
      const stored = getStoredUser();
      if (stored && active) setUser(stored);
      await loadProfile();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    setSessionState({ access_token: data.token });
    await loadProfile();
  };

  const signOut = async () => {
    await apiLogout();
    setUser(null);
    setSessionState(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
