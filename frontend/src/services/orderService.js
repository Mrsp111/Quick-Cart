import axios from 'axios';

const API_URL = 'http://localhost:5000/api/orders';

export const getOrderById = async (orderId) => {
  try {
    const response = await axios.get(`${API_URL}/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};