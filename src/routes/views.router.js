import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const productsFilePath = path.join(process.cwd(), 'src/data/products.json');

// Ruta para la página principal ('/') que lista productos
router.get('/', (req, res) => {
  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
      if (err) {
          return res.status(500).send('Error al leer los productos');
      }
      const products = JSON.parse(data);
      res.render('home', {
          title: 'Lista de Productos',
          products, // Pasamos la lista de productos a la vista
      });
  });
});

// Ruta para la pantalla de añadir producto
router.get('/add-product', (req, res) => {
  res.render('addProduct', { title: 'Añadir Producto' });
});

// Ruta para la pantalla de productos en tiempo real
router.get('/realTimeProducts', (req, res) => {
  res.render('realTimeProducts', { title: 'Productos en Tiempo Real' });
});

// Ruta para la pantalla de crear carrito
router.get('/add-cart', (req, res) => {
  res.render('addCart', { title: 'Crear Carrito' });
});

// Ruta para la pantalla de ver carrito
router.get('/view-cart', (req, res) => {
  res.render('viewCart', { title: 'Ver Carrito' });
});

export default router;
