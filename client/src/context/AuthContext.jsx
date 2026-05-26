import React, { createContext, useState, useEffect, useContext } from 'react';

// Create Auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // On mount, check for token in storage
  useEffect(() => {
    const stored = localStorage.getItem('authToken');
    if (stored) {
      setUser({ token: stored });
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('authToken', token);
    setUser({ token });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
