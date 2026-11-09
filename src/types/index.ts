/**
 * Modèle de données & Types TypeScript - Plateforme Doctorat Maroc
 * Arrêté ministériel n° 1886.23 du 1er août 2024
 */

export type Role = 'CANDIDAT' | 'DIRECTEUR_THESE' | 'DIRECTEUR_CED' | 'ADMINISTRATEUR';

export type CampaignStatus = 'PREPARATION' | 'OUVERTE' | 'FERMEE' | 'CLOTUREE';

export type ApplicationStatus =
  | 'BROUILLON'
  | 'SOUMISE'
  | 'EN_COURS_VERIFICATION'
  | 'INCOMPLETE'
  | 'EN_ATTENTE_CORRECTION'
  | 'CORRECTION_SOUMISE'
  | 'COMPLETE'
  | 'EN_PRESELECTION'
  | 'NON_PRESELECTIONNEE'
  | 'PRESELECTIONNEE'
  | 'ENTRETIEN_PROGRAMME'
  | 'ENTRETIEN_EFFECTUE'
  | 'EN_ATTENTE_DELIBERATION'
  | 'ADMISE'
  | 'LISTE_ATTENTE'
  | 'REFUSEE'
  | 'REJETEE_DELAI_EXPIRE'
  | 'EN_ATTENTE_INSCRIPTION'
  | 'INSCRIPTION_CONFIRMEE';

export type DecisionType = 'ADMIS' | 'LISTE_ATTENTE' | 'REFUSE';

export type CommitteeRole = 'PRESIDENT' | 'MEMBRE' | 'RAPPORTEUR';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
  cin?: string;
  cneCnie?: string;
  degreeName?: string;
  institution?: string;
  department?: string;
  title?: string; // Pr., Dr., etc.
  isActive: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  code: string;
  title: string;
  academicYear: string;
  description: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  correctionHoursAllowed: number; // 72
  isCurrent: boolean;
  maxThesesPerSupervisor: number;
}

export interface ThesisSubject {
  id: string;
  campaignId: string;
  supervisorId: string;
  supervisorName: string;
  supervisorEmail: string;
  title: string;
  description: string;
  domain: string;
  keywords: string[];
  labStructure: string;
  institution: string;
  quotaSlots: number;
  isPublished: boolean;
  createdAt: string;
}

export interface RequiredDocumentType {
  id: string;
  code: string;
  label: string;
  description: string;
  isRequired: boolean;
  maxSizeBytes: number;
  allowedMime: string;
  displayOrder: number;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentTypeCode: string;
  documentLabel: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  isApproved?: boolean;
  rejectionReason?: string;
  fileUrl?: string;
}

export interface CorrectionRequest {
  id: string;
  applicationId: string;
  requestedById: string;
  requestedByName: string;
  instructions: string;
  missingItems: string[]; // Codes des documents ou rubriques à corriger
  deadlineAt: string; // ISO String (Date.now() + 72h)
  submittedAt?: string;
  isResolved: boolean;
  createdAt: string;
}

export interface InterviewEvaluation {
  evaluatorId: string;
  evaluatorName: string;
  score: number; // 0 à 20
  comments: string;
  submittedAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  candidateName: string;
  subjectTitle: string;
  scheduledDate: string; // ISO string
  durationMinutes: number;
  roomLocation: string;
  committeeMembers: string[]; // Noms des examinateurs
  notes?: string;
  isCompleted: boolean;
  evaluations: InterviewEvaluation[];
}

export interface DeliberationDecision {
  id: string;
  applicationId: string;
  decision: DecisionType;
  finalScore?: number; // Moyenne calculée
  waitingListRank?: number; // Rang sur la liste d'attente
  isPublished: boolean;
  promotedFromWait: boolean;
  promotionReason?: string;
  decisionDate: string;
  publishedAt?: string;
}

export interface EnrollmentVerification {
  id: string;
  applicationId: string;
  verifiedById: string;
  verifiedByName: string;
  presentationDate: string;
  diplomasVerified: boolean;
  transcriptsVerified: boolean;
  charterSigned: boolean;
  isConfirmed: boolean;
  confirmedAt?: string;
  officerRemarks?: string;
}

export interface Application {
  id: string;
  campaignId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateCin?: string;
  candidateCne?: string;
  subjectId: string;
  subjectTitle: string;
  supervisorName: string;
  domain: string;
  status: ApplicationStatus;
  currentStepIndex: number; // 1 à 6
  progressPercent: number; // 0 à 100
  researchSummary: string;
  masterGrade?: number;
  masterOriginUniversity?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  documents: ApplicationDocument[];
  correctionRequest?: CorrectionRequest;
  preselectionScore?: number;
  preselectionDecision?: 'ACCEPTED' | 'REJECTED';
  preselectionComment?: string;
  interview?: Interview;
  deliberation?: DeliberationDecision;
  enrollment?: EnrollmentVerification;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'DEADLINE' | 'CONVOCATION';
  isRead: boolean;
  createdAt: string;
  linkTab?: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  type: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  timestamp: string;
}
