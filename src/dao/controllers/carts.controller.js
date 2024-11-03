// src/dao/controllers/carts.controller.js

import cartModel from '../models/carts.model.js';
import { io } from '../../app.js';
import productsModel from '../models/products.model.js';

// Crear un nuevo carrito con descripción
export const createCart = async (req, res) => {
    try {
        const { description } = req.body;
        const newCart = new cartModel({ description, products: [] });
        await newCart.save();
        io.emit('cartUpdated');
        res.status(201).json(newCart);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Obtener todos los carritos (lista con descripciones e IDs)
export const getCarts = async (req, res) => {
    try {
        const carts = await cartModel.find({}, 'description _id'); // Solo descripción e ID para listado rápido
        res.json(carts);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Obtener un carrito específico con productos detallados
export const getCartById = async (req, res) => {
    try {
        const cart = await cartModel.findById(req.params.cid).populate('products.productId');
        if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
        res.json(cart);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Eliminar un producto específico del carrito
export const removeProductFromCart = async (req, res) => {
    const { cid, pid } = req.params;

    try {
        const cart = await cartModel.findById(cid);
        if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

        cart.products = cart.products.filter(p => !p.productId.equals(pid));
        await cart.save();
        io.emit('cartUpdated');
        res.json({ status: 'success', message: 'Producto eliminado del carrito' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Actualizar el carrito con un nuevo arreglo de productos
export const updateCartProducts = async (req, res) => {
    const { cid } = req.params;
    const { products } = req.body;

    try {
        const cart = await cartModel.findById(cid);
        if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

        const productIds = products.map(p => p.productId);
        const existingProducts = await productsModel.find({ _id: { $in: productIds } });

        if (existingProducts.length !== productIds.length) {
            return res.status(400).json({ status: 'error', message: 'Uno o más productos no existen' });
        }

        cart.products = products.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));

        await cart.save();
        io.emit('cartUpdated');
        res.json({ status: 'success', message: 'Carrito actualizado con éxito' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Actualizar la cantidad de un solo producto en el carrito
export const updateProductQuantityInCart = async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    try {
        const cart = await cartModel.findById(cid);
        if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

        const productInCart = cart.products.find(p => p.productId.equals(pid));
        if (!productInCart) return res.status(404).json({ status: 'error', message: 'Producto no encontrado en el carrito' });

        productInCart.quantity = quantity;
        await cart.save();
        io.emit('cartUpdated');
        res.json({ status: 'success', message: 'Cantidad del producto actualizada en el carrito' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Eliminar todos los productos del carrito
export const clearCart = async (req, res) => {
    const { cid } = req.params;

    try {
        const cart = await cartModel.findById(cid);
        if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });

        cart.products = [];
        await cart.save();
        io.emit('cartUpdated');
        res.json({ status: 'success', message: 'Carrito vaciado correctamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const addProductToCart = async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity = 1 } = req.body; // Si no se especifica cantidad, usa 1 como predeterminado

    try {
        // Verificar que el producto exista en la base de datos
        const product = await productsModel.findById(pid);
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }

        // Buscar el carrito y verificar si ya contiene el producto
        const cart = await cartModel.findById(cid);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
        }

        const productInCart = cart.products.find(item => item.productId.equals(pid));
        
        if (productInCart) {
            // Si el producto ya está en el carrito, incrementar la cantidad
            productInCart.quantity += quantity;
        } else {
            // Si el producto no está en el carrito, agregarlo
            cart.products.push({ productId: pid, quantity });
        }

        // Guardar los cambios en el carrito
        await cart.save();

        // Emitir evento de actualización de carrito
        io.emit('cartUpdated');

        res.status(200).json({ status: 'success', message: 'Producto agregado al carrito con éxito' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};