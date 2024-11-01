// api/usuarios.js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); // Importar MongoClient y ObjectId
const jwt = require('jsonwebtoken'); // Asegúrate de importar jwt
const router = express.Router();

const uri = 'mongodb://localhost:27017/BaseDatos'; // Cambia esto a tu URI de MongoDB
const client = new MongoClient(uri);

// Conectar a la base de datos una vez al iniciar el servidor
client.connect()
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

router.get('/usuario', async (req, res) => {
    const token = req.headers['authorization']; // Suponiendo que el token se envía en el encabezado

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        // Verificar el token y obtener el ID del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '_id');
        const userId = decoded.id; // Obtener el ID del usuario del token

        const database = client.db('BaseDatos'); // Cambia esto a tu nombre de base de datos
        const users = database.collection('users'); // Cambia esto al nombre de tu colección

        const user = await users.findOne({ _id: ObjectId(userId) }); // Buscar el usuario por ID
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ username: user.username }); // Devolver el nombre de usuario
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
    }
});

module.exports = router;