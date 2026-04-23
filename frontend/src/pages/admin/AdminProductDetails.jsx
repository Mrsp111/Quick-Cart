import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { formatIndianRupee } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { toast } from "sonner";
import ProductCard from "@/components/product/ProductCard";
import ProductForm from "@/components/admin/product/ProductForm";

const AdminProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated: isAdmin } = useAdmin();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  const isEditMode = location.pathname.endsWith('/edit');
  const isNewProduct = location.pathname.endsWith('/new');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch categories
        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Fetch product if editing existing product
        if (productId && !isNewProduct) {
          const productResponse = await fetch(`http://localhost:5000/api/products/${productId}`);
          const productData = await productResponse.json();

          if (!productResponse.ok) throw new Error(productData.error || "Product not found");
          setProduct(productData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, isNewProduct]);

  const handleDeleteProduct = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/products/${productId}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error("Failed to delete product");
        toast.success("Product deleted successfully");
        navigate("/admin/products");
      } catch (error) {
        toast.error(error.message || "Failed to delete product");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!isLoading && !product && !isNewProduct) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <Button onClick={() => navigate("/admin/products")}>Back to Products</Button>
      </div>
    );
  }

  if (isNewProduct || isEditMode) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex items-center gap-2 text-gray-500">
          <Link to="/admin/products" className="hover:text-gray-700">Products</Link>
          <span>›</span>
          <span className="text-gray-700">{isNewProduct ? 'New Product' : 'Edit Product'}</span>
        </div>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{isNewProduct ? 'Add New Product' : 'Edit Product'}</h1>
          <ProductForm 
            product={product} 
            categories={categories}
            onSubmit={() => navigate('/admin/products')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-gray-500">
        <Link to="/admin/products" className="hover:text-gray-700">Products</Link>
        <span>›</span>
        <span className="text-gray-700">{product.name}</span>
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
              <h3 className="font-medium text-lg">Available Sizes</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((sizeObj) => (
                  <div
                    key={sizeObj._id}
                    className="px-6 py-3 rounded-xl border-2 border-gray-200 bg-white"
                  >
                    <div>{sizeObj.size}</div>
                    <div className="text-xs text-gray-500 mt-1">Stock: {sizeObj.quantity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand section */}
          {product.brand && (
            <div className="pt-4 border-t">
              <h3 className="font-medium text-lg mb-2">Brand</h3>
              <p className="text-gray-700">{product.brand}</p>
            </div>
          )}

          {/* Admin Options */}
          {isAdmin && (
            <div className="flex gap-6 pt-4 border-t">
              <Link to={`/admin/products/${productId}/edit`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                <Pencil className="w-5 h-5" /> Edit Product
              </Link>
              <button onClick={handleDeleteProduct} className="text-red-600 hover:text-red-800 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Delete Product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProductDetails;
