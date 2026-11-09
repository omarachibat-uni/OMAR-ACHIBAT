/**
 * Plateforme Web de Gestion des Candidatures au Doctorat
 * Université Sidi Mohamed Ben Abdellah - Fès
 * Conforme à la décision ministérielle n° 1886.23 du 1er août 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NotificationsModal } from './components/NotificationsModal';
import { EmailModal } from './components/EmailModal';
import { PublicHome } from './pages/PublicHome';
import { SubjectsCatalog } from './pages/SubjectsCatalog';
import { CandidateSpace } from './pages/CandidateSpace';
import { SupervisorSpace } from './pages/SupervisorSpace';
import { DirectorSpace } from './pages/DirectorSpace';
import { AdminSpace } from './pages/AdminSpace';
import { AuthPages } from './pages/AuthPages';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { Application, Campaign, EmailLog, RequiredDocumentType, ThesisSubject, User } from './types';
import { GraduationCap, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getAuthenticatedUser());
  const [campaign, setCampaign] = useState<Campaign>(() => storageService.getCampaign());
  const [subjects, setSubjects] = useState<ThesisSubject[]>(() => storageService.getSubjects());
  const [applications, setApplications] = useState<Application[]>(() => storageService.getApplications());
  const [documentTypes, setDocumentTypes] = useState<RequiredDocumentType[]>(() => storageService.getRequiredDocumentTypes());
  const [auditLogs, setAuditLogs] = useState(() => storageService.getAuditLogs());
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => storageService.getEmailLogs());
  const [notifications, setNotifications] = useState(() => storageService.getNotifications(currentUser?.id));

  // Vue courante : démarre sur la page d'accueil ou redirection rôle si connecté
  const [currentView, setCurrentView] = useState<string>(() => {
    const user = authService.getAuthenticatedUser();
    return user ? authService.getDefaultRouteForRole(user.role) : 'login';
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);

  // Modales
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEmailsOpen, setIsEmailsOpen] = useState(false);

  // Rechargement centralisé des données
  const refreshAllData = useCallback(() => {
    storageService.check72hTimeouts();

    const freshUser = authService.getAuthenticatedUser();
    setCurrentUser(freshUser);
    setCampaign(storageService.getCampaign());
    setSubjects(storageService.getSubjects());
    setApplications(storageService.getApplications());
    setDocumentTypes(storageService.getRequiredDocumentTypes());
    setAuditLogs(storageService.getAuditLogs());
    setEmailLogs(storageService.getEmailLogs());
    setNotifications(storageService.getNotifications(freshUser?.id));
  }, []);

  // Surveillance périodique en arrière-plan du délai souverain de 72h
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(() => {
      storageService.check72hTimeouts();
      setApplications(storageService.getApplications());
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Candidature active du candidat connecté
  const currentCandidateApp = currentUser && currentUser.role === 'CANDIDAT'
    ? applications.find((a) => a.candidateId === currentUser.id)
    : undefined;

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  /**
   * Navigation sécurisée avec contrôle d'accès strict par rôle
   */
  const handleNavigate = (view: string) => {
    const restrictedViews = ['candidate_space', 'supervisor_space', 'director_space', 'admin_space'];

    if (restrictedViews.includes(view)) {
      if (!currentUser) {
        setCurrentView('login');
        return;
      }

      if (view === 'candidate_space' && currentUser.role !== 'CANDIDAT') {
        alert('Accès refusé : cet espace est exclusivement réservé aux candidats.');
        setCurrentView(authService.getDefaultRouteForRole(currentUser.role));
        return;
      }
      if (view === 'supervisor_space' && currentUser.role !== 'DIRECTEUR_THESE') {
        alert('Accès refusé : cet espace est exclusivement réservé aux directeurs de thèse.');
        setCurrentView(authService.getDefaultRouteForRole(currentUser.role));
        return;
      }
      if (view === 'director_space' && currentUser.role !== 'DIRECTEUR_CED') {
        alert('Accès refusé : cet espace est exclusivement réservé à la direction du CED.');
        setCurrentView(authService.getDefaultRouteForRole(currentUser.role));
        return;
      }
      if (view === 'admin_space' && currentUser.role !== 'ADMINISTRATEUR') {
        alert('Accès refusé : cet espace est exclusivement réservé aux administrateurs.');
        setCurrentView(authService.getDefaultRouteForRole(currentUser.role));
        return;
      }
    }

    setCurrentView(view);
  };

  /**
   * Gestion de la connexion réussie avec redirection automatique selon le rôle
   */
  const handleSuccessLogin = (user: User) => {
    setCurrentUser(user);
    refreshAllData();
    const targetDashboard = authService.getDefaultRouteForRole(user.role);
    setCurrentView(targetDashboard);
  };

  /**
   * Déconnexion sécurisée : purge de la session et redirection vers /login
   */
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    refreshAllData();
    setCurrentView('login');
  };

  const handleResetDatabase = () => {
    if (confirm('Voulez-vous réinitialiser les données de démonstration (sujets, 4 comptes de test, etc.) ?')) {
      storageService.initDatabase(true);
      const fresh = authService.getAuthenticatedUser();
      setCurrentUser(fresh);
      refreshAllData();
      if (!fresh) {
        setCurrentView('login');
      }
    }
  };

  const handleApplySubjectFromCatalog = (subjectId: string) => {
    if (!currentUser) {
      alert('Veuillez vous connecter avec un compte candidat pour postuler à un sujet.');
      setCurrentView('login');
      return;
    }

    if (currentUser.role !== 'CANDIDAT') {
      alert('Seuls les candidats peuvent postuler à un sujet de thèse.');
      return;
    }

    const res = storageService.createOrUpdateDraft(currentUser, subjectId, '');
    if (res.success) {
      refreshAllData();
      setCurrentView('candidate_space');
    } else {
      alert(res.error || 'Erreur lors de la sélection du sujet.');
    }
  };

  const handleResendEmail = (email: EmailLog) => {
    storageService.sendEmail({
      recipientEmail: email.recipientEmail,
      recipientName: email.recipientName,
      subject: `[RÉÉMISSION] ${email.subject}`,
      body: email.body,
      type: email.type,
    });
    refreshAllData();
    alert(`Courriel réémis avec succès vers ${email.recipientEmail}.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E9EDF2] text-[#17365D]">
      {/* En-tête Institutionnel Officiel */}
      <Header
        currentUser={currentUser}
        campaign={campaign}
        unreadNotifsCount={unreadNotifsCount}
        emailCount={emailLogs.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenEmails={() => setIsEmailsOpen(true)}
        onLogout={handleLogout}
        onResetDatabase={handleResetDatabase}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Contenu Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'public_home' && (
          <PublicHome
            campaign={campaign}
            subjects={subjects}
            onNavigate={handleNavigate}
            onSelectSubject={(id) => {
              setSelectedSubjectId(id);
              handleNavigate('subjects_catalog');
            }}
          />
        )}

        {currentView === 'subjects_catalog' && (
          <SubjectsCatalog
            subjects={subjects}
            currentUser={currentUser || {
              id: 'guest',
              email: '',
              firstName: 'Visiteur',
              lastName: '',
              role: 'CANDIDAT',
              isActive: false,
              createdAt: '',
            }}
            currentApplication={currentCandidateApp}
            campaign={campaign}
            onApplySubject={handleApplySubjectFromCatalog}
            onNavigate={handleNavigate}
            initialSelectedId={selectedSubjectId}
          />
        )}

        {/* Page de Connexion / Inscription / Récupération */}
        {(currentView === 'login' || currentView === 'register' || currentView === 'forgot') && (
          <AuthPages
            initialMode={currentView === 'register' ? 'register' : currentView === 'forgot' ? 'forgot' : 'login'}
            onSuccessLogin={handleSuccessLogin}
            onNavigate={handleNavigate}
          />
        )}

        {/* Espace Candidat */}
        {currentView === 'candidate_space' && currentUser && currentUser.role === 'CANDIDAT' && (
          <CandidateSpace
            currentUser={currentUser}
            campaign={campaign}
            currentApplication={currentCandidateApp}
            onRefreshApplication={refreshAllData}
            onNavigate={handleNavigate}
            documentTypes={documentTypes}
          />
        )}

        {/* Espace Directeur de Thèse */}
        {currentView === 'supervisor_space' && currentUser && currentUser.role === 'DIRECTEUR_THESE' && (
          <SupervisorSpace
            currentUser={currentUser}
            campaign={campaign}
            subjects={subjects}
            applications={applications}
            onRefreshData={refreshAllData}
          />
        )}

        {/* Espace Directeur du CED */}
        {currentView === 'director_space' && currentUser && currentUser.role === 'DIRECTEUR_CED' && (
          <DirectorSpace
            currentUser={currentUser}
            campaign={campaign}
            applications={applications}
            documentTypes={documentTypes}
            onRefreshData={refreshAllData}
          />
        )}

        {/* Espace Administrateur */}
        {currentView === 'admin_space' && currentUser && currentUser.role === 'ADMINISTRATEUR' && (
          <AdminSpace
            currentUser={currentUser}
            campaign={campaign}
            subjects={subjects}
            applications={applications}
            users={storageService.getUsers()}
            documentTypes={documentTypes}
            auditLogs={auditLogs}
            onRefreshData={refreshAllData}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>

      {/* Modale des Notifications */}
      {currentUser && (
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onNotificationRead={refreshAllData}
          onNavigateTab={(tab) => {
            if (currentUser.role === 'CANDIDAT') handleNavigate('candidate_space');
            else if (currentUser.role === 'DIRECTEUR_CED') handleNavigate('director_space');
            else if (currentUser.role === 'DIRECTEUR_THESE') handleNavigate('supervisor_space');
          }}
        />
      )}

      {/* Modale d'Inspection des Emails (Simulation Nodemailer) */}
      <EmailModal
        isOpen={isEmailsOpen}
        onClose={() => setIsEmailsOpen(false)}
        emailLogs={emailLogs}
        onResend={handleResendEmail}
      />

      {/* Pied de page institutionnel */}
      <footer className="bg-[#17365D] text-white border-t border-[#B69248]/30 py-8 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#B69248]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="font-serif font-bold text-white text-sm">
                Université Sidi Mohamed Ben Abdellah de Fès (USMBA)
              </p>
              <p className="text-[11px] text-slate-400">
                Centre d'Études Doctorales (CED) — Décret ministériel n° 1886.23 du 1er août 2024
              </p>
            </div>
          </div>

          <div className="text-center md:text-right text-[11px] space-y-1 text-slate-400">
            <p>Plateforme institutionnelle de sélection et d'inscription administrative au doctorat</p>
            <p className="text-[#B69248] font-semibold">
              Authentification sécurisée par mot de passe haché (bcrypt) et contrôle d'accès strict
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
