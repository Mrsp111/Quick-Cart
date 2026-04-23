import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import multer from "multer";
import fs from "fs";
import crypto from 'crypto';
import Stripe from "stripe";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import QuickcartModel from "./models/register.model.js";
import AdminModel from "./models/admin.model.js";
import ProductModel from "./models/product.model.js";
import CategoryModel from "./models/category.model.js";
import { ContactModel } from "./models/contact.model.js";
import CartModel from "./models/cart.model.js";
import OrderModel from "./models/order.model.js";
import PaymentSessionModel from "./models/paymentSession.model.js";
import { sendPasswordResetEmail, sendOrderConfirmationEmail } from './utils/emailService.js';
// Get directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");

try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
        console.log(`Created uploads directory at: ${uploadsDir}`);
    } else {
        // Verify write permissions
        fs.accessSync(uploadsDir, fs.constants.W_OK);
    }
} catch (error) {
    console.error(`Error managing uploads directory: ${error.message}`);
    if (error.code === 'EACCES') {
        console.error('Permission denied: Unable to create or access uploads directory');
    } else if (error.code === 'ENOSPC') {
        console.error('No space left on device for creating uploads directory');
    }
    process.exit(1);
}

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });
const app = express();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:8081";
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
const WEBHOOK_PATH = '/api/stripe/webhook';

const maskValue = (value, visibleLength = 8) => {
    if (!value) return 'missing';
    const str = String(value);
    if (str.length <= visibleLength) return str;
    return `${str.slice(0, visibleLength)}...`;
};

const toSafeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toMinorUnit = (value) => Math.round(toSafeNumber(value) * 100);

// Middleware
app.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.startsWith(WEBHOOK_PATH)) {
            req.rawBody = buf;
        }
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        // Get total users count
        const totalUsers = await QuickcartModel.countDocuments();

        // Get total orders count
        const totalOrders = await OrderModel.countDocuments();

        // Get total products count
        const totalProducts = await ProductModel.countDocuments();

        // Get delivered orders count
        const deliveredOrders = await OrderModel.countDocuments({ status: 'delivered' });

        res.json({
            totalUsers,
            totalOrders,
            totalProducts,
            deliveredOrders
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});


// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        // Ensure unique filenames by appending a random string
        const uniqueSuffix = crypto.randomBytes(4).toString('hex');
        cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (!allowedTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
            const error = new Error('Only JPG/JPEG/PNG images are allowed!');
            error.code = 'INVALID_FILE_TYPE';
            return cb(error, false);
        }
        cb(null, true);
    }
});

// Multer error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size is too large. Max size is 5MB.' });
        }
        return res.status(400).json({ error: error.message });
    } else if (error) {
        if (error.code === 'INVALID_FILE_TYPE') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Something went wrong with file upload.' });
    }
    next();
});

// Connect to Database
connectDB();

const requiredShippingFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];

const normalizeOrderItems = (items = []) => {
    if (!Array.isArray(items)) return [];

    return items
        .map((item) => ({
            productId: item.productId,
            size: item.size || 'M',
            sizeType: item.sizeType || 'standard',
            quantity: Number(item.quantity || 0)
        }))
        .filter((item) => item.productId && item.size && item.sizeType && item.quantity > 0);
};

const hasAllShippingFields = (shippingInfo = {}) => {
    return requiredShippingFields.every((field) => Boolean(shippingInfo[field]));
};

const buildOrderItemsFromProducts = async (items) => {
    return Promise.all(items.map(async (item) => {
        const product = await ProductModel.findById(item.productId);
        if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
        }

        return {
            productId: item.productId,
            name: product.name,
            price: product.price,
            size: item.size,
            sizeType: item.sizeType,
            quantity: item.quantity,
            imageUrl: product.imageUrl
        };
    }));
};

const syncPaidOrderState = async (order, stripeSessionId) => {
    let updated = false;

    if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        updated = true;
    }

    // For online payments, move order from pending to processing after confirmed payment.
    if (order.status === 'pending') {
        order.status = 'processing';
        updated = true;
    }

    if (!order.stripeSessionId) {
        order.stripeSessionId = stripeSessionId;
        updated = true;
    }

    if (updated) {
        await order.save();
        console.log('[StripeFinalize] Updated existing order state to paid/processing', {
            stripeSessionId,
            orderId: order._id,
            paymentStatus: order.paymentStatus,
            status: order.status
        });
    }

    return order;
};

