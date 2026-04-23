import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(1, "Description is required"),
  brand: z.string().min(2, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  stockQuantity: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(1),
  originalPrice: z.coerce.number().min(0).optional(),
  sku: z.string().min(2),
  gender: z.enum(["Men", "Women", "Unisex"], { required_error: "Gender is required" }),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  sizeType: z.enum(["standard", "waist"]),
  sizes: z
    .array(
      z.object({
        size: z.string().min(1, "Size is required"),
        quantity: z.coerce.number().min(0, "Quantity must be 0 or more"),
      })
    )
    .min(1, "At least one size is required"),
  isNewArrival: z.boolean().optional(),
});

const AddProductForm = ({ product = null, onSubmit = () => {}, categories = [] }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    // Initialize image previews from product data
    if (product) {
      const previews = [];
      if (product.images && product.images.length > 0) {
        previews.push(...product.images.map(img => 
          img.startsWith('http') ? img : `http://localhost:5000${img}`
        ));
      } else if (product.imageUrl) {
        previews.push(
          product.imageUrl.startsWith('http') 
            ? product.imageUrl 
            : `http://localhost:5000${product.imageUrl}`
        );
      }
      setImagePreviews(previews);
    }
  }, [product]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      sizeType: "standard",
      isNewArrival: false,
      sizes: [{ size: "", quantity: 0 }],
    },
  });

  const sizes = watch("sizes", []);



  const addSize = () => {
    setValue("sizes", [...sizes, { size: "", quantity: 0 }]);
  };

  const updateSize = (index, field, value) => {
    const updatedSizes = [...sizes];
    updatedSizes[index][field] = field === "quantity" ? parseInt(value) || 0 : value;
    setValue("sizes", updatedSizes);
  };

  const removeSize = (index) => {
    setValue("sizes", sizes.filter((_, i) => i !== index));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const invalidFiles = files.filter(
      file => !['image/jpeg', 'image/png', 'image/gif'].includes(file.type)
    );

    if (invalidFiles.length > 0) {
      toast({
        title: "Error",
        description: "Some files have invalid types. Only JPEG, PNG, and GIF are allowed.",
        variant: "destructive"
      });
      return;
    }

    const largeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      toast({
        title: "Error",
        description: "Some images exceed 5MB size limit",
        variant: "destructive"
      });
      return;
    }

    // Create preview URLs for the new files
    const validFiles = files.filter(file => 
      ['image/jpeg', 'image/png', 'image/gif'].includes(file.type) && 
      file.size <= 5 * 1024 * 1024
    );

    // Add new files to the end of the array to maintain sequence
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Add new previews to the end of the array
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    // Revoke the object URL to prevent memory leaks
    if (selectedFiles[index]) {
      URL.revokeObjectURL(imagePreviews[index]);
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []);

  const onFormSubmit = async (data) => {
    try {
      if (selectedFiles.length === 0 && !data.imageUrl && !product?.imageUrl) {
        // Removed toast message for image requirement
        return;
      }

      const productData = {
        ...data,
        sizes,
        price: parseFloat(data.price),
        originalPrice: parseFloat(data.originalPrice) || 0,
        stockQuantity: parseInt(data.stockQuantity) || 0,
        discountPercentage: parseFloat(data.discountPercentage) || 0,
      };

      const formData = new FormData();
      // Append files in reverse order to maintain the order of newly added images first
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });
      
      // Add existing image URLs to maintain their order
      if (imagePreviews.length > selectedFiles.length) {
        const existingImages = imagePreviews.slice(selectedFiles.length);
        formData.append('existingImages', JSON.stringify(existingImages));
      }
      
      // Format data differently for create vs update
      if (product) {
        formData.append('updates', JSON.stringify(productData));
      } else {
        formData.append('product', JSON.stringify(productData));
      }

      const apiUrl = product
        ? `http://localhost:5000/api/products/${product._id}`
        : "http://localhost:5000/api/products";
      const method = product ? "PUT" : "POST";

      const response = await fetch(apiUrl, {
        method,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save product');
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: result.message || "Product saved successfully!",
        className: "bg-white border-green-500 text-green-500",
      });

      reset();
      setValue("sizes", [{ size: "", quantity: 0 }]);
      setSelectedFiles([]);
      setImagePreviews([]);
      onSubmit();
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.error || "Something went wrong",
        variant: "destructive",
        className: "bg-white border-red-500 text-red-500",
      });
    }
  };

  return (
    
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Input placeholder="Product Name" {...register("name")} />
      {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

      <Textarea placeholder="Description" {...register("description")} />
      {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}

      <Input placeholder="Brand" {...register("brand")} />
      {errors.brand && <p className="text-red-500 text-sm">{errors.brand.message}</p>}

      <select {...register("category")} className="w-full p-2 border rounded-md">
        <option value="">Select Category</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {category.name}
          </option>
        ))}
      </select>
      {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}

      <Input placeholder="SKU" {...register("sku")} />
      {errors.sku && <p className="text-red-500 text-sm">{errors.sku.message}</p>}

      <select {...register("gender")} className="w-full p-2 border rounded-md">
        <option value="">Select Gender</option>
        <option value="Men">Men</option>
        <option value="Women">Women</option>
        <option value="Unisex">Unisex</option>
      </select>
      {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message}</p>}
      
      <Input type="number" placeholder="Stock Quantity" {...register("stockQuantity")} />
      <Input type="number" placeholder="Price" {...register("price")} />
      <Input type="number" placeholder="Original Price" {...register("originalPrice")} />
      <Input type="number" placeholder="Discount %" {...register("discountPercentage")} />

      <label className="block font-medium">Size Type</label>
      <select {...register("sizeType")} className="w-full p-2 border rounded-md">
        <option value="standard">Standard</option>
        <option value="waist">Waist</option>
      </select>

      <label className="block font-medium mt-4">Sizes</label>
      {sizes.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <Input
            {...register(`sizes.${i}.size`, { required: "Size is required" })}
            value={entry.size}
            onChange={(e) => updateSize(i, "size", e.target.value)}
          />
          <Input
            type="number"
            {...register(`sizes.${i}.quantity`, { required: "Quantity is required" })}
            value={entry.quantity}
            onChange={(e) => updateSize(i, "quantity", e.target.value)}
          />
          <Button type="button" onClick={() => removeSize(i)}>Remove</Button>
        </div>
      ))}
      <Button type="button" onClick={addSize}>Add Size</Button>

      <input type="checkbox" {...register("isNewArrival")} />
      <label>New Arrival</label>

      <div className="space-y-4">
        <label className="block font-medium">Product Images</label>
        <Input 
          type="file" 
          onChange={handleImageUpload} 
          accept="image/jpeg,image/png,image/gif"
          multiple
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img 
                src={preview} 
                alt={`Preview ${index + 1}`} 
                className="w-full h-32 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit">Save Product</Button>
    </form>
  );
};

export default AddProductForm;


