const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');          // pour les codes temporaires
const nodemailer = require('nodemailer');  // pour envoyer les emails

// Tous les rôles possibles (doivent être les mêmes que l'ENUM dans la table utilisateur)
const ALL_ROLES = [
  'SUPER_ADMIN',
  'ORGANISATEUR',
  'COMMUNICANT',
  'PARTICIPANT',
  'MEMBRE_COMITE',
  'INVITE',
  'RESP_WORKSHOP',
];

// REGISTER
const register = async (req, res) => {
  let { nom, prenom, email, mot_de_passe, role, photo, institution, domaine_recherche } = req.body;

  // Vérifier que le rôle envoyé est valide
  if (!ALL_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }

  try {
    // Vérifier si l'email existe déjà
    db.query('SELECT * FROM utilisateur WHERE email = ?', [email], async (err, result) => {
      if (err) {
        console.error('Erreur DB:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }

      if (result.length > 0) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

      // Insertion en DB
      const sql = `
        INSERT INTO utilisateur 
          (nom, prenom, email, mot_de_passe, role, photo, institution, domaine_recherche)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [nom, prenom, email, hashedPassword, role, photo, institution, domaine_recherche],
        (err, resultInsert) => {
          if (err) {
            console.error('Erreur insertion:', err);
            return res
              .status(500)
              .json({ message: "Erreur serveur lors de l'inscription" });
          }

          res.status(201).json({
            message: 'Utilisateur créé avec succès',
            userId: resultInsert.insertId,
            role, // pour vérifier côté front
          });
        }
      );
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// LOGIN
const login = (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res
      .status(400)
      .json({ message: 'Email et mot de passe requis' });
  }

  db.query('SELECT * FROM utilisateur WHERE email = ?', [email], async (err, result) => {
    if (err) {
      console.error('Erreur DB:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    if (result.length === 0) {
      return res
        .status(400)
        .json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // durée 1 jour
    );

    res.json({
      message: 'Authentification réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        photo: user.photo,
        institution: user.institution,
        domaine_recherche: user.domaine_recherche,
      },
    });
  });
};

// FORGOT PASSWORD
const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'email requis' });
  }

  db.query(
    'SELECT id FROM utilisateur WHERE email = ?',
    [email],
    async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'erreur serveur' });
      }
      if (result.length === 0) {
        return res.json({
          message: 'si cet email existe,un lien a été envoyé',
        });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = crypto
        .createHash('sha256')
        .update(code)
        .digest('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      db.query(
        `UPDATE utilisateur
         SET reset_token_hash = ?, reset_token_expires = ?
         WHERE email = ?`,
        [codeHash, expiresAt, email],
        async (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ message: 'erreur serveur' });
          }
          try {
            await sendResetEmail(email, code);
          } catch (e) {
            console.error("Erreur envoi email:", e);
            return res.status(500).json({ message: "Impossible d'envoyer l'email pour le moment" });
          }
          res.json({ message: 'si cet email existe,un code a été envoyé' });
        }
      );
    }
  );
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  const { email, code, nouveau_mot_de_passe } = req.body;
  if (!email || !code || !nouveau_mot_de_passe) {
    return res.status(400).json({ message: 'Données manquantes' });
  }

  const codeHash = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');

  db.query(
    `SELECT id, reset_token_expires
     FROM utilisateur
     WHERE email = ? AND reset_token_hash = ?`,
    [email, codeHash],
    async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'erreur serveur' });
      }
      if (result.length === 0) {
        return res.status(400).json({ message: 'code invalide' });
      }

      const user = result[0];
      if (new Date(user.reset_token_expires) < new Date()) {
        return res.status(400).json({ message: 'code expiré' });
      }

      const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);

      db.query(
        `UPDATE utilisateur
         SET mot_de_passe = ?,
             reset_token_hash = NULL,
             reset_token_expires = NULL
         WHERE id = ?`,
        [hashedPassword, user.id],
        (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ message: 'erreur serveur' });
          }
          res.json({ message: 'mot de passe modifié avec succès' });
        }
      );
    }
  );
};

const sendResetEmail = async (to, code) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Réinitialisation du mot de passe',
    html: `<p>Votre code (valide 5min) : <b>${code}</b></p>`,
  });
};

const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requis" });

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Reuse existing nodemailer setup or creating new one to be safe and "minimal changes"
    // User asked "Use my backend code". I will use the same env vars.
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"MedEventa Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Votre code de vérification MedEventa',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Bienvenue sur MedEventa !</h2>
          <p>Voici votre code de vérification :</p>
          <h1 style="color: #09e0c7; letter-spacing: 2px;">${code}</h1>
          <p>Valide pour 10 minutes.</p>
        </div>
      `,
    });

    // Simple in-memory store
    if (!global.verificationStore) global.verificationStore = new Map();
    global.verificationStore.set(email, {
      code,
      expires: Date.now() + 10 * 60 * 1000
    });

    res.json({ message: "Code de vérification envoyé" });
  } catch (error) {
    console.error("Erreur envoi code:", error);
    res.status(500).json({ message: error.message || "Impossible d'envoyer l'email" });
  }
};

const verifyVerificationCode = (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: "Email et code requis" });

  if (!global.verificationStore) return res.status(400).json({ message: "Aucun code demandé." });

  const record = global.verificationStore.get(email);
  if (!record) return res.status(400).json({ message: "Aucun code trouvé." });
  if (Date.now() > record.expires) return res.status(400).json({ message: "Code expiré." });
  if (record.code !== code) return res.status(400).json({ message: "Code invalide." });

  global.verificationStore.delete(email);
  res.json({ message: "Vérifié avec succès" });
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  sendVerificationCode,
  verifyVerificationCode,
};