async function finalizeOnlineOrder(stripeSessionId, fallbackEmail = null) {
    console.log('[StripeFinalize] Attempting order finalization', {
        stripeSessionId,
        hasFallbackEmail: Boolean(fallbackEmail)
    });

    const paymentSession = await PaymentSessionModel.findOne({ stripeSessionId });
    if (!paymentSession) {
        console.error('[StripeFinalize] No payment session found for Stripe session', { stripeSessionId });
        throw new Error('Payment session not found');
    }

    if (paymentSession.orderCreated && paymentSession.orderId) {
        const existingOrderBySession = await OrderModel.findById(paymentSession.orderId);
        if (existingOrderBySession) {
            await syncPaidOrderState(existingOrderBySession, stripeSessionId);
            console.log('[StripeFinalize] Reusing previously created order', {
                stripeSessionId,
                orderId: existingOrderBySession._id
            });
            return existingOrderBySession;
        }
    }

    const existingOrder = await OrderModel.findOne({ stripeSessionId });
    if (existingOrder) {
        await syncPaidOrderState(existingOrder, stripeSessionId);
        await PaymentSessionModel.findOneAndUpdate(
            { stripeSessionId },
            { orderCreated: true, orderId: existingOrder._id, paymentStatus: 'paid' }
        );

        console.log('[StripeFinalize] Found existing order by Stripe session ID', {
            stripeSessionId,
            orderId: existingOrder._id
        });

        return existingOrder;
    }

    const orderItems = await buildOrderItemsFromProducts(paymentSession.items);

    const order = new OrderModel({
        userId: paymentSession.userId,
        items: orderItems,
        shippingInfo: paymentSession.shippingInfo,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        stripeSessionId,
        subtotal: paymentSession.subtotal,
        deliveryFee: paymentSession.deliveryFee,
        orderTotal: paymentSession.orderTotal,
        orderDate: new Date(),
        status: 'processing'
    });

    try {
        await order.save();
        console.log('[StripeFinalize] Created new order from Stripe session', {
            stripeSessionId,
            orderId: order._id
        });
    } catch (error) {
        if (error?.code === 11000) {
            const duplicateOrder = await OrderModel.findOne({ stripeSessionId });
            if (duplicateOrder) {
                await PaymentSessionModel.findOneAndUpdate(
                    { stripeSessionId },
                    { orderCreated: true, orderId: duplicateOrder._id, paymentStatus: 'paid' }
                );

                console.log('[StripeFinalize] Duplicate key handled, reused existing order', {
                    stripeSessionId,
                    orderId: duplicateOrder._id
                });

                return duplicateOrder;
            }
        }

        console.error('[StripeFinalize] Failed to save order', {
            stripeSessionId,
            message: error.message
        });
        throw error;
    }

    await CartModel.findOneAndUpdate(
        { userId: paymentSession.userId },
        { items: [], updatedAt: new Date() }
    );

    console.log('[StripeFinalize] Cleared user cart after successful payment', {
        stripeSessionId,
        userId: paymentSession.userId
    });

    const emailTo = paymentSession.shippingInfo?.email || paymentSession.userEmail || fallbackEmail;

    await PaymentSessionModel.findOneAndUpdate(
        { stripeSessionId },
        {
            orderCreated: true,
            orderId: order._id,
            paymentStatus: 'paid'
        }
    );

    console.log('[StripeFinalize] Marked payment session as paid and linked order', {
        stripeSessionId,
        orderId: order._id
    });

    return order;
}

