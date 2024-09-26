const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const productsFilePath = path.join(__dirname, '../data/products');

// Ruta GET '/' - Obtener todos los productos 
// permite usar limit como query param para limitar la cantidad de productos a mostrar
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit);
  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error al leer los productos');
    let products = JSON.parse(data);
    if (limit && !isNaN(limit)) {
      products = products.slice(0, limit);
    }
    res.json(products);
  });
});

// Ruta GET '/:pid' - Obtener un producto por ID
router.get('/:pid', (req, res) => {
  const pid = req.params.pid;
  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error al leer los productos');
    const products = JSON.parse(data);
    const product = products.find(p => p.id === pid);
    if (!product) return res.status(404).send('Producto no encontrado');
    res.json(product);
  });
});

// Ruta POST '/' - Agregar un nuevo producto
router.post('/', (req, res) => {
  const { title, description, code, price, stock, category, thumbnails = [] } = req.body;
  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).send('Todos los campos son obligatorios excepto thumbnails');
  }

  const newProduct = {
    id: uuidv4(),
    title,
    description,
    code,
    price,
    status: true,
    stock,
    category,
    thumbnails
  };

  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error al leer los productos');
    const products = JSON.parse(data);
    products.push(newProduct);
    fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), err => {
      if (err) return res.status(500).send('Error al guardar el producto');
      res.status(201).json(newProduct);
    });
  });
});

// Ruta PUT '/:pid' - Actualizar un producto por ID
router.put('/:pid', (req, res) => {
  const pid = req.params.pid;
  const updatedFields = req.body;

  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error al leer los productos');
    let products = JSON.parse(data);
    const productIndex = products.findIndex(p => p.id === pid);
    if (productIndex === -1) return res.status(404).send('Producto no encontrado');

    // Evitar cambiar el ID original
    if (updatedFields.id) delete updatedFields.id;

    products[productIndex] = { ...products[productIndex], ...updatedFields };

    fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), err => {
      if (err) return res.status(500).send('Error al actualizar el producto');
      res.json(products[productIndex]);
    });
  });
});

// Ruta DELETE '/:pid' - Eliminar un producto por ID
router.delete('/:pid', (req, res) => {
  const pid = req.params.pid;

  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error al leer los productos');
    let products = JSON.parse(data);
    const newProducts = products.filter(p => p.id !== pid);
    if (products.length === newProducts.length) return res.status(404).send('Producto no encontrado');

    fs.writeFile(productsFilePath, JSON.stringify(newProducts, null, 2), err => {
      if (err) return res.status(500).send('Error al eliminar el producto');
      res.send('Producto eliminado correctamente');
    });
  });
});

module.exports = router;
