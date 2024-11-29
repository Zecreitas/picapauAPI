require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectToDatabase = require('./src/config/database');
const userRoutes = require('./src/routes/routes');
const curriculoRoutes = require('./src/routes/routesCurriculo');
const anotacaoRoutes = require('./src/routes/routesAnotacao');
const equipeRoutes = require('./src/routes/routesEquipes');
const recrutamentoRoutes = require('./src/routes/routesRecrutamento');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectToDatabase();

app.use('/api', userRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/curriculos', curriculoRoutes);
app.use('/api/anotacoes', anotacaoRoutes);
app.use('/api/equipes', equipeRoutes);
app.use('/api/recrutamentos', recrutamentoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
