
  import React, { useState, useEffect } from "react";
  import { Link, useLocation, useNavigate } from "react-router-dom";
  import MainLayout from "@/components/layout/MainLayout";
  import { useCart } from "@/context/CartContext";
  import { toast } from "@/components/ui/use-toast";
  import { orderApi } from "@/services/orderApi";
  import { ShoppingBag, CreditCard, Truck } from "lucide-react";
  import { formatIndianRupee } from "@/utils/currency";

  const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { cart, clearCart } = useCart();
    const [orderTotal, setOrderTotal] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(150);
    const [cartWithProducts, setCartWithProducts] = useState([]);
    const [formData, setFormData] = useState({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      paymentMethod: "cod"
    });
    const [loading, setLoading] = useState(false);
    const [localCartTotal, setLocalCartTotal] = useState(0);

    // Fetch complete product details for each cart item
    useEffect(() => {
      const fetchProductDetails = async () => {
        if (cart.length === 0) {
          setCartWithProducts([]);
          setLocalCartTotal(0);
          return;
        }
        
        setLoading(true);
        try {
          const cartItemsWithProducts = await Promise.all(
            cart.map(async (item) => {
              const productId = item.productId || item.product?._id;
              if (!productId) return item;
              
              try {
                const response = await fetch(`http://localhost:5000/api/products/${productId}`);
                if (!response.ok) throw new Error(`Failed to fetch product ${productId}`);
                
                const productData = await response.json();
                // Add base URL to image path if it exists and doesn't already have it
                if (productData.imageUrl) {
                  productData.imageUrl = productData.imageUrl.startsWith('http') 
                    ? productData.imageUrl 
                    : `http://localhost:5000${productData.imageUrl}`;
                }
                return { ...item, product: productData };
              } catch (err) {
                console.error(`Error fetching product ${productId}:`, err);
                return item;
              }
            })
          );
          
          setCartWithProducts(cartItemsWithProducts);
          
          // Calculate local cart total based on fetched product data
          const total = cartItemsWithProducts.reduce((sum, item) => {
            return sum + ((item.product?.price || 0) * item.quantity);
          }, 0);
          setLocalCartTotal(total);
          setOrderTotal(total + deliveryFee);
        } catch (err) {
          console.error('Error fetching product details:', err);
          toast({
            title: "Error",
            description: "Failed to load product details",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchProductDetails();
    }, [cart, deliveryFee]);

    // Redirect if cart is empty
    useEffect(() => {
      if (cart.length === 0) {
        navigate("/cart");
        toast({
          title: "Empty Cart",
          description: "Your cart is empty. Please add items before checkout.",
          variant: "destructive",
        });
      }
    }, [cart, navigate]);

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      if (params.get("payment") === "cancelled") {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled online payment. Your cart is still safe.",
          variant: "destructive",
        });
      }
    }, [location.search]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value,
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        // Validate form data
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        }

        // Format cart items to ensure they have the required fields
        const formattedItems = cart.map(item => ({
          productId: item.productId || item.product?._id,
          size: item.size || 'M',
          sizeType: item.sizeType || 'standard',
          quantity: item.quantity
        }));

        // Prepare order data to send to the backend
        const orderData = {
          items: formattedItems,
          shippingInfo: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          },
          paymentMethod: formData.paymentMethod,
          subtotal: localCartTotal,
          deliveryFee,
          orderTotal
        };

        if (formData.paymentMethod === "online") {
          const sessionResponse = await orderApi.createCheckoutSession(orderData);
          if (!sessionResponse?.checkoutUrl) {
            throw new Error("Unable to start online payment. Please try again.");
          }

          window.location.assign(sessionResponse.checkoutUrl);
          return;
        }

        await orderApi.createOrder(orderData);

        // Keep existing COD flow untouched
        await clearCart();
        sessionStorage.setItem("orderCompleted", "true");
        toast({
          title: "Order Placed Successfully",
          description: `Your order has been placed. Total: ${formatIndianRupee(orderTotal)}`,
        });
        navigate("/order-confirmation");
      } catch (error) {
        console.error("Error placing order:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to place your order. Please try again.",

          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center gap-2 text-sm mb-8">
            <Link to="/" className="text-gray-500 hover:text-black">Home</Link>
            <span className="text-gray-500">/</span>
            <Link to="/cart" className="text-gray-500 hover:text-black">Cart</Link>
            <span className="text-gray-500">/</span>
            <span className="font-medium">Checkout</span>
          </div>

          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <ShoppingBag className="mr-3 h-8 w-8" />
            Complete Your Order
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Truck className="mr-2 h-5 w-5 text-blue-600" />
                    Shipping Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium mb-1">State</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium mb-1">ZIP Code</label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-green-600" />
                    Payment Method
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === "cod"}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="cod" className="ml-2 block text-sm font-medium">Cash on Delivery</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="online"
                        name="paymentMethod"
                        value="online"
                        checked={formData.paymentMethod === "online"}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="online" className="ml-2 block text-sm font-medium">Online (Stripe Test Mode)</label>
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-black hover:bg-gray-800 text-white py-3 rounded-md font-medium transition-all duration-300 transform hover:scale-[1.02] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-lg p-6 sticky top-8 shadow-md bg-gray-50">
                <h2 className="text-xl font-bold mb-6 text-center pb-2 border-b border-gray-200">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatIndianRupee(localCartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">{formatIndianRupee(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-200 mt-2 pt-2">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">{formatIndianRupee(orderTotal)}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-center bg-gray-200 py-2 rounded-md">Order Details</h3>
                  <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
                    {cartWithProducts.map((item) => (
                      <div key={`${item.productId || item.product?._id}-${item.size}`} className="flex gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name || 'Product'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product?.name || 'Product'}</p>
                          <p className="text-gray-500 text-xs">
                            Size: {item.size}
                            {item.color && `, Color: ${item.color}`}
                          </p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-gray-500 text-xs">
                              Qty: {item.quantity}
                            </p>
                            <p className="font-semibold text-sm">
                              ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  };

  export default Checkout;

