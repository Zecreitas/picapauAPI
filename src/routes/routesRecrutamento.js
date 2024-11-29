const express = require('express');
const Recrutamento = require('../models/recrutamento');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Curriculo = require('../models/curriculo');

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

// Middleware para verificar se o usuário é um gerenciador
const verificarGerenciador = (req, res, next) => {
    if (!req.user || req.user.tipo !== 'Gerenciador') {
        return res.status(403).json({ mensagem: 'Acesso negado. Apenas gerenciadores podem criar recrutamentos.' });
    }
    next();
};

// Rota para criar recrutamento
router.post('/', authenticate, verificarGerenciador, async (req, res) => {
    try {
        const { nome, descricao, curriculos } = req.body;

        if (!nome || !descricao || !Array.isArray(curriculos) || curriculos.length === 0) {
            return res.status(400).json({ mensagem: 'Nome, descrição e lista de currículos são obrigatórios.' });
        }

        const curriculosValidos = await Curriculo.find({ '_id': { $in: curriculos } });

        if (curriculosValidos.length !== curriculos.length) {
            return res.status(400).json({ mensagem: 'Alguns currículos fornecidos não são válidos.' });
        }

        const novoRecrutamento = new Recrutamento({
            nome,
            descricao,
            curriculos,
            gerenciador: req.user.id,
        });

        await novoRecrutamento.save();

        res.status(201).json({ mensagem: 'Recrutamento criado com sucesso.', recrutamento: novoRecrutamento });
    } catch (erro) {
        console.error('Erro ao criar recrutamento:', erro);
        res.status(500).json({ mensagem: 'Erro ao criar recrutamento.' });
    }
});

// Rota para listar os recrutamentos do gerenciador
router.get('/meus-recrutamentos', authenticate, verificarGerenciador, async (req, res) => {
    try {
        const recrutamentos = await Recrutamento.find({ gerenciador: req.user.id });

        if (!recrutamentos.length) {
            return res.status(404).json({ mensagem: 'Nenhum recrutamento encontrado.' });
        }

        res.status(200).json({ mensagem: 'Recrutamentos encontrados.', recrutamentos });
    } catch (err) {
        console.error('Erro ao buscar recrutamentos:', err.message);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

module.exports = router;
