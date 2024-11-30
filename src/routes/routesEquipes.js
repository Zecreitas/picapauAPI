const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const Equipe = require('../models/equipe');
const User = require('../models/user');

const router = express.Router();

// Middleware de autenticação
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token não fornecido ou formato inválido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '12131415');
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Erro ao verificar o token:', err.message);
        res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

router.post('/criar-equipe', authenticate, async (req, res) => {
  try {
    // Verifica se o usuário é um Gerenciador
    if (req.user.tipo !== 'Gerenciador') {
      return res.status(403).json({ message: 'Apenas gerenciadores podem criar equipes.' });
    }

    const { nome, membros, liderEmail } = req.body;

    // Validações
    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
      return res.status(400).json({ message: 'O nome da equipe é obrigatório e deve ser uma string válida.' });
    }

    if (!membros || !Array.isArray(membros) || membros.length === 0) {
      return res.status(400).json({ message: 'A equipe deve conter uma lista de IDs de funcionários.' });
    }

    if (!liderEmail || typeof liderEmail !== 'string' || liderEmail.trim() === '') {
      return res.status(400).json({ message: 'O email do líder é obrigatório.' });
    }

    // Filtra os membros válidos
    const idsValidos = membros.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (idsValidos.length !== membros.length) {
      return res.status(400).json({ message: 'Alguns IDs fornecidos para membros não são válidos.' });
    }

    // Verifica se todos os membros são do tipo 'Funcionario'
    const funcionarios = await User.find({ _id: { $in: idsValidos }, tipo: 'Funcionario' });
    if (funcionarios.length !== idsValidos.length) {
      return res.status(400).json({ message: 'Alguns IDs fornecidos não correspondem a funcionários existentes.' });
    }

    // Busca o líder pelo email
    const lider = await User.findOne({ email: liderEmail, tipo: 'Lider' });
    if (!lider) {
      return res.status(400).json({ message: 'Não foi encontrado um líder com o email fornecido.' });
    }

    // Cria a nova equipe
    const novaEquipe = new Equipe({
      nome: nome.trim(),
      membros: idsValidos,
      lider: lider._id,
      criador: req.user.id  // Adiciona o ID do usuário que está criando a equipe
    });

    await novaEquipe.save();

    // Adiciona a equipe ao líder
    if (!Array.isArray(lider.equipes)) {
      lider.equipes = [];
    }
    lider.equipes.push(novaEquipe._id);
    await lider.save();

    res.status(200).json({ message: 'Equipe criada com sucesso.', equipe: novaEquipe });
  } catch (err) {
    console.error('Erro ao criar equipe:', err.message);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});


// Rota para listar equipes
router.get('/listar-equipes', authenticate, async (req, res) => {
  try {
    // Se o usuário for um Gerenciador, ele pode ver todas as equipes
    if (req.user.tipo === 'Gerenciador') {
      const equipes = await Equipe.find()
        .populate({
          path: 'membros',
          select: 'nome email tipo'
        })
        .populate({
          path: 'lider',
          select: 'nome email'
        });

      if (equipes.length === 0) {
        return res.status(404).json({ message: 'Nenhuma equipe encontrada.' });
      }

      return res.status(200).json({ equipes });
    }

    // Se o usuário for um Líder, ele verá apenas suas equipes
    if (req.user.tipo === 'Lider') {
      const lider = await User.findById(req.user.id)
        .populate({
          path: 'equipes',
          populate: {
            path: 'membros',
            select: 'nome email tipo'
          }
        });

      if (!lider || !lider.equipes || lider.equipes.length === 0) {
        return res.status(404).json({ message: 'Nenhuma equipe encontrada.' });
      }

      return res.status(200).json({ equipes: lider.equipes });
    }

    // Caso o tipo não seja 'Gerenciador' nem 'Lider'
    return res.status(403).json({ message: 'Acesso negado.' });
  } catch (err) {
    console.error('Erro ao listar equipes:', err.message);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});


module.exports = router;