app.post('/api/stripe/webhook', async (req, res) => {
    const requestId = crypto.randomUUID();
    console.log('[StripeWebhook] Incoming webhook request', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        hasSignatureHeader: Boolean(req.headers['stripe-signature']),
        rawBodyLength: req.rawBody?.length || 0,
        userAgent: req.headers['user-agent'] || 'unknown'
    });

    if (!stripe) {
        console.error('[StripeWebhook] Stripe client is not configured', { requestId });
        return res.status(500).send('Stripe is not configured');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('[StripeWebhook] STRIPE_WEBHOOK_SECRET is missing', { requestId });
        return res.status(500).send('Stripe webhook secret is not configured');
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
        console.error('[StripeWebhook] Missing stripe-signature header', { requestId });
        return res.status(400).send('Missing Stripe signature');
    }

    if (!req.rawBody) {
        console.error('[StripeWebhook] Raw body is missing. Signature verification will fail.', { requestId });
        return res.status(400).send('Missing raw body for signature verification');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('[StripeWebhook] Signature verified', {
            requestId,
            eventId: event.id,
            eventType: event.type,
            livemode: event.livemode
        });
    } catch (error) {
        console.error('[StripeWebhook] Signature verification failed', {
            requestId,
            message: error.message,
            webhookSecretPrefix: maskValue(process.env.STRIPE_WEBHOOK_SECRET)
        });
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
            const session = event.data.object;
            console.log('[StripeWebhook] Checkout session payment event received', {
                requestId,
                eventType: event.type,
                sessionId: session.id,
                paymentStatus: session.payment_status,
                customerEmail: session.customer_email || session.customer_details?.email || null
            });

            if (session.payment_status === 'paid') {
                const order = await finalizeOnlineOrder(session.id, session.customer_email || session.customer_details?.email || null);
                console.log('[StripeWebhook] Order finalized from checkout.session event', {
                    requestId,
                    eventType: event.type,
                    sessionId: session.id,
                    orderId: order?._id || null
                });
            } else {
                console.warn('[StripeWebhook] Checkout session payment event received but payment is not paid', {
                    requestId,
                    eventType: event.type,
                    sessionId: session.id,
                    paymentStatus: session.payment_status
                });
            }
        }

        if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
            const session = event.data.object;
            const paymentStatus = event.type === 'checkout.session.expired' ? 'cancelled' : 'failed';
            await PaymentSessionModel.findOneAndUpdate(
                { stripeSessionId: session.id },
                { paymentStatus }
            );

            console.log('[StripeWebhook] Updated payment session state from checkout.session failure/expiry event', {
                requestId,
                eventType: event.type,
                sessionId: session.id,
                paymentStatus
            });
        }

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const sessions = await stripe.checkout.sessions.list({
                payment_intent: paymentIntent.id,
                limit: 1
            });

            const matchedSession = sessions.data?.[0];

            if (matchedSession) {
                console.log('[StripeWebhook] Matched payment_intent.succeeded to checkout session', {
                    requestId,
                    paymentIntentId: paymentIntent.id,
                    sessionId: matchedSession.id
                });

                const order = await finalizeOnlineOrder(
                    matchedSession.id,
                    matchedSession.customer_email || matchedSession.customer_details?.email || null
                );

                console.log('[StripeWebhook] Order finalized from payment_intent.succeeded', {
                    requestId,
                    paymentIntentId: paymentIntent.id,
                    sessionId: matchedSession.id,
                    orderId: order?._id || null
                });
            } else {
                console.warn('[StripeWebhook] payment_intent.succeeded received but no checkout session matched', {
                    requestId,
                    paymentIntentId: paymentIntent.id
                });
            }
        }

        if (event.type !== 'checkout.session.completed'
            && event.type !== 'checkout.session.async_payment_succeeded'
            && event.type !== 'checkout.session.expired'
            && event.type !== 'checkout.session.async_payment_failed'
            && event.type !== 'payment_intent.succeeded') {
            console.log('[StripeWebhook] Event received and ignored (not handled in app)', {
                requestId,
                eventType: event.type
            });
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('[StripeWebhook] Processing error', {
            requestId,
            eventType: event?.type,
            message: error.message,
            stack: error.stack
        });
        return res.status(500).json({ error: 'Failed to process webhook event' });
    }
});

