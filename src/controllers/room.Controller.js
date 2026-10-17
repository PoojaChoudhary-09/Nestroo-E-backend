import mongoose from "mongoose";
import RoomModel from "../models/room.model.js";
import {
    sendBadRequest,
    sendConflict,
    sendCreated,
    sendNotFound,
    sendServerError,
    sendSuccess
} from "../utils/response.js";


// CREATE CATEGORY
// Create a room type with an optional uploaded image.
export const create = async (req, res) => {
    try {
        const { name, slug } = req.body;
        // Validate required fields
        if (!name || !slug) {
            return sendBadRequest(res, "Name and slug are required");
        }

        // Check duplicate category
        const room = await RoomModel.findOne({
            $or: [{ name }, { slug }]
        });

        if (room) {
            return sendConflict(res, "Room already exists");
        }
        const imageUrl = req.file ? req.file.path : '';
        await RoomModel.create({
            name,
            slug,
            image: imageUrl
        });

        return sendCreated(res, "Room created successfully");

    } catch (error) {
        console.error("Create Category Error:", error);
        return sendServerError(res);
    }
};


// GET ALL CATEGORIES
// Return paginated room types, optionally filtered by status.
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
        const total = await RoomModel.countDocuments(filter);
        const pages = limit ? Math.ceil(total / limit) : 1;
        const currentPage = Math.min(page, Math.max(pages, 1));
        let roomQuery = RoomModel.find(filter);

        if (limit) {
            roomQuery = roomQuery
                .skip((currentPage - 1) * limit)
                .limit(limit);
        }

        const room = await roomQuery;

        return res.status(200).json({
            message: "Room data found",
            success: true,
            room,
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
// Return one room type by MongoDB ID.
export const readById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequest(res, "Invalid category ID");
        }

        const room = await RoomModel.findById(id);

        if (!room) {
            return sendNotFound(res, "Category not found");
        }

        return res.status(200).json({
            message: "Room data found",
            success: true,
            room
        });

    } catch (error) {
        console.error("Read Category By ID Error:", error);
        return sendServerError(res);
    }
};


// DELETE ROOM TYPE
// Permanently remove a room type by ID.
export const deleteById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequest(res, "Invalid room type ID");
        }

        const room = await RoomModel.findById(id);

        if (!room) {
            return sendNotFound(res, "Room type not found");
        }

        await RoomModel.findByIdAndDelete(id);

        return sendSuccess(res, "Room type deleted successfully");

    } catch (error) {
        console.error("Delete Room Type Error:", error);
        return sendServerError(res);
    }
};


// UPDATE ROOM TYPE STATUS
// Toggle whether a room type is visible in the store.
export const status = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequest(res, "Invalid room type ID");
        }

        const room = await RoomModel.findById(id);

        if (!room) {
            return sendNotFound(res, "Room type not found");
        }

        await RoomModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    status: !room.status
                }
            },
            {
                new: true
            }
        );

        return sendSuccess(res, "Room type status updated successfully");

    } catch (error) {
        console.error("Update Room Type Status Error:", error);
        return sendServerError(res);
    }
};


// Update a room type's name, slug, and optional image.
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name = "", slug = "" } = req.body;
        const imageUrl = req.file?.path ?? null;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequest(res, "Invalid room type ID");
        }

        if (!name || !slug) {
            return sendBadRequest(res, "Name and slug are required");
        }

        const room = await RoomModel.findById(id);

        if (!room) {
            return sendNotFound(res, "Room type not found");
        }

        const duplicateRoom = await RoomModel.findOne({
            $or: [
                { name },
                { slug }
            ],
            _id: { $ne: id }
        });

        if (duplicateRoom) {
            return sendConflict(res, "Room type name or slug already exists");
        }

        if (name) room.name = name;
        if (slug) room.slug = slug;
        if (imageUrl) room.image = imageUrl;
        await room.save();

        return sendSuccess(res, "Room type updated successfully");

    } catch (error) {
        console.error("Update Room Type Error:", error);
        return sendServerError(res);
    }
};
