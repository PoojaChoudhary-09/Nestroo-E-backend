import mongoose from "mongoose";
import CategoryModel from "../models/category.model.js";
import {
    sendBadRequest,
    sendConflict,
    sendCreated,
    sendNotFound,
    sendServerError,
    sendSuccess
} from "../utils/response.js";


// CREATE CATEGORY
// Create a category after validating its name, slug, and uploaded image.
export const create = async (req, res) => {
    try {
        const { name, slug } = req.body;

        console.log(name, slug)

        // Validate required fields
        if (!name || !slug) {
            return sendBadRequest(res, "Name and slug are required");
        }

        // Check duplicate category
        const category = await CategoryModel.findOne({
            $or: [{ name }, { slug }]
        });

        if (category) {
            return sendConflict(res, "Category already exists");
        }
        if (!req.file) {
            return sendBadRequest(res, "Category image is required");
        }

        const imageUrl = req.file.path;
        // Create category
        await CategoryModel.create({
            name,
            slug,
            image: imageUrl
        });

        return sendCreated(res, "Category created successfully");

    } catch (error) {
        console.error("Create Category Error:", error);
        return sendServerError(res);
    }
};


// GET ALL CATEGORIES
// Return paginated categories, optionally filtered by active status.
export const read = async (req, res) => {
    try {
        const requestedLimit = Number(req.query.limit);
        const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
            ? requestedLimit
            : null;
        const requestedPage = Number(req.query.page);
        const page = Number.isInteger(requestedPage) && requestedPage > 0
            ? requestedPage
            : 1;
        const filter = {};
        if (req.query.status !== undefined) {
            filter.status = req.query.status === "true";
        }
        const total = await CategoryModel.countDocuments(filter);
        const pages = limit ? Math.ceil(total / limit) : 1;
        const currentPage = Math.min(page, Math.max(pages, 1));
        let categoryQuery = CategoryModel.find(filter);

        if (limit) {
            categoryQuery = categoryQuery
                .skip((currentPage - 1) * limit)
                .limit(limit);
        }

        const categories = await categoryQuery;

        return res.status(200).json({
            message: "Category data found",
            success: true,
            categories,
            total,
            pages,
            page: currentPage
        });

    } catch (error) {
        console.error("Read Category Error:", error);
        return sendServerError(res);
    }
};


// GET CATEGORY BY ID
// Return one category by its MongoDB ID.
export const readById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequest(res, "Invalid category ID");
        }

        const category = await CategoryModel.findById(id);

        if (!category) {
            return sendNotFound(res, "Category not found");
        }

        return res.status(200).json({
            message: "Category data found",
            success: true,
            category
        });

    } catch (error) {
        console.error("Read Category By ID Error:", error);
        return sendServerError(res);
    }
};


// DELETE CATEGORY
// Permanently remove a category by ID.
export const deleteById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequest(res, "Invalid category ID");
        }

        const category = await CategoryModel.findById(id);

        if (!category) {
            return sendNotFound(res, "Category not found");
        }

        await CategoryModel.findByIdAndDelete(id);

        return sendSuccess(res, "Category deleted successfully");

    } catch (error) {
        console.error("Delete Category Error:", error);
        return sendServerError(res);
    }
};


// UPDATE CATEGORY STATUS
// Toggle whether a category is visible in the store.
export const status = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequest(res, "Invalid category ID");
        }

        const category = await CategoryModel.findById(id);

        if (!category) {
            return sendNotFound(res, "Category not found");
        }

        await CategoryModel.findByIdAndUpdate(
            id,
            {  $set: { status: !category.status  } },
            {   new: true  }
        );

        return sendSuccess(res, "Category status updated successfully");

    } catch (error) {
        console.error("Update Category Status Error:", error);
        return sendServerError(res);
    }
};


// Update a category's name, slug, and optional image.
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name = "", slug = "" } = req.body;
        const imageUrl = req.file?.path ?? null;

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequest(res, "Invalid category ID");
        }

        // Validate fields
        if (!name || !slug) {
            return sendBadRequest(res, "Name and slug are required");
        }

        // Check category exists
        const category = await CategoryModel.findById(id);

        if (!category) {
            return sendNotFound(res, "Category not found");
        }

        // Check duplicate name or slug
        const duplicateCategory = await CategoryModel.findOne({
            $or: [  { name }, { slug } ],
            _id: { $ne: id }
        });

        if (duplicateCategory) {
            return sendConflict(res, "Category name or slug already exists");
        }
        if (name) category.name = name;
        if (slug) category.slug = slug;
        if (imageUrl) category.image = imageUrl;
        await category.save();

        return sendSuccess(res, "Category updated successfully");

    } catch (error) {
        console.error("Update Category Error:", error);
        return sendServerError(res);
    }
};
