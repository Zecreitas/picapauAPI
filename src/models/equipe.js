// models/Equipe.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const equipeSchema = new Schema({
  nome: { type: String, required: true },
  membros: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lider: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const Equipe = mongoose.model('Equipe', equipeSchema);

module.exports = Equipe;
