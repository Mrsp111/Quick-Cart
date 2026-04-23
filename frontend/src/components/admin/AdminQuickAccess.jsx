import React from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Box, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/context/AdminContext";

const AdminQuickAccess = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAdmin();

  if (!isAuthenticated) return null;

  const quickLinks = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { title: "Products", icon: ShoppingBag, path: "/admin/products" },
    { title: "Orders", icon: ClipboardList, path: "/admin/orders" }
  ];

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-blue-800">Admin Quick Access</h3>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-blue-700 hover:bg-blue-800"
            onClick={() => navigate("/admin/dashboard")}
          >
            Go to Admin Panel
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Button
              key={link.title}
              variant="outline"
              className="flex flex-col items-center justify-center gap-2 h-24 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
              onClick={() => navigate(link.path)}
            >
              <link.icon className="h-6 w-6 text-blue-700" />
              <span className="text-sm font-medium">{link.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminQuickAccess;