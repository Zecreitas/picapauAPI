const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    tipo: { type: String, enum: ['Lider', 'Gerenciador', 'Funcionario'], required: true },
    pontos: { type: Number, default: 0 },
    equipe: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    curriculos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Curriculo' }],
});

module.exports = mongoose.model('User', UserSchema);
