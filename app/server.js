const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Conectar a la base de datos
mongoose.connect('mongodb://localhost:27017/tu_base_de_datos', { useNewUrlParser: true, useUnifiedTopology: true });

// Definir el esquema de usuario
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String, // Asegúrate de encriptar la contraseña antes de almacenarla
});

const User = mongoose.model('User', userSchema);

// Endpoint para registrar un nuevo usuario
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Validar los datos (puedes agregar más validaciones)
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  // Crear un nuevo usuario
  const newUser = new User({ username, email, password });
  await newUser.save();

  res.status(201).json({ message: 'Usuario registrado exitosamente' });
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor en ejecución en http://localhost:3000');
});
