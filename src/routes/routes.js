const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const Curriculo = require('../models/curriculo');
const Anotacao = require('../models/anotacao');
const Equipe = require('../models/equipe');
const Recrutamento = require('../models/recrutamento');

const mongoose = require('mongoose');


const multer = require('multer');
const path = require('path');

const router = express.Router();

// Validação de email
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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



// Rota de cadastro
router.post(
  '/cadastro',
  [
    body('nome').notEmpty().withMessage('Coloque seu nome'),
    body('email').isEmail().withMessage('Digite um e-mail válido'),
    body('senha').isLength({ min: 6 }).withMessage('A senha precisa ter pelo menos 6 caracteres'),
    body('tipo')
      .isIn(['Lider', 'Gerenciador', 'Funcionario'])
      .withMessage('Tipo de usuário inválido'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, email, senha, tipo } = req.body;

    try {
      if (tipo === 'Funcionario') {
        return res.status(403).json({ message: 'Funcionários não podem se cadastrar diretamente.' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Formato de e-mail inválido' });
      }

      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'Usuário já existe' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      user = new User({
        nome,
        email,
        senha: hashedPassword,
        tipo,
      });

      await user.save();
      res.status(201).json({ message: 'Usuário criado com sucesso' });
    } catch (err) {
      console.error('Erro ao criar usuário:', err.message);
      res.status(500).send('Erro no servidor');
    }
  }
);


// Rota de login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const payload = {
      user: {
        id: user._id,
        nome: user.nome,
        tipo: user.tipo,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || '12131415',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            nome: user.nome,
            email: user.email,
            tipo: user.tipo,
            equipe: user.equipe,
          },
        });
      }
    );
  } catch (err) {
    console.error('Erro durante o login:', err.message);
    res.status(500).send('Erro no servidor');
  }
});

// Rota de cadastro de funcionário
router.post(
  '/cadastrofuncionario',
  authenticate,
  async (req, res) => {
    const { email, senha, nome, tipo, equipe } = req.body;

    try {
      if (req.user.tipo !== 'Gerenciador') {
        return res.status(403).json({ message: 'Apenas gerenciadores podem cadastrar funcionários' });
      }

      if (tipo !== 'Funcionario') {
        return res.status(400).json({ message: 'O tipo de usuário precisa ser "Funcionario"' });
      }

      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'Usuário já existe' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      user = new User({
        nome,
        email,
        senha: hashedPassword,
        tipo,
        equipe,
      });

      await user.save();
      res.status(201).json({ message: 'Funcionário cadastrado com sucesso' });
    } catch (err) {
      console.error('Erro ao cadastrar funcionário:', err.message);
      res.status(500).send('Erro no servidor');
    }
  }
);

// Rota para adicionar pontos
router.post('/adicionar-pontos', authenticate, async (req, res) => {
  const { funcionarioId, pontos } = req.body;

  try {
    if (req.user.tipo !== 'Lider') {
      return res.status(403).json({ message: 'Apenas líderes podem atribuir pontos.' });
    }

    if (!funcionarioId || !pontos || isNaN(pontos)) {
      return res.status(400).json({ message: 'ID do funcionário e pontos são obrigatórios.' });
    }

    if (pontos <= 0) {
      return res.status(400).json({ message: 'Os pontos devem ser maiores que zero.' });
    }

    const funcionario = await User.findById(funcionarioId);
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado.' });
    }

    if (funcionario.tipo !== 'Funcionario') {
      return res.status(400).json({ message: 'Pontos só podem ser atribuídos a funcionários.' });
    }

    funcionario.pontos += pontos;
    await funcionario.save();

    res.status(200).json({
      message: `Pontos adicionados com sucesso. O funcionário agora tem ${funcionario.pontos} pontos.`,
      funcionario: {
        id: funcionario._id,
        nome: funcionario.nome,
        pontos: funcionario.pontos,
      },
    });
  } catch (err) {
    console.error('Erro ao adicionar pontos:', err.message);
    res.status(500).send('Erro no servidor.');
  }
});

// Rota para obter os dados do usuário
router.get('/meus-dados', authenticate, async (req, res) => {
  try {
      const user = await User.findById(req.user.id)
          .populate('equipe')
          .populate('curriculos')
          .exec();

      if (!user) {
          return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
      }

      const dadosUsuario = {
          id: user._id,
          nome: user.nome,
          email: user.email,
          tipo: user.tipo,
          pontos: user.pontos || 0,
      };

      if (user.tipo === 'Lider' || user.tipo === 'Funcionario') {
        dadosUsuario.equipe = user.equipe;
    
        const anotacoes = await Anotacao.find({ lider: user._id });
        dadosUsuario.anotacoes = anotacoes || [];
    }
    
    if (user.tipo === 'Gerenciador') {
      const recrutamentos = await Recrutamento.find({ gerenciador: user._id });
  
      const curriculos = await Curriculo.find({ gerenciador: user._id });
  
      dadosUsuario.curriculos = curriculos || [];
      dadosUsuario.recrutamentos = recrutamentos;
  }
  
    

      res.status(200).json({
          mensagem: 'Dados do usuário recuperados com sucesso.',
          dadosUsuario,
      });
  } catch (err) {
      console.error('Erro ao buscar os dados do usuário:', err.message);
      res.status(500).json({ mensagem: 'Erro ao recuperar os dados do usuário.' });
  }
});



module.exports = router;
