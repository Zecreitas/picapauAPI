const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const equipeSchema = new Schema({
  nome: { type: String, required: true },
  membros: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  criador: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const Equipe = mongoose.models.Equipe || mongoose.model('Equipe', equipeSchema);

module.exports = Equipe;

