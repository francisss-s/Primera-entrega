const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cartsFilePath = path.join(__dirname, '../data/carrito.json');
const productsFilePath = path.join(__dirname, '../data/productos.json');


// Ruta GET '/:cid' - Obtener un carrito por ID
router.get('/:cid', (req, res) => {
  const cid = req.params.cid;
  fs.readFile(cartsFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error al leer los carritos');
    const carts = JSON.parse(data);
    const cart = carts.find(c => c.id === cid);
    if (!cart) return res.status(404).send('Carrito no encontrado');
    res.json(cart);
  });
});

// Ruta POST '/' - Crear un nuevo carrito
router.post('/', (req, res) => {
  const newCart = {
    id: uuidv4(),
    products: []
  };

  fs.readFile(cartsFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error al leer los carritos');
    const carts = JSON.parse(data);
    carts.push(newCart);
    fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), err => {
      if (err) return res.status(500).send('Error al guardar el carrito');
      res.status(201).json(newCart);
    });
  });
});

// Ruta POST '/:cid/product/:pid' - Agregar un producto al carrito
router.post('/:cid/product/:pid', (req, res) => {
  const cid = req.params.cid;
  const pid = req.params.pid;

  // Verificar si el producto existe en productos.json
  fs.readFile(productsFilePath, 'utf-8', (err, productData) => {
    if (err) return res.status(500).send('Error al leer los productos');
    const products = JSON.parse(productData);
    const productExists = products.find(p => p.id === pid);
    if (!productExists) return res.status(404).send('Producto no encontrado');

    // Si el producto existe, proceder a agregarlo al carrito
    fs.readFile(cartsFilePath, 'utf-8', (err, cartData) => {
      if (err) return res.status(500).send('Error al leer los carritos');
      let carts = JSON.parse(cartData);
      const cartIndex = carts.findIndex(c => c.id === cid);
      if (cartIndex === -1) return res.status(404).send('Carrito no encontrado');

      let cart = carts[cartIndex];
      let productInCart = cart.products.find(p => p.id === pid);

      if (productInCart) {
        productInCart.quantity += 1;
      } else {
        cart.products.push({ id: pid, quantity: 1 });
      }

      carts[cartIndex] = cart;

      fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), err => {
        if (err) return res.status(500).send('Error al actualizar el carrito');
        res.send('Producto agregado al carrito');
      });
    });
  });
});

module.exports = router;
