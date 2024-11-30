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
    if (req.user.tipo !== 'Lider') {
      return res.status(403).json({ message: 'Apenas líderes podem criar equipes.' });
    }

    const { nome, membros } = req.body;

    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
      return res.status(400).json({ message: 'O nome da equipe é obrigatório e deve ser uma string válida.' });
    }

    if (!membros || !Array.isArray(membros) || membros.length === 0) {
      return res.status(400).json({ message: 'A equipe deve conter uma lista de IDs de funcionários.' });
    }

    const idsValidos = membros.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (idsValidos.length !== membros.length) {
      return res.status(400).json({ message: 'Alguns IDs fornecidos não são válidos.' });
    }

    const funcionarios = await User.find({ _id: { $in: idsValidos }, tipo: 'Funcionario' });
    if (funcionarios.length !== idsValidos.length) {
      return res.status(400).json({ message: 'Alguns IDs fornecidos não correspondem a funcionários existentes.' });
    }

    const lider = await User.findById(req.user.id);
    if (!lider) {
      return res.status(404).json({ message: 'Líder não encontrado.' });
    }
    if (!Array.isArray(lider.equipes)) {
      lider.equipes = [];
    }

    const novaEquipe = new Equipe({
      nome: nome.trim(),
      membros: idsValidos,
      lider: lider._id
    });

    await novaEquipe.save();

    lider.equipes.push(novaEquipe._id);
    await lider.save();

    res.status(200).json({ message: 'Equipe criada com sucesso.', equipe: novaEquipe });
  } catch (err) {
    console.error('Erro ao criar equipe:', err.message);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});


router.get('/listar-equipes', authenticate, async (req, res) => {
  try {
    if (req.user.tipo !== 'Lider') {
      return res.status(403).json({ message: 'Apenas líderes podem acessar suas equipes.' });
    }

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

    res.status(200).json({ equipes: lider.equipes });
  } catch (err) {
    console.error('Erro ao listar equipes:', err.message);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});





module.exports = router;
