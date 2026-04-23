import mongoose from "mongoose";

const paymentItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    size: { type: String, required: true },
    sizeType: { type: String, enum: ["standard", "waist"], required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const paymentSessionSchema = new mongoose.Schema(
  {
    stripeSessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true },
    userEmail: { type: String },
    items: { type: [paymentItemSchema], required: true },
    shippingInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    orderTotal: { type: Number, required: true },
    paymentMethod: { type: String, default: "online" },
    paymentStatus: {
      type: String,
      enum: ["created", "paid", "cancelled", "failed"],
      default: "created",
    },
    orderCreated: { type: Boolean, default: false },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentSession", paymentSessionSchema);
