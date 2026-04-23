import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { ShoppingBag, Check } from "lucide-react";

const LoginForm = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  // Removed bufferState and progress states
  // Removed useEffect for progress animation
  // Removed useEffect for resetting progress

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(credentials);
      if (result.success) {
        navigate("/");
      } else {
        console.error("Login failed:", result.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 🔹 Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={credentials.email}
          onChange={(e) =>
            setCredentials({ ...credentials, email: e.target.value })
          }
          className="w-full px-4 py-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) =>
            setCredentials({ ...credentials, password: e.target.value })
          }
          className="w-full px-4 py-2 border rounded"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-black text-white py-2 rounded transition-all duration-300 ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
          }`}
        >
          {isLoading ? "Please wait..." : "Login"}
        </button>
      </form>
    </>
  );
};

export default LoginForm;
