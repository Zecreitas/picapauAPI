const mongoose = require('mongoose');
const curriculo = require('./curriculo');
const User = require('./user');


const RecrutamentoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  descricao: {
    type: String,
    required: true,
  },
  curriculos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curriculo',
    required: true,
  }],
  gerenciador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  criadoEm: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Recrutamento', RecrutamentoSchema);
