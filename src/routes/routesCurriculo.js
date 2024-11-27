const express = require('express');
const multer = require('multer');
const path = require('path');
const Curriculo = require('../models/curriculo');
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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/curriculos'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.pdf') {
            return cb(new Error('Apenas arquivos PDF são permitidos.'));
        }
        cb(null, true);
    },
});

router.post(
    '/',
    authenticate,
    upload.single('arquivo'),
    async (req, res) => {
        const { nome, email, cpf } = req.body;

        try {

            if (req.user.tipo !== 'Gerenciador') {
                return res.status(403).json({ message: 'Apenas gerenciadores podem adicionar currículos.' });
            }

            const cpfExistente = await Curriculo.findOne({ cpf });
            if (cpfExistente) {
                return res.status(400).json({ message: 'CPF já cadastrado.' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'Arquivo do currículo é obrigatório.' });
            }

            const filePath = path.join('uploads', 'curriculos', req.file.filename).replace(/\\/g, '/');

            const curriculo = new Curriculo({
                nome,
                email,
                cpf,
                arquivo: filePath,
            });

            await curriculo.save();

            res.status(201).json({ message: 'Currículo cadastrado com sucesso.', curriculo });
        } catch (err) {
            console.error('Erro ao cadastrar currículo:', err.message);
            res.status(500).json({ message: 'Erro no servidor.' });
        }
    }
);

module.exports = router;