// Contact Endpoints
app.post('/api/contact', async (req, res) => {
  try {
    const contact = new ContactModel(req.body);
    await contact.save();
    res.status(201).json({ message: 'Contact form submitted successfully', contact });
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

app.get('/api/contact', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const [contacts, total] = await Promise.all([
      ContactModel.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ContactModel.countDocuments(searchQuery)
    ]);

    const pages = Math.ceil(total / limit);

    res.json({
      contacts,
      pagination: {
        total,
        pages,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.delete('/api/contact/:id', async (req, res) => {
  try {
    const contact = await ContactModel.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Cart Endpoints
// Get user's cart
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const cart = await CartModel.findOne({ userId: req.params.userId });
    res.json(cart || { userId: req.params.userId, items: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart', details: error.message });
  }
});

// Add item to cart
app.post('/api/cart/:userId/items', async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    if (!productId || !size || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const sizeObj = product.sizes.find(s => s.size === size);
    if (!sizeObj) {
      return res.status(400).json({ error: 'Invalid size' });
    }

    if (sizeObj.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough stock' });
    }

    let cart = await CartModel.findOne({ userId: req.params.userId });
    if (!cart) {
      cart = new CartModel({ userId: req.params.userId, items: [] });
    }

    const existingItem = cart.items.find(item => 
      item.productId === productId && item.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        size,
        sizeType: product.sizeType,
        quantity
      });
    }

    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart', details: error.message });
  }
});

// Update cart item quantity
app.put('/api/cart/:userId/items/:productId', async (req, res) => {
  try {
    const { quantity, size } = req.body;
    if (!quantity || !size) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cart = await CartModel.findOne({ userId: req.params.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.find(item => 
      item.productId === req.params.productId && item.size === size
    );
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    const product = await ProductModel.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const sizeObj = product.sizes.find(s => s.size === size);
    if (!sizeObj || sizeObj.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough stock' });
    }

    item.quantity = quantity;
    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart item', details: error.message });
  }
});

// Remove item from cart
app.delete('/api/cart/:userId/items/:productId', async (req, res) => {
  try {
    const { size } = req.body;
    if (!size) {
      return res.status(400).json({ error: 'Size is required' });
    }

    const cart = await CartModel.findOne({ userId: req.params.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => 
      !(item.productId === req.params.productId && item.size === size)
    );
    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item from cart', details: error.message });
  }
});

// Clear cart
app.delete('/api/cart/:userId', async (req, res) => {
  try {
    const cart = await CartModel.findOne({ userId: req.params.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart', details: error.message });
  }
});


/// --- PRODUCT ENDPOINTS ---
// Get all products with optional filtering, sorting, and pagination
app.get("/api/products", async (req, res) => {
    try {
        const { category, brand, gender, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', isNewArrival } = req.query;
        
        const filter = {};
        if (isNewArrival === 'true') filter.isNewArrival = true;
        if (category) filter.category = category;
        if (brand) filter.brand = brand;
        if (gender) filter.gender = gender;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const products = await ProductModel.find(filter).sort(sort);
        
        res.json({ products });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products", details: error.message });
    }
});

// Create a new product
app.post("/api/products", upload.array("images", 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json;

        const productData = JSON.parse(req.body.product);
        productData.isNewArrival = productData.isNewArrival || false;

        // Create array of image paths
        const imagePaths = req.files.map(file => `/uploads/${file.filename}`);

        const product = new ProductModel({
            name: productData.name,
            price: Number(productData.price),
            description: productData.description,
            category: productData.category,
            brand: productData.brand,
            sku: productData.sku,
            gender: productData.gender,
            stockQuantity: Number(productData.stockQuantity) || 0,
            originalPrice: Number(productData.originalPrice) || productData.price,
            discountPercentage: Number(productData.discountPercentage) || 0,
            sizeType: productData.sizeType || "standard",
            sizes: Array.isArray(productData.sizes) ? productData.sizes : [],
            images: imagePaths,
            imageUrl: imagePaths[0], // Set first image as main imageUrl for backward compatibility
            isNewArrival: productData.isNewArrival
        });

        await product.save();
        res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to create product", details: error.message });
    }
});

// Get product by ID
app.get("/api/products/:id", async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch product", details: error.message });
    }
});

// Update product
app.put("/api/products/:id", upload.array("images", 5), async (req, res) => {
    try {
        if (!req.body.updates) {
            return res.status(400).json({ error: "Updates data is required" });
        }

        let updates;
        try {
            updates = JSON.parse(req.body.updates);
        } catch (error) {
            return res.status(400).json({ error: "Invalid updates format", details: error.message });
        }

        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // Handle multiple image uploads
        if (req.files && req.files.length > 0) {
            // Create array of new image paths
            const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
            
            // Handle existing images from the frontend
            let existingImages = [];
            if (req.body.existingImages) {
                try {
                    existingImages = JSON.parse(req.body.existingImages);
                } catch (err) {
                    console.error('Error parsing existing images:', err);
                }
            }
            
            // If replacing all images
            if (updates.replaceAllImages) {
                // Delete old images if they exist
                if (product.images && product.images.length > 0) {
                    product.images.forEach(imagePath => {
                        const oldImagePath = path.join(__dirname, imagePath);
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    });
                }
                updates.images = newImagePaths;
            } else {
                // Add new images to the beginning, followed by existing images
                updates.images = [...newImagePaths, ...existingImages];
            }
            
            // Update main imageUrl for backward compatibility
            updates.imageUrl = updates.images[0];
        }

        // Ensure sizeType and sizes are handled
        product.sizeType = updates.sizeType || product.sizeType;
        product.sizes = Array.isArray(updates.sizes) ? updates.sizes : product.sizes;

        Object.assign(product, updates);
        await product.save();

        res.json({ message: "Product updated successfully", product });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product", details: error.message });
    }
});
// Delete product
app.delete("/api/products/:id", async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        
        // Delete all images associated with the product
        if (product.images && product.images.length > 0) {
            product.images.forEach(imagePath => {
                try {
                    const fullPath = path.join(__dirname, imagePath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                } catch (err) {
                    console.error(`Error deleting image ${imagePath}:`, err);
                }
            });
        } else if (product.imageUrl) {
            // Fallback for backward compatibility
            try {
                const fullPath = path.join(__dirname, product.imageUrl);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (err) {
                console.error(`Error deleting image ${product.imageUrl}:`, err);
            }
        }
        
        await product.deleteOne();
        
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete product", details: error.message });
    }
});


// --- CONTACT US FORM SUBMISSION ---
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const contact = new ContactModel({ name, email, subject, message });
        await contact.save();
        res.status(201).json({ message: "Your message has been received" });
    } catch (error) {
        res.status(500).json({ error: "Failed to submit message", details: error.message });
    }
});

// --- ORDER STATUS UPDATE ---
app.put('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const order = await OrderModel.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Validate status transition
        const currentStatus = order.status;
        const isValidTransition = (
            // Allow any transition from pending
            currentStatus === 'pending' ||
            // Allow processing to shipped/cancelled
            (currentStatus === 'processing' && ['shipped', 'cancelled'].includes(status)) ||
            // Allow shipped to delivered/cancelled
            (currentStatus === 'shipped' && ['delivered', 'cancelled'].includes(status)) ||
            // Don't allow changes after delivered or cancelled
            (currentStatus === 'delivered' && status === 'delivered') ||
            (currentStatus === 'cancelled' && status === 'cancelled')
        );

        if (!isValidTransition) {
            return res.status(400).json({
                error: `Invalid status transition from ${currentStatus} to ${status}`
            });
        }

        order.status = status;
        await order.save();

        res.json({
            message: 'Order status updated successfully',
            order: {
                id: order._id,
                status: order.status,
                updatedAt: order.updatedAt
            }
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status', details: error.message });
    }
});

// --- USER REGISTRATION ---
app.post("/api/register", async (req, res) => {
    try {
        const { firstName, lastName, phone, address, email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });
        const existingUser = await QuickcartModel.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already registered" });
        const user = await QuickcartModel.create({ firstName, lastName, phone, address, email, password });
        res.status(201).json({ message: "Registration successful", user });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Failed to register user", details: err.message });
    }
});

// --- LOGIN ---
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await QuickcartModel.findOne({ email });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
        
        res.json({ message: "Login successful", user });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Failed to login", details: err.message });
    }
});

// --- FORGOT PASSWORD ---
app.post("/api/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });
        
        // Check if user exists
        const user = await QuickcartModel.findOne({ email });
        if (!user) {
            // For security reasons, don't reveal that the email doesn't exist
            return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
        }
        
        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
        
        // Save the token to the user record
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();
        
        // Send the password reset email
        const emailResult = await sendPasswordResetEmail(email, resetToken);
        
        if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            return res.status(500).json({ error: "Error sending reset link. Please try again." });
        }
        
        // In development mode, return the preview URL so the user can view the test email
        // In production, this would be removed and emails would be sent directly
        if (process.env.NODE_ENV !== 'production' && emailResult.previewUrl) {
            return res.status(200).json({ 
                message: "Password reset instructions sent to your email", 
                note: "Since this is a test environment, the email is not actually sent. Please use the preview URL below to view the email:",
                previewUrl: emailResult.previewUrl 
            });
        }
        
        res.status(200).json({ message: "Password reset instructions sent to your email" });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Failed to process password reset request", details: error.message });
    }
});

