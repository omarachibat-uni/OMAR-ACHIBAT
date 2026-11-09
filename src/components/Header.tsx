import React, { useState } from 'react';
import {
  GraduationCap,
  Bell,
  Mail,
  UserCheck,
  ChevronDown,
  LogOut,
  RotateCcw,
  BookOpen,
  Calendar,
  Layers,
  FileCheck,
  ShieldAlert,
  LogIn,
  User as UserIcon,
} from 'lucide-react';
import { Campaign, Role, User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  campaign: Campaign;
  unreadNotifsCount: number;
  emailCount: number;
  onOpenNotifications: () => void;
  onOpenEmails: () => void;
  onLogout: () => void;
  onResetDatabase: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  campaign,
  unreadNotifsCount,
  emailCount,
  onOpenNotifications,
  onOpenEmails,
  onLogout,
  onResetDatabase,
  currentView,
  onNavigate,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const roleLabels: Record<Role, { label: string; badgeClass: string }> = {
    CANDIDAT: { label: 'Candidat / Étudiant', badgeClass: 'bg-blue-100 text-[#17365D] border-blue-200' },
    DIRECTEUR_THESE: { label: 'Directeur de Thèse (Pr.)', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
    DIRECTEUR_CED: { label: 'Directeur du CED', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
    ADMINISTRATEUR: { label: 'Administrateur', badgeClass: 'bg-purple-100 text-purple-900 border-purple-200' },
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      {/* Bandeau officiel supérieur */}
      <div className="bg-[#17365D] text-white py-1.5 px-4 sm:px-8 text-[11px] font-medium tracking-wide flex flex-wrap items-center justify-between border-b border-[#B69248]/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B69248] inline-block animate-pulse"></span>
            <span className="font-serif uppercase tracking-wider text-slate-200">
              Royaume du Maroc — Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation
            </span>
          </div>
          <span className="hidden md:inline text-white/40">|</span>
          <span className="hidden md:inline text-[#B69248] font-semibold">
            Arrêté ministériel n° 1886.23 du 1er août 2024
          </span>
        </div>

        {/* Bouton de réinitialisation des données de test */}
        <div className="flex items-center gap-3">
          <button
            onClick={onResetDatabase}
            title="Réinitialiser les données de test"
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Réinitialiser Démo</span>
          </button>
        </div>
      </div>

      {/* Barre Principale */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Identité Université */}
          <div
            onClick={() => onNavigate('public_home')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#17365D] to-[#0f233d] flex items-center justify-center text-white shadow-md border-2 border-[#B69248]/40 group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="w-7 h-7 text-[#B69248]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-base sm:text-lg tracking-tight text-[#17365D]">
                  UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH
                </span>
                <span className="text-[10px] bg-[#B69248]/15 text-[#917130] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  USMBA FÈS
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium tracking-tight">
                Centre d'Études Doctorales (CED) — Portail des Candidatures au Doctorat
              </p>
            </div>
          </div>

          {/* Contrôles utilisateur & alertes */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Statut de la campagne */}
            <div className="hidden lg:flex flex-col items-end px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-bold text-[#17365D]">Campagne {campaign.academicYear}</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                {campaign.status} (Clôture : 15 Déc.)
              </span>
            </div>

            {/* Bouton Boîte Email Simulé */}
            <button
              onClick={onOpenEmails}
              title="Centre d'emails envoyés (Simulation Nodemailer)"
              className="relative p-2 text-slate-600 hover:text-[#17365D] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              <Mail className="w-5 h-5" />
              {emailCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#17365D] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {emailCount}
                </span>
              )}
            </button>

            {/* Bouton Notifications */}
            {currentUser && (
              <button
                onClick={onOpenNotifications}
                title="Notifications système"
                className="relative p-2 text-slate-600 hover:text-[#17365D] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
            )}

            {/* Profil Utilisateur ou Bouton Connexion */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 hover:border-[#17365D] bg-white transition-all cursor-pointer shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-full bg-[#17365D] text-[#B69248] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                    {currentUser.firstName[0]}
                    {currentUser.lastName[0]}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-[#17365D] leading-tight">
                      {currentUser.title ? `${currentUser.title} ` : ''}
                      {currentUser.firstName} {currentUser.lastName}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      {roleLabels[currentUser.role]?.label}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Menu profil authentifié avec UNIQUEMENT ses informations et bouton Déconnexion */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="pb-3 border-b border-slate-100">
                      <div className="text-xs font-bold text-[#17365D]">
                        {currentUser.title ? `${currentUser.title} ` : ''}
                        {currentUser.firstName} {currentUser.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                        {currentUser.email}
                      </div>
                      <div className="mt-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            roleLabels[currentUser.role]?.badgeClass
                          }`}
                        >
                          {roleLabels[currentUser.role]?.label}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left p-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 rounded-xl bg-[#17365D] hover:bg-[#102742] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4 text-[#B69248]" />
                Se connecter
              </button>
            )}
          </div>
        </div>

        {/* Barre de navigation institutionnelle */}
        <nav className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('public_home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                currentView === 'public_home'
                  ? 'bg-[#17365D] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Accueil & Campagne
            </button>

            <button
              onClick={() => onNavigate('subjects_catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'subjects_catalog'
                  ? 'bg-[#17365D] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Sujets de Thèse
            </button>

            {currentUser?.role === 'CANDIDAT' && (
              <button
                onClick={() => onNavigate('candidate_space')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'candidate_space'
                    ? 'bg-[#17365D] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Mon Espace Candidat
              </button>
            )}

            {currentUser?.role === 'DIRECTEUR_THESE' && (
              <button
                onClick={() => onNavigate('supervisor_space')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'supervisor_space'
                    ? 'bg-[#17365D] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Espace Directeur de Thèse
              </button>
            )}

            {currentUser?.role === 'DIRECTEUR_CED' && (
              <button
                onClick={() => onNavigate('director_space')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'director_space'
                    ? 'bg-[#17365D] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                Supervision du CED
              </button>
            )}

            {currentUser?.role === 'ADMINISTRATEUR' && (
              <button
                onClick={() => onNavigate('admin_space')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'admin_space'
                    ? 'bg-[#17365D] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Administration Système
              </button>
            )}
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Connecté en tant que : <strong className="text-[#17365D]">{currentUser.email}</strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Non connecté
              </span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
