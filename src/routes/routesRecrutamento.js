const express = require('express');
const Recrutamento = require('../models/recrutamento');
const jwt = require('jsonwebtoken');

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

const verificarGerenciador = (req, res, next) => {
    if (!req.user || req.user.user.tipo !== 'Gerenciador') {
        return res.status(403).json({ mensagem: 'Acesso negado. Apenas líderes podem fazer anotações.' });
    }
    next();
};


router.post('/', authenticate, verificarGerenciador, async (req, res) => {
    try {
        
        
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro ao criar anotação.' });
    }
});




module.exports = router;