// --- RESET PASSWORD ---
app.post("/api/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token and new password are required" });
        }
        
        // Find user with the given token and valid expiry
        const user = await QuickcartModel.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }
        
        // Update the user's password
        user.password = newPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();
        
        res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Failed to reset password", details: error.message });
    }
});
//admin.login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await AdminModel.findOne({ email, password });
        if (!admin) return res.status(401).json({ error: 'Invalid admin credentials' });
        res.json({ message: 'Admin login successful', admin: { id: admin._id, email: admin.email }, token: 'admin_token' });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// --- CATEGORY MANAGEMENT ---
app.post("/api/categories", async (req, res) => {
    try {
        let { name } = req.body;
        if (!name) return res.status(400).json({ error: "Category name is required" });
        name = name.trim().toLowerCase();
        const existingCategory = await CategoryModel.findOne({ name });
        if (existingCategory) return res.status(400).json({ error: "Category already exists" });
        const category = await CategoryModel.create({ name });
        res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category", details: error.message });
    }
});

app.get("/api/categories", async (req, res) => {
    try {
        const categories = await CategoryModel.find({ isActive: true });
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories", details: error.message });
    }
});

// --- IMAGE UPLOAD ---
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ message: 'Image uploaded successfully', imageUrl });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

app.delete("/api/categories/:id", async (req, res) => {
    try {
        // Check if any products reference this category
        const productsWithCategory = await ProductModel.findOne({ category: req.params.id });
        if (productsWithCategory) {
            return res.status(400).json({ 
                error: "Cannot delete category - it is being used by one or more products" 
            });
        }
        
        const category = await CategoryModel.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ error: "Category not found" });
        
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Failed to delete category", details: error.message });
    }
});

