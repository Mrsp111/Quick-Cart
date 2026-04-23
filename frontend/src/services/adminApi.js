import { getAuthHeaders, handleApiResponse } from '@/utils/api-helpers';

const API_BASE_URL = 'http://localhost:5000/api';

export const adminApi = {
  // Get all orders with pagination
  getAllOrders: async (page = 1, limit = 10, status = '') => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (status) queryParams.append('status', status);
    
    const response = await fetch(`${API_BASE_URL}/orders?${queryParams.toString()}`, {
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
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleApiResponse(response);
  },

  // Delete an order
  deleteOrder: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleApiResponse(response);
  }
};