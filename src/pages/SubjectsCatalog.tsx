import React, { useState } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  User,
  Building,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Application, Campaign, ThesisSubject, User as UserModel } from '../types';

interface SubjectsCatalogProps {
  subjects: ThesisSubject[];
  currentUser: UserModel;
  currentApplication?: Application;
  campaign: Campaign;
  onApplySubject: (subjectId: string) => void;
  onNavigate: (view: string) => void;
  initialSelectedId?: string;
}

export const SubjectsCatalog: React.FC<SubjectsCatalogProps> = ({
  subjects,
  currentUser,
  currentApplication,
  campaign,
  onApplySubject,
  onNavigate,
  initialSelectedId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [activeSubject, setActiveSubject] = useState<ThesisSubject | null>(() => {
    if (initialSelectedId) {
      return subjects.find((s) => s.id === initialSelectedId) || null;
    }
    return null;
  });

  const domains = ['ALL', ...Array.from(new Set(subjects.map((s) => s.domain)))];

  const filteredSubjects = subjects.filter((s) => {
    if (!s.isPublished) return false;
    const matchesDomain = selectedDomain === 'ALL' || s.domain === selectedDomain;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.supervisorName.toLowerCase().includes(q) ||
      s.labStructure.toLowerCase().includes(q) ||
      s.keywords.some((kw) => kw.toLowerCase().includes(q));
    return matchesDomain && matchesSearch;
  });

  const isCandidate = currentUser.role === 'CANDIDAT';
  const hasSubmittedApp = currentApplication && currentApplication.status !== 'BROUILLON';

  const handleApplyClick = (subj: ThesisSubject) => {
    if (!isCandidate) {
      alert('Veuillez vous connecter avec un compte Candidat pour postuler à un sujet.');
      return;
    }
    if (hasSubmittedApp) {
      alert('Règle réglementaire stricte : Votre candidature est déjà soumise. Le choix de sujet de thèse est définitivement verrouillé pour la campagne.');
      return;
    }
    onApplySubject(subj.id);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* En-tête */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#17365D] text-xs font-semibold border border-blue-200">
            <BookOpen className="w-3.5 h-3.5" /> Catalogue Officiel des Sujets de Recherche
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#17365D]">
            Sujets de Thèse Proposés — Campagne {campaign.academicYear}
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Consultez les thématiques doctorales agréées par le Centre d'Études Doctorales (CED). Règle ministérielle : chaque candidat peut sélectionner et déposer un dossier pour <strong>un seul et unique sujet</strong> pour l'ensemble de la campagne.
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3 pt-6 border-t border-slate-100">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Rechercher par titre, mots-clés, directeur de thèse, laboratoire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#17365D] focus:ring-1 focus:ring-[#17365D] outline-hidden bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-4 relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#17365D] focus:ring-1 focus:ring-[#17365D] outline-hidden bg-slate-50/50 cursor-pointer"
            >
              <option value="ALL">Toutes les disciplines ({subjects.filter((s) => s.isPublished).length})</option>
              {domains
                .filter((d) => d !== 'ALL')
                .map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alerte si le candidat a déjà verrouillé son choix */}
      {hasSubmittedApp && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 text-xs">
          <ShieldAlert className="w-5 h-5 text-[#B69248] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Choix de sujet verrouillé :</span> Vous avez déjà soumis définitivement votre candidature pour le sujet :
            <strong> "{currentApplication.subjectTitle}"</strong>. Conformément aux dispositions de l'arrêté ministériel n° 1886.23, il est impossible de postuler à un autre sujet.
          </div>
        </div>
      )}

      {/* Grille des sujets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSubjects.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h4 className="font-serif font-bold text-slate-700 text-base">Aucun sujet ne correspond à vos critères.</h4>
            <p className="text-xs text-slate-500 mt-1">Essayez d'ajuster votre recherche ou vos filtres de discipline.</p>
          </div>
        ) : (
          filteredSubjects.map((subj) => {
            const isMyChosenSubject = currentApplication?.subjectId === subj.id;

            return (
              <div
                key={subj.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isMyChosenSubject
                    ? 'border-[#17365D] ring-2 ring-[#17365D]/15'
                    : 'border-slate-200/90 hover:border-[#B69248]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-[#17365D] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {subj.domain}
                    </span>
                    {isMyChosenSubject && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Mon Sujet Choisi
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#17365D] leading-snug">
                    {subj.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {subj.description}
                  </p>

                  {/* Mots-clés */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {subj.keywords.map((kw, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {/* Structure et encadrement */}
                  <div className="pt-2 text-xs space-y-1 text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-[#B69248] shrink-0" />
                      <span>Directeur : <strong>{subj.supervisorName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{subj.labStructure} ({subj.institution})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveSubject(subj)}
                    className="text-xs font-semibold text-slate-700 hover:text-[#17365D] underline cursor-pointer"
                  >
                    Fiche détaillée
                  </button>

                  <button
                    onClick={() => handleApplyClick(subj)}
                    disabled={hasSubmittedApp && !isMyChosenSubject}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isMyChosenSubject
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                        : hasSubmittedApp
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-[#17365D] text-white hover:bg-[#102742] shadow-xs'
                    }`}
                  >
                    {isMyChosenSubject ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Gérer Mon Dossier
                      </>
                    ) : (
                      <>
                        Postuler <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Détails du Sujet */}
      {activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#B69248]/15 text-[#917130] uppercase tracking-wider">
                  {activeSubject.domain}
                </span>
                <span className="text-xs text-slate-400">Réf : {activeSubject.id}</span>
              </div>
              <button
                onClick={() => setActiveSubject(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <h3 className="font-serif font-black text-xl text-[#17365D] leading-tight">
                {activeSubject.title}
              </h3>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs">
                <div className="font-bold text-[#17365D] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#B69248]" />
                  Directeur de Thèse : {activeSubject.supervisorName}
                </div>
                <p className="text-slate-600">Contact : {activeSubject.supervisorEmail}</p>
                <p className="text-slate-600">
                  Laboratoire : <strong>{activeSubject.labStructure}</strong>
                </p>
                <p className="text-slate-600">Établissement d'accueil : {activeSubject.institution}</p>
              </div>

              <div>
                <h4 className="font-serif font-bold text-sm text-[#17365D] mb-2 uppercase tracking-wide">
                  Description Scientifique du Projet
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {activeSubject.description}
                </p>
              </div>

              <div>
                <h4 className="font-serif font-bold text-sm text-[#17365D] mb-2 uppercase tracking-wide">
                  Mots-clés & Thématiques
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeSubject.keywords.map((kw, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-mono">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Capacité d'accueil : <strong>{activeSubject.quotaSlots} doctorant(s)</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  onClick={() => {
                    handleApplyClick(activeSubject);
                    setActiveSubject(null);
                  }}
                  disabled={hasSubmittedApp && currentApplication?.subjectId !== activeSubject.id}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#17365D] text-white hover:bg-[#102742] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <GraduationCap className="w-4 h-4 text-[#B69248]" />
                  Choisir ce sujet pour ma candidature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
