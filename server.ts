/**
 * Serveur Express Full-Stack - Plateforme Doctorat Maroc
 * Arrêté ministériel n° 1886.23 du 1er août 2024
 */

import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DEMO_ACCOUNTS, runSeed, SeedUser } from './backend/seed';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_doctorat_maroc_2026_min_32_chars';
const USERS_FILE = path.resolve(__dirname, 'backend/data/users.json');

app.use(express.json());
app.use(cookieParser());

// Assurer l'existence du seed au démarrage
if (!fs.existsSync(USERS_FILE)) {
  runSeed().catch(console.error);
}

function getUsersFromDisk(): SeedUser[] {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveUsersToDisk(users: SeedUser[]): void {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// --- Middleware d'authentification JWT ---
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: 'Session non authentifiée. Veuillez vous connecter.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Session expirée ou invalide.' });
  }
}

// --- ENDPOINTS REST D'AUTHENTIFICATION ---

/**
 * POST /api/auth/login
 * Vérification des identifiants avec bcrypt et émission du cookie JWT HttpOnly
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Adresse email et mot de passe requis.' });
  }

  const users = getUsersFromDisk();
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, error: 'Identifiants invalides : adresse email ou mot de passe incorrect.' });
  }

  const isPasswordValid = await bcrypt.compare(password.trim(), user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, error: 'Identifiants invalides : adresse email ou mot de passe incorrect.' });
  }

  // Génération du token JWT
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Cookie HttpOnly sécurisé
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  });

  const { passwordHash, ...safeUser } = user;
  return res.json({
    success: true,
    user: safeUser,
    token,
  });
});

/**
 * POST /api/auth/logout
 * Déconnexion sécurisée : purge du cookie HttpOnly
 */
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('auth_token');
  return res.json({ success: true, message: 'Déconnexion effectuée avec succès.' });
});

/**
 * GET /api/auth/me
 * Récupération de l'utilisateur actuellement connecté via JWT
 */
app.get('/api/auth/me', authenticateJWT, (req: AuthRequest, res: Response) => {
  const users = getUsersFromDisk();
  const user = users.find((u) => u.id === req.user?.id);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
  }

  const { passwordHash, ...safeUser } = user;
  return res.json({ success: true, user: safeUser });
});

/**
 * POST /api/auth/seed
 * Ré-exécution du seed des 4 comptes de test
 */
app.post('/api/auth/seed', async (_req: Request, res: Response) => {
  await runSeed();
  return res.json({ success: true, message: 'Comptes de test régénérés avec succès.' });
});

// --- INTÉGRATION DE VITE EN MODE DÉVELOPPEMENT / PRODUCTION ---
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Mode production
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVEUR] Plateforme Doctorat Maroc en écoute sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ERREUR CRITIQUE] Impossible de démarrer le serveur Express :', err);
});
