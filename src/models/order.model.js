import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  fullname: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  addressline1: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  country: { type: String, default: "India", trim: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { type: shippingAddressSchema, required: true },
  subtotal: { type: Number, required: true, min: 0 },
  shippingCharge: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["COD", "ONLINE"], required: true },
  paymentStatus: { type: String, enum: ["PENDING", "PAID", "FAILED", "REFUNDED"], default: "PENDING" },
  paymentId: { type: String, default: null },
  orderStatus: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
    default: "PENDING"
  },
  razorpay_order_id: {
    type: String,
    default: null
  },
  razorpay_payment_id:{
  type:String,
  default: null
  },
  paidAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null }
}, { timestamps: true });

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default OrderModel;
