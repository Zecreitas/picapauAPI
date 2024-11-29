const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  tipo: { type: String, enum: ['Lider', 'Gerenciador', 'Funcionario'], required: true },
  equipes: [{ type: Schema.Types.ObjectId, ref: 'Equipe' }]
});


const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
