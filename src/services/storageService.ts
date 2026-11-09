/**
 * Service de persistance et moteur de règles métier - Plateforme Doctorat Maroc
 * Arrêté ministériel n° 1886.23 du 1er août 2024
 */

import bcrypt from 'bcryptjs';
import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
  AuditLog,
  Campaign,
  CorrectionRequest,
  DecisionType,
  EmailLog,
  Interview,
  NotificationItem,
  RequiredDocumentType,
  Role,
  ThesisSubject,
  User,
} from '../types';
import {
  INITIAL_APPLICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CAMPAIGN,
  INITIAL_DOCUMENT_TYPES,
  INITIAL_EMAIL_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUBJECTS,
  INITIAL_USERS,
} from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'doctorat_maroc_users',
  CAMPAIGN: 'doctorat_maroc_campaign',
  SUBJECTS: 'doctorat_maroc_subjects',
  APPLICATIONS: 'doctorat_maroc_applications',
  DOC_TYPES: 'doctorat_maroc_doc_types',
  AUDIT_LOGS: 'doctorat_maroc_audit_logs',
  EMAIL_LOGS: 'doctorat_maroc_email_logs',
  NOTIFICATIONS: 'doctorat_maroc_notifications',
  CURRENT_USER: 'doctorat_maroc_current_user',
};

class StorageService {
  constructor() {
    this.initDatabase();
    this.check72hTimeouts();
  }

