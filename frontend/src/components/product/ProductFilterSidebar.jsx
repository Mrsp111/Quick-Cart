import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ProductFilterSidebar = ({ categories = [] }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize price range state with URL params or defaults
  const [priceRange, setPriceRange] = useState(() => {
    const priceParam = searchParams.get('price');
    return priceParam ? priceParam.split(',').map(Number) : [0, 10000];
  });
  
  // Separate states for min and max price inputs
  const [minPrice, setMinPrice] = useState(priceRange[0]);
  const [maxPrice, setMaxPrice] = useState(priceRange[1]);
  
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const categoryParam = searchParams.get('categories');
    return categoryParam ? categoryParam.split(',') : [];
  });

  // Initialize gender filter state with URL params or default
  const [selectedGender, setSelectedGender] = useState(() => {
    return searchParams.get('gender') || '';
  });

  // Sync input fields with slider when price range changes
  useEffect(() => {
    setMinPrice(priceRange[0]);
    setMaxPrice(priceRange[1]);
  }, [priceRange]);

  // Handle slider change
  const handlePriceChange = (values) => {
    setPriceRange(values);
    updatePriceParams(values[0], values[1]);
  };

  // Handle min price input change
  const handleMinPriceChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setMinPrice(value);
  };

  // Handle max price input change
  const handleMaxPriceChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setMaxPrice(value);
  };

  // Apply price filter when input fields are blurred
  const applyPriceFilter = () => {
    // Ensure min is not greater than max
    const validMinPrice = Math.min(minPrice, maxPrice);
    const validMaxPrice = Math.max(minPrice, maxPrice);
    
    setPriceRange([validMinPrice, validMaxPrice]);
    updatePriceParams(validMinPrice, validMaxPrice);
  };

  // Update URL params with price values
  const updatePriceParams = (min, max) => {
    setSearchParams((params) => {
      params.set("price", `${min},${max}`);
      return params;
    });
  };

  const handleCategoryChange = (categoryId) => {
    let newCategories;
    if (selectedCategories.includes(categoryId)) {
      newCategories = selectedCategories.filter(id => id !== categoryId);
    } else {
      newCategories = [...selectedCategories, categoryId];
    }
    setSelectedCategories(newCategories);
    setSearchParams((params) => {
      if (newCategories.length > 0) {
        params.set("categories", newCategories.join(','));
      } else {
        params.delete("categories");
      }
      return params;
    });
  };

  const handleClearCategory = () => {
    setSelectedCategories([]);
    setSearchParams((params) => {
      params.delete("categories");
      return params;
    });
  };

  // Handle gender filter change
  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
    setSearchParams((params) => {
      params.set("gender", gender);
      return params;
    });
  };

  // Clear gender filter
  const handleClearGender = () => {
    setSelectedGender('');
    setSearchParams((params) => {
      params.delete("gender");
      return params;
    });
  };

  
  return (
    <div className="w-full md:w-64 space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Range Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Price Range</h3>
              {(priceRange[0] !== 0 || priceRange[1] !== 10000) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setPriceRange([0, 10000]);
                    setMinPrice(0);
                    setMaxPrice(10000);
                    setSearchParams((params) => {
                      params.set("price", "0,10000");
                      return params;
                    });
                  }}
                  className="text-xs h-7 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="pt-2">
              <Slider
                defaultValue={[0, 10000]}
                max={10000}
                step={100}
                value={priceRange}
                onValueChange={handlePriceChange}
                className="mb-6"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="min-price" className="text-xs mb-1 block">Min Price</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="min-price"
                    type="number"
                    min="0"
                    max={maxPrice}
                    value={minPrice}
                    onChange={handleMinPriceChange}
                    onBlur={applyPriceFilter}
                    className="pl-6"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="max-price" className="text-xs mb-1 block">Max Price</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="max-price"
                    type="number"
                    min={minPrice}
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    onBlur={applyPriceFilter}
                    className="pl-6"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Gender Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Gender</h3>
              {selectedGender && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearGender}
                  className="text-xs h-7 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <RadioGroup value={selectedGender} onValueChange={(value) => handleGenderChange(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    id="gender-men" 
                    value="Men" 
                    checked={selectedGender === "Men"} 
                    onCheckedChange={() => handleGenderChange("Men")}
                  />
                  <Label 
                    htmlFor="gender-men" 
                    className="text-sm cursor-pointer"
                  >
                    Men
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    id="gender-women" 
                    value="Women" 
                    checked={selectedGender === "Women"} 
                    onCheckedChange={() => handleGenderChange("Women")}
                  />
                  <Label 
                    htmlFor="gender-women" 
                    className="text-sm cursor-pointer"
                  >
                    Women
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    id="gender-unisex" 
                    value="Unisex" 
                    checked={selectedGender === "Unisex"} 
                    onCheckedChange={() => handleGenderChange("Unisex")}
                  />
                  <Label 
                    htmlFor="gender-unisex" 
                    className="text-sm cursor-pointer"
                  >
                    Unisex
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Categories</h3>
              {selectedCategories.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearCategory}
                  className="text-xs h-7 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category._id || category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`category-${category._id || category.id}`}
                    checked={selectedCategories.includes(category._id || category.id)}
                    onChange={() => handleCategoryChange(category._id || category.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label
                    htmlFor={`category-${category._id || category.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductFilterSidebar;
