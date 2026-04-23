import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Function to check if the session has expired
  const checkSessionExpiration = () => {
    const sessionExpires = localStorage.getItem("sessionExpires");
    if (sessionExpires) {
      const expirationDate = new Date(sessionExpires);
      const now = new Date();
      
      if (now > expirationDate) {
        // Session has expired
        console.log("Session expired");
        logout();
        return true;
      }
    }
    return false;
  };

  const login = async (credentials) => {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setUser(data.user);

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Set default session expiration (24 hours)
        const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
        const expirationDate = new Date(Date.now() + expirationTime);
        localStorage.setItem("sessionExpires", expirationDate.toISOString());

        return { success: true, ...data };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: "Login failed" };
    }
  };

  const [, setLogoutState] = useState("initial"); // initial, processing, completed

  const logout = async () => {
    // Set logout state to processing
    setLogoutState("processing");
    
    // Simulate a process with a slight delay for better user experience
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Perform actual logout
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionExpires");
    
    // Set logout state to completed
    setLogoutState("completed");
    
    // Reset logout state after a short delay
    setTimeout(() => {
      setLogoutState("initial");
    }, 500);
  };

  // Check auth state on app load
  useEffect(() => {
    try {
      // First check if session has expired
      if (checkSessionExpiration()) {
        return; // Session expired, already logged out
      }
      
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && parsedUser._id) {
          setIsAuthenticated(true);
          setUser(parsedUser);
        } else {
          logout(); // clear invalid data
        }
      }
    } catch (err) {
      console.error("Error loading auth:", err);
      logout(); // fallback clear
    }
    
    // Add event listener for when user leaves the site
    const handleBeforeUnload = () => {
      // Update the last activity timestamp when user leaves
      if (isAuthenticated) {
        localStorage.setItem("lastActivity", new Date().toISOString());
      }
    };
    
    // Add event listener for when user becomes inactive (tab visibility changes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched away from the tab
        handleBeforeUnload();
      } else if (document.visibilityState === 'visible') {
        // User returned to the tab - check if session expired
        checkSessionExpiration();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up periodic session check (every minute)
    const sessionCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        checkSessionExpiration();
      }
    }, 60000); // Check every minute
    
    // Clean up event listeners and interval
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
    };
  }, [isAuthenticated]); // Re-run when authentication state changes

  return (
    <UserContext.Provider value={{ isAuthenticated, user, login, logout, checkSessionExpiration }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
