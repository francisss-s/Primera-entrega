import { Server } from 'socket.io';
import cartsRouter from './routes/carts.router.js';
import { createServer } from 'http';
import { engine } from 'express-handlebars';
import express from 'express';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import path from 'path';
import productsRouter from './routes/products.router.js';
import viewsRouter from './routes/views.router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;
console.log('MONGODB_URI:', MONGODB_URI);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer); // Inicializar Socket.IO

// Middleware para parsear JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Handlebars
app.engine('handlebars', engine({
    layoutsDir: path.join(__dirname, 'views/layouts'),
    defaultLayout: 'main',
    extname: '.handlebars',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true, // Permitir acceso a propiedades heredadas
        allowProtoMethodsByDefault: true     // Permitir métodos heredados, si es necesario
    },
    helpers: {
        calculateTotal: (price, quantity) => (price * quantity).toFixed(2) 
    }
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Rutas para las vistas
app.use('/', viewsRouter);

// Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado');
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Exportar io para usar en los controladores si es necesario
export { io };

// Conectar a MongoDB y manejar errores
const connectToDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        process.exit(1); // Terminar la aplicación si falla la conexión
    }
};

httpServer.listen(PORT, async () => {
    await connectToDatabase();
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
