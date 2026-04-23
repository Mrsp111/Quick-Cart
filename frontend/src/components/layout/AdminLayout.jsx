import React from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Bell, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/context/AdminContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {  logout, isAuthenticated } = useAdmin();

  if (!isAuthenticated) {
    navigate("/admin/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="w-[180px] border-r border-gray-200 bg-white flex-shrink-0">
        <div className="p-4">
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold tracking-tighter">QuickCart.</h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 -mt-1">STORE</p>
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/admin/dashboard"
            className={`flex items-center px-4 py-2.5 text-sm ${
              isActive("/admin/dashboard") ? "bg-slate-100 font-medium" : ""
            }`}
          >
            <span className="flex-1">DASHBOARD</span>
          </Link>

          <Link
            to="/admin/products"
            className={`flex items-center px-4 py-2.5 text-sm ${
              isActive("/admin/products") ? "bg-slate-100 font-medium" : ""
            }`}
          >
            <span className="flex-1">ALL PRODUCTS</span>
          </Link>

          <Link
            to="/admin/orders"
            className={`flex items-center px-4 py-2.5 text-sm ${
              isActive("/admin/orders") ? "bg-slate-100 font-medium" : ""
            }`}
          >
            <span className="flex-1">ORDER LIST</span>
          </Link>

          <Link
            to="/admin/customer-queries"
            className={`flex items-center px-4 py-2.5 text-sm ${
              isActive("/admin/customer-queries") ? "bg-slate-100 font-medium" : ""
            }`}
          >
            <span className="flex-1">CUSTOMER QUERIES</span>
          </Link>
        </div>

       
          
        
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex-1">
              {/* Breadcrumbs or page titles can go here */}
            </div>

            <div className="flex items-center gap-4">
              <button className="text-gray-500">
                <Search className="w-5 h-5" />
              </button>
              <button className="text-gray-500">
                <Bell className="w-5 h-5" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    ADMIN
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <Link to="/admin/settings" className="w-full">CHANGE PASSWORD</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    LOG OUT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-3 px-6 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <p>© 2025 - Quick cart Dashboard</p>
            <div className="flex gap-4">
              <Link to="/about" className="hover:underline">About</Link>
              <Link to="/careers" className="hover:underline">Careers</Link>
              <Link to="/policy" className="hover:underline">Policy</Link>
              <Link to="/contact" className="hover:underline">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
