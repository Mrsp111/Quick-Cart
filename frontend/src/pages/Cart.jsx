import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Minus, Plus, Trash2, Loader } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "@/components/ui/use-toast";
import { formatIndianRupee } from "@/utils/currency";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localCartTotal, setLocalCartTotal] = useState(0);
  const deliveryFee = 150;

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
              // Add base URL to image path if it exists
              if (productData.imageUrl) {
                productData.imageUrl = `http://localhost:5000${productData.imageUrl}`;
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
  }, [cart]);

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-2 text-sm mb-8">
          <Link to="/" className="text-gray-500 hover:text-black">Home</Link>
          <span className="text-gray-500">/</span>
          <span className="font-medium">Cart</span>
        </div>

        <h1 className="text-3xl font-bold mb-8">Your cart</h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading cart items...</span>
          </div>
        ) : cart.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/shop">
              <button className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {cartWithProducts.map((item) => (
                  <div
                    key={`${item.productId || (item.product?._id || 'unknown')}-${item.size}-${item.color || 'default'}`}
                    className="p-6 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {item.product?.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{item.product?.name || 'Product'}</h3>
                            <p className="text-gray-500 text-sm">
                              Size: {item.size}
                              {item.color && `, Color: ${item.color}`}
                            </p>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.productId || item.product?._id, item.size, item.sizeType)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              className="px-2 py-1"
                              onClick={() => updateQuantity(item.productId || item.product?._id, item.quantity - 1, item.size, item.sizeType)}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-1">{item.quantity}</span>
                            <button
                              className="px-2 py-1"
                              onClick={() => updateQuantity(item.productId || item.product?._id, item.quantity + 1, item.size, item.sizeType)}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <p className="font-medium">{formatIndianRupee(item.product?.price || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatIndianRupee(localCartTotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">{formatIndianRupee(deliveryFee)}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatIndianRupee(localCartTotal + deliveryFee)}</span>
                    </div>
                  </div>
                </div>

                {cartWithProducts.length === 0 ? (
                  <button 
                    className="w-full bg-black bg-opacity-50 cursor-not-allowed text-white flex items-center justify-center gap-2 py-6 rounded"
                    disabled
                  >
                    Go to Checkout
                  </button>
                ) : (
                  <Link to="/checkout" className="w-full">
                    <button 
                      className="w-full bg-black hover:bg-gray-800 text-white flex items-center justify-center gap-2 py-6 rounded"
                    >
                      Go to Checkout
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Cart;
