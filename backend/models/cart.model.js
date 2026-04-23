import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, ref: "Product", required: true }, // Matches your PROD-xxxx
  size: { type: String, required: true }, // E.g., 'M' or '32'
  sizeType: { type: String, enum: ['standard', 'waist'], required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Cart", cartSchema);