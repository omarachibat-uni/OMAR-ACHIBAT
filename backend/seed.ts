/**
 * Script de Seed Idempotent pour les Comptes de Démonstration
 * Arrêté ministériel n° 1886.23 du 1er août 2024
 *
 * Exécution : npx tsx backend/seed.ts
 */

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface SeedUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'CANDIDAT' | 'DIRECTEUR_THESE' | 'DIRECTEUR_CED' | 'ADMINISTRATEUR';
  title?: string;
  phone?: string;
  cin?: string;
  cneCnie?: string;
  degreeName?: string;
  institution?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
}

export const DEMO_ACCOUNTS = [
  {
    roleName: 'Candidat',
    email: 'candidat@demo.ma',
    passwordClear: 'Demo2026!',
    user: {
      id: 'user-cand-1',
      email: 'candidat@demo.ma',
      firstName: 'Driss',
      lastName: 'Alaoui',
      role: 'CANDIDAT' as const,
      phone: '+212 6 61 23 45 67',
      cin: 'CD789123',
      cneCnie: 'N134567890',
      degreeName: 'Master Spécialisé en Intelligence Artificielle & Big Data',
      institution: 'Faculté des Sciences Dhar El Mahraz - Fès',
      isActive: true,
      createdAt: '2026-10-15T09:00:00Z',
    },
  },
  {
    roleName: 'Directeur de thèse',
    email: 'directeur.these@demo.ma',
    passwordClear: 'Demo2026!',
    user: {
      id: 'user-prof-1',
      email: 'directeur.these@demo.ma',
      firstName: 'Rachid',
      lastName: 'Berrada',
      title: 'Pr.',
      role: 'DIRECTEUR_THESE' as const,
      phone: '+212 5 35 60 80 10',
      department: 'Département d\'Informatique & Génie Électrique',
      institution: 'Faculté des Sciences et Techniques (FST) Fès',
      isActive: true,
      createdAt: '2026-09-01T08:00:00Z',
    },
  },
  {
    roleName: 'Directeur du CED',
    email: 'directeur.ced@demo.ma',
    passwordClear: 'Demo2026!',
    user: {
      id: 'user-ced-1',
      email: 'directeur.ced@demo.ma',
      firstName: 'Fatima Zahra',
      lastName: 'Bennani',
      title: 'Pr.',
      role: 'DIRECTEUR_CED' as const,
      phone: '+212 5 35 60 99 00',
      department: 'Direction du Centre d\'Études Doctorales (CED-ST)',
      institution: 'Université Sidi Mohamed Ben Abdellah',
      isActive: true,
      createdAt: '2026-09-01T08:00:00Z',
    },
  },
  {
    roleName: 'Administrateur',
    email: 'admin@demo.ma',
    passwordClear: 'Demo2026!',
    user: {
      id: 'user-admin-1',
      email: 'admin@demo.ma',
      firstName: 'Karim',
      lastName: 'El Fassi',
      title: 'M.',
      role: 'ADMINISTRATEUR' as const,
      phone: '+212 5 35 60 99 05',
      department: 'Service des Admissions Doctorales & Systèmes d\'Information',
      institution: 'Présidence USMBA',
      isActive: true,
      createdAt: '2026-09-01T08:00:00Z',
    },
  },
];

export async function runSeed() {
  console.log('--- Initialisation du Seed des Comptes Démo Doctorat Maroc ---');
  const saltRounds = 10;

  const seededUsers: SeedUser[] = [];

  for (const item of DEMO_ACCOUNTS) {
    const hash = await bcrypt.hash(item.passwordClear, saltRounds);
    const seededUser: SeedUser = {
      ...item.user,
      passwordHash: hash,
    };
    seededUsers.push(seededUser);
    console.log(`[OK] Compte ${item.roleName} généré : ${item.email} (Hash bcrypt : ${hash.substring(0, 15)}...)`);
  }

  // Stocker dans un fichier local de persistence backend JSON pour le serveur Express
  const dataDir = path.resolve(process.cwd(), 'backend/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const usersFile = path.join(dataDir, 'users.json');
  let existingUsers: SeedUser[] = [];
  if (fs.existsSync(usersFile)) {
    try {
      existingUsers = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    } catch {
      existingUsers = [];
    }
  }

  // Upsert idempotent : mettre à jour si existe déjà, insérer sinon (aucun doublon)
  for (const sUser of seededUsers) {
    const idx = existingUsers.findIndex((u) => u.email.toLowerCase() === sUser.email.toLowerCase());
    if (idx >= 0) {
      existingUsers[idx] = { ...existingUsers[idx], ...sUser };
    } else {
      existingUsers.push(sUser);
    }
  }

  fs.writeFileSync(usersFile, JSON.stringify(existingUsers, null, 2), 'utf-8');
  console.log(`[SUCCÈS] ${seededUsers.length} comptes de test enregistrés dans ${usersFile}`);
  console.log('-------------------------------------------------------------');
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed().catch((err) => {
    console.error('Erreur lors du seed :', err);
    process.exit(1);
  });
}
