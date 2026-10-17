import mongoose from "mongoose";
import {
  sendBadRequest,
  sendConflict,
  sendCreated,
  sendNotFound,
  sendServerError,
  sendSuccess,
} from "../utils/response.js";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import RoomModel from "../models/room.model.js";
// CREATE CATEGORY
// GET ALL CATEGORIES
// Build the storefront/admin filters and return a paginated product list.
export const read = async (req, res) => {
  try {
    const query = req.query;
    const queryFilter = {};
    const sortFilter = {};
    const requestedLimit = Number(query.limit);
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 15)
      : 10;
    const requestedPage = Number(query.page);
    const page = Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
   
    if (query.stock) {
      queryFilter.stock = query.stock == "true";
    }
    if (query.bestseller) {
      queryFilter.bestSeller = query.bestseller == "true";
    }
    if (query.status) {
      queryFilter.status = query.status == "true";
    }
    if (query.featured) {
      queryFilter.featured = query.featured == "true";
    }

    if (query.category) {
      const categoryArray = query.category.split(",");

      const categories = await CategoryModel.find({
        slug: { $in: categoryArray },
      }).select("_id");
      queryFilter.categoryId = {
        $in: categories.map((category) => category._id),
      };
    }

    if (query.room_type) {
      const roomArray = query.room_type.split(",");

      const rooms = await RoomModel.find({
        slug: { $in: roomArray },
      }).select("_id");
      queryFilter.roomId = {
        $in: rooms.map((room) => room._id),
      };
    }

  if(query.min_price && query.max_price){
    queryFilter.salePrice={
      $gte: Number(query.min_price),
      $lte: Number(query.max_price)

    }
  }

  if(query.sort){
    if(query.sort === "asc"){
      sortFilter.salePrice = 1
    }else if(query.sort === "desc"){
   sortFilter.salePrice = -1
    }else {
   sortFilter.createdAt = -1
    }
 
  }
    const countProduct = await ProductModel.countDocuments(queryFilter);
    const pages = Math.ceil(countProduct / limit);
    const currentPage = Math.min(page, Math.max(pages, 1));
    const skip = (currentPage - 1) * limit;
    const product = await ProductModel.find(queryFilter)
      .skip(skip)
      .sort(sortFilter)
      .limit(limit);
    return res.status(200).json({
      message: "Product data found",
      success: true,
      product,
      pages,
      page: currentPage,
      total: countProduct
    });
  } catch (error) {
    return sendServerError(res);
  }
};

// GET CATEGORY BY ID
// Return one product after validating its MongoDB ID.
export const readById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid product ID");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Category not found");
    }

    return res.status(200).json({
      message: "Product data found",
      success: true,
      product,
    });
  } catch (error) {
    return sendServerError(res);
  }
};

// DELETE CATEGORY
// Permanently delete a product by ID.
export const deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid Product ID");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Product not found");
    }

    await ProductModel.findByIdAndDelete(id);

    return sendSuccess(res, "Product deleted successfully");
  } catch (error) {
    return sendServerError(res);
  }
};

// UPDATE CATEGORY STATUS
// Toggle the product's store visibility status.
export const status = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid product ID");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Proudtc not found");
    }

    await ProductModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: !product.status,
        },
      },
      {
        new: true,
      },
    );

    return sendSuccess(res, "Product status updated successfully");
  } catch (error) {
    return sendServerError(res);
  }
};

// Update basic product fields and replace the thumbnail when a new image is uploaded.
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name = "", slug = "" } = req.body;
    const imageUrl = req.file?.path ?? null;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res);
    }

    // Validate fields
    if (!name || !slug) {
      return sendBadRequest(res);
    }

    // Check category exists
    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Product not found");
    }

    // Check duplicate name or slug
    const duplicateProduct = await ProductModel.findOne({
      $or: [{ name }, { slug }],
      _id: { $ne: id },
    });

    if (duplicateProduct) {
      return sendConflict(res);
    }
    if (name) product.name = name;
    if (slug) product.slug = slug;
    if (imageUrl) product.thumbnail = imageUrl;
    await product.save();

    return sendSuccess(res, "product updated successfully");
  } catch (error) {
    return sendServerError(res);
  }
};

// Validate product form data and create a product with its thumbnail.
export const create = async (req, res) => {
  try {
    console.log(req.body);

    const imageUrl = req.file?.path || "";

    const {
      name,
      slug,
      shortDescription,
      description,
      categoryId,
      roomId,
      price,
      salePrice,
      discount,
      stock,
      material,
      color,
    } = req.body;

    if (!name || !slug || !description || !categoryId || !roomId || !price) {
      return sendBadRequest(res);
    }
    console.log(req.body);

    const product = await ProductModel.findOne({ slug });

    if (product) return sendConflict(res);

    await ProductModel.create({
      name,
      slug,
      shortDescription,
      description,
      categoryId,
      roomId,
      price,
      salePrice,
      discount,
      stock,
      material,
      color,
      thumbnail: imageUrl,
    });

    sendCreated(res);
  } catch (error) {
    console.log(error);
    sendServerError(res);
  }
};

// Toggle one allowed product flag such as stock, featured, or bestSeller.
export const updateFlag = async (req, res, fieldOverride = null) => {
  try {
    const { id } = req.params;
    const field = fieldOverride || req.body?.field;

    const allowedFields = ["stock", "featured", "bestSeller", "newArrival"];

    if (!allowedFields.includes(field)) {
      return sendBadRequest(res, "Invalid field");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res);
    }

    product[field] = !product[field];

    await product.save();

    return sendSuccess(res, `${field} updated successfully`);
  } catch (error) {
    return sendServerError(res, error);
  }
};

// Toggle product inventory availability.
export const toggleStock = async (req, res) => updateFlag(req, res, "stock");
// Toggle whether the product is featured.
export const toggleFeatured = async (req, res) =>
  updateFlag(req, res, "featured");
// Toggle the best-seller flag.
export const toggleBestSeller = async (req, res) =>
  updateFlag(req, res, "bestSeller");
// Toggle the new-arrival flag.
export const toggleNewArrival = async (req, res) =>
  updateFlag(req, res, "newArrival");

// Append additional gallery images to an existing product.
export const addImages = async (req, res) => {
  try {
    const { id } = req.params;
    const imagesURLs = Array.isArray(req.files)
      ? req.files.map((img) => img.path)
      : [];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid product ID");
    }
    const product = await ProductModel.findById(id);
    if (!product) {
      return sendNotFound(res, "Product not found");
    }
    product.images.push(...imagesURLs);
    await product.save();
    return sendSuccess(res, "Images added successfully");
  } catch (error) {
    sendServerError(res);
  }
};
