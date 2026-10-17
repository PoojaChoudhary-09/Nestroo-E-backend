import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
}
)



const CategoryModel = mongoose.model("category", categorySchema);
export default CategoryModel