const mongoose = require('mongoose');

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
});

module.exports = mongoose.model('Curriculo', CurriculoSchema);
