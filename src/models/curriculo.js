const mongoose = require('mongoose');
const User = require('./user');

const CurriculoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{11}$/,
  },
  arquivo: {
    type: String, 
    required: true,
  },
  criadoEm: {
    type: Date,
    default: Date.now,
  },
  gerenciador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Curriculo', CurriculoSchema);
