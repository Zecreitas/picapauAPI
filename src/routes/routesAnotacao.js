const express = require('express');
const router = express.Router();
const Anotacao = require('../models/anotacao');
const jwt = require('jsonwebtoken');

const verificarLider = (req, res, next) => {
    if (!req.user || req.user.user.tipo !== 'Lider') {
        return res.status(403).json({ mensagem: 'Acesso negado. Apenas líderes podem fazer anotações.' });
    }
    next();
};

const autenticarUsuario = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ mensagem: 'Token não fornecido ou formato inválido.' });
    }
    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (erro) {
        console.error('Erro ao verificar o token:', erro.message);
        return res.status(401).json({ mensagem: 'Token inválido.' });
    }
};

router.post('/', autenticarUsuario, verificarLider, async (req, res) => {
    try {
        const { funcionario, descricao } = req.body;
        if (!funcionario || !descricao) {
            return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos obrigatórios.' });
        }
        const novaAnotacao = new Anotacao({
            funcionario,
            descricao,
            lider: req.user.user.id,
        });
        await novaAnotacao.save();
        res.status(201).json({ mensagem: 'Anotação criada com sucesso.', anotacao: novaAnotacao });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro ao criar anotação.' });
    }
});

router.get('/minhas-anotacoes', autenticarUsuario, verificarLider, async (req, res) => {
    try {
        const liderId = req.user.user.id;

        const anotacoes = await Anotacao.find({ lider: liderId });

        if (!anotacoes.length) {
            return res.status(404).json({ mensagem: 'Nenhuma anotação encontrada para este líder.' });
        }

        res.status(200).json({ mensagem: 'Anotações recuperadas com sucesso.', anotacoes });
    } catch (erro) {
        console.error('Erro ao buscar anotações:', erro);
        res.status(500).json({ mensagem: 'Erro ao buscar anotações.' });
    }
});


module.exports = router;
