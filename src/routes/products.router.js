import express from 'express';
import fs from 'fs';
import { io } from '../app.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const productsFilePath = path.join(process.cwd(), 'src/data/products.json');

// Función para leer productos desde el archivo
const readProductsFromFile = (callback) => {
    fs.readFile(productsFilePath, 'utf-8', (err, data) => {
        if (err) {
            return callback(err);
        }
        const products = JSON.parse(data);
        callback(null, products);
    });
};

// Función para escribir productos en el archivo
const writeProductsToFile = (products, callback) => {
    fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), (err) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

// Ruta GET '/' - Obtener todos los productos
router.get('/', (req, res) => {
    readProductsFromFile((err, products) => {
        if (err) return res.status(500).send('Error al leer los productos');
        res.json(products);
    });
});

// Ruta GET '/:pid' - Obtener un producto por ID
router.get('/:pid', (req, res) => {
    const pid = req.params.pid;
    readProductsFromFile((err, products) => {
        if (err) return res.status(500).send('Error al leer los productos');
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
  console.log('Producto agregaado'); // Log para verificar que el evento fue emitido
  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
      if (err) return res.status(500).send('Error al leer los productos');
      const products = JSON.parse(data);
      products.push(newProduct);
      fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), err => {
          if (err) return res.status(500).send('Error al guardar el producto');

          // Emitir el evento a todos los clientes cuando se agrega un producto
          io.emit('updateProducts');
        

          res.status(201).json(newProduct);
      });
  });
});

// Ruta PUT '/:pid' - Actualizar un producto por ID
router.put('/:pid', (req, res) => {
    const pid = req.params.pid;
    const updatedFields = req.body;

    readProductsFromFile((err, products) => {
        if (err) return res.status(500).send('Error al leer los productos');
        const productIndex = products.findIndex(p => p.id === pid);
        if (productIndex === -1) return res.status(404).send('Producto no encontrado');

        // Evitar cambiar el ID original
        if (updatedFields.id) delete updatedFields.id;

        products[productIndex] = { ...products[productIndex], ...updatedFields };

        writeProductsToFile(products, (err) => {
            if (err) return res.status(500).send('Error al actualizar el producto');
            
            io.emit('productUpdated'); // Emitimos el evento de Socket.IO
            res.json(products[productIndex]);
        });
    });
});

// Ruta DELETE '/:pid' - Eliminar un producto por ID
router.delete('/:pid', (req, res) => {
    const pid = req.params.pid;

    readProductsFromFile((err, products) => {
        if (err) return res.status(500).send('Error al leer los productos');
        const newProducts = products.filter(p => p.id !== pid);
        if (products.length === newProducts.length) return res.status(404).send('Producto no encontrado');

        writeProductsToFile(newProducts, (err) => {
            if (err) return res.status(500).send('Error al eliminar el producto');
            
            io.emit('productDeleted'); // Emitimos el evento de Socket.IO
            res.send('Producto eliminado correctamente');
        });
    });
});

export default router;
