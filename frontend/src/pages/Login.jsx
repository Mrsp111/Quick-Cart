import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/context/UserContext";
import { toast as sonnerToast } from "sonner"; // ✅ added

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const result = await login({ email, password });

      if (result.success) {
        const expirationTime = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const expirationDate = new Date(Date.now() + expirationTime);
        localStorage.setItem("sessionExpires", expirationDate.toISOString());

        // ✅ Show success toast using sonner
        sonnerToast.success("Login successful! Welcome back.", {
          style: {
            backgroundColor: "white",
            color: "black",
            borderRadius: "0.5rem",
            fontWeight: "bold",
          },
        });

        navigate("/");
      } else {
        setErrorMessage(result.error || "Invalid email or password");
        toast({
          title: "Error",
          description: result.error || "Invalid email or password",
          variant: "destructive",
          className: "bg-white border-red-500 text-black",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
        className: "bg-white border-red-500 text-black",
      });
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 flex flex-col items-center">
        <div className="flex items-center gap-2 text-sm mb-8">
          <Link to="/" className="text-gray-500 hover:text-black transition-colors">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-semibold text-black">LOGIN</span>
        </div>

        <div className="max-w-md w-full bg-white border border-gray-200 shadow-lg rounded-lg p-8 transition-all transform hover:scale-[1.02] duration-300">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2 text-center">
            Welcome Back!
          </h1>
          <p className="text-gray-500 text-center mb-6">
            Log in to your account to continue
          </p>

          {errorMessage && (
            <p className="text-red-600 text-sm mb-4 bg-red-100 p-2 rounded">
              {errorMessage}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label htmlFor="remember-me" className="text-sm font-medium text-gray-700">
                Keep me logged in
              </label>
            </div>

            <Button
              type="submit"
              className={`w-full bg-black hover:bg-gray-900 text-white py-3 rounded-lg flex items-center justify-center transition-all duration-300 transform ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "LOGIN"}
              {!isLoading && (
                <ArrowRight className="ml-2 h-5 w-5 animate-bounce" />
              )}
            </Button>
            <Link to="/admin/login">
              <Button
                variant="outline"
                className="w-full mt-3 border-gray-300 hover:border-red-500 hover:bg-red-100 text-gray-700 transition-all duration-300"
              >
                Admin Login
              </Button>
            </Link>
          </form>

          <div className="text-center mt-4">
            <Link
              to="/forgotpassword"
              className="text-blue-600 hover:underline text-sm transition-all duration-200"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            <h2 className="text-sm font-medium text-gray-800 mb-2">Don't have an account?</h2>
            <Link to="/register">
              <Button
                variant="outline"
                className="w-full border-gray-300 hover:border-blue-500 hover:bg-blue-100 text-gray-700 transition-all duration-300"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;
