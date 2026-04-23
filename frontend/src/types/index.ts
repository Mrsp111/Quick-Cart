
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  category: string;
  imageUrl: string;
  colors?: string[];
  sizes?: string[];
  stock?: number;
  sku?: string;
  brand?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  checked?: boolean; // New property to track checkbox state
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UploadedImage {
  url: string;
  file: File;
  id: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}
