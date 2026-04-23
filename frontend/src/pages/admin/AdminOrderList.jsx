import React from "react";
import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const fetchOrders = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/orders?limit=1000');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        status: response.status,
        statusText: response.statusText
      }));
      console.error('API Error:', {
        url: response.url,
        status: response.status,
        data: errorData
      });
      throw new Error(`Failed to fetch orders: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    
    if (!data.orders || !Array.isArray(data.orders)) {
      throw new Error(`Invalid orders data structure. Received: ${JSON.stringify(data)}`);
    }
    
    return {
      orders: data.orders.map(order => ({
        id: `#${order._id || ''}`,
        product: order.items?.[0]?.name || 'Unknown',
        date: new Date(order.orderDate).toLocaleDateString(),
        customer: order.shippingInfo?.fullName || 'Unknown',
        status: order.status,
        amount: `₹${order.orderTotal?.toFixed(2) || '0.00'}`
      }))
    };
  } catch (error) {
    console.error('Error fetching orders:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to process orders data: ${error.message}`);
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update order status');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

const AdminOrderList = () => {
  const [selectedOrders, setSelectedOrders] = React.useState([]);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ 
    queryKey: ["orders"], 
    queryFn: fetchOrders 
  });
  
  const ordersData = data?.orders || [];

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(ordersData.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId, checked) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      await Promise.all(
        selectedOrders.map(orderId =>
          updateOrderStatus(orderId.substring(1), newStatus.toLowerCase())
        )
      );
      await queryClient.invalidateQueries(["orders"]);
      toast.success('Orders status updated successfully');
      setSelectedOrders([]);
    } catch (error) {
      console.error('Error updating orders status:', error);
      toast.error('Failed to update orders status');
    }
  };

  const handleBulkPrint = async () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bulk Order Invoices</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .invoice { page-break-after: always; padding: 20px; max-width: 800px; margin: 0 auto; }
            .invoice:last-child { page-break-after: auto; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { text-align: center; margin-bottom: 20px; }
            .flex { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .summary { margin-top: 20px; }
            .total { font-weight: bold; font-size: 1.1em; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
          </style>
        </head>
        <body>
    `);

    try {
      for (const orderId of selectedOrders) {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId.substring(1)}`);
        if (!response.ok) throw new Error(`Failed to fetch order ${orderId}`);
        const order = await response.json();

        const orderDate = new Date(order.orderDate).toLocaleDateString();
        
        printWindow.document.write(`
          <div class="invoice">
            <div class="header">
              <h1>QuickCart</h1>
              <h2>INVOICE</h2>
              <p>Order #: ${order._id}</p>
              <p>Date: ${orderDate}</p>
              <hr/>
            </div>

            <div class="flex">
              <div>
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${order.shippingInfo?.fullName || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.shippingInfo?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.shippingInfo?.phone || 'N/A'}</p>
              </div>
              <div>
                <h3>Shipping Information</h3>
                <p><strong>Address:</strong> ${order.shippingInfo?.address || ''}, ${order.shippingInfo?.city || ''}, ${order.shippingInfo?.state || ''} ${order.shippingInfo?.zipCode || ''}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Not specified'}</p>
                <p><strong>Status:</strong> ${order.status || 'Pending'}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.size}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary">
              <table>
                <tr>
                  <td><strong>Subtotal:</strong></td>
                  <td align="right">₹${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Delivery Fee:</strong></td>
                  <td align="right">₹${order.deliveryFee.toFixed(2)}</td>
                </tr>
                <tr class="total">
                  <td><strong>Total:</strong></td>
                  <td align="right">₹${order.orderTotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <p>Thank you for shopping with <strong>QuickCart</strong>!</p>
            </div>
          </div>
        `);
      }

      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error generating bulk print:', error);
      toast.error('Failed to generate bulk print');
      printWindow.close();
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId.substring(1), newStatus.toLowerCase());
      await queryClient.invalidateQueries(["orders"]);
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isLoading) return (
  <div className="p-6 space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse flex space-x-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
if (error) return (
  <div className="p-6 bg-red-50 border border-red-200 rounded-md">
    <h3 className="text-red-800 font-medium">Error loading orders</h3>
    <p className="text-red-600 mt-2">{error.message}</p>
    <Button 
      variant="outline" 
      className="mt-4 bg-white"
      onClick={() => window.location.reload()}
    >
      Retry
    </Button>
  </div>
);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Orders List</h1>
          <div className="text-sm text-gray-500">
            <Link to="/admin/dashboard" className="hover:underline">Home</Link> &gt; Order List
          </div>
        </div>
        <div className="flex items-center">
          <div className="border border-gray-300 rounded-md px-4 py-2 flex items-center gap-2 bg-white">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 3H19V1H17V3H7V1H5V3H4C2.9 3 2 3.9 2 5V21C2 22.1 2.9 23 4 23H20C21.1 23 22 22.1 22 21V5C22 3.9 21.1 3 20 3ZM20 21H4V10H20V21ZM20 8H4V5H20V8Z" fill="currentColor"/>
              </svg>
              <span>Feb 16,2022 - Feb 20,2022</span>
            </div>
          </div>
          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-white" onClick={handleBulkPrint}>
                Print Selected
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <Card className="border-0 shadow-lg">
        <div className="p-6 flex justify-between items-center border-b bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-xl font-bold">Recent Purchases</h2>
          <button>
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedOrders.length === ordersData.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersData.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <TableCell>
                    <Checkbox 
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, checked)}
                    />
                  </TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>
                    <Link to={`/admin/orders/${order.id.substring(1)}`} className="hover:underline">
                      {order.id}
                    </Link>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue>
                          <StatusBadge status={order.status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Shipped">Shipped</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">{order.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-700";
  
  if (status === "Delivered") {
    bgColor = "bg-green-100";
    textColor = "text-green-700";
  } else if (status === "Canceled") {
    bgColor = "bg-red-100";
    textColor = "text-red-700";
  } else if (status === "Pending") {
    bgColor = "bg-amber-100";
    textColor = "text-amber-700";
  } else if (status === "Processing") {
    bgColor = "bg-blue-100";
    textColor = "text-blue-700";
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};

export default AdminOrderList