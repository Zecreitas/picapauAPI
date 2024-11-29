const mongoose = require('mongoose');
const curriculo = require('./curriculo');

const RecrutamentoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  descricao: {
    type: String,
    required: true
  },
  curriculo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curriculo',
    required: true
  },
  criadoEm: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Recrutamento', RecrutamentoSchema);
