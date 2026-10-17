import crypto from "crypto";
import Razorpay from "razorpay";
import OrderModel from "../models/order.model.js";
import CartModel from "../models/cart.model.js";
import ProductModel from "../models/product.model.js";

const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_ID, key_secret: process.env.RAZORPAY_SECRET_KEY });

// Convert either frontend address naming style into the database schema format.
const normalizeAddress = (address = {}) => ({
  fullname: address.fullname ?? address.fullName,
  mobile: address.mobile,
  pincode: address.pincode,
  addressline1: address.addressline1 ?? address.addressLine,
  city: address.city,
  state: address.state,
  country: address.country || "India",
});

// Generate the customer-facing order number stored with every order.
const makeOrderId = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Validate the cart, calculate the trusted server-side total, and create either
// a COD order or a pending Razorpay order for the authenticated customer.
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod: rawPaymentMethod } = req.body;
    const paymentMethod = String(rawPaymentMethod || "").toUpperCase();
    const address = normalizeAddress(shippingAddress);
    if (!Object.values(address).every(Boolean) || !["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Valid address and payment method are required" });
    }

    // Always read products and prices from the database instead of trusting the browser cart.
    const cart = await CartModel.findOne({ userId }).lean();
    if (!cart?.items?.length) return res.status(400).json({ success: false, message: "Your cart is empty" });
    const products = await ProductModel.find({ _id: { $in: cart.items.map((item) => item.productId) }, status: true })
      .select("_id name thumbnail price salePrice stock").lean();
    const productById = new Map(products.map((product) => [String(product._id), product]));
    const items = [];
    for (const cartItem of cart.items) {
      const product = productById.get(String(cartItem.productId));
      if (!product) return res.status(400).json({ success: false, message: "A product in your cart is unavailable" });
      if (!product.stock) return res.status(400).json({ success: false, message: `${product.name} is out of stock` });
      const qty = Math.max(1, Number(cartItem.qty) || 1);
      const price = Number(product.salePrice || product.price);
      items.push({ productId: product._id, name: product.name, image: product.thumbnail || "", price, qty, subtotal: price * qty });
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingCharge = subtotal >= 999 ? 0 : 100;
    const totalAmount = subtotal + shippingCharge;
    const order = await OrderModel.create({
      orderId: makeOrderId(), userId, items, shippingAddress: address, subtotal, shippingCharge,
      discount: 0, totalAmount, paymentMethod, paymentStatus: "PENDING", orderStatus: "PENDING",
    });

    // Online orders remain pending until Razorpay returns a payment response.
    if (paymentMethod === "ONLINE") {
      try {
        const razorpayOrder = await razorpay.orders.create({ amount: Math.round(totalAmount * 100), currency: "INR", receipt: order.orderId });
        order.razorpay_order_id = razorpayOrder.id;
        await order.save();
        return res.status(201).json({ success: true, message: "Payment order created", order_id: order.orderId, razorpay_order_id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, key_id: process.env.RAZORPAY_ID });
      } catch (error) {
        await OrderModel.deleteOne({ _id: order._id });
        throw error;
      }
    }

    // COD is already accepted, so its cart can be cleared immediately.
    await CartModel.updateOne({ _id: cart._id }, { $set: { items: [] } });
    order.orderStatus = "CONFIRMED";
    await order.save();
    return res.status(201).json({ success: true, message: "Order placed successfully", order_id: order.orderId, order });
  } catch (error) {
    console.error("Place Order Error:", error);
    return res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

// Verify Razorpay's HMAC signature and mark the matching order as paid.
// The cart is cleared only after this verification succeeds.
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ success: false, message: "Incomplete payment details" });
    // Razorpay signs the order ID and payment ID with the server-only secret key.
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const valid = expectedSignature.length === razorpay_signature.length && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));
    if (!valid) return res.status(400).json({ success: false, message: "Payment verification failed" });

    // Restrict verification to the current user's order to prevent cross-account updates.
    const order = await OrderModel.findOne({ razorpay_order_id, userId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.paymentStatus === "PAID") return res.status(200).json({ success: true, message: "Payment already verified", order_id: order.orderId });
    order.razorpay_payment_id = razorpay_payment_id;
    order.paymentId = razorpay_payment_id;
    order.paymentStatus = "PAID";
    order.orderStatus = "CONFIRMED";
    order.paidAt = new Date();
    await order.save();
    await CartModel.updateOne({ userId: req.user._id }, { $set: { items: [] } });
    return res.status(200).json({ success: true, message: "Payment verified successfully", order_id: order.orderId });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return res.status(500).json({ success: false, message: "Unable to verify payment" });
  }
};

// Return recent orders for the protected admin order-management endpoint.
export const read = async (req, res) => {
  try {
    const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, orders });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
};
