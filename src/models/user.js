const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  tipo: { type: String, enum: ['Lider', 'Gerenciador', 'Funcionario'], required: true },
  equipe: {
    type: [String],
    required: function () {
      return this.tipo === 'Lider' || this.tipo === 'Funcionario';
    }
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