app.put("/api/categories/:id", async (req, res) => {
    try {
        let { name } = req.body;
        if (!name) return res.status(400).json({ error: "Category name is required" });
        
        name = name.trim().toLowerCase();
        const category = await CategoryModel.findById(req.params.id);
        if (!category) return res.status(404).json({ error: "Category not found" });
        
        const existingCategory = await CategoryModel.findOne({ name, _id: { $ne: req.params.id } });
        if (existingCategory) return res.status(400).json({ error: "Category name already exists" });
        
        category.name = name;
        await category.save();
        
        res.json({ message: "Category updated successfully", category });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ error: "Failed to update category", details: error.message });
    }
});

app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const contact = new ContactModel({ name, email, subject, message });
        await contact.save();
        res.status(201).json({ message: "Contact form submitted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to submit contact form", details: error.message });
    }
});

// Get product by ID
app.get("/api/products/:id", async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ error: "Failed to fetch product", details: error.message });
    }
});

// Toggle checked status for a product
app.put("/api/products/:id/toggle", async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        product.checked = !product.checked;
        await product.save();
        res.json(product);
    } catch (error) {
        console.error("Error toggling product status:", error);
        res.status(500).json({ error: "Failed to toggle product status", details: error.message });
    }
});

// Get all checked products
app.get("/api/products/checked", async (req, res) => {
    try {
        const products = await ProductModel.find({ checked: true });
        res.json(products);
    } catch (error) {
        console.error("Error fetching checked products:", error);
        res.status(500).json({ error: "Failed to fetch checked products", details: error.message });
    }
});

// Update product
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
    try {
        if (!req.body.updates) {
            return res.status(400).json({ error: "Updates data is required" });
        }
        let updates;
        try {
            updates = JSON.parse(req.body.updates);
        } catch (error) {
            return res.status(400).json({ error: "Invalid updates format", details: error.message });
        }
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        if (req.file) {
            updates.imageUrl = `/uploads/${req.file.filename}`;
            // Delete old image if it exists
            if (product.imageUrl) {
                const oldImagePath = path.join(__dirname, product.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        Object.assign(product, updates);
        await product.save();
        res.json({ message: "Product updated successfully", product });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product", details: error.message });
    }
});

// Delete product
app.delete("/api/products/:id", async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // Delete associated image if it exists
        if (product.imageUrl) {
            const imagePath = path.join(__dirname, product.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await product.deleteOne();
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product", details: error.message });
    }
});

// --- CART ENDPOINTS ---
// Get cart for a user
app.get("/api/cart/:userId", async (req, res) => {
    try {
        const cart = await CartModel.findOne({ userId: req.params.userId });
        if (!cart) return res.status(404).json({ error: "Cart not found" });
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch cart", details: error.message });
    }
});

// Initialize or update cart
app.post("/api/cart/:userId", async (req, res) => {
    try {
        const { items } = req.body;
        const cart = await CartModel.findOneAndUpdate(
            { userId: req.params.userId },
            { items, updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: "Failed to update cart", details: error.message });
    }
});

// Add item to cart
app.post("/api/cart/:userId/items", async (req, res) => {
    try {
        const { productId, size, sizeType, quantity } = req.body;
        if (!productId || !size || !sizeType || !quantity) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let cart = await CartModel.findOne({ userId: req.params.userId });
        if (!cart) {
            cart = new CartModel({ userId: req.params.userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(
            item => item.productId === productId && item.size === size && item.sizeType === sizeType
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, size, sizeType, quantity });
        }

        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: "Failed to add item to cart", details: error.message });
    }
});

// Update item quantity in cart
app.put("/api/cart/:userId/items/:productId", async (req, res) => {
    try {
        const { quantity, size, sizeType } = req.body;
        if (!quantity || quantity < 0) {
            return res.status(400).json({ error: "Invalid quantity" });
        }

        const cart = await CartModel.findOne({ userId: req.params.userId });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        const itemIndex = cart.items.findIndex(
            item => item.productId === req.params.productId && item.size === size && item.sizeType === sizeType
        );

        if (itemIndex === -1) return res.status(404).json({ error: "Item not found in cart" });

        if (quantity === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }

        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: "Failed to update item quantity", details: error.message });
    }
});

