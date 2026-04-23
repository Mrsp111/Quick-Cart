import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilterSidebar from "@/components/product/ProductFilterSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const Shop = () => {
  const { category } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Get categories from search params
        const categoryFilter = searchParams.get("categories");
        const categoryParam = categoryFilter
          ? categoryFilter
              .split(",")
              .map((cat) => `category=${cat}`)
              .join("&")
          : category
          ? `category=${category}`
          : "";

        // Get price range from search params
        const priceParam = searchParams.get("price");
        let priceRangeParam = "";
        if (priceParam) {
          const [min, max] = priceParam.split(",").map(Number);
          priceRangeParam = `&minPrice=${min}&maxPrice=${max}`;
        }

        // Get gender filter from search params
        const genderFilter = searchParams.get("gender");
        const genderParam = genderFilter ? `&gender=${genderFilter}` : "";

        // Build the API URL with proper parameters - removed pagination
        const baseUrl = "http://localhost:5000/api/products";
        const filterParams = [categoryParam, priceRangeParam, genderParam]
          .filter((param) => param)
          .join("&");

        const apiUrl = filterParams ? `${baseUrl}?${filterParams}` : baseUrl;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();

        // Set all products at once for smooth scrolling
        setProducts(Array.isArray(data) ? data : data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [category, searchParams]);

  useEffect(() => {
    // Handle sorting only - filtering is now handled by the API
    const sortParam = searchParams.get("sort");
    if (sortParam) {
      setSortBy(sortParam);
      let sortedProducts = [...products];

      if (sortParam === "price-asc") {
        sortedProducts.sort((a, b) => a.price - b.price);
      } else if (sortParam === "price-desc") {
        sortedProducts.sort((a, b) => b.price - a.price);
      } else {
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      }

      setProducts(sortedProducts);
    }
  }, [searchParams.get("sort"), products]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setSearchParams((params) => {
      params.set("sort", e.target.value);
      return params;
    });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setSearchParams((params) => {
      params.set("search", query);
      return params;
    });

    const filteredProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query)
    );
    setProducts(filteredProducts);
  };

  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      const filteredProducts = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchParam) ||
          product.brand.toLowerCase().includes(searchParam)
      );
      setProducts(filteredProducts);
    }
  }, [searchParams.get("search"), products]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <ProductFilterSidebar categories={categories} />
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">
                {searchParams.get("categories")
                  ? (() => {
                      const selectedIds = searchParams
                        .get("categories")
                        ?.split(",");
                      const selectedNames = selectedIds.map(
                        (id) =>
                          categories.find(
                            (cat) => cat._id === id || cat.id === id
                          )?.name || id
                      );
                      return `${selectedNames.join(", ")} Collection`;
                    })()
                  : category
                  ? `${category} Collection`
                  : "All Products"}
              </h1>

              <div className="flex items-center justify-between">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="border border-gray-300 rounded px-4 py-2 text-sm"
                />
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="border border-gray-300 rounded px-4 py-2 text-sm hover:bg-gray-100 transition"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
            <ProductGrid products={products} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Shop;
