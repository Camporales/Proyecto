// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    // Agrega otros campos según sea necesario, como email, contraseña, etc.
});

const User = mongoose.model('User', userSchema);

module.exports = User;