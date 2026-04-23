import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAdmin } from "../../context/AdminContext";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/admin/dashboard");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("admin", JSON.stringify(data.admin));
        localStorage.setItem("adminToken", data.token);
        await login(email, password, true); // Set remember=true to persist admin session


        toast.success("Login successful", {
          description: "Welcome to QuickCart Admin Dashboard!",
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));
        navigate("/admin/dashboard");
      } else {
        toast.error("Login failed", {
          description: data.error || "Invalid email or password",
        });
      }
    } catch {
      toast.error("Login failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }; // 🔧 this was missing

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center px-4">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col items-center animate-fade-in">
            <div className="w-14 h-14 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-medium text-gray-800">Logging in...</p>
          </div>
        </div>
      )}

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">QuickCart</h1>
        <p className="text-sm uppercase tracking-widest text-gray-500 mt-1">Admin Panel</p>
      </div>

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Sign in to your account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              className="w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              className="w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot your password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2 rounded flex items-center justify-center transition duration-200"
            disabled={isLoading}
          >
            LOGIN
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            type="button"
            className="w-full bg-gray-200 hover:bg-gray-300 text-black font-semibold py-2 rounded flex items-center justify-center transition duration-200 mt-2"
            onClick={() => navigate('/')}
          >
            Go to User Site
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
