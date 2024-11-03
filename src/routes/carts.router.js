import {
    addProductToCart,
    clearCart,
    createCart,
    getCartById,
    getCarts,
    removeProductFromCart,
    updateCartProducts,
    updateProductQuantityInCart
} from '../dao/controllers/carts.controller.js';

import express from 'express';

const router = express.Router();

router.post('/', createCart);                       // Crear un nuevo carrito con descripción
router.get('/', getCarts);                          // Obtener todos los carritos con descripción e ID
router.get('/:cid', getCartById);                   // Obtener un carrito específico con productos detallados
router.post('/:cid/product/:pid', addProductToCart); // Agregar producto al carrito

router.put('/:cid', updateCartProducts);           // Actualizar el carrito con un arreglo de productos
router.put('/:cid/products/:pid', updateProductQuantityInCart); // Actualizar cantidad de un producto en el carrito

router.delete('/:cid/products/:pid', removeProductFromCart); // Eliminar producto específico del carrito
router.delete('/:cid', clearCart);                 // Vaciar el carrito

export default router;
