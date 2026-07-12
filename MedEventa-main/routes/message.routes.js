const express = require('express');
const router = express.Router();

const { sendMessage, getMessages, getDashboardActivity } = require('../controllers/message.controller');
const { sendMessageValidation } = require('../validators/message.validators');
const { verifyToken } = require('../middlewares/auth.middlewares'); // ou ton fichier auth

// Envoyer un message interne
router.post('/messages/send', verifyToken, sendMessageValidation, sendMessage);

// Récupérer les messages reçus par l’utilisateur connecté
router.get('/messages', verifyToken, getMessages);
// Tableau de bord activité (messages + notifs + compteur)
router.get('/dashboard/activity', verifyToken, getDashboardActivity);
module.exports = router;
