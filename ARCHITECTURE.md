# ARCHITECTURE & ANALYSE TECHNIQUE — PLATEFORME DOCTORAT MAROC
*Conforme à la décision ministérielle n° 1886.23 du 1er août 2024*

---

## 1. Vue d'ensemble et Découpage Modulaire

La plateforme est conçue selon une architecture modulaire et découplée en deux grands sous-systèmes :
- **Frontend SPA (React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + FullCalendar)**
- **Backend API REST (Node.js + Express + Prisma ORM + MySQL + JWT HttpOnly + Nodemailer + node-cron)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT REACT (Vite + TS)                          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌───────────────┐ │
│  │ Espace Public  │ │ Espace Candidat│ │ Espace Prof/Dir│ │ Espace Admin  │ │
│  └───────┬────────┘ └───────┬────────┘ └───────┬────────┘ └───────┬───────┘ │
│          └──────────────────┼──────────────────┼──────────────────┘         │
│                             │ Axios (Credentials, Cookies HttpOnly)        │
├─────────────────────────────┼───────────────────────────────────────────────┤
│                             ▼                                               │
│                         EXPRESS API REST                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares: Auth (JWT), RBAC Roles, RateLimiting, Audit Logger, Multer│  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     ▼                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐ │
│  │ Auth Service │ │ Campagne/Thès│ │ Candidatures │ │ 72h Timeout Cron    │ │
│  ├──────────────┤ ├──────────────┤ ├──────────────┤ ├─────────────────────┤ │
│  │ Présélection │ │ Entretiens   │ │ Délibérations│ │ Inscriptions        │ │
│  └──────────────┴──────────────┴──────────────┴─────────────────────┘ │
│                                     │ Prisma ORM                            │
├─────────────────────────────────────┼───────────────────────────────────────┤
│                                     ▼                                       │
│                         BASE DE DONNÉES MYSQL                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Matrice RACI & Permissions des Rôles

| Fonctionnalité / Action | Candidat | Directeur de Thèse | Directeur CED | Administrateur | Membre Commission |
|---|:---:|:---:|:---:|:---:|:---:|
| Création de compte autonome | **R / A** | Non (Invitation) | Non (Attribution) | Non (Super) | Non |
| Consultation publique des sujets | **R** | **R** | **R** | **R** | **R** |
| Choix d'un sujet (Max 1) & Dépôt | **R / A** | Non | Non | Non | Non |
| Verrouillage irréversible du sujet | Automatique | Non | Non | Non | Non |
| Contrôle de recevabilité des pièces | Non | Non | **A / R** | **A / R** | Non |
| Déclaration Dossier Incomplet (Délai 72h) | Non | Non | **R** | **R** | Non |
| Soumission des pièces rectifiées | **R / A** | Non | Non | Non | Non |
| Traitement automatique du Rejet 72h | Système | Non | Informé | Informé | Non |
| Avis de Présélection sur dossier | Non | **R** (ses sujets) | **A / R** | **R** | **R** |
| Planification Calendrier Entretiens | Non | Consultation | **A / R** | **A / R** | Consultation |
| Saisie Note Entretien (0-20) + Avis | Non | **R** (si jury) | **R** (si jury) | Consultation | **R** (si jury) |
| Délibération & Ordonnancement Listes | Non | Non | **A / R** | **R** | **C** |
| Validation & Publication officielle | Non | Non | **A** | **A** | Non |
| Promotion depuis Liste d'Attente | Non | Non | **A / R** | **A / R** | Non |
| Contrôle physique & Confirmation Inscription | Non | Non | **A / R** | **A / R** | Non |
| Consultation Journal d'Audit & Métriques | Non | Non | **R** | **A / R** | Non |

*Légende : R = Réalise (Responsible), A = Approuve (Accountable), C = Consulté, I = Informé.*

---

## 3. Diagramme de Processus Métier (Workflow Réglementaire)