// Remove item from cart
app.delete("/api/cart/:userId/items/:productId", async (req, res) => {
    try {
        const { size, sizeType } = req.body;
        const cart = await CartModel.findOne({ userId: req.params.userId });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        const itemIndex = cart.items.findIndex(
            item => item.productId === req.params.productId && item.size === size && item.sizeType === sizeType
        );

        if (itemIndex === -1) return res.status(404).json({ error: "Item not found in cart" });

        cart.items.splice(itemIndex, 1);
        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: "Failed to remove item from cart", details: error.message });
    }
});

// Clear cart
app.delete("/api/cart/:userId", async (req, res) => {
    try {
        const cart = await CartModel.findOne({ userId: req.params.userId });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        cart.items = [];
        cart.updatedAt = Date.now();
        await cart.save();
        res.json({ message: "Cart cleared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear cart", details: error.message });
    }
});

// --- STRIPE PAYMENT ENDPOINTS ---
app.post('/api/payments/create-checkout-session', async (req, res) => {
    try {
        console.log('[StripeCheckout] Create session request received', {
            hasStripeClient: Boolean(stripe),
            frontendBaseUrl: FRONTEND_BASE_URL
        });

        if (!stripe) {
            return res.status(500).json({ error: 'Stripe is not configured on the server' });
        }

        const {
            userId,
            userEmail,
            items,
            shippingInfo,
            paymentMethod,
            subtotal,
            deliveryFee,
            orderTotal
        } = req.body;

        const normalizedItems = normalizeOrderItems(items);

        if (!userId || !hasAllShippingFields(shippingInfo) || normalizedItems.length === 0) {
            console.warn('[StripeCheckout] Missing required fields', {
                userIdPresent: Boolean(userId),
                hasShippingInfo: hasAllShippingFields(shippingInfo),
                itemCount: normalizedItems.length
            });
            return res.status(400).json({ error: 'Missing required fields for checkout session' });
        }

        if (paymentMethod !== 'online') {
            return res.status(400).json({ error: 'Invalid payment method for Stripe checkout' });
        }

        const productItems = await Promise.all(normalizedItems.map(async (item) => {
            const product = await ProductModel.findById(item.productId);
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            return {
                ...item,
                name: product.name,
                price: toSafeNumber(product.price)
            };
        }));

        const computedSubtotal = productItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const normalizedDeliveryFee = Math.max(0, toSafeNumber(deliveryFee));
        const computedTotal = computedSubtotal + normalizedDeliveryFee;

        const providedSubtotal = toSafeNumber(subtotal);
        const providedTotal = toSafeNumber(orderTotal);

        if (Math.abs(computedSubtotal - providedSubtotal) > 1 || Math.abs(computedTotal - providedTotal) > 1) {
            return res.status(400).json({ error: 'Order amount mismatch. Please refresh cart and try again.' });
        }

        const lineItems = productItems.map((item) => ({
            quantity: item.quantity,
            price_data: {
                currency: 'inr',
                unit_amount: toMinorUnit(item.price),
                product_data: {
                    name: item.name
                }
            }
        }));

        if (normalizedDeliveryFee > 0) {
            lineItems.push({
                quantity: 1,
                price_data: {
                    currency: 'inr',
                    unit_amount: toMinorUnit(normalizedDeliveryFee),
                    product_data: {
                        name: 'Delivery Fee'
                    }
                }
            });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: lineItems,
            customer_email: shippingInfo.email || userEmail,
            success_url: `${FRONTEND_BASE_URL}/order-confirmation?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_BASE_URL}/checkout?payment=cancelled`,
            metadata: {
                userId
            }
        });

        console.log('[StripeCheckout] Stripe checkout session created', {
            sessionId: session.id,
            userId,
            amountSubtotal: computedSubtotal,
            amountTotal: computedTotal,
            successUrl: `${FRONTEND_BASE_URL}/order-confirmation?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${FRONTEND_BASE_URL}/checkout?payment=cancelled`
        });

        await PaymentSessionModel.findOneAndUpdate(
            { stripeSessionId: session.id },
            {
                stripeSessionId: session.id,
                userId,
                userEmail: userEmail || shippingInfo.email,
                items: normalizedItems,
                shippingInfo,
                subtotal: computedSubtotal,
                deliveryFee: normalizedDeliveryFee,
                orderTotal: computedTotal,
                paymentMethod: 'online',
                paymentStatus: 'created',
                orderCreated: false,
                orderId: null
            },
            { upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({
            message: 'Stripe checkout session created',
            sessionId: session.id,
            checkoutUrl: session.url
        });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        return res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
    }
});

app.post('/api/payments/confirm-session', async (req, res) => {
    try {
        console.log('[StripeConfirm] Confirm session request received', {
            hasStripeClient: Boolean(stripe)
        });

        if (!stripe) {
            return res.status(500).json({ error: 'Stripe is not configured on the server' });
        }

        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Stripe session not found' });
        }

        console.log('[StripeConfirm] Stripe session retrieved', {
            sessionId: session.id,
            paymentStatus: session.payment_status,
            livemode: session.livemode
        });

        if (session.payment_status !== 'paid') {
            return res.status(400).json({
                error: 'Payment is not completed yet',
                paymentStatus: session.payment_status
            });
        }

        const order = await finalizeOnlineOrder(
            session.id,
            session.customer_email || session.customer_details?.email || null
        );

        console.log('[StripeConfirm] Order finalized via return-flow confirmation', {
            sessionId: session.id,
            orderId: order?._id || null
        });

        return res.status(200).json({
            message: 'Payment confirmed and order finalized',
            order,
            orderId: order._id
        });
    } catch (error) {
        console.error('Error confirming Stripe session:', error);
        return res.status(500).json({ error: 'Failed to confirm Stripe session', details: error.message });
    }
});

