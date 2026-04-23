import React, { useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    // Basic validation
    if (!email.trim()) {
      setMessage("Please enter your email address");
      setIsLoading(false);
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Password reset link has been sent to your email");
      } else {
        setMessage(data.error || "Error sending reset link. Please try again.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setMessage("Error sending reset link. Please try again.");
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
          <span className="font-medium">FORGOT PASSWORD</span>
        </div>

        <div className="max-w-md mx-auto border border-gray-200 rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
          <p className="text-gray-600 mb-6">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          {message && (
            <div className={`p-4 rounded-md mb-6 ${message.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full py-6"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white hover:bg-gray-300 text-black py-6"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
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
        </div>
      </div>
    </MainLayout>
  );
};

export default ForgotPassword;