```
[1. Campagne Ouverte & Publication des Sujets]
                     │
                     ▼
[2. Candidat: Inscription & Choix d'un unique Sujet] ──> Sujet verrouillé
                     │
                     ▼
[3. Candidat: Dépôt des pièces (CV, CIN, Diplôme, Relevés, Projet)]
                     │
                     ▼
[4. Soumission Définitive du Dossier] ──> Statut: SOUMISE / EN_COURS_VERIFICATION
                     │
                     ├───────────────────────────────────────────────┐
                     ▼                                               ▼
            [Dossier Complet]                              [Dossier Incomplet]
                     │                                               │
                     │                                 [Déclenchement Délai 72h]
                     │                                 • Notification & Email candidat
                     │                                 • Compte à rebours temps réel
                     │                                 • Sujet strictement verrouillé
                     │                                               │
                     │                                 ┌─────────────┴─────────────┐
                     │                                 ▼                           ▼
                     │                       [Corrections soumises         [Expiration 72h]
                     │                          avant échéance]                    │
                     │                                 │                   Statut: REJETEE_DELAI
                     │                                 ▼                   • Verrouillage total
                     │                       [Re-vérification pièces]      • Email & Audit log
                     │                                 │
                     │◄────────────────────────────────┘
                     ▼
[5. Statut: RECEVABLE / EN_PRESELECTION]
                     │
                     ├───────────────────────────────┐
                     ▼                               ▼
            [Présélection Validée]         [Non Présélectionné]
                     │                               │
                     ▼                               ▼
[6. Statut: PRESELECTIONNEE]               Statut: NON_PRESELECTIONNEE
                     │
                     ▼
[7. Programmation de l'Entretien (FullCalendar)]
   • Détection des conflits de salle & examinateurs
   • Convocation officielle envoyée (Date, Heure, Salle, Jury)
                     │
                     ▼
[8. Déroulement Entretien & Évaluations]
   • Notes individuelles /20 obligatoires + commentaires motivés
   • Pas de seuil couperet à 10/20 automatique
                     │
                     ▼
[9. Délibération de la Commission & Directeur CED]
   • Statuts préparatoires : ADMIS | LISTE_ATTENTE (avec rang) | REFUSE
   • Validation institutionnelle
                     │
                     ▼
[10. Publication Officielle des Résultats]
   • Les résultats deviennent visibles aux candidats
   • Email d'admission avec instructions de convocation en présentiel
                     │
   ┌─────────────────┴─────────────────┐
   ▼                                   ▼
[Liste d'Attente]                 [Candidat Admis]
   │                                   │
   │ (Si désistement / place libérée)  ▼
   └──────────> Promotion motivée ────>│
                                       ▼
[11. Inscription Administrative Initiale en Présentiel]
   • Présentation physique du candidat au CED
   • Dépôt & vérification des diplômes originaux
   • Signature de la Charte de Thèse
   • Validation dans le back-office par l'agent habilité
                     │
                     ▼
[12. Statut Final: INSCRIPTION_CONFIRMEE] ──> Progression: 100%
```

---

## 4. Modèle de Données Relationnel (Prisma Schema pour MySQL)

### Entités principales :
1. **User** (id, email, passwordHash, firstName, lastName, phone, cin, role, isActive, createdAt)
2. **Campaign** (id, code, title, academicYear, status, startDate, endDate, isCurrent)
3. **ThesisSubject** (id, title, description, domain, keywords, labStructure, supervisorId, campaignId, isPublished)
4. **Application** (id, candidateId, campaignId, subjectId, status, currentStep, submittedAt, progressPercent)
5. **RequiredDocumentType** (id, code, label, isRequired, maxSizeBytes, allowedMimeTypes)
6. **ApplicationDocument** (id, applicationId, documentTypeId, originalName, storedPath, mimeType, sizeBytes, version)
7. **DocumentReview** (id, documentId, reviewerId, isApproved, comments, reviewedAt)
8. **CorrectionRequest** (id, applicationId, requestedById, instructions, missingItems, deadlineAt, submittedAt, status)
9. **SelectionCommittee** (id, name, domain, campaignId)
10. **CommitteeMember** (id, committeeId, userId, roleInCommittee)
11. **PreselectionReview** (id, applicationId, reviewerId, score, decision, comments, reviewedAt)
12. **Interview** (id, applicationId, committeeId, scheduledStart, scheduledEnd, roomLocation, status, notes)
13. **InterviewEvaluation** (id, interviewId, evaluatorId, gradeOutOf20, remarks, submittedAt)
14. **DeliberationDecision** (id, applicationId, finalRank, decisionType, waitingListRank, isPublished, publishedAt, promotedFromWaitlist)
15. **EnrollmentVerification** (id, applicationId, verifiedById, originalDiplomasChecked, charterSigned, confirmedAt, remarks)
16. **Notification** (id, userId, title, message, type, isRead, linkUrl, createdAt)
17. **EmailLog** (id, recipientEmail, subject, templateName, status, errorDetails, sentAt)
18. **AuditLog** (id, userId, action, resourceType, resourceId, previousState, newState, ipAddress, userAgent, timestamp)

---

## 5. Spécification Détaillée du Délai de 72 Heures

- **Déclenchement :** Action explicite du vérificateur (`POST /api/applications/:id/request-correction`).
- **Calcul serveur souverain :** `deadlineAt = now() + 72 * 3600 * 1000` (exactement 72h00m00s).
- **Protection concurrente :** Transaction avec verrouillage optimiste / pessimiste pour interdire le changement de sujet de thèse.
- **Tâche Cron d'expiration :** Exécutée toutes les minutes (`node-cron`) vérifiant `status = 'PENDING_CORRECTION' AND deadlineAt < now() AND submittedAt IS NULL`.
- **Résolution Idempotente :**
  - Si soumission candidat reçue avant expiration : statut bascule à `CORRECTION_SUBMITTED`, la tâche cron ignore ce dossier.
  - Si expiration atteinte sans remise : passage automatique en `REJECTED_DEADLINE_EXPIRED`, notification et log audit automatique.
