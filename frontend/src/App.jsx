import React from 'react';
import "./App.css";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { UserProvider } from "./context/UserContext";
import { AdminProvider } from "./context/AdminContext";
import CategoryManager from "./components/admin/product/CategoryManager";

// Pages
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserOrderHistory from "./pages/user/UserOrderHistory";
import UserOrderDetails from "./pages/user/UserOrderDetails";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductDetails from "./pages/admin/AdminProductDetails";
import AdminOrderList from "./pages/admin/AdminOrderList";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";
import AdminLayout from "./components/layout/AdminLayout";
import CustomerQueries from "./pages/admin/CustomerQueries";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/shop", element: <Shop /> },
  { path: "/category/:category", element: <Shop /> },
  { path: "/product/:productId", element: <ProductDetail /> },
  { path: "/cart", element: <Cart /> },
  { path: "/checkout", element: <Checkout /> },
  { path: "/order-confirmation", element: <OrderConfirmation /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgotpassword", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/about-us", element: <AboutUs /> },
  { path: "/contact-us", element: <ContactUs /> },
  { path: "/profile", element: <Profile /> },
  { path: "/user/orders", element: <UserOrderHistory /> },
  { path: "/user/orders/:orderId", element: <UserOrderDetails /> },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "products", element: <AdminProducts /> },
      { path: "products/new", element: <AdminProductDetails /> },
      { path: "products/:productId", element: <AdminProductDetails /> },
      { path: "products/:productId/edit", element: <AdminProductDetails /> },
      { path: "orders", element: <AdminOrderList /> },
      { path: "orders/:orderId", element: <AdminOrderDetails /> },
      { path: "customer-queries", element: <CustomerQueries /> },
      { path: "categories", element: <CategoryManager /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <CartProvider>
            <AdminProvider>
              <Toaster />
              <Sonner
                theme="light"
                toastOptions={{
                  style: {
                    background: "#ffffff",
                    color: "#000000",
                    border: "1px solid #ccc",
                  },
                }}
              />
              <RouterProvider router={router} />
            </AdminProvider>
          </CartProvider>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
  