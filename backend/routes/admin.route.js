const express = require('express');
const router = express.Router();
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/register.model');

// Get dashboard statistics
router.get('/dashboard-stats', async (req, res) => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments();

        // Get total orders and delivered orders count
        const totalOrders = await Order.countDocuments();
        const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });

        // Get total products count
        const totalProducts = await Product.countDocuments();

        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ orderDate: -1 })
            .limit(5)
            .populate('shippingInfo')
            .lean();

        const formattedRecentOrders = recentOrders.map(order => ({
            id: order._id,
            product: order.items?.[0]?.name || 'Unknown Product',
            date: new Date(order.orderDate).toLocaleDateString(),
            customer: order.shippingInfo?.fullName || 'Unknown Customer',
            status: order.status,
            amount: `₹${order.orderTotal?.toFixed(2) || '0.00'}`
        }));

        res.json({
            totalUsers,
            totalOrders,
            totalProducts,
            deliveredOrders,
            recentOrders: formattedRecentOrders
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

module.exports = router;