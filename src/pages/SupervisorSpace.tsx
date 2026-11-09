import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Users,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  Building,
  User,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Application, Campaign, ThesisSubject, User as UserModel } from '../types';
import { storageService } from '../services/storageService';

interface SupervisorSpaceProps {
  currentUser: UserModel;
  campaign: Campaign;
  subjects: ThesisSubject[];
  applications: Application[];
  onRefreshData: () => void;
}

export const SupervisorSpace: React.FC<SupervisorSpaceProps> = ({
  currentUser,
  campaign,
  subjects,
  applications,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'theses' | 'candidatures' | 'entretiens' | 'resultats'>('candidatures');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [evalScore, setEvalScore] = useState<number>(16);
  const [evalComment, setEvalComment] = useState<string>('');
  const [preselectScore, setPreselectScore] = useState<number>(15);
  const [preselectComment, setPreselectComment] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filtrer exclusivement les sujets et candidatures de ce directeur de thèse
  const mySubjects = subjects.filter((s) => s.supervisorId === currentUser.id);
  const mySubjectIds = mySubjects.map((s) => s.id);
  const myApplications = applications.filter((a) => mySubjectIds.includes(a.subjectId));

  const handleSavePreselection = (app: Application, decision: 'ACCEPTED' | 'REJECTED') => {
    if (!preselectComment.trim()) {
      alert('Veuillez renseigner un avis motivé pour la commission de présélection.');
      return;
    }
    const res = storageService.submitPreselectionReview(app.id, decision, preselectScore, preselectComment);
    if (res.success) {
      setActionNotice(`Avis de présélection pour ${app.candidateName} enregistré avec succès.`);
      onRefreshData();
      setSelectedApp(null);
      setPreselectComment('');
    }
  };

  const handleSaveInterviewScore = (app: Application) => {
    if (evalScore < 0 || evalScore > 20) {
      alert('La note doit être obligatoirement comprise entre 0 et 20.');
      return;
    }
    if (!evalComment.trim()) {
      alert('Le commentaire d\'évaluation est obligatoire (Arrêté 1886.23).');
      return;
    }

    const res = storageService.evaluateInterview(app.id, evalScore, evalComment);
    if (res.success) {
      setActionNotice(`Évaluation pour ${app.candidateName} soumise avec succès (Note : ${evalScore}/20).`);
      onRefreshData();
      setSelectedApp(null);
      setEvalComment('');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Profil de l'enseignant */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-[#B69248] font-serif font-black text-xl flex items-center justify-center shrink-0 border border-[#B69248]/30">
            {currentUser.firstName[0]}
            {currentUser.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-xl sm:text-2xl font-black text-[#17365D]">
                {currentUser.title || 'Pr.'} {currentUser.firstName} {currentUser.lastName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                Directeur de Thèse Habilité
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {currentUser.department} — {currentUser.institution}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right text-xs">
          <span className="text-slate-400 block text-[11px] font-semibold uppercase">Périmètre d'encadrement</span>
          <span className="font-bold text-[#17365D]">{mySubjects.length} Sujet(s) Déposé(s)</span>
          <span className="text-slate-500 block">{myApplications.length} Candidat(s) postulant(s)</span>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            Fermer
          </button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('candidatures')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'candidatures' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Candidatures Associées ({myApplications.length})
        </button>

        <button
          onClick={() => setActiveTab('theses')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'theses' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Mes Sujets de Thèse ({mySubjects.length})
        </button>

        <button
          onClick={() => setActiveTab('entretiens')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'entretiens' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Calendrier des Entretiens & Notation
        </button>
      </div>

      {/* TAB : Candidatures associées */}
      {activeTab === 'candidatures' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#17365D]">
                Dossiers de Candidature Rattachés à Vos Thématiques
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Examen des profils, avis de présélection et consultation des pièces justificatives
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
              Total : {myApplications.length}
            </span>
          </div>

          {myApplications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Aucune candidature soumise pour vos sujets actuellement.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myApplications.map((app) => (
                <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#17365D]">{app.candidateName}</span>
                      <span className="text-xs font-mono text-slate-500">CIN: {app.candidateCin}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          app.status === 'PRESELECTIONNEE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'EN_ATTENTE_CORRECTION'
                            ? 'bg-amber-100 text-amber-800'
                            : app.status === 'REJETEE_DELAI_EXPIRE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-50 text-[#17365D]'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-serif">
                      Sujet : <strong>{app.subjectTitle}</strong>
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      Diplôme : {app.candidateEmail} — Master : {app.masterGrade ? `${app.masterGrade}/20` : 'N/A'} ({app.masterOriginUniversity})
                    </p>

                    {app.preselectionScore && (
                      <div className="text-[11px] text-emerald-800 font-medium">
                        Avis présélection saisi : <strong>{app.preselectionDecision}</strong> (Note dossier : {app.preselectionScore}/20)
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#17365D] hover:text-white text-[#17365D] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Examiner le Dossier & Donner Avis
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB : Mes sujets de thèse */}
      {activeTab === 'theses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mySubjects.map((subj) => (
            <div key={subj.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#B69248] bg-[#B69248]/10 px-2.5 py-0.5 rounded-full uppercase">
                  {subj.domain}
                </span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Publié
                </span>
              </div>

              <h4 className="font-serif font-bold text-base text-[#17365D] leading-snug">
                {subj.title}
              </h4>

              <p className="text-xs text-slate-600 line-clamp-3">{subj.description}</p>

              <div className="pt-2 text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
                <span>Laboratoire : <strong>{subj.labStructure}</strong></span>
                <span>Quota : <strong>{subj.quotaSlots} place</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB : Calendrier des entretiens & Notation */}
      {activeTab === 'entretiens' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-serif text-lg font-bold text-[#17365D]">
              Calendrier des Auditions Orales & Grille d'Évaluation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Saisie de la note sur 20 et de l'appréciation collégiale obligatoire (aucun seuil éliminatoire fixe de 10/20 n'est imposé)
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {myApplications
              .filter((a) => a.interview)
              .map((app) => {
                const int = app.interview!;
                const existingEval = int.evaluations.find((e) => e.evaluatorId === currentUser.id);

                return (
                  <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#17365D]">{app.candidateName}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(int.scheduledDate).toLocaleDateString('fr-FR')} à {new Date(int.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] bg-blue-50 text-[#17365D] px-2 py-0.5 rounded font-semibold">
                          {int.roomLocation}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-serif">Sujet : {app.subjectTitle}</p>
                      {existingEval && (
                        <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Votre note attribuée : <strong className="font-mono text-sm">{existingEval.score} / 20</strong> — "{existingEval.comments}"
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        if (existingEval) {
                          setEvalScore(existingEval.score);
                          setEvalComment(existingEval.comments);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#17365D] text-white text-xs font-bold hover:bg-[#102742] transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      {existingEval ? 'Modifier ma Note /20' : 'Saisir Note & Appréciation'}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modal d'évaluation et examen du dossier */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-serif font-black text-lg text-[#17365D]">
                  Évaluation & Avis : {selectedApp.candidateName}
                </h3>
                <p className="text-xs text-slate-500">Sujet : {selectedApp.subjectTitle}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Pièces justificatives consultables */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wide">Pièces Jointes Déposées</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedApp.documents.map((d) => (
                    <span key={d.id} className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono text-[11px] text-slate-800">
                      📄 {d.documentLabel}
                    </span>
                  ))}
                </div>
              </div>

              {/* Formulaire de Présélection sur dossier */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4">
                <h4 className="font-serif font-bold text-sm text-[#17365D] uppercase tracking-wide">
                  Avis de Présélection sur Dossier (Phase 1)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Note sur Dossier (/20)</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      value={preselectScore}
                      onChange={(e) => setPreselectScore(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Observations Scientifiques</label>
                    <input
                      type="text"
                      placeholder="Pertinence du projet, qualité du Master..."
                      value={preselectComment}
                      onChange={(e) => setPreselectComment(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleSavePreselection(selectedApp, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 font-bold cursor-pointer"
                  >
                    Avis Défavorable
                  </button>
                  <button
                    onClick={() => handleSavePreselection(selectedApp, 'ACCEPTED')}
                    className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 cursor-pointer"
                  >
                    Avis Favorable de Présélection
                  </button>
                </div>
              </div>

              {/* Formulaire d'évaluation d'entretien (si programmé) */}
              {selectedApp.interview && (
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-4">
                  <h4 className="font-serif font-bold text-sm text-[#17365D] uppercase tracking-wide">
                    Notation de l'Entretien Oral (Note /20 & Commentaire Obligatoire)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Note Attribuée (0 - 20)</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.25}
                        value={evalScore}
                        onChange={(e) => setEvalScore(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-black text-base text-[#17365D]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">Appréciation Motivée Obligatoire</label>
                      <textarea
                        rows={2}
                        value={evalComment}
                        onChange={(e) => setEvalComment(e.target.value)}
                        placeholder="Capacité d'analyse, argumentation scientifique, autonomie du candidat..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveInterviewScore(selectedApp)}
                      className="px-5 py-2 rounded-xl bg-[#17365D] text-white font-bold hover:bg-[#102742] cursor-pointer shadow-xs"
                    >
                      Enregistrer l'Évaluation Définitive
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
