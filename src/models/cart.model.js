import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [{
        _id: false,
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        qty: {
            type: Number,
            required: true,
            min: 1
        }
    }]
},
 {
    timestamps: true
 }
);
cartSchema.index({ userId: 1 }, { unique: true });
const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
export default Cart;
