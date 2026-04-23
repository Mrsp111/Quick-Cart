import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

const ADMIN_SESSION_KEY = "quickcart-admin";
const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAdminSession = () => {
    const storedAdmin = localStorage.getItem(ADMIN_SESSION_KEY);
    const sessionExpires = localStorage.getItem("admin_session_expires");

    if (sessionExpires) {
      const expirationDate = new Date(sessionExpires);
      const now = new Date();
      
      if (now > expirationDate) {
        logout();
        return false;
      }
    }

    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error("Failed to parse admin data:", error);
        logout();
      }
    }
    return false;
  };

  useEffect(() => {
    // Check admin session on load
    checkAdminSession();
    setIsLoading(false);

    // Handle admin session when leaving site
    const handleBeforeUnload = () => {
      if (isAuthenticated) {
        localStorage.setItem("admin_last_activity", new Date().toISOString());
      }
    };

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      } else if (document.visibilityState === 'visible' && isAuthenticated) {
        checkAdminSession();
      }
    };

    // Set up event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check session periodically
    const sessionCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        checkAdminSession();
      }
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
    };
  }, [isAuthenticated]);

  const login = async (email, password, remember = false) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll just simulate a successful login
      if (email && password) {
        const mockAdmin = {
          id: "admin1",
          name: "Admin User",
          email: email,
          role: "admin",
        };
        
        setAdmin(mockAdmin);
        setIsAuthenticated(true);
        
        if (remember) {
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(mockAdmin));
          // Set session expiration (24 hours)
          const expirationTime = 24 * 60 * 60 * 1000;
          const expirationDate = new Date(Date.now() + expirationTime);
          localStorage.setItem("admin_session_expires", expirationDate.toISOString());
        }
        
        setIsLoading(false);
        return true;
      }
      
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An error occurred during login",
        variant: "destructive",
      });
      
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem("admin_session_expires");
    localStorage.removeItem("admin_last_activity");
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out of admin panel.",
    });
  };

  return (
    <AdminContext.Provider value={{ admin, login, logout, isLoading, isAuthenticated }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};