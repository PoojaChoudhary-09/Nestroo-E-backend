
async function connectDB() {
    // Open the MongoDB connection used by the backend models.
    try {
        const response = await mongoose.connect("mongodb://localhost:27017/wsjp131")

    } catch (error) {

    }
}
