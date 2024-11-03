import {
    createProduct,
    deleteProduct,
    getProductById,
    getProducts,
    updateProduct
} from '../dao/controllers/products.controller.js';

import express from 'express';

const router = express.Router();

router.get('/', getProducts);
router.get('/:pid', getProductById);
router.post('/', createProduct);
router.put('/:pid', updateProduct);
router.delete('/:pid', deleteProduct);

export default router;