  public initDatabase(forceReset: boolean = false) {
    const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const needsMigration = !existingUsers || !existingUsers.includes('demo.ma') || !existingUsers.includes('passwordHash');

    if (forceReset || needsMigration) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_KEYS.CAMPAIGN, JSON.stringify(INITIAL_CAMPAIGN));
      localStorage.setItem(STORAGE_KEYS.DOC_TYPES, JSON.stringify(INITIAL_DOCUMENT_TYPES));
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(INITIAL_EMAIL_LOGS));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      if (forceReset) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem('doctorat_auth_user');
        localStorage.removeItem('doctorat_session_token');
      }
    }
  }

  // --- Vérification automatique souveraine du délai de 72h ---
  public check72hTimeouts(): Application[] {
    const apps = this.getApplications();
    const now = new Date();
    let updated = false;

    apps.forEach((app) => {
      if (
        app.status === 'EN_ATTENTE_CORRECTION' &&
        app.correctionRequest &&
        !app.correctionRequest.isResolved &&
        new Date(app.correctionRequest.deadlineAt) <= now &&
        !app.correctionRequest.submittedAt
      ) {
        // Expiration du délai constatée par le serveur
        app.status = 'REJETEE_DELAI_EXPIRE';
        app.progressPercent = 0; // Parcours arrêté
        app.updatedAt = now.toISOString();
        updated = true;

        this.addAuditLog({
          userId: 'SYSTEM',
          userName: 'Automate Système (node-cron)',
          userRole: 'ADMINISTRATEUR',
          action: 'EXPIRATION_DELAI_72H',
          resourceType: 'Application',
          resourceId: app.id,
          details: `Rejet automatique de la candidature de ${app.candidateName} suite à l'expiration du délai impératif de 72h sans soumission des pièces rectificatives.`,
        });

        this.sendEmail({
          recipientEmail: app.candidateEmail,
          recipientName: app.candidateName,
          subject: 'Dossier de candidature rejeté pour expiration du délai de 72h',
          body: `Madame, Monsieur,\n\nNous vous informons que le délai impératif de 72 heures accordé pour la régularisation des pièces de votre candidature au sujet "${app.subjectTitle}" est arrivé à son terme le ${new Date(app.correctionRequest.deadlineAt).toLocaleString('fr-FR')}.\n\nFaute d'avoir déposé les corrections requises dans ce délai, votre dossier est définitivement déclaré irrecevable (Statut : Rejetée pour expiration du délai).\n\nCentre d'Études Doctorales.`,
          type: 'REJET_DELAI_72H',
        });

        this.addNotification({
          userId: app.candidateId,
          title: 'Candidature Rejetée - Délai de 72h Épuisé',
          message: 'Le délai imparti de 72h pour régulariser votre dossier est expiré. Votre candidature est classée sans suite.',
          type: 'ERROR',
        });
      }
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    }

    return apps;
  }

  // --- Utilisateurs et Authentification ---
  public getUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  public getCurrentUser(): User | null {
    const stored = localStorage.getItem('doctorat_auth_user') || localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        const users = this.getUsers();
        return users.find((u) => u.id === parsed.id) || parsed;
      } catch {
        return null;
      }
    }
    return null;
  }

  public setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem('doctorat_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('doctorat_auth_user');
      localStorage.removeItem('doctorat_session_token');
    }
  }

  public getActingUser(): User {
    const user = this.getCurrentUser();
    if (user) return user;
    return {
      id: 'SYSTEM',
      email: 'system@usmba.ac.ma',
      firstName: 'Administration',
      lastName: 'Système',
      role: 'ADMINISTRATEUR',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }

  public registerCandidate(data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone: string;
    cin: string;
    cneCnie: string;
    degreeName: string;
    institution: string;
  }): { success: boolean; error?: string; user?: User } {
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Cette adresse email est déjà enregistrée sur la plateforme.' };
    }
    if (users.some((u) => u.cin?.toUpperCase() === data.cin.toUpperCase())) {
      return { success: false, error: 'Ce numéro de CIN est déjà associé à un compte candidat.' };
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password || 'Demo2026!', salt);

    const newUser: User = {
      id: `user-cand-${Date.now()}`,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'CANDIDAT',
      phone: data.phone,
      cin: data.cin.toUpperCase(),
      cneCnie: data.cneCnie,
      degreeName: data.degreeName,
      institution: data.institution,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);

    this.addAuditLog({
      userId: newUser.id,
      userName: `${newUser.firstName} ${newUser.lastName}`,
      userRole: 'CANDIDAT',
      action: 'INSCRIPTION_COMPTE',
      resourceType: 'User',
      resourceId: newUser.id,
      details: 'Création de compte candidat avec vérification des identifiants nationaux.',
    });

    this.sendEmail({
      recipientEmail: newUser.email,
      recipientName: `${newUser.firstName} ${newUser.lastName}`,
      subject: 'Confirmation de création de votre compte candidat au doctorat (USMBA)',
      body: `Bonjour ${newUser.firstName},\n\nVotre compte candidat sur la plateforme de gestion des candidatures au doctorat de l'Université Sidi Mohamed Ben Abdellah a été créé avec succès.\n\nVous pouvez désormais vous connecter, consulter le catalogue des sujets et déposer votre dossier de candidature. Attention : la réglementation limite formellement chaque candidat à un seul sujet de recherche pour la campagne.\n\nLe Centre d'Études Doctorales.`,
      type: 'CREATION_COMPTE',
    });

    return { success: true, user: newUser };
  }

  // --- Campagne ---
  public getCampaign(): Campaign {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CAMPAIGN) || JSON.stringify(INITIAL_CAMPAIGN));
  }

  public updateCampaign(campaign: Partial<Campaign>): Campaign {
    const current = this.getCampaign();
    const updated = { ...current, ...campaign };
    localStorage.setItem(STORAGE_KEYS.CAMPAIGN, JSON.stringify(updated));

    const user = this.getActingUser();
    this.addAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      action: 'MISE_A_JOUR_CAMPAGNE',
      resourceType: 'Campaign',
      resourceId: updated.id,
      details: `Modification des paramètres de la campagne ${updated.code} (Statut: ${updated.status}).`,
    });

    return updated;
  }

  // --- Sujets de Thèse ---
  public getSubjects(): ThesisSubject[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
  }

  public addSubject(subjectData: Omit<ThesisSubject, 'id' | 'createdAt'>): ThesisSubject {
    const subjects = this.getSubjects();
    const newSubject: ThesisSubject = {
      ...subjectData,
      id: `subj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    subjects.unshift(newSubject);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));

    const user = this.getActingUser();
    this.addAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      action: 'CREATION_SUJET_THESE',
      resourceType: 'ThesisSubject',
      resourceId: newSubject.id,
      details: `Création du sujet de thèse "${newSubject.title}" par ${newSubject.supervisorName}.`,
    });

    return newSubject;
  }

  public toggleSubjectPublication(id: string): ThesisSubject | undefined {
    const subjects = this.getSubjects();
    const subj = subjects.find((s) => s.id === id);
    if (subj) {
      subj.isPublished = !subj.isPublished;
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
      return subj;
    }
    return undefined;
  }

  // --- Types de documents requis ---
  public getRequiredDocumentTypes(): RequiredDocumentType[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DOC_TYPES) || JSON.stringify(INITIAL_DOCUMENT_TYPES));
  }

  public updateDocumentTypes(types: RequiredDocumentType[]): void {
    localStorage.setItem(STORAGE_KEYS.DOC_TYPES, JSON.stringify(types));
  }

  // --- Candidatures ---
  public getApplications(): Application[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
  }

  public getApplicationById(id: string): Application | undefined {
    return this.getApplications().find((a) => a.id === id);
  }

  public getCandidateApplication(candidateId: string): Application | undefined {
    return this.getApplications().find((a) => a.candidateId === candidateId);
  }

  /**
   * Créer ou initialiser un brouillon de candidature
   * RÈGLE STRICTE : un candidat ne peut avoir qu'une seule candidature active par campagne
   */
  public createOrUpdateDraft(candidate: User, subjectId: string, summary: string): { success: boolean; error?: string; app?: Application } {
    const campaign = this.getCampaign();
    if (campaign.status !== 'OUVERTE') {
      return { success: false, error: 'Les candidatures ne sont pas ouvertes pour cette campagne.' };
    }

    const apps = this.getApplications();
    const existing = apps.find((a) => a.candidateId === candidate.id && a.campaignId === campaign.id);

    // Si une candidature est déjà soumise (non brouillon), le sujet est irrévocablement verrouillé
    if (existing && existing.status !== 'BROUILLON') {
      return {
        success: false,
        error: 'Votre candidature est déjà soumise. La réglementation interdit tout changement de sujet de thèse après la soumission.',
      };
    }

    const subject = this.getSubjects().find((s) => s.id === subjectId);
    if (!subject) {
      return { success: false, error: 'Sujet de thèse introuvable.' };
    }

    let targetApp: Application;

    if (existing) {
      // Mise à jour du brouillon existant (seul cas où le sujet est modifiable)
      existing.subjectId = subject.id;
      existing.subjectTitle = subject.title;
      existing.supervisorName = subject.supervisorName;
      existing.domain = subject.domain;
      existing.researchSummary = summary;
      existing.updatedAt = new Date().toISOString();
      targetApp = existing;
    } else {
      targetApp = {
        id: `app-${Date.now()}`,
        campaignId: campaign.id,
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        candidateEmail: candidate.email,
        candidatePhone: candidate.phone,
        candidateCin: candidate.cin,
        candidateCne: candidate.cneCnie,
        subjectId: subject.id,
        subjectTitle: subject.title,
        supervisorName: subject.supervisorName,
        domain: subject.domain,
        status: 'BROUILLON',
        currentStepIndex: 1,
        progressPercent: 20,
        researchSummary: summary,
        masterGrade: 16.0,
        masterOriginUniversity: candidate.institution,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documents: [],
      };
      apps.push(targetApp);
    }

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return { success: true, app: targetApp };
  }

  // Téléverser un document pour une candidature
  public uploadDocument(
    applicationId: string,
    docTypeCode: string,
    file: { name: string; size: number; mimeType: string }
  ): { success: boolean; error?: string; app?: Application } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Candidature introuvable.' };

    const docType = this.getRequiredDocumentTypes().find((t) => t.code === docTypeCode);
    if (!docType) return { success: false, error: 'Type de document inconnu.' };

    if (file.size > docType.maxSizeBytes) {
      return {
        success: false,
        error: `Le fichier dépasse la taille maximale autorisée (${(docType.maxSizeBytes / (1024 * 1024)).toFixed(1)} Mo).`,
      };
    }

    // Supprimer l'ancienne version s'il y en a une
    app.documents = app.documents.filter((d) => d.documentTypeCode !== docTypeCode);

    const newDoc: ApplicationDocument = {
      id: `doc-${Date.now()}`,
      applicationId: app.id,
      documentTypeCode: docType.code,
      documentLabel: docType.label,
      originalName: file.name,
      sizeBytes: file.size,
      mimeType: file.mimeType,
      uploadedAt: new Date().toISOString(),
    };

    app.documents.push(newDoc);
    app.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return { success: true, app };
  }

  // Soumission définitive de la candidature
  public submitApplication(applicationId: string): { success: boolean; error?: string; app?: Application } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Candidature introuvable.' };

    // Vérifier les pièces obligatoires
    const requiredTypes = this.getRequiredDocumentTypes().filter((t) => t.isRequired);
    for (const req of requiredTypes) {
      const present = app.documents.some((d) => d.documentTypeCode === req.code);
      if (!present) {
        return {
          success: false,
          error: `Pièce obligatoire manquante : ${req.label}. Veuillez téléverser toutes les pièces requises avant la soumission.`,
        };
      }
    }

    app.status = 'SOUMISE';
    app.currentStepIndex = 1;
    app.progressPercent = 25;
    app.submittedAt = new Date().toISOString();
    app.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    this.addAuditLog({
      userId: app.candidateId,
      userName: app.candidateName,
      userRole: 'CANDIDAT',
      action: 'SOUMISSION_DEFINITIVE',
      resourceType: 'Application',
      resourceId: app.id,
      details: `Soumission définitive du dossier pour le sujet "${app.subjectTitle}". Le choix du sujet est désormais verrouillé.`,
    });

    this.sendEmail({
      recipientEmail: app.candidateEmail,
      recipientName: app.candidateName,
      subject: 'Accusé de réception - Dépôt de candidature au doctorat (USMBA)',
      body: `Bonjour ${app.candidateName},\n\nNous vous confirmons la bonne réception de votre dossier de candidature au sujet :\n"${app.subjectTitle}" sous la direction de ${app.supervisorName}.\n\nVotre dossier est désormais transmis à la commission d'examen des pièces administratives. Vous recevrez une notification dès que la recevabilité de votre dossier sera confirmée.\n\nCentre d'Études Doctorales.`,
      type: 'ACCUSE_RECEPTION_CANDIDATURE',
    });

    return { success: true, app };
  }

  // --- Gestion des dossiers incomplets et déclenchement impératif du délai de 72h ---
  public requestCorrection(
    applicationId: string,
    instructions: string,
    missingItems: string[]
  ): { success: boolean; error?: string; app?: Application } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Candidature introuvable.' };

    const reviewer = this.getActingUser();
    const now = new Date();
    // 72h00m00s exactement
    const deadline = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();

    const correction: CorrectionRequest = {
      id: `corr-${Date.now()}`,
      applicationId: app.id,
      requestedById: reviewer.id,
      requestedByName: `${reviewer.title || ''} ${reviewer.firstName} ${reviewer.lastName}`.trim(),
      instructions,
      missingItems,
      deadlineAt: deadline,
      isResolved: false,
      createdAt: now.toISOString(),
    };

    app.status = 'EN_ATTENTE_CORRECTION';
    app.correctionRequest = correction;
    app.currentStepIndex = 2; // Étape 2 avec alerte
    app.updatedAt = now.toISOString();

    // Marquer les pièces concernées comme rejetées
    app.documents.forEach((doc) => {
      if (missingItems.includes(doc.documentTypeCode)) {
        doc.isApproved = false;
        doc.rejectionReason = instructions;
      }
    });

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    this.addAuditLog({
      userId: reviewer.id,
      userName: `${reviewer.firstName} ${reviewer.lastName}`,
      userRole: reviewer.role,
      action: 'DEMANDE_CORRECTION_72H',
      resourceType: 'Application',
      resourceId: app.id,
      details: `Dossier déclaré incomplet. Déclenchement du délai impératif de 72h expirant le ${new Date(deadline).toLocaleString('fr-FR')}. Pièces demandées : ${missingItems.join(', ')}.`,
    });

    this.sendEmail({
      recipientEmail: app.candidateEmail,
      recipientName: app.candidateName,
      subject: 'URGENT : Demande de correction de votre dossier de candidature (Délai : 72 heures)',
      body: `Bonjour ${app.candidateName},\n\nAprès examen administratif de votre dossier de candidature au doctorat pour le sujet "${app.subjectTitle}", des pièces ont été déclarées non conformes ou manquantes :\n\nMotifs & Instructions :\n${instructions}\n\nConformément à la réglementation ministérielle, vous disposez d'un DÉLAI STRICT ET IMPÉRATIF DE 72 HEURES à compter de la réception de cet email pour déposer vos pièces rectifiées dans votre espace candidat.\n\nDate limite de dépôt : ${new Date(deadline).toLocaleString('fr-FR')}\n\nATTENTION : Passé ce délai, votre dossier sera automatiquement et irrévocablement rejeté par le système informatique sans possibilité de recours.\n\nLe sujet de recherche choisi demeure verrouillé.\n\nCentre d'Études Doctorales.`,
      type: 'NOTIFICATION_72H',
    });

    this.addNotification({
      userId: app.candidateId,
      title: 'Action requise : Correction sous 72h',
      message: `Votre dossier nécessite des rectifications. Date limite : ${new Date(deadline).toLocaleString('fr-FR')}.`,
      type: 'DEADLINE',
      linkTab: 'corrections',
    });

    return { success: true, app };
  }

  // Soumission des corrections par le candidat avant les 72h
  public submitCorrection(applicationId: string): { success: boolean; error?: string; app?: Application } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Candidature introuvable.' };

    if (!app.correctionRequest) {
      return { success: false, error: 'Aucune demande de correction en cours.' };
    }

    const now = new Date();
    if (new Date(app.correctionRequest.deadlineAt) < now) {
      // Trop tard, le cron ou le serveur doit bloquer
      app.status = 'REJETEE_DELAI_EXPIRE';
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
      return {
        success: false,
        error: 'Le délai de 72 heures est expiré. Vos corrections ne peuvent plus être acceptées.',
      };
    }

    // Le candidat a répondu à temps !
    app.correctionRequest.submittedAt = now.toISOString();
    app.correctionRequest.isResolved = true;
    app.status = 'CORRECTION_SOUMISE';
    app.updatedAt = now.toISOString();

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    this.addAuditLog({
      userId: app.candidateId,
      userName: app.candidateName,
      userRole: 'CANDIDAT',
      action: 'SOUMISSION_CORRECTION_72H',
      resourceType: 'Application',
      resourceId: app.id,
      details: `Le candidat a soumis ses pièces de correction dans les délais réglementaires (${new Date().toLocaleString('fr-FR')}).`,
    });

    this.sendEmail({
      recipientEmail: app.candidateEmail,
      recipientName: app.candidateName,
      subject: 'Confirmation de dépôt de vos pièces rectifiées',
      body: `Bonjour ${app.candidateName},\n\nNous vous confirmons la réception de vos pièces justificatives rectifiées avant l'expiration du délai de 72h. Votre dossier est remis en file de vérification administrative.\n\nCentre d'Études Doctorales.`,
      type: 'CONFIRMATION_CORRECTION',
    });

    return { success: true, app };
  }

  // Validation de la recevabilité du dossier (passe en Présélection)
  public approveReceivability(applicationId: string): { success: boolean; error?: string; app?: Application } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Candidature introuvable.' };

    const reviewer = this.getActingUser();
    app.status = 'EN_PRESELECTION';
    app.currentStepIndex = 3;
    app.progressPercent = 45;
    app.updatedAt = new Date().toISOString();

    app.documents.forEach((d) => {
      d.isApproved = true;
    });

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    this.addAuditLog({
      userId: reviewer.id,
      userName: `${reviewer.firstName} ${reviewer.lastName}`,
      userRole: reviewer.role,
      action: 'DOSSIER_RECEVABLE',
      resourceType: 'Application',
      resourceId: app.id,
      details: `Dossier complet et validé administrativement. Transmission à la commission de présélection.`,
    });

    return { success: true, app };
  }

  // --- Présélection sur dossier ---
  public submitPreselectionReview(
    applicationId: string,
    decision: 'ACCEPTED' | 'REJECTED',
    score: number,
    comment: string
  ): { success: boolean; error?: string; app?: Application } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Candidature introuvable.' };

    const reviewer = this.getActingUser();
    app.preselectionScore = score;
    app.preselectionDecision = decision;
    app.preselectionComment = comment;

    if (decision === 'ACCEPTED') {
      app.status = 'PRESELECTIONNEE';
      app.currentStepIndex = 3;
      app.progressPercent = 55;
    } else {
      app.status = 'NON_PRESELECTIONNEE';
      app.progressPercent = 45; // Fin de parcours
    }

    app.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    this.addAuditLog({
      userId: reviewer.id,
      userName: `${reviewer.firstName} ${reviewer.lastName}`,
      userRole: reviewer.role,
      action: 'DECISION_PRESELECTION',
      resourceType: 'Application',
      resourceId: app.id,
      details: `Avis de présélection : ${decision} avec une note sur dossier de ${score}/20. Observations : "${comment}".`,
    });

    return { success: true, app };
  }

  // --- Entretiens ---
  public scheduleInterview(
    applicationId: string,
    interviewData: {
      scheduledDate: string;
      durationMinutes: number;
      roomLocation: string;
      committeeMembers: string[];
      notes?: string;
    }
  ): { success: boolean; error?: string; app?: Application } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Candidature introuvable.' };

    const interview: Interview = {
      id: `int-${Date.now()}`,
      applicationId: app.id,
      candidateName: app.candidateName,
      subjectTitle: app.subjectTitle,
      scheduledDate: interviewData.scheduledDate,
      durationMinutes: interviewData.durationMinutes,
      roomLocation: interviewData.roomLocation,
      committeeMembers: interviewData.committeeMembers,
      notes: interviewData.notes,
      isCompleted: false,
      evaluations: [],
    };

    app.interview = interview;
    app.status = 'ENTRETIEN_PROGRAMME';
    app.currentStepIndex = 4;
    app.progressPercent = 65;
    app.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    const reviewer = this.getActingUser();
    this.addAuditLog({
      userId: reviewer.id,
      userName: `${reviewer.firstName} ${reviewer.lastName}`,
      userRole: reviewer.role,
      action: 'PLANIFICATION_ENTRETIEN',
      resourceType: 'Interview',
      resourceId: interview.id,
      details: `Entretien programmé pour ${app.candidateName} le ${new Date(interviewData.scheduledDate).toLocaleString('fr-FR')} (${interviewData.roomLocation}).`,
    });

    this.sendEmail({
      recipientEmail: app.candidateEmail,
      recipientName: app.candidateName,
      subject: 'Convocation officielle à l\'entretien de sélection doctorale (USMBA)',
      body: `Bonjour ${app.candidateName},\n\nNous avons l'honneur de vous convoquer à l'entretien de sélection orale pour votre candidature au sujet :\n"${app.subjectTitle}".\n\nDate et Heure : ${new Date(interviewData.scheduledDate).toLocaleString('fr-FR')}\nDurée estimée : ${interviewData.durationMinutes} minutes\nLieu / Salle : ${interviewData.roomLocation}\nMembres du jury : ${interviewData.committeeMembers.join(', ')}\n\nConsignes : Veuillez vous munir de votre pièce d'identité originale et d'une présentation synthétique de votre projet de recherche.\n\nCentre d'Études Doctorales.`,
      type: 'CONVOCATION_ENTRETIEN',
    });

    this.addNotification({
      userId: app.candidateId,
      title: 'Convocation à l\'entretien oral',
      message: `Votre entretien est programmé le ${new Date(interviewData.scheduledDate).toLocaleString('fr-FR')} en ${interviewData.roomLocation}.`,
      type: 'CONVOCATION',
      linkTab: 'convocation',
    });

    return { success: true, app };
  }

  // Évaluation d'entretien (note sur 20 + commentaire obligatoire)
  public evaluateInterview(
    applicationId: string,
    score: number,
    comments: string
  ): { success: boolean; error?: string; app?: Application } {
    if (score < 0 || score > 20) {
      return { success: false, error: 'La note doit être obligatoirement comprise entre 0 et 20.' };
    }
    if (!comments.trim()) {
      return { success: false, error: 'Le commentaire d\'évaluation est obligatoire.' };
    }

    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app || !app.interview) return { success: false, error: 'Entretien introuvable pour cette candidature.' };

    const evaluator = this.getActingUser();

    // Remplacer ou ajouter l'évaluation
    app.interview.evaluations = app.interview.evaluations.filter((e) => e.evaluatorId !== evaluator.id);
    app.interview.evaluations.push({
      evaluatorId: evaluator.id,
      evaluatorName: `${evaluator.title || ''} ${evaluator.firstName} ${evaluator.lastName}`.trim(),
      score,
      comments,
      submittedAt: new Date().toISOString(),
    });

    app.interview.isCompleted = true;
    app.status = 'ENTRETIEN_EFFECTUE';
    app.currentStepIndex = 4;
    app.progressPercent = 75;
    app.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    this.addAuditLog({
      userId: evaluator.id,
      userName: `${evaluator.firstName} ${evaluator.lastName}`,
      userRole: evaluator.role,
      action: 'EVALUATION_ENTRETIEN',
      resourceType: 'Interview',
      resourceId: app.interview.id,
      details: `Attribution de la note ${score}/20 par ${evaluator.lastName} pour ${app.candidateName}. Remarque : "${comments}".`,
    });

    return { success: true, app };
  }

  // --- Délibérations et Publication des Résultats ---
  public saveDeliberation(
    applicationId: string,
    decision: DecisionType,
    finalScore: number,
    waitingListRank?: number
  ): { success: boolean; error?: string; app?: Application } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Candidature introuvable.' };

    app.deliberation = {
      id: `delib-${Date.now()}`,
      applicationId: app.id,
      decision,
      finalScore,
      waitingListRank: decision === 'LISTE_ATTENTE' ? waitingListRank : undefined,
      isPublished: app.deliberation?.isPublished || false,
      promotedFromWait: false,
      decisionDate: new Date().toISOString(),
    };

    if (decision === 'ADMIS') {
      app.status = 'ADMISE';
      app.currentStepIndex = 5;
      app.progressPercent = 85;
    } else if (decision === 'LISTE_ATTENTE') {
      app.status = 'LISTE_ATTENTE';
      app.currentStepIndex = 5;
      app.progressPercent = 80;
    } else {
      app.status = 'REFUSEE';
      app.currentStepIndex = 5;
      app.progressPercent = 75;
    }

    app.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    return { success: true, app };
  }

  // Publication officielle des résultats (rend visible aux candidats)
  public publishResults(): { success: boolean; count: number } {
    const apps = this.getApplications();
    const reviewer = this.getActingUser();
    let count = 0;

    apps.forEach((app) => {
      if (app.deliberation && !app.deliberation.isPublished) {
        app.deliberation.isPublished = true;
        app.deliberation.publishedAt = new Date().toISOString();
        count++;

        if (app.deliberation.decision === 'ADMIS') {
          this.sendEmail({
            recipientEmail: app.candidateEmail,
            recipientName: app.candidateName,
            subject: 'Félicitations : Décision d\'admission au doctorat (USMBA)',
            body: `Bonjour ${app.candidateName},\n\nNous avons l'immense honneur de vous annoncer que la commission de sélection doctorale a validé votre ADMISSION au sujet de thèse :\n"${app.subjectTitle}".\n\nVotre statut est désormais "Admis". Veuillez vous connecter à votre espace candidat pour prendre connaissance des consignes et documents exigés pour la confirmation de votre inscription administrative en présentiel.\n\nCentre d'Études Doctorales.`,
            type: 'ADMISSION_OFFICIELLE',
          });

          this.addNotification({
            userId: app.candidateId,
            title: 'Félicitations ! Vous êtes admis(e)',
            message: 'Les résultats officiels sont publiés. Consultez les instructions pour votre inscription physique.',
            type: 'SUCCESS',
            linkTab: 'resultats',
          });
        } else if (app.deliberation.decision === 'LISTE_ATTENTE') {
          this.sendEmail({
            recipientEmail: app.candidateEmail,
            recipientName: app.candidateName,
            subject: 'Résultats de sélection doctorale : Liste d\'Attente (USMBA)',
            body: `Bonjour ${app.candidateName},\n\nSuite aux délibérations de la commission, votre candidature a été retenue sur la LISTE D'ATTENTE au rang n° ${app.deliberation.waitingListRank}.\n\nEn cas de désistement d'un candidat admis, le secrétariat du CED prendra directement contact avec vous selon l'ordre strict de classement.\n\nCentre d'Études Doctorales.`,
            type: 'RESULTAT_LISTE_ATTENTE',
          });
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    this.addAuditLog({
      userId: reviewer.id,
      userName: `${reviewer.firstName} ${reviewer.lastName}`,
      userRole: reviewer.role,
      action: 'PUBLICATION_OFFICIELLE_RESULTATS',
      resourceType: 'DeliberationDecision',
      resourceId: 'ALL',
      details: `Publication officielle des résultats d'admission et des listes d'attente pour ${count} candidatures.`,
    });

    return { success: true, count };
  }

  // Promotion motivée depuis la liste d'attente
  public promoteFromWaitlist(
    applicationId: string,
    reason: string
  ): { success: boolean; error?: string; app?: Application } {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app || !app.deliberation) return { success: false, error: 'Décision introuvable.' };

    const reviewer = this.getActingUser();
    app.deliberation.decision = 'ADMIS';
    app.deliberation.promotedFromWait = true;
    app.deliberation.promotionReason = reason;
    app.status = 'ADMISE';
    app.progressPercent = 85;
    app.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    this.addAuditLog({
      userId: reviewer.id,
      userName: `${reviewer.firstName} ${reviewer.lastName}`,
      userRole: reviewer.role,
      action: 'PROMOTION_LISTE_ATTENTE',
      resourceType: 'Application',
      resourceId: app.id,
      details: `Promotion officielle de ${app.candidateName} depuis la liste d'attente vers la liste principale des admis. Motif impératif : "${reason}".`,
    });

    this.sendEmail({
      recipientEmail: app.candidateEmail,
      recipientName: app.candidateName,
      subject: 'Bonne nouvelle : Promotion de la Liste d\'Attente vers la Liste des Admis (USMBA)',
      body: `Bonjour ${app.candidateName},\n\nSuite à un désistement de place sur le sujet "${app.subjectTitle}", vous avez été officiellement promu(e) sur la liste des ADMIS.\n\nVous êtes invité(e) à préparer votre dossier d'inscription physique en présentiel.\n\nCentre d'Études Doctorales.`,
      type: 'PROMOTION_ATTENTE',
    });

    return { success: true, app };
  }

  // --- Inscription Administrative Initiale en Présentiel ---
  public confirmPhysicalEnrollment(
    applicationId: string,
    verificationData: {
      diplomasVerified: boolean;
      transcriptsVerified: boolean;
      charterSigned: boolean;
      officerRemarks?: string;
    }
  ): { success: boolean; error?: string; app?: Application } {
    if (!verificationData.diplomasVerified || !verificationData.charterSigned) {
      return {
        success: false,
        error: 'La confirmation d\'inscription exige la vérification des originaux ET la signature de la Charte de Thèse.',
      };
    }

    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { success: false, error: 'Candidature introuvable.' };

    const officer = this.getActingUser();
    const now = new Date();

    app.enrollment = {
      id: `enr-${Date.now()}`,
      applicationId: app.id,
      verifiedById: officer.id,
      verifiedByName: `${officer.title || ''} ${officer.firstName} ${officer.lastName}`.trim(),
      presentationDate: now.toISOString(),
      diplomasVerified: verificationData.diplomasVerified,
      transcriptsVerified: verificationData.transcriptsVerified,
      charterSigned: verificationData.charterSigned,
      isConfirmed: true,
      confirmedAt: now.toISOString(),
      officerRemarks: verificationData.officerRemarks,
    };

    app.status = 'INSCRIPTION_CONFIRMEE';
    app.currentStepIndex = 6;
    app.progressPercent = 100; // ATTEINT 100% UNIQUEMENT ICI !
    app.updatedAt = now.toISOString();

    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));

    this.addAuditLog({
      userId: officer.id,
      userName: `${officer.firstName} ${officer.lastName}`,
      userRole: officer.role,
      action: 'CONFIRMATION_INSCRIPTION_PHYSIQUE',
      resourceType: 'EnrollmentVerification',
      resourceId: app.enrollment.id,
      details: `Inscription administrative confirmée en présentiel pour le doctorant ${app.candidateName} par ${officer.lastName}. Originaux contrôlés et Charte de thèse signée.`,
    });

    this.sendEmail({
      recipientEmail: app.candidateEmail,
      recipientName: app.candidateName,
      subject: 'Attestation Officielle : Inscription Administrative au Doctorat Confirmée (USMBA)',
      body: `Bonjour ${app.candidateName},\n\nNous avons le plaisir de vous confirmer que votre inscription administrative initiale en première année de doctorat au sein de l'Université Sidi Mohamed Ben Abdellah a été officiellement enregistrée et validée en présentiel ce jour.\n\nSujet : ${app.subjectTitle}\nDirecteur : ${app.supervisorName}\nStructure de recherche : ${app.domain}\n\nFélicitations pour cette étape marquant le début de vos travaux de recherche doctorale.\n\nCentre d'Études Doctorales.`,
      type: 'CONFIRMATION_INSCRIPTION',
    });

    this.addNotification({
      userId: app.candidateId,
      title: 'Inscription Administrative Confirmée (100 %)',
      message: 'Votre inscription physique au CED est validée. Bienvenue parmi les doctorants de l\'USMBA !',
      type: 'SUCCESS',
      linkTab: 'suivi',
    });

    return { success: true, app };
  }

  // --- Notifications ---
  public getNotifications(userId?: string): NotificationItem[] {
    const all: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    if (userId) {
      return all.filter((n) => n.userId === userId);
    }
    return all;
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): NotificationItem {
    const list = this.getNotifications();
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    return item;
  }

  public markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
  }

  // --- Emails ---
  public getEmailLogs(): EmailLog[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS) || '[]');
  }

  public sendEmail(emailData: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
    type: string;
  }): EmailLog {
    const logs = this.getEmailLogs();
    const log: EmailLog = {
      id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientEmail: emailData.recipientEmail,
      recipientName: emailData.recipientName,
      subject: emailData.subject,
      body: emailData.body,
      type: emailData.type,
      status: 'DELIVERED',
      sentAt: new Date().toISOString(),
    };
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(logs));
    return log;
  }

  // --- Journal d'Audit ---
  public getAuditLogs(): AuditLog[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  }

  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const logs = this.getAuditLogs();
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    return log;
  }
}

export const storageService = new StorageService();
