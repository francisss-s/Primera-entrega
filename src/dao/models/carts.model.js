// src/dao/models/carts.model.js

import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    description: { type: String, default: '' }, // Campo opcional para descripción del carrito
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
            quantity: { type: Number, default: 1 }
        }
    ]
});

const cartModel = mongoose.model('carts', cartSchema);

export default cartModel;
