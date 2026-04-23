import mongoose from "mongoose";

// Counter Schema to track the last used ID
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true },
});
const Counter = mongoose.model("Counter", counterSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  _id: { type: String }, // Custom Product ID
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['Men', 'Women', 'Unisex'], required: true }, // Gender field for categorizing products

  // New Fields 👇
  sizeType: { type: String, enum: ['standard', 'waist'], required: true }, 
  sizes: [
    {
      size: { type: String, required: true }, // e.g., "M" or "32"
      quantity: { type: Number, required: true, min: 0 },
    }
  ],

  // Keeping stockQuantity if you want total count (can auto-calculate from sizes if needed)
  stockQuantity: { type: Number, required: true, min: 0 },

  price: { type: Number, required: true, min: 0 },
  originalPrice: { 
    type: Number, 
    required: true, 
    min: 0,
    validate: {
      validator: function (value) {
        return value >= this.price;
      },
      message: "Original price must be greater than or equal to the current price",
    },
  },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  images: [{ type: String }], // Array of image URLs
  imageUrl: { type: String, default: "" }, // Keeping for backward compatibility
  createdAt: { type: Date, default: Date.now, required: true },
  isNewArrival: { type: Boolean, default: false },
});

// Auto-increment custom product ID
productSchema.pre("save", async function (next) {
  if (!this._id) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "productId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this._id = `PROD-${counter.seq.toString().padStart(4, "0")}`;
  }
  next();
});

export const CounterModel = Counter;

export default mongoose.model("Product", productSchema);
