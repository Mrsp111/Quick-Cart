import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import AProductCard from "@/components/product/AProductCard";
import { toast } from "@/components/ui/use-toast";

const BASE_URL = "http://localhost:5000";

const getAllProducts = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/products`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const products = Array.isArray(data) ? data : data.products || [];
    return products.map(product => ({
      ...product,
      imageUrl: product.imageUrl ? (product.imageUrl.startsWith("http") ? product.imageUrl : `${BASE_URL}${product.imageUrl}`) : '',
      checked: product.checked || false
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await getAllProducts();
        setProducts(productsData);
        setLoading(false);
      } catch (err) {
        const errorMessage = err.message || 'Failed to fetch products';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          className: "bg-white border-red-500 text-red-500"
        });
        setError(errorMessage);
        setLoading(false);
      }
    };
    
    fetchProducts();
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading products...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-3">
          <Button asChild className="rounded-sm">
            <Link to="/admin/categories">
              Manage Categories
            </Link>
          </Button>
          <Button asChild className="rounded-sm">
            <Link to="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              ADD NEW PRODUCT
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="relative group">
            <AProductCard product={product} />
            <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                to={`/admin/products/${product._id}`}
                className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProducts;
