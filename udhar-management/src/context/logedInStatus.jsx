import React, { createContext, useState, useEffect } from 'react';

export const loggedInContext = createContext(null);

export function LoggedInProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('udhar_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loggedIn, setLoggedInState] = useState(() => {
    return !!localStorage.getItem('udhar_user');
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('udhar_user', JSON.stringify(user));
      setLoggedInState(true);
    } else {
      localStorage.removeItem('udhar_user');
      setLoggedInState(false);
    }
  }, [user]);

  const logIn = (userData) => {
    setUser(userData);
    setLoggedInState(true);
    if (userData) {
      localStorage.setItem('udhar_user', JSON.stringify(userData));
    }
  };

  const logOut = () => {
    setUser(null);
    setLoggedInState(false);
    localStorage.removeItem('udhar_user');
  };

  const setLoggedIn = (val) => {
    setLoggedInState(val);
    if (!val) {
      setUser(null);
      localStorage.removeItem('udhar_user');
    }
  };

  return (
    <loggedInContext.Provider
      value={{
        loggedIn,
        user,
        logIn,
        logOut,
        setLoggedIn,
      }}
    >
      {children}
    </loggedInContext.Provider>
  );
}

export default LoggedInProvider;