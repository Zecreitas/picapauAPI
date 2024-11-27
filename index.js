require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectToDatabase = require('./src/config/database');
const userRoutes = require('./src/routes/routes');
const curriculoRoutes = require('./src/routes/routesCurriculo');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar ao MongoDB
connectToDatabase();

// Configurar rotas
app.use('/api', userRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/curriculos', curriculoRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
