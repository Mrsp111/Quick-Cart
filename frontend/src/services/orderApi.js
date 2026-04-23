import { getAuthHeaders, handleApiResponse } from '@/utils/api-helpers';

const API_BASE_URL = 'http://localhost:5000/api';

const getCurrentUser = () => {
  const userData = localStorage.getItem('user');
  if (!userData) throw new Error('User not authenticated');
  
  try {
    const user = JSON.parse(userData);
    if (!user || !user._id || !user.email) throw new Error('Invalid user data');
    return user;
  } catch (error) {
    console.error('Error parsing user data:', error);
    throw new Error('Failed to parse user data');
  }
};

export const orderApi = {
  // Create a new order
  createOrder: async (orderData) => {
    const user = getCurrentUser();
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...orderData, userId: user._id, userEmail: user.email })
    });
    return handleApiResponse(response);
  },

  // Create Stripe Checkout Session for online payments
  createCheckoutSession: async (orderData) => {
    const user = getCurrentUser();
    const response = await fetch(`${API_BASE_URL}/payments/create-checkout-session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...orderData, userId: user._id, userEmail: user.email })
    });
    return handleApiResponse(response);
  },

  // Confirm Stripe session after redirect from success URL
  confirmStripeSession: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/payments/confirm-session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId })
    });
    return handleApiResponse(response);
  },

  // Get all orders for the current user
  getUserOrders: async () => {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  },

  // Get a specific order by ID
  getOrderById: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  }
};