import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Search,
  Send,
  Building,
  UserCheck,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Application, Campaign, DecisionType, RequiredDocumentType, User as UserModel } from '../types';
import { storageService } from '../services/storageService';
import { CountdownTimer } from '../components/CountdownTimer';

interface DirectorSpaceProps {
  currentUser: UserModel;
  campaign: Campaign;
  applications: Application[];
  documentTypes: RequiredDocumentType[];
  onRefreshData: () => void;
}

export const DirectorSpace: React.FC<DirectorSpaceProps> = ({
  currentUser,
  campaign,
  applications,
  documentTypes,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'supervision' | 'recevabilite' | 'entretiens' | 'deliberations'>('supervision');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal 72h
  const [incompletModalApp, setIncompletModalApp] = useState<Application | null>(null);
  const [missingDocs, setMissingDocs] = useState<string[]>(['RELEVES_NOTES']);
  const [instructions72h, setInstructions72h] = useState('');

  // Modal Planification Entretien
  const [interviewModalApp, setInterviewModalApp] = useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState('2026-11-10T10:00');
  const [interviewRoom, setInterviewRoom] = useState('Salle des Actes, FST Fès');
  const [juryMembers, setJuryMembers] = useState('Pr. Fatima Zahra Bennani (Présidente), Pr. Rachid Berrada (Encadrant)');

  // Modal Promotion Liste d'Attente
  const [promoteModalApp, setPromoteModalApp] = useState<Application | null>(null);
  const [promoteReason, setPromoteReason] = useState('Désistement constaté sur le quota initial.');

  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const filteredApps = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      app.candidateName.toLowerCase().includes(q) ||
      app.subjectTitle.toLowerCase().includes(q) ||
      app.candidateCin?.toLowerCase().includes(q) ||
      app.supervisorName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Action : Déclencher le délai impératif de 72h
  const handleTrigger72h = () => {
    if (!incompletModalApp) return;
    if (missingDocs.length === 0) {
      alert('Veuillez cocher au moins une pièce manquante ou non conforme.');
      return;
    }
    if (!instructions72h.trim()) {
      alert('Veuillez expliciter les motifs précis de la demande de régularisation.');
      return;
    }

    const res = storageService.requestCorrection(incompletModalApp.id, instructions72h, missingDocs);
    if (res.success) {
      setActionAlert(`Délai souverain de 72h déclenché pour ${incompletModalApp.candidateName}. Notification et email envoyés.`);
      setIncompletModalApp(null);
      setInstructions72h('');
      onRefreshData();
    }
  };

  // Action : Valider la recevabilité administrative
  const handleApproveReceivability = (app: Application) => {
    const res = storageService.approveReceivability(app.id);
    if (res.success) {
      setActionAlert(`Dossier de ${app.candidateName} déclaré complet et recevable pour la présélection.`);
      onRefreshData();
    }
  };

  // Action : Planifier l'entretien
  const handleScheduleInterview = () => {
    if (!interviewModalApp) return;
    const res = storageService.scheduleInterview(interviewModalApp.id, {
      scheduledDate: new Date(interviewDate).toISOString(),
      durationMinutes: 30,
      roomLocation: interviewRoom,
      committeeMembers: juryMembers.split(',').map((s) => s.trim()),
    });

    if (res.success) {
      setActionAlert(`Entretien oral programmé pour ${interviewModalApp.candidateName}. Convocation officielle transmise.`);
      setInterviewModalApp(null);
      onRefreshData();
    }
  };

  // Action : Délibération
  const handleSaveDeliberation = (app: Application, decision: DecisionType, score: number, rank?: number) => {
    const res = storageService.saveDeliberation(app.id, decision, score, rank);
    if (res.success) {
      setActionAlert(`Décision de délibération enregistrée pour ${app.candidateName} (${decision}).`);
      onRefreshData();
    }
  };

  // Action : Publier officiellement tous les résultats
  const handlePublishAll = () => {
    if (confirm('Voulez-vous valider et publier officiellement l\'ensemble des résultats ? Ils deviendront immédiatement visibles aux candidats.')) {
      const res = storageService.publishResults();
      setActionAlert(`Résultats officiels publiés avec succès pour ${res.count} candidat(s). Notifications envoyées.`);
      onRefreshData();
    }
  };

  // Action : Promouvoir un candidat de la liste d'attente
  const handlePromoteCandidate = () => {
    if (!promoteModalApp) return;
    if (!promoteReason.trim()) {
      alert('Veuillez motiver formellement la promotion.');
      return;
    }

    const res = storageService.promoteFromWaitlist(promoteModalApp.id, promoteReason);
    if (res.success) {
      setActionAlert(`Candidat ${promoteModalApp.candidateName} promu avec succès sur la liste principale des admis.`);
      setPromoteModalApp(null);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* En-tête Direction CED */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#B69248] text-white font-serif font-black text-xl flex items-center justify-center shrink-0 shadow-sm border border-amber-700/30">
            {currentUser.firstName[0]}
            {currentUser.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-xl sm:text-2xl font-black text-[#17365D]">
                {currentUser.title || 'Pr.'} {currentUser.firstName} {currentUser.lastName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Directrice du Centre d'Études Doctorales (CED)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Supervision académique de la Campagne Nationale d'Admission au Doctorat (Arrêté ministériel 1886.23)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePublishAll}
            className="px-5 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#102742] text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Award className="w-4 h-4 text-[#B69248]" />
            Valider & Publier Officiellement les Résultats
          </button>
        </div>
      </div>

      {actionAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{actionAlert}</span>
          <button onClick={() => setActionAlert(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            Fermer
          </button>
        </div>
      )}

      {/* Onglets Direction CED */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('supervision')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'supervision' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          1. Supervision Générale ({applications.length})
        </button>

        <button
          onClick={() => setActiveTab('recevabilite')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'recevabilite' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-[#B69248]" />
          2. Contrôle de Recevabilité & Protocole 72h
        </button>

        <button
          onClick={() => setActiveTab('entretiens')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'entretiens' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          3. Organisation des Entretiens
        </button>

        <button
          onClick={() => setActiveTab('deliberations')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'deliberations' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-[#B69248]" />
          4. Délibérations & Listes d'Attente
        </button>
      </div>

      {/* TAB 1 : Supervision Générale */}
      {activeTab === 'supervision' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#17365D]">
                Registre Central des Dossiers Déposés
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Contrôle des flux, recherche multicritères et consultation des états d'avancement
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filtrer candidat, sujet, CIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-[#17365D] outline-hidden w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-[#17365D] outline-hidden cursor-pointer"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="SOUMISE">Soumise</option>
                <option value="EN_ATTENTE_CORRECTION">En attente de correction (72h)</option>
                <option value="EN_PRESELECTION">En présélection</option>
                <option value="PRESELECTIONNEE">Présélectionnée</option>
                <option value="ENTRETIEN_PROGRAMME">Entretien programmé</option>
                <option value="ADMISE">Admise</option>
                <option value="LISTE_ATTENTE">Liste d'attente</option>
                <option value="REJETEE_DELAI_EXPIRE">Rejetée 72h expiré</option>
                <option value="INSCRIPTION_CONFIRMEE">Inscription confirmée</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-serif uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Candidat</th>
                  <th className="p-3">Sujet & Directeur</th>
                  <th className="p-3">Statut Dossier</th>
                  <th className="p-3">Pièces</th>
                  <th className="p-3">Progression</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{app.candidateName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">CIN: {app.candidateCin || '-'}</div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-slate-900 line-clamp-1">{app.subjectTitle}</div>
                      <div className="text-[11px] text-[#B69248] font-semibold">{app.supervisorName}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          app.status === 'INSCRIPTION_CONFIRMEE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'EN_ATTENTE_CORRECTION'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : app.status === 'REJETEE_DELAI_EXPIRE'
                            ? 'bg-red-100 text-red-800'
                            : app.status === 'ADMISE'
                            ? 'bg-emerald-50 text-emerald-900'
                            : 'bg-blue-50 text-[#17365D]'
                        }`}
                      >
                        {app.status}
                      </span>
                      {app.correctionRequest && !app.correctionRequest.isResolved && app.status === 'EN_ATTENTE_CORRECTION' && (
                        <div className="mt-1">
                          <CountdownTimer deadlineAt={app.correctionRequest.deadlineAt} compact />
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {app.documents.length} fichier(s)
                    </td>
                    <td className="p-3 font-mono font-bold text-[#17365D]">
                      {app.progressPercent}%
                    </td>
                    <td className="p-3 text-right">
                      {app.status === 'SOUMISE' || app.status === 'CORRECTION_SOUMISE' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleApproveReceivability(app)}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 text-[11px] font-bold cursor-pointer"
                          >
                            Valider Complet
                          </button>
                          <button
                            onClick={() => {
                              setIncompletModalApp(app);
                              setInstructions72h('');
                            }}
                            className="px-2.5 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-[11px] font-bold cursor-pointer"
                          >
                            Incomplet (72h)
                          </button>
                        </div>
                      ) : app.status === 'PRESELECTIONNEE' && !app.interview ? (
                        <button
                          onClick={() => setInterviewModalApp(app)}
                          className="px-2.5 py-1 bg-[#17365D] text-white rounded-lg hover:bg-[#102742] text-[11px] font-bold cursor-pointer"
                        >
                          Convoquer Entretien
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">En cours</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2 : Contrôle de Recevabilité & Protocole 72h */}
      {activeTab === 'recevabilite' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-serif text-lg font-bold text-[#17365D]">
              Gestion Prioritaire des Dossiers Incomplets & Délais de 72 Heures
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conformément à l'arrêté 1886.23, tout dossier déclaré incomplet reçoit une date limite de 72h précises. Passé ce délai, le rejet automatique est appliqué de plein droit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications
              .filter((a) => a.status === 'EN_ATTENTE_CORRECTION' || a.status === 'REJETEE_DELAI_EXPIRE')
              .map((app) => (
                <div
                  key={app.id}
                  className={`p-5 rounded-2xl border ${
                    app.status === 'REJETEE_DELAI_EXPIRE'
                      ? 'bg-red-50/60 border-red-200'
                      : 'bg-amber-50/60 border-amber-300'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#17365D]">{app.candidateName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        app.status === 'REJETEE_DELAI_EXPIRE'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">Sujet : {app.subjectTitle}</p>

                  {app.correctionRequest && (
                    <div className="space-y-2 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">Motifs notifiés au candidat :</span>
                        <p className="text-slate-600 font-mono text-[11px] leading-relaxed">
                          {app.correctionRequest.instructions}
                        </p>
                      </div>

                      {app.status === 'EN_ATTENTE_CORRECTION' && (
                        <CountdownTimer deadlineAt={app.correctionRequest.deadlineAt} compact />
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3 : Organisation des Entretiens */}
      {activeTab === 'entretiens' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#17365D]">
                Planning des Auditions Orales devant la Commission
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Affectation des salles, constitution des jurys et consultation des notes attribuées
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {applications
              .filter((a) => a.interview)
              .map((app) => {
                const int = app.interview!;
                return (
                  <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#17365D]">{app.candidateName}</span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {new Date(int.scheduledDate).toLocaleString('fr-FR')}
                        </span>
                        <span className="text-xs text-slate-500">Salle : {int.roomLocation}</span>
                      </div>
                      <p className="text-xs text-slate-700">Sujet : {app.subjectTitle}</p>
                      <div className="text-[11px] text-slate-600">
                        Jury : {int.committeeMembers.join(' — ')}
                      </div>

                      {int.evaluations.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          {int.evaluations.map((ev, i) => (
                            <span key={i} className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              Note de {ev.evaluatorName} : <strong className="font-mono">{ev.score}/20</strong> ("{ev.comments}")
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4 : Délibérations & Listes d'Attente */}
      {activeTab === 'deliberations' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#17365D]">
                Délibération Collégiale & Établissement des Résultats
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Classement officiel (Admis, Liste d'attente ordonnée, Refusé) et gestion des promotions
              </p>
            </div>
            <button
              onClick={handlePublishAll}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer shadow-xs"
            >
              Publier Officiellement aux Candidats
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {applications.map((app) => {
              const currentDecision = app.deliberation?.decision;
              return (
                <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#17365D]">{app.candidateName}</span>
                      <span className="text-xs font-mono text-slate-500">Note Entretien : {app.interview?.evaluations[0]?.score || 'N/A'}/20</span>
                      {currentDecision && (
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            currentDecision === 'ADMIS'
                              ? 'bg-emerald-100 text-emerald-900'
                              : currentDecision === 'LISTE_ATTENTE'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-red-100 text-red-900'
                          }`}
                        >
                          {currentDecision === 'LISTE_ATTENTE'
                            ? `Liste d'Attente (Rang ${app.deliberation?.waitingListRank || 1})`
                            : currentDecision}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-serif">Sujet : {app.subjectTitle}</p>
                    <p className="text-xs text-slate-500">Directeur : {app.supervisorName}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleSaveDeliberation(app, 'ADMIS', 17.5)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        currentDecision === 'ADMIS'
                          ? 'bg-emerald-700 text-white'
                          : 'border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      Admettre (Principal)
                    </button>

                    <button
                      onClick={() => handleSaveDeliberation(app, 'LISTE_ATTENTE', 15.0, 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        currentDecision === 'LISTE_ATTENTE'
                          ? 'bg-amber-600 text-white'
                          : 'border border-amber-300 text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      Liste d'Attente (Rang 1)
                    </button>

                    <button
                      onClick={() => handleSaveDeliberation(app, 'REFUSE', 11.0)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        currentDecision === 'REFUSE'
                          ? 'bg-red-700 text-white'
                          : 'border border-red-300 text-red-800 hover:bg-red-50'
                      }`}
                    >
                      Refuser
                    </button>

                    {currentDecision === 'LISTE_ATTENTE' && (
                      <button
                        onClick={() => setPromoteModalApp(app)}
                        className="px-3 py-1.5 rounded-lg bg-blue-100 text-[#17365D] hover:bg-blue-200 text-xs font-bold cursor-pointer flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Promouvoir vers Admis
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal 72h Déclaration Dossier Incomplet */}
      {incompletModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-amber-300 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                Délai Réglementaire Impératif de 72h
              </span>
              <h3 className="font-serif font-black text-lg text-[#17365D] mt-2">
                Déclarer le dossier incomplet : {incompletModalApp.candidateName}
              </h3>
              <p className="text-xs text-slate-500">
                L'action déclenchera un compte à rebours souverain de 72h avec email et notification.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Sélectionnez les pièces non conformes :</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                {documentTypes.map((type) => {
                  const isChecked = missingDocs.includes(type.code);
                  return (
                    <label key={type.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setMissingDocs([...missingDocs, type.code]);
                          else setMissingDocs(missingDocs.filter((c) => c !== type.code));
                        }}
                      />
                      <span>{type.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Instructions & Motifs détaillés à transmettre au candidat :
              </label>
              <textarea
                rows={3}
                value={instructions72h}
                onChange={(e) => setInstructions72h(e.target.value)}
                placeholder="Ex : Le relevé du semestre S3 est manquant et le diplôme de Master n'est pas certifié conforme..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:border-[#17365D] outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIncompletModalApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleTrigger72h}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Déclencher le Délai de 72h
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Planification Entretien */}
      {interviewModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <h3 className="font-serif font-black text-lg text-[#17365D]">
              Planifier l'Entretien Oral : {interviewModalApp.candidateName}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date et Heure</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lieu / Salle</label>
                <input
                  type="text"
                  value={interviewRoom}
                  onChange={(e) => setInterviewRoom(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Composition de la Commission (Jury)</label>
                <input
                  type="text"
                  value={juryMembers}
                  onChange={(e) => setJuryMembers(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setInterviewModalApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleScheduleInterview}
                className="px-5 py-2.5 bg-[#17365D] hover:bg-[#102742] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#B69248]" />
                Émettre la Convocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Promotion Liste d'Attente */}
      {promoteModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <h3 className="font-serif font-black text-lg text-[#17365D]">
              Promouvoir depuis la Liste d'Attente : {promoteModalApp.candidateName}
            </h3>
            <p className="text-xs text-slate-600">
              L'action basculera le candidat sur la liste des ADMIS et lui enverra les instructions d'inscription administrative physique.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motif formel de la promotion :</label>
              <textarea
                rows={2}
                value={promoteReason}
                onChange={(e) => setPromoteReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPromoteModalApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handlePromoteCandidate}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmer la Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
