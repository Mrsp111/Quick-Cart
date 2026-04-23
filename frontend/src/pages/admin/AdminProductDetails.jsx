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
      <div className="container py-16 mx-auto text-center">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!isLoading && !product && !isNewProduct) {
    return (
      <div className="container py-16 mx-auto text-center">
        <h1 className="mb-4 text-3xl font-bold">Product Not Found</h1>
        <Button onClick={() => navigate("/admin/products")}>Back to Products</Button>
      </div>
    );
  }

  if (isNewProduct || isEditMode) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center gap-2 mb-6 text-gray-500">
          <Link to="/admin/products" className="hover:text-gray-700">Products</Link>
          <span>›</span>
          <span className="text-gray-700">{isNewProduct ? 'New Product' : 'Edit Product'}</span>
        </div>
        <div className="max-w-3xl mx-auto">
          <h1 className="mb-6 text-2xl font-bold">{isNewProduct ? 'Add New Product' : 'Edit Product'}</h1>
          <ProductForm 
            product={product} 
            categories={categories}
            onSubmit={() => navigate('/admin/products')}
          />
        </div>
      </div>
    );
  }

  // Helper to get valid image URL
  const getImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('blob:')) return img; // for previews, not for gallery
    if (img.startsWith('http')) return img;
    return `http://localhost:5000${img}`;
  };

  // Filter out blob: images for gallery (they are not server images)
  const galleryImages = (product.images || []).filter(img => img && !img.startsWith('blob:'));
  const mainImage = galleryImages.length > 0 ? getImageUrl(galleryImages[0]) : getImageUrl(product.imageUrl);

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-gray-500">
        <Link to="/admin/products" className="hover:text-gray-700">Products</Link>
        <span>›</span>
        <span className="text-gray-700">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left Side - Image Gallery */}
        <div className="space-y-4">
          <div className="relative h-[400px] w-full rounded-lg overflow-hidden bg-gray-100">
            <img
              src={mainImage}
              alt={product.name}
              className="object-contain w-full h-full"
              id="main-product-image"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {galleryImages.length > 0 ? (
              galleryImages.map((image, index) => (
                <div 
                  key={index} 
                  className="h-24 overflow-hidden transition-colors border rounded-lg cursor-pointer hover:border-blue-500"
                  onClick={() => {
                    document.getElementById('main-product-image').src = getImageUrl(image);
                  }}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${product.name} - Image ${index + 1}`}
                    className="object-contain w-full h-full"
                  />
                </div>
              ))
            ) : (
              <div className="h-24 overflow-hidden border rounded-lg cursor-pointer">
                <img
                  src={getImageUrl(product.imageUrl)}
                  alt={product.name}
                  className="object-contain w-full h-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Product Details */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold">{product.name}</h1>
          
          <div className="p-4 space-y-2 rounded-lg bg-gray-50">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-black/90">{formatIndianRupee(product.price)}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-500 line-through">{formatIndianRupee(product.originalPrice)}</span>
                <span className="px-3 py-1 text-sm font-medium text-green-600 rounded-full bg-green-50">{product.discountPercentage}% off</span>
              </div>
            </div>
          </div>

          <div className="text-gray-600">
            <p>{product.description}</p>
          </div>
          
          {product.sizes?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Available Sizes</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((sizeObj) => (
                  <div
                    key={sizeObj._id}
                    className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl"
                  >
                    <div>{sizeObj.size}</div>
                    <div className="mt-1 text-xs text-gray-500">Stock: {sizeObj.quantity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand section */}
          {product.brand && (
            <div className="pt-4 border-t">
              <h3 className="mb-2 text-lg font-medium">Brand</h3>
              <p className="text-gray-700">{product.brand}</p>
            </div>
          )}

          {/* Admin Options */}
          {isAdmin && (
            <div className="flex gap-6 pt-4 border-t">
              <Link to={`/admin/products/${productId}/edit`} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                <Pencil className="w-5 h-5" /> Edit Product
              </Link>
              <button onClick={handleDeleteProduct} className="flex items-center gap-2 text-red-600 hover:text-red-800">
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
