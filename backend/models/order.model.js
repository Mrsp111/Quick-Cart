import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  size: { type: String, required: true },
  sizeType: { type: String, enum: ['standard', 'waist'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String }
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [orderItemSchema],
  shippingInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  stripeSessionId: { type: String, unique: true, sparse: true, index: true },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  orderTotal: { type: Number, required: true }, // Storing the total amount
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: 'pending', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }
});

export default mongoose.model("Order", orderSchema);