import { io } from '../../app.js';
import productsModel from '../models/products.model.js';

export const getProducts = async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;

        // Configuración de opciones de paginación
        const options = {
            limit: parseInt(limit),
            page: parseInt(page),
            sort: sort ? { price: sort === 'asc' ? 1 : -1 } : undefined,
        };

        // Configuración de filtro
        let filter = {};
        if (query) {
            // Si el query es 'available', filtrar por productos con stock > 0
            if (query.toLowerCase() === 'available') {
                filter.stock = { $gt: 0 };
            } else {
                // Búsqueda general en la categoría (ej. "electronics") con expresión regular
                filter = {
                    $or: [
                        { category: { $regex: query, $options: 'i' } },
                        { title: { $regex: query, $options: 'i' } } // Opcional: agregar filtro en el título
                    ]
                };
            }
        }

        // Ejecutar consulta de paginación
        const result = await productsModel.paginate(filter, options);

        // Responder con el formato especificado
        res.json({
            status: 'success',
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}&limit=${limit}&sort=${sort || ''}&query=${query || ''}` : null,
            nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}&limit=${limit}&sort=${sort || ''}&query=${query || ''}` : null,
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};


export const getProductById = async (req, res) => {
    try {
        const product = await productsModel.findById(req.params.pid);
        if (!product) return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { title, description, code, price, stock, category } = req.body;
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }

        const newProduct = new productsModel({
            title,
            description,
            code,
            price,
            stock,
            category
        });

        await newProduct.save();
        io.emit('updateProducts');
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const updatedProduct = await productsModel.findByIdAndUpdate(req.params.pid, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        io.emit('productUpdated');
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await productsModel.findByIdAndDelete(req.params.pid);
        if (!deletedProduct) return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        io.emit('productDeleted');
        res.send({ status: 'success', message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
