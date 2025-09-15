import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  anonymousUsername: string | null;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  anonymousUsername: null,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [anonymousUsername, setAnonymousUsername] = useState<string | null>(
    localStorage.getItem('anonymousUsername')
  );

  const login = (newToken: string, username: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('anonymousUsername', username);
    setToken(newToken);
    setAnonymousUsername(username);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('anonymousUsername');
    setToken(null);
    setAnonymousUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, anonymousUsername, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};