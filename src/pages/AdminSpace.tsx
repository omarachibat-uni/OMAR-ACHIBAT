import React, { useState } from 'react';
import {
  ShieldAlert,
  Settings,
  Users,
  BookOpen,
  FileText,
  UserCheck,
  Activity,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Clock,
  Eye,
  FileCheck,
} from 'lucide-react';
import {
  Application,
  AuditLog,
  Campaign,
  CampaignStatus,
  RequiredDocumentType,
  ThesisSubject,
  User,
} from '../types';
import { storageService } from '../services/storageService';

interface AdminSpaceProps {
  currentUser: User;
  campaign: Campaign;
  subjects: ThesisSubject[];
  applications: Application[];
  users: User[];
  documentTypes: RequiredDocumentType[];
  auditLogs: AuditLog[];
  onRefreshData: () => void;
  onResetDatabase: () => void;
}

export const AdminSpace: React.FC<AdminSpaceProps> = ({
  currentUser,
  campaign,
  subjects,
  applications,
  users,
  documentTypes,
  auditLogs,
  onRefreshData,
  onResetDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'campagne' | 'inscriptions' | 'sujets' | 'documents' | 'audit'>('stats');

  // État formulaire Campagne
  const [campTitle, setCampTitle] = useState(campaign.title);
  const [campYear, setCampYear] = useState(campaign.academicYear);
  const [campStatus, setCampStatus] = useState<CampaignStatus>(campaign.status);

  // État validation inscription physique
  const [selectedAdmittedApp, setSelectedAdmittedApp] = useState<Application | null>(null);
  const [diplomasChecked, setDiplomasChecked] = useState(true);
  const [transcriptsChecked, setTranscriptsChecked] = useState(true);
  const [charterSigned, setCharterSigned] = useState(true);
  const [officerNotes, setOfficerNotes] = useState('Dossier physique conforme. Originaux vérifiés et Charte paraphée.');

  // Formulaire nouveau sujet
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjTitle, setNewSubjTitle] = useState('');
  const [newSubjDesc, setNewSubjDesc] = useState('');
  const [newSubjDomain, setNewSubjDomain] = useState('Intelligence Artificielle & Génie Logiciel');
  const [newSubjKeywords, setNewSubjKeywords] = useState('IA, Big Data, Cloud');
  const [newSubjLab, setNewSubjLab] = useState('Laboratoire d\'Ingénierie des Systèmes Intelligents (LISI)');

  const [notice, setNotice] = useState<string | null>(null);

  // Statistiques calculées réelles
  const totalCandidates = applications.length;
  const submittedCount = applications.filter((a) => a.status !== 'BROUILLON').length;
  const inCorrectionCount = applications.filter((a) => a.status === 'EN_ATTENTE_CORRECTION').length;
  const expired72hCount = applications.filter((a) => a.status === 'REJETEE_DELAI_EXPIRE').length;
  const preselectedCount = applications.filter((a) => a.status === 'PRESELECTIONNEE' || a.currentStepIndex >= 4).length;
  const interviewScheduledCount = applications.filter((a) => !!a.interview).length;
  const admittedCount = applications.filter((a) => a.deliberation?.decision === 'ADMIS').length;
  const waitlistCount = applications.filter((a) => a.deliberation?.decision === 'LISTE_ATTENTE').length;
  const enrolledCount = applications.filter((a) => a.status === 'INSCRIPTION_CONFIRMEE').length;

  const handleSaveCampaign = () => {
    storageService.updateCampaign({
      title: campTitle,
      academicYear: campYear,
      status: campStatus,
    });
    setNotice('Configuration de la campagne mise à jour avec succès.');
    onRefreshData();
  };

  const handleConfirmEnrollment = () => {
    if (!selectedAdmittedApp) return;
    const res = storageService.confirmPhysicalEnrollment(selectedAdmittedApp.id, {
      diplomasVerified: diplomasChecked,
      transcriptsVerified: transcriptsChecked,
      charterSigned,
      officerRemarks: officerNotes,
    });

    if (res.success) {
      setNotice(`Inscription administrative confirmée en présentiel pour ${selectedAdmittedApp.candidateName} (Progression 100%).`);
      setSelectedAdmittedApp(null);
      onRefreshData();
    } else {
      alert(res.error || 'Erreur lors de la validation.');
    }
  };

  const handleCreateSubject = () => {
    if (!newSubjTitle.trim() || !newSubjDesc.trim()) {
      alert('Veuillez renseigner le titre et la description du sujet.');
      return;
    }

    storageService.addSubject({
      campaignId: campaign.id,
      supervisorId: currentUser.id,
      supervisorName: `${currentUser.title || 'M.'} ${currentUser.firstName} ${currentUser.lastName}`,
      supervisorEmail: currentUser.email,
      title: newSubjTitle,
      description: newSubjDesc,
      domain: newSubjDomain,
      keywords: newSubjKeywords.split(',').map((s) => s.trim()),
      labStructure: newSubjLab,
      institution: 'Université Sidi Mohamed Ben Abdellah',
      quotaSlots: 1,
      isPublished: true,
    });

    setIsAddSubjectOpen(false);
    setNewSubjTitle('');
    setNewSubjDesc('');
    setNotice('Nouveau sujet de thèse créé et publié avec succès.');
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Profil Administrateur */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-900 text-purple-200 font-serif font-black text-xl flex items-center justify-center shrink-0 border border-purple-700/30">
            AD
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-xl sm:text-2xl font-black text-[#17365D]">
                Console d'Administration & Gestion Système
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900 border border-purple-200">
                Super Administrateur
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Paramétrage technique, validation des inscriptions physiques, métriques réelles et journal d'audit
            </p>
          </div>
        </div>

        <button
          onClick={onResetDatabase}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer border border-slate-300"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser Données Démo
        </button>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            Fermer
          </button>
        </div>
      )}

      {/* Onglets Admin */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stats' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Tableau de Bord & Métriques
        </button>

        <button
          onClick={() => setActiveTab('inscriptions')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inscriptions' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-[#B69248]" />
          Validation des Inscriptions en Présentiel ({enrolledCount}/{admittedCount})
        </button>

        <button
          onClick={() => setActiveTab('campagne')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'campagne' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Paramètres de la Campagne
        </button>

        <button
          onClick={() => setActiveTab('sujets')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sujets' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Gestion des Sujets ({subjects.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Journal d'Audit ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1 : Tableau de bord & Métriques réelles */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Candidatures</span>
              <div className="font-mono text-2xl font-black text-[#17365D] mt-1">{totalCandidates}</div>
              <span className="text-[11px] text-slate-500">{submittedCount} soumise(s)</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase">En correction 72h</span>
              <div className="font-mono text-2xl font-black text-amber-700 mt-1">{inCorrectionCount}</div>
              <span className="text-[11px] text-amber-900">Délai souverain actif</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/30 shadow-2xs">
              <span className="text-[10px] font-bold text-red-800 uppercase">Rejetées 72h Expiré</span>
              <div className="font-mono text-2xl font-black text-red-700 mt-1">{expired72hCount}</div>
              <span className="text-[11px] text-red-900">Automate node-cron</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Entretiens</span>
              <div className="font-mono text-2xl font-black text-[#17365D] mt-1">{interviewScheduledCount}</div>
              <span className="text-[11px] text-slate-500">{preselectedCount} présélectionné(s)</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Inscriptions 100%</span>
              <div className="font-mono text-2xl font-black text-emerald-700 mt-1">{enrolledCount}</div>
              <span className="text-[11px] text-emerald-900">{admittedCount} admis au total</span>
            </div>
          </div>

          {/* Synthèse du workflow */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#17365D]">
              Entonnoir de Sélection & Contrôle Réglementaire (Données Temps Réel)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">1. Dépôt & Recevabilité</span>
                <p className="text-slate-500 leading-snug">
                  {submittedCount} dossiers examinés avec respect strict de l'unicité de candidature.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">2. Règle des 72 Heures</span>
                <p className="text-slate-500 leading-snug">
                  {inCorrectionCount} dossier(s) en régularisation. {expired72hCount} rejet(s) automatique(s) après expiration.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">3. Entretiens & Jury</span>
                <p className="text-slate-500 leading-snug">
                  Notes /20 saisies avec appréciation obligatoire sans seuil couperet fixe.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">4. Présentiel & Charte</span>
                <p className="text-slate-500 leading-snug">
                  {enrolledCount} inscription(s) définitive(s) physiquement vérifiée(s) avec signature de la charte de thèse.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 : Validation des Inscriptions en Présentiel */}
      {activeTab === 'inscriptions' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#17365D]">
                Guichet de Contrôle Physique & Validation des Inscriptions Initiales
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vérification des originaux des diplômes et de la <strong>Charte de Thèse</strong> signée (Porte l'avancement à 100 %)
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {applications
              .filter((a) => a.deliberation?.decision === 'ADMIS')
              .map((app) => {
                const isConfirmed = app.status === 'INSCRIPTION_CONFIRMEE';

                return (
                  <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#17365D]">{app.candidateName}</span>
                        <span className="text-xs font-mono text-slate-500">CIN: {app.candidateCin}</span>
                        {isConfirmed ? (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Inscription Confirmée (100 %)
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                            En attente de présentation physique
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700">Sujet : {app.subjectTitle}</p>
                      <p className="text-xs text-slate-500">Directeur de thèse : {app.supervisorName}</p>
                    </div>

                    <div className="shrink-0">
                      {isConfirmed ? (
                        <div className="text-xs text-slate-500 text-right">
                          Confirmée le {new Date(app.enrollment?.confirmedAt || '').toLocaleDateString('fr-FR')} par {app.enrollment?.verifiedByName}
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedAdmittedApp(app)}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <FileCheck className="w-4 h-4 text-[#B69248]" />
                          Vérifier Présentation & Confirmer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3 : Configuration de la Campagne */}
      {activeTab === 'campagne' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 max-w-2xl">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-serif text-lg font-bold text-[#17365D]">
              Paramétrage de l'Unique Campagne Doctorale
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cycle de vie : Préparation, Ouverte, Fermée ou Clôturée (Arrêté 1886.23)
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nom de la Campagne</label>
              <input
                type="text"
                value={campTitle}
                onChange={(e) => setCampTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Année Universitaire</label>
                <input
                  type="text"
                  value={campYear}
                  onChange={(e) => setCampYear(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Statut du Cycle de Vie</label>
                <select
                  value={campStatus}
                  onChange={(e) => setCampStatus(e.target.value as CampaignStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold cursor-pointer"
                >
                  <option value="PREPARATION">PREPARATION (Saisie des sujets)</option>
                  <option value="OUVERTE">OUVERTE (Dépôt des candidatures actif)</option>
                  <option value="FERMEE">FERMEE (Dépôts clos, instruction active)</option>
                  <option value="CLOTUREE">CLOTUREE (Campagne terminée)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Délai souverain de régularisation :</span>
              <p>Fixé à <strong>72 heures</strong> (inviolable par configuration réglementaire).</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveCampaign}
                className="px-6 py-2.5 bg-[#17365D] hover:bg-[#102742] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Enregistrer les Modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 : Gestion des Sujets */}
      {activeTab === 'sujets' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#17365D]">
                Catalogue des Thèses & Quotas d'Encadrement
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Publication, contrôle des structures de recherche et affectation
              </p>
            </div>
            <button
              onClick={() => setIsAddSubjectOpen(true)}
              className="px-4 py-2 bg-[#17365D] hover:bg-[#102742] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#B69248]" /> Ajouter un Sujet
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {subjects.map((subj) => (
              <div key={subj.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#17365D]">{subj.title}</span>
                    <span className="text-[10px] font-bold text-[#B69248] bg-[#B69248]/10 px-2 py-0.5 rounded-full">
                      {subj.domain}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{subj.description}</p>
                  <p className="text-[11px] text-slate-500">
                    Directeur : <strong>{subj.supervisorName}</strong> — Laboratoire : {subj.labStructure}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      storageService.toggleSubjectPublication(subj.id);
                      onRefreshData();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      subj.isPublished ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {subj.isPublished ? 'Publié' : 'Dépublié'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5 : Journal d'Audit */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#17365D]">
                Journal d'Audit des Opérations & Traçabilité Infalsifiable
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chaque décision, transition d'état, déclenchement de 72h et confirmation est scellée avec horodatage
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{auditLogs.length} événements tracés</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-serif uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Horodatage</th>
                  <th className="p-3">Acteur</th>
                  <th className="p-3">Action Réglementaire</th>
                  <th className="p-3">Détails de l'Événement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.userRole}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-50 text-[#17365D] border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 text-[11px] leading-relaxed max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Confirmation Inscription Physique */}
      {selectedAdmittedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-emerald-300 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                Étape Finale en Présentiel
              </span>
              <h3 className="font-serif font-black text-lg text-[#17365D] mt-2">
                Confirmation d'Inscription Administrative : {selectedAdmittedApp.candidateName}
              </h3>
              <p className="text-xs text-slate-500">
                Vérification humaine des documents originaux au secrétariat du CED.
              </p>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diplomasChecked}
                  onChange={(e) => setDiplomasChecked(e.target.checked)}
                />
                <span>Originaux du Baccalauréat et du Master / Diplôme d'Ingénieur vérifiés</span>
              </label>

              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transcriptsChecked}
                  onChange={(e) => setTranscriptsChecked(e.target.checked)}
                />
                <span>Originaux de l'ensemble des relevés de notes (S1 à S4) conformes</span>
              </label>

              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={charterSigned}
                  onChange={(e) => setCharterSigned(e.target.checked)}
                />
                <span>
                  <strong>Charte de Thèse</strong> dûment signée et paraphée par le doctorant et le directeur
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Observations administratives de l'agent :</label>
              <input
                type="text"
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedAdmittedApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmEnrollment}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#B69248]" />
                Valider l'Inscription Définitive (100 %)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Sujet */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4">
            <h3 className="font-serif font-black text-lg text-[#17365D]">Créer un Nouveau Sujet de Recherche</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de la Thèse</label>
                <input
                  type="text"
                  placeholder="Intitulé scientifique précis..."
                  value={newSubjTitle}
                  onChange={(e) => setNewSubjTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discipline / Domaine</label>
                <input
                  type="text"
                  value={newSubjDomain}
                  onChange={(e) => setNewSubjDomain(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Structure de Recherche (Laboratoire)</label>
                <input
                  type="text"
                  value={newSubjLab}
                  onChange={(e) => setNewSubjLab(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mots-clés (séparés par des virgules)</label>
                <input
                  type="text"
                  value={newSubjKeywords}
                  onChange={(e) => setNewSubjKeywords(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description Scientifique</label>
                <textarea
                  rows={3}
                  placeholder="Objectifs de recherche, méthodologie..."
                  value={newSubjDesc}
                  onChange={(e) => setNewSubjDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddSubjectOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateSubject}
                className="px-5 py-2.5 bg-[#17365D] hover:bg-[#102742] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Créer & Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