// --- ORDER ENDPOINTS ---
// Create a new order
app.post("/api/orders", async (req, res) => {
    try {
        const { userId, items, shippingInfo, paymentMethod, subtotal, deliveryFee, orderTotal } = req.body;
        
        if (!userId || !items || !shippingInfo || !paymentMethod || !subtotal || !deliveryFee || !orderTotal) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (paymentMethod !== 'cod') {
            return res.status(400).json({ error: 'Use Stripe checkout flow for online payments' });
        }
        
        // Create order with complete product details
        const orderItems = await Promise.all(items.map(async (item) => {
            try {
                const product = await ProductModel.findById(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                
                return {
                    productId: item.productId,
                    name: product.name,
                    price: product.price,
                    size: item.size,
                    sizeType: item.sizeType,
                    quantity: item.quantity,
                    imageUrl: product.imageUrl
                };
            } catch (err) {
                console.error(`Error processing order item: ${err.message}`);
                throw err;
            }
        }));
        
        const order = new OrderModel({
            userId,
            items: orderItems,
            shippingInfo,
            paymentMethod,
            paymentStatus: 'pending',
            subtotal,
            deliveryFee,
            orderTotal,
            orderDate: new Date(),
            status: 'pending'
        });
        
        await order.save();
        
        // Clear the user's cart after successful order
        await CartModel.findOneAndUpdate(
            { userId },
            { items: [], updatedAt: new Date() }
        );

        // Fetch user email for sending confirmation
        const user = await QuickcartModel.findById(userId);
        
        res.status(201).json({ 
            message: "Order created successfully", 
            order,
            orderId: order._id 
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Failed to create order", details: error.message });
    }
});

// Get all orders for a user
app.get("/api/orders/user/:userId", async (req, res) => {
    try {
        const orders = await OrderModel.find({ userId: req.params.userId }).sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ error: "Failed to fetch orders", details: error.message });
    }
});

// Get a specific order by ID
app.get("/api/orders/:id", async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ error: "Failed to fetch order", details: error.message });
    }
});

// Update order status (admin only)
app.put("/api/orders/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }
        
        // Validate status value
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }
        
        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        order.status = status;
        await order.save();
        
        res.json({ message: "Order status updated successfully", order });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Failed to update order status", details: error.message });
    }
});

// Get all orders (admin only)
app.get("/api/orders", async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const filter = {};
        if (status) filter.status = status;
        
        const skip = (Number(page) - 1) * Number(limit);
        const total = await OrderModel.countDocuments(filter);
        
        const orders = await OrderModel.find(filter)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(Number(limit));
        
        res.json({ 
            orders, 
            pagination: { 
                total, 
                page: Number(page), 
                pages: Math.ceil(total / Number(limit)) 
            } 
        });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({ error: "Failed to fetch orders", details: error.message });
    }
});

// Delete an order (admin only)
app.delete("/api/orders/:id", async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        await order.deleteOne();
        res.json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to submit contact form", details: error.message });
    }
});


// --- GLOBAL ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!", details: err.message });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('[StripeInit] Configuration snapshot', {
        envPath,
        frontendBaseUrl: FRONTEND_BASE_URL,
        webhookPath: WEBHOOK_PATH,
        stripeKeyConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
        webhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        webhookSecretPrefix: maskValue(process.env.STRIPE_WEBHOOK_SECRET),
        handledWebhookEvents: [
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
            'checkout.session.expired',
            'checkout.session.async_payment_failed',
            'payment_intent.succeeded'
        ]
    });
});