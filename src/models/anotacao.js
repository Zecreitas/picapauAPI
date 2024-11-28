const mongoose = require('mongoose');

const AnotacaoSchema = new mongoose.Schema({
  funcionario: {
    type: String,
    required: true,
  },
  data: {
    type: Date,
    default: Date.now,
  },
  descricao: {
    type: String,
    required: true,
  },
  lider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Anotacao', AnotacaoSchema);
