import { getAuthHeaders, handleApiResponse } from '@/utils/api-helpers';

const API_BASE_URL = 'http://localhost:5000/api';

const getCurrentUserId = () => {
  const userData = localStorage.getItem('user');
  if (!userData) throw new Error('User not authenticated');
  
  try {
    const user = JSON.parse(userData);
    if (!user || !user._id) throw new Error('Invalid user data');
    return user._id;
  } catch (error) {
    throw new Error('Failed to parse user data');
  }
};

export const cartApi = {
  // Get user's cart
  getCart: async () => {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Add item to cart
  addToCart: async (productId, quantity, size, sizeType) => {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE_URL}/cart/${userId}/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, quantity, size, sizeType })
    });
    return handleApiResponse(response);
  },

  // Update cart item quantity
  updateQuantity: async (productId, quantity, size, sizeType) => {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE_URL}/cart/${userId}/items/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity, size, sizeType })
    });
    return handleApiResponse(response);
  },

  // Remove item from cart
  removeFromCart: async (productId, size, sizeType) => {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE_URL}/cart/${userId}/items/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ size, sizeType })
    });
    return handleApiResponse(response);
  },

  // Clear cart
  clearCart: async () => {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  }
};