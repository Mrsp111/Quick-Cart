import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const fetchUserOrders = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/orders/user/${userId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch user orders");
    }
    const data = await response.json();
    const orders = Array.isArray(data) ? data : [];
    return orders.map((order) => ({
      ...order,
      shippingAddress: `${order.shippingInfo?.address || ""}, ${order.shippingInfo?.city || ""}, ${order.shippingInfo?.state || ""} ${order.shippingInfo?.zipCode || ""}`,
      paymentStatus: order.paymentStatus || "pending",
      items: order.items.map((item) => ({
        ...item,
        image: item.imageUrl
          ? `http://localhost:5000${item.imageUrl}`
          : "/assets/placeholder-image.png"
      }))
    }));
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

const UserOrderHistory = () => {
  const userId = JSON.parse(localStorage.getItem("user"))?._id;
  const { data, isLoading, error } = useQuery({
    queryKey: ["userOrders", userId],
    queryFn: () => fetchUserOrders(userId)
  });

  if (isLoading) return <div className="p-6 text-lg font-medium animate-pulse">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;

  const orders = data || [];
  const sortedOrders = orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  const getStatusLabel = (order) => {
    if (order.paymentStatus === "paid") {
      return order.status === "delivered" ? "Paid • Delivered" : `Paid • ${order.status}`;
    }

    return order.status;
  };

  const getStatusClassName = (order) => {
    if (order.paymentStatus === "paid") {
      return order.status === "delivered"
        ? "bg-green-100 text-green-700"
        : "bg-emerald-100 text-emerald-700";
    }

    return order.status === "delivered"
      ? "bg-green-100 text-green-700"
      : order.status === "processing"
      ? "bg-blue-100 text-blue-700"
      : order.status === "cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";
  };

  return (
    <MainLayout>
      <div className="p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Your Orders</h1>
          <p className="text-sm text-gray-500">
            <Link to="/" className="text-blue-600 hover:underline">Home</Link> &gt; Order History
          </p>
        </div>

        <Card className="shadow-xl border border-gray-200 rounded-2xl transition-all duration-300">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="text-gray-700 font-medium">Products</TableHead>
                  <TableHead className="text-gray-700 font-medium">Address</TableHead>
                  <TableHead className="text-gray-700 font-medium">Date</TableHead>
                  <TableHead className="text-gray-700 font-medium">Status</TableHead>
                  <TableHead className="text-right text-gray-700 font-medium">Amount</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedOrders.map((order) => (
                  <Link
                    key={order._id}
                    to={`/user/orders/${order._id}`}
                    className="contents"
                  >
                    <TableRow className="hover:bg-gray-50 cursor-pointer transition-all duration-200 ease-in-out group">
                      <TableCell>
                        <div className="max-w-md space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 object-cover rounded-md border border-gray-200 shadow-sm transform group-hover:scale-105 transition duration-200"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-800">{item.name}</div>
                                <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-gray-700">
                        {order.shippingAddress}
                      </TableCell>

                      <TableCell className="text-sm text-gray-700">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </TableCell>

                      <TableCell>
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 ${getStatusClassName(order)}`}>
                          {getStatusLabel(order)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right text-sm font-semibold text-gray-800">
                        ₹{order.orderTotal}
                      </TableCell>
                    </TableRow>
                  </Link>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UserOrderHistory;
