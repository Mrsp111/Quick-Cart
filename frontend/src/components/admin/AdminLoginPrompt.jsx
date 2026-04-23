
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminLoginPrompt = () => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="outline" 
        className="shadow-md bg-white border-gray-300 hover:bg-gray-100"
        onClick={() => navigate("/admin/login")}
      >
        Access Admin Panel
      </Button>
    </div>
  );
};

export default AdminLoginPrompt;
