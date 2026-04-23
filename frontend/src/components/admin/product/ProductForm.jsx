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
  // ✅ FIX: Each image slot tracks its type, preview URL, file (if new), and server path (if existing)
  // Shape of each slot:
  // ✅ REPLACE WITH THIS
const [imageSlots, setImageSlots] = useState(() => {
  if (!product) return [];
  const images = product.images?.length > 0
    ? product.images
    : product.imageUrl ? [product.imageUrl] : [];

  return images.map(img => ({
    type: 'existing',
    preview: img.startsWith('http') ? img : `http://localhost:5000${img}`,
    serverPath: img.startsWith('http') ? img.replace('http://localhost:5000', '') : img,
  }));
});
  // { type: 'existing', preview: 'http://...', serverPath: '/uploads/...' }
  // { type: 'new',      preview: 'blob:...',   file: File }
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      sizeType: "standard",
      isNewArrival: false,
      sizes: [{ size: "", quantity: 0 }],
    },
  });

  const sizes = watch("sizes", []);

  const addSize = () => setValue("sizes", [...sizes, { size: "", quantity: 0 }]);

  const updateSize = (index, field, value) => {
    const updatedSizes = [...sizes];
    updatedSizes[index][field] = field === "quantity" ? parseInt(value) || 0 : value;
    setValue("sizes", updatedSizes);
  };

  const removeSize = (index) => setValue("sizes", sizes.filter((_, i) => i !== index));

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);

    const invalidFiles = files.filter(f => !['image/jpeg', 'image/png', 'image/gif'].includes(f.type));
    if (invalidFiles.length > 0) {
      toast({ title: "Error", description: "Only JPEG, PNG, and GIF are allowed.", variant: "destructive" });
      return;
    }

    const largeFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      toast({ title: "Error", description: "Some images exceed 5MB size limit", variant: "destructive" });
      return;
    }

    // ✅ FIX: Each new file gets its own slot with type 'new'
    const newSlots = files.map(file => ({
      type: 'new',
      preview: URL.createObjectURL(file),
      file,
    }));

    setImageSlots(prev => [...prev, ...newSlots]);
  };

  const removeImage = (index) => {
    setImageSlots(prev => {
      const slot = prev[index];
      // ✅ FIX: Only revoke blob URLs for new files, not existing server image URLs
      if (slot.type === 'new') {
        URL.revokeObjectURL(slot.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imageSlots.forEach(slot => {
        if (slot.type === 'new') URL.revokeObjectURL(slot.preview);
      });
    };
  }, []);

  const onFormSubmit = async (data) => {
    try {
      if (imageSlots.length === 0 && !product?.imageUrl) {
        toast({ title: "Error", description: "At least one image is required", variant: "destructive" });
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

      // ✅ FIX: Separate slots by type cleanly
      const newFiles = imageSlots.filter(s => s.type === 'new').map(s => s.file);
      const existingServerPaths = imageSlots.filter(s => s.type === 'existing').map(s => s.serverPath);

      // Append new image files
      newFiles.forEach(file => formData.append('images', file));

      // ✅ FIX: existingImages is now ONLY the remaining server paths (removals already applied)
      formData.append('existingImages', JSON.stringify(existingServerPaths));

      if (product) {
        formData.append('updates', JSON.stringify(productData));
      } else {
        formData.append('product', JSON.stringify(productData));
      }

      const apiUrl = product
        ? `http://localhost:5000/api/products/${product._id}`
        : "http://localhost:5000/api/products";
      const method = product ? "PUT" : "POST";

      const response = await fetch(apiUrl, { method, body: formData });

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
      setImageSlots([]);
      onSubmit();
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
        className: "bg-white border-red-500 text-red-500",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Input placeholder="Product Name" {...register("name")} />
      {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}

      <Textarea placeholder="Description" {...register("description")} />
      {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}

      <Input placeholder="Brand" {...register("brand")} />
      {errors.brand && <p className="text-sm text-red-500">{errors.brand.message}</p>}

      <select {...register("category")} className="w-full p-2 border rounded-md">
        <option value="">Select Category</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>{category.name}</option>
        ))}
      </select>
      {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}

      <Input placeholder="SKU" {...register("sku")} />
      {errors.sku && <p className="text-sm text-red-500">{errors.sku.message}</p>}

      <select {...register("gender")} className="w-full p-2 border rounded-md">
        <option value="">Select Gender</option>
        <option value="Men">Men</option>
        <option value="Women">Women</option>
        <option value="Unisex">Unisex</option>
      </select>
      {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}

      <Input type="number" placeholder="Stock Quantity" {...register("stockQuantity")} />
      <Input type="number" placeholder="Price" {...register("price")} />
      <Input type="number" placeholder="Original Price" {...register("originalPrice")} />
      <Input type="number" placeholder="Discount %" {...register("discountPercentage")} />

      <label className="block font-medium">Size Type</label>
      <select {...register("sizeType")} className="w-full p-2 border rounded-md">
        <option value="standard">Standard</option>
        <option value="waist">Waist</option>
      </select>

      <label className="block mt-4 font-medium">Sizes</label>
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
        <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
          {imageSlots.map((slot, index) => (
            <div key={index} className="relative group">
              <img
                src={slot.preview}
                alt={`Preview ${index + 1}`}
                className="object-cover w-full h-32 rounded-md"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-2 right-2 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
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