
import CartModel from "../models/cart.model.js";
import mongoose from "mongoose";
import { sendServerError } from "../utils/response.js";

// Merge or replace the authenticated user's server cart with the browser cart.
export const sync = async (req, res) => {
  try {
    const { items = [], mode = "replace" } = req.body;
    if (!Array.isArray(items) || !["merge", "replace"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Cart items or sync mode are invalid"
      });
    }

    const normalizedItems = [];
    for (const item of items) {
      const productId = item.productId ?? item.id ?? item._id;
      const qty = Number(item.qty);
      if (!mongoose.Types.ObjectId.isValid(productId) || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Each cart item must have a valid product ID and quantity"
        });
      }
      normalizedItems.push({ productId, qty });
    }

    let cart = await CartModel.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new CartModel({ userId: req.user._id, items: [] });
    }

    if (mode === "merge") {
      const mergedItems = new Map(
        cart.items.map((item) => [item.productId.toString(), item.qty])
      );
      for (const item of normalizedItems) {
        const id = item.productId.toString();
        mergedItems.set(id, (mergedItems.get(id) || 0) + item.qty);
      }
      cart.items = Array.from(mergedItems, ([productId, qty]) => ({ productId, qty }));
    } else {
      cart.items = normalizedItems;
    }

    await cart.save();
    const populatedCart = await CartModel.findById(cart._id).populate(
      "items.productId",
      "_id name price salePrice thumbnail"
    );
    return res.status(200).json({
      success: true,
      message: "Cart synchronized successfully",
      cart: populatedCart
    });
  } catch (error) {
    console.error("Cart Sync Error:", error);
    return sendServerError(res);
  }
};
