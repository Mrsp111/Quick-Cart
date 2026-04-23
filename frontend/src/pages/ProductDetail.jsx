import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { isLoggedIn } from "@/utils/auth";
import { formatIndianRupee } from "@/utils/currency";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import ProductCard from "@/components/product/ProductCard";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/products/${productId}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Product not found");
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error(error.message || "Product not found");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!product?.category) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/products?category=${product.category}&limit=10`);
        if (!response.ok) throw new Error('Failed to fetch similar products');
        
        const data = await response.json();
        const filteredProducts = data.products.filter(p => p._id !== product._id);
        setSimilarProducts(filteredProducts);
      } catch (error) {
        console.error('Error fetching similar products:', error);
      }
    };

    fetchSimilarProducts();
  }, [product]);

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      setShowLoginDialog(true);
      return;
    }
    if (!selectedSize) {
      toast.error("Please select a size", {
        style: {
          backgroundColor: "white",
          color: "black",
        },
      });
      return;
    }

    const sizeType = product.category?.includes("pants") ? "waist" : "standard";

    try {
      setIsLoading(true);
      await addToCart(product, quantity, selectedSize, sizeType);
    } catch (error) {
      toast.error(error.message || "Failed to add item to cart");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading product details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="container mx-auto py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-gray-500">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span>›</span>
          <Link to="/shop" className="hover:text-gray-700">Shop</Link>
          <span>›</span>
          <Link to="/shop/mens" className="hover:text-gray-700">Mens</Link>
          <span>›</span>
          <span className="text-gray-700">T-shirts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side - Image Gallery */}
          <div className="space-y-4">
            <div className="relative h-[400px] w-full rounded-lg overflow-hidden bg-gray-100">
              <img
                src={`http://localhost:5000${product.images && product.images.length > 0 ? product.images[0] : product.imageUrl}`}
                alt={product.name}
                className="w-full h-full object-contain"
                id="main-product-image"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {product.images && product.images.length > 0 ? (
                product.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="h-24 border rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => {
                      document.getElementById('main-product-image').src = `http://localhost:5000${image}`;
                    }}
                  >
                    <img
                      src={`http://localhost:5000${image}`}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))
              ) : (
                <div className="h-24 border rounded-lg overflow-hidden cursor-pointer">
                  <img
                    src={`http://localhost:5000${product.imageUrl}`}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-black/90">{formatIndianRupee(product.price)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-gray-500 line-through">{formatIndianRupee(product.originalPrice)}</span>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">{product.discountPercentage}% off</span>
                </div>
              </div>
            </div>
            <div className="text-gray-600">
              <p>{product.description}</p>
            </div>
            
            {product.sizes?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-lg flex items-center gap-2">
                  Choose Size
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((sizeObj) => (
                    <button
                      key={sizeObj._id}
                      className={`px-6 py-3 rounded-xl border-2 transition-all duration-200
                        ${selectedSize === sizeObj.size 
                          ? "border-black bg-black text-white transform scale-105" 
                          : "border-gray-200 hover:border-gray-400 bg-white"}
                        ${sizeObj.quantity === 0 ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
                      onClick={() => setSelectedSize(sizeObj.size)}
                      disabled={sizeObj.quantity === 0}
                    >
                      {sizeObj.size}
                      {sizeObj.quantity === 0 && (
                        <span className="block text-xs mt-1 text-gray-500">Out of stock</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                <button
                  className="p-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  className="w-12 text-center text-lg font-medium bg-transparent"
                  type="number"
                  value={quantity}
                  readOnly
                />
                <button
                  className="p-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-4 px-6 rounded-2xl hover:bg-black/90 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Adding to cart...
                  </div>
                ) : (
                  "Add to Cart"
                )}
              </button>
            </div>

            {/* Brand section */}
            {product.brand && (
              <div className="pt-4 border-t">
                <h3 className="font-medium text-lg mb-2">Brand</h3>
                <p className="text-gray-700">{product.brand}</p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
            <div className="relative overflow-x-auto pb-4">
              <div className="flex gap-6 overflow-x-auto scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
                {similarProducts.map((similarProduct) => (
                  <div key={similarProduct._id} className="flex-none w-[280px]">
                    <ProductCard product={similarProduct} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[425px] bg-white shadow-2xl border-2 border-black/10 rounded-[32px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
              Login Required
            </DialogTitle>
            <DialogDescription className="text-center text-base text-gray-600">
              Please login or create an account to add items to your cart and start shopping!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-6">
            <Button
              variant="outline"
              className="w-full py-6 text-lg font-medium rounded-2xl border-2 hover:bg-black hover:text-white"
              onClick={() => {
                setShowLoginDialog(false);
                navigate("/login");
              }}
            >
              Login to Your Account
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-gray-100" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white px-6 text-gray-400 font-semibold tracking-wider">Or</span>
              </div>
            </div>
            <Button
              className="w-full py-6 text-lg font-medium bg-black text-white rounded-2xl hover:scale-105"
              onClick={() => {
                setShowLoginDialog(false);
                navigate("/signup");
              }}
            >
              Create New Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ProductDetail;
