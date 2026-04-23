import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setMessage("Invalid reset link. Please request a new password reset.");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    // Basic validation
    if (!password.trim() || !confirmPassword.trim()) {
      setMessage("Please enter both password fields");
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    // Password strength validation
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword: password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
        setMessage("Your password has been reset successfully");
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setMessage(data.error || "Error resetting password. Please try again.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setMessage("Error resetting password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center gap-2 text-sm mb-8">
          <Link to="/" className="text-gray-500 hover:text-black">Home</Link>
          <span className="text-gray-500">/</span>
          <span className="font-medium">RESET PASSWORD</span>
        </div>

        <div className="max-w-md mx-auto border border-gray-200 rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-4">Reset Your Password</h1>
          
          {!token && (
            <div className="p-4 rounded-md mb-6 bg-red-50 text-red-600">
              Invalid reset link. Please request a new password reset.
              <div className="mt-4">
                <Link 
                  to="/forgotpassword" 
                  className="text-blue-600 hover:underline"
                >
                  Go to Forgot Password
                </Link>
              </div>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-md mb-6 ${isSuccess ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
              {message}
            </div>
          )}

          {token && !isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  className="w-full py-6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  className="w-full py-6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white py-6"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="text-blue-600 hover:underline text-sm"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}

          {isSuccess && (
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-blue-600 hover:underline"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ResetPassword;