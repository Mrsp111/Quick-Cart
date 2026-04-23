import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, ShoppingBag, Users, Package, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    deliveredOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/dashboard-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        const data = await response.json();
        setStats(data);
        setRecentOrders(data.recentOrders || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();

    // Refresh stats every 5 minutes
    const intervalId = setInterval(fetchDashboardStats, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading dashboard statistics: {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <div className="text-sm text-gray-500">
          <Link to="/admin/dashboard" className="hover:underline">Home</Link> &gt; Dashboard
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          amount={loading ? "Loading..." : stats.totalUsers}
          icon={Users}
          loading={loading}
        />
        <StatCard 
          title="Total Orders" 
          amount={loading ? "Loading..." : stats.totalOrders}
          icon={ShoppingBag}
          loading={loading}
        />
        <StatCard 
          title="Total Products" 
          amount={loading ? "Loading..." : stats.totalProducts}
          icon={Package}
          loading={loading}
        />
        <StatCard 
          title="Delivered Orders" 
          amount={loading ? "Loading..." : stats.deliveredOrders}
          icon={CheckCircle}
          loading={loading}
        />
      </div>
      

    </div>
  );
};

const StatCard = ({ title, amount, icon: Icon, loading }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-base font-medium">{title}</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            {loading ? (
              <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-xl font-bold">{amount}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatusBadge = ({ status }) => {
  let color = "bg-gray-100";
  
  if (status === "Delivered") {
    color = "text-green-700";
  } else if (status === "Canceled") {
    color = "text-amber-600";
  }
  
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${status === "Delivered" ? "bg-green-700" : "bg-amber-600"}`}></div>
      <span className={color}>{status}</span>
    </div>
  );
};

export default AdminDashboard;