import express from 'express';
import fs from 'fs';
import { io } from '../app.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const cartsFilePath = path.join(process.cwd(), 'src/data/carts.json');
const productsFilePath = path.join(process.cwd(), 'src/data/products.json');

// Función para leer los carritos desde el archivo
const readCartsFromFile = (callback) => {
    fs.readFile(cartsFilePath, 'utf-8', (err, data) => {
        if (err) {
            return callback(err);
        }
        const carts = JSON.parse(data);
        callback(null, carts);
    });
};

// Función para escribir los carritos en el archivo
const writeCartsToFile = (carts, callback) => {
    fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), (err) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

// Ruta POST '/' - Crear un nuevo carrito
router.post('/', (req, res) => {
    const newCart = {
        id: uuidv4(),
        products: []
    };

    readCartsFromFile((err, carts) => {
        if (err) return res.status(500).send('Error al leer los carritos');
        carts.push(newCart);
        writeCartsToFile(carts, (err) => {
            if (err) return res.status(500).send('Error al guardar el carrito');

            io.emit('cartUpdated');  // Emitir evento de carrito actualizado
            res.status(201).json(newCart);
        });
    });
});

// Ruta GET '/' - Obtener todos los carritos
router.get('/', (req, res) => {
    readCartsFromFile((err, carts) => {
        if (err) return res.status(500).send('Error al leer los carritos');
        res.json(carts);
    });
});

// Ruta GET '/:cid' - Obtener un carrito por ID
router.get('/:cid', (req, res) => {
    const cid = req.params.cid;
    readCartsFromFile((err, carts) => {
        if (err) return res.status(500).send('Error al leer los carritos');
        const cart = carts.find(c => c.id === cid);
        if (!cart) return res.status(404).send('Carrito no encontrado');
        res.json(cart);
    });
});

// Ruta POST '/:cid/product/:pid' - Agregar un producto al carrito
router.post('/:cid/product/:pid', (req, res) => {
    const cid = req.params.cid;
    const pid = req.params.pid;
    const quantity = req.body.quantity || 1;

    readCartsFromFile((err, carts) => {
        if (err) return res.status(500).send('Error al leer los carritos');
        const cart = carts.find(c => c.id === cid);
        if (!cart) return res.status(404).send('Carrito no encontrado');

        fs.readFile(productsFilePath, 'utf-8', (err, productData) => {
            if (err) return res.status(500).send('Error al leer los productos');
            const products = JSON.parse(productData);
            const product = products.find(p => p.id === pid);
            if (!product) return res.status(404).send('Producto no encontrado');

            const productInCart = cart.products.find(p => p.id === pid);
            if (productInCart) {
                productInCart.quantity += quantity; // Incrementar la cantidad si ya existe
            } else {
                cart.products.push({ id: pid, quantity: quantity });
            }

            writeCartsToFile(carts, (err) => {
                if (err) return res.status(500).send('Error al actualizar el carrito');
                
                io.emit('cartUpdated');  // Emitir evento de carrito actualizado
                res.send('Producto agregado al carrito');
            });
        });
    });
});

// Ruta DELETE '/:cid/product/:pid' - Eliminar un producto del carrito
router.delete('/:cid/product/:pid', (req, res) => {
    const cid = req.params.cid;
    const pid = req.params.pid;

    readCartsFromFile((err, carts) => {
        if (err) return res.status(500).send('Error al leer los carritos');
        const cart = carts.find(c => c.id === cid);
        if (!cart) return res.status(404).send('Carrito no encontrado');

        cart.products = cart.products.filter(p => p.id !== pid);

        writeCartsToFile(carts, (err) => {
            if (err) return res.status(500).send('Error al actualizar el carrito');
            
            io.emit('cartUpdated');  // Emitir evento de carrito actualizado
            res.send('Producto eliminado del carrito');
        });
    });
});

// Ruta DELETE '/:cid' - Eliminar un carrito por ID
router.delete('/:cid', (req, res) => {
    const cid = req.params.cid;

    readCartsFromFile((err, carts) => {
        if (err) return res.status(500).send('Error al leer los carritos');
        const newCarts = carts.filter(c => c.id !== cid);
        if (carts.length === newCarts.length) return res.status(404).send('Carrito no encontrado');

        writeCartsToFile(newCarts, (err) => {
            if (err) return res.status(500).send('Error al eliminar el carrito');
            
            io.emit('cartUpdated');  // Emitir evento de carrito actualizado
            res.send('Carrito eliminado correctamente');
        });
    });
});

export default router;
