import cartsModel from '../dao/models/carts.model.js';
import express from 'express';
import productsModel from '../dao/models/products.model.js';

const router = express.Router();

// Ruta para la página principal ('/') que lista productos
router.get('/', async (req, res) => {
    try {
        const products = await productsModel.find(); // Obtener productos desde MongoDB
        res.render('home', {
            title: 'Lista de Productos',
            products, // Pasamos la lista de productos a la vista
        });
    } catch (error) {
        res.status(500).send('Error al obtener los productos desde la base de datos');
    }
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

// Ruta para los detalles de un producto específico
router.get('/products/:pid', async (req, res) => {
    try {
        const product = await productsModel.findById(req.params.pid);
        if (!product) {
            return res.status(404).render('404', { title: 'Producto no encontrado' });
        }
        res.render('productDetail', { title: product.title, ...product._doc });
    } catch (error) {
        console.error('Error al obtener los detalles del producto:', error);
        res.status(500).render('error', { message: 'Error al cargar detalles del producto' });
    }
});

router.get('/carts/:cid', async (req, res) => {
    try {
        const cart = await cartsModel.findById(req.params.cid).populate('products.productId');
        if (!cart) {
            return res.status(404).render('404', { title: 'Carrito no encontrado' });
        }
        res.render('cartDetail', { title: 'Detalles del Carrito', products: cart.products });
    } catch (error) {
        console.error('Error al cargar el carrito:', error);
        res.status(500).render('error', { message: 'Error al cargar el carrito' });
    }
});

export default router;
