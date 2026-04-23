import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Checkbox } from "../../components/ui/checkbox";
import { User, Package, MoreVertical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getOrderById } from "../../services/orderService";

const AdminOrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOrderById(orderId);
        const transformedData = {
          ...data,
          id: data._id,
          customer: {
            name: data.shippingInfo?.fullName || "Not available",
            email: data.shippingInfo?.email || "Not available",
            phone: data.shippingInfo?.phone || "Not available",
          },
          shippingAddress: `${data.shippingInfo?.address || ""}, ${data.shippingInfo?.city || ""}, ${data.shippingInfo?.state || ""} ${data.shippingInfo?.zipCode || ""}`,
          paymentMethod: data.paymentMethod || "Not specified",
          orderDate: data.orderDate,
          status: data.status || "Pending",
          subtotal: data.subtotal,
          deliveryFee: data.deliveryFee,
          total: data.orderTotal,
          items: data.items,
        };
        setOrder(transformedData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch order details");
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  const printInvoice = () => {
    const printContents = document.getElementById("invoice").innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Optional: Reload to restore event bindings
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div className="max-w-4xl mx-auto p-4">
      <button
        onClick={printInvoice}
        className="mb-4 px-4 py-2 bg-black text-white rounded shadow-md"
      >
        Print Invoice
      </button>

      <div
        id="invoice"
        className="bg-white text-black p-8 shadow-md border rounded font-sans"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-wide mb-1">QuickCart</h1>
          <h2 className="text-xl mb-1">INVOICE</h2>
          <p className="mb-0">Order #: <strong>{order.id}</strong></p>
          <p>Date: <strong>{new Date(order.orderDate).toLocaleDateString()}</strong></p>
          <hr className="my-4" />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-gray-500 mb-2">Customer Information</h3>
            <p><strong>Name:</strong> {order.customer.name}</p>
            <p><strong>Email:</strong> {order.customer.email}</p>
            <p><strong>Phone:</strong> {order.customer.phone}</p>
          </div>
          <div className="md:text-right">
            <h3 className="text-gray-500 mb-2">Shipping Information</h3>
            <p><strong>Address:</strong> {order.shippingAddress}</p>
            <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
            <p><strong>Status:</strong> {order.status}</p>
          </div>
        </div>

        <h3 className="mb-3 font-semibold">Ordered Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-300 mb-6">
            <thead className="bg-gray-100 text-center">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Product</th>
                <th className="p-2 border">Size</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="p-2 border">{index + 1}</td>
                  <td className="p-2 border">{item.name}</td>
                  <td className="p-2 border">{item.size}</td>
                  <td className="p-2 border">₹{item.price.toFixed(2)}</td>
                  <td className="p-2 border">{item.quantity}</td>
                  <td className="p-2 border">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full md:w-1/2">
            <h3 className="mb-3 font-semibold">Order Summary</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1"><strong>Subtotal:</strong></td>
                  <td className="py-1 text-right">₹{order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-1"><strong>Delivery Fee:</strong></td>
                  <td className="py-1 text-right">₹{order.deliveryFee.toFixed(2)}</td>
                </tr>
                <tr className="border-t mt-2">
                  <td className="py-2 font-bold text-lg"><strong>Total:</strong></td>
                  <td className="py-2 text-right font-bold text-lg">₹{order.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-8 text-gray-600">
          <p>Thank you for shopping with <strong>QuickCart</strong>!</p>
        </div>
      </div>

    </div>
  );
};

export default AdminOrderDetails;
