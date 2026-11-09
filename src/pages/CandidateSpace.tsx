import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Award,
  Building,
  User,
  Download,
  AlertCircle,
  FileCheck,
  Send,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Application, Campaign, RequiredDocumentType, User as UserModel } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { CountdownTimer } from '../components/CountdownTimer';
import { storageService } from '../services/storageService';

interface CandidateSpaceProps {
  currentUser: UserModel;
  campaign: Campaign;
  currentApplication?: Application;
  onRefreshApplication: () => void;
  onNavigate: (view: string) => void;
  documentTypes: RequiredDocumentType[];
}

export const CandidateSpace: React.FC<CandidateSpaceProps> = ({
  currentUser,
  campaign,
  currentApplication,
  onRefreshApplication,
  onNavigate,
  documentTypes,
}) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'documents' | 'corrections' | 'convocation' | 'resultats' | 'inscription'>('dossier');
  const [researchSummary, setResearchSummary] = useState(currentApplication?.researchSummary || '');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSubmitted = currentApplication && currentApplication.status !== 'BROUILLON';
  const is72hActive = currentApplication?.status === 'EN_ATTENTE_CORRECTION';
  const hasInterview = !!currentApplication?.interview;
  const isDeliberated = !!currentApplication?.deliberation?.isPublished;
  const isAdmitted = currentApplication?.deliberation?.decision === 'ADMIS' && currentApplication.deliberation.isPublished;

  // Auto-sélection de l'onglet pertinent si 72h actif
  React.useEffect(() => {
    if (is72hActive) {
      setActiveTab('corrections');
    }
  }, [is72hActive]);

  const handleSimulateUpload = (docTypeCode: string) => {
    if (!currentApplication) return;
    setIsUploading(docTypeCode);

    setTimeout(() => {
      const docType = documentTypes.find((t) => t.code === docTypeCode);
      const fakeFileName = `${docTypeCode}_${currentUser.lastName}_${currentUser.cin || '2026'}.pdf`;
      const result = storageService.uploadDocument(currentApplication.id, docTypeCode, {
        name: fakeFileName,
        size: 1540000,
        mimeType: 'application/pdf',
      });

      setIsUploading(null);
      if (result.success) {
        setActionMessage({ type: 'success', text: `Document "${docType?.label}" téléversé avec succès.` });
        onRefreshApplication();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Erreur lors du téléversement.' });
      }
    }, 400);
  };

  const handleSubmitApplication = () => {
    if (!currentApplication) return;
    if (confirm('Êtes-vous sûr de vouloir soumettre définitivement votre dossier ? Une fois soumis, le choix du sujet de thèse sera verrouillé irrévocablement.')) {
      const res = storageService.submitApplication(currentApplication.id);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Candidature soumise avec succès ! Votre dossier est en file d\'examen administratif.' });
        onRefreshApplication();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Erreur de soumission.' });
      }
    }
  };

  const handleSubmitCorrections = () => {
    if (!currentApplication) return;
    const res = storageService.submitCorrection(currentApplication.id);
    if (res.success) {
      setActionMessage({ type: 'success', text: 'Corrections transmises dans les délais ! Le statut de votre dossier est mis à jour.' });
      onRefreshApplication();
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Erreur de soumission des corrections.' });
    }
  };

  const handleSimulate72hExpiry = () => {
    if (!currentApplication || !currentApplication.correctionRequest) return;
    if (confirm('Voulez-vous simuler l\'expiration immédiate du délai de 72h ? La candidature passera automatiquement en "Rejetée pour expiration du délai".')) {
      currentApplication.correctionRequest.deadlineAt = new Date(Date.now() - 1000).toISOString();
      storageService.check72hTimeouts();
      onRefreshApplication();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Profil rapide du candidat */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#17365D] text-[#B69248] font-serif font-black text-xl flex items-center justify-center shrink-0 shadow-sm border border-[#B69248]/30">
            {currentUser.firstName[0]}
            {currentUser.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-xl sm:text-2xl font-black text-[#17365D]">
                {currentUser.firstName} {currentUser.lastName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-blue-50 text-[#17365D] border border-blue-200">
                CIN : {currentUser.cin || 'Non renseigné'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700">
                CNE/MASSAR : {currentUser.cneCnie || 'N/A'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Diplôme d'accès : <strong>{currentUser.degreeName || 'Master Spécialisé'}</strong> — {currentUser.institution}
            </p>
          </div>
        </div>

        {/* Campagne active */}
        <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">Campagne Active</span>
          <span className="font-serif font-bold text-sm text-[#17365D]">{campaign.title}</span>
          <span className="text-xs text-slate-500 block">Année universitaire {campaign.academicYear}</span>
        </div>
      </div>

      {/* Barre d'avancement dynamique souveraine */}
      <ProgressBar application={currentApplication} />

      {/* Message d'action temporaire */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-red-50 text-red-900 border border-red-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            Fermer
          </button>
        </div>
      )}

      {/* Si aucune candidature n'est encore initiée */}
      {!currentApplication && (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4">
          <FileText className="w-12 h-12 text-[#B69248] mx-auto opacity-80" />
          <h3 className="font-serif font-bold text-xl text-[#17365D]">Aucune candidature en cours</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Pour démarrer votre parcours doctoral, veuillez consulter le catalogue des sujets de recherche et sélectionner le sujet correspondant à vos compétences académiques.
          </p>
          <button
            onClick={() => onNavigate('subjects_catalog')}
            className="px-6 py-3 rounded-xl bg-[#17365D] text-white font-bold text-xs hover:bg-[#102742] transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            Choisir un sujet de thèse <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Onglets de navigation dans l'espace candidat */}
      {currentApplication && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('dossier')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dossier' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              1. Choix du Sujet & Projet
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'documents' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              2. Pièces Justificatives ({currentApplication.documents.length}/{documentTypes.filter((t) => t.isRequired).length})
            </button>

            {is72hActive && (
              <button
                onClick={() => setActiveTab('corrections')}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'corrections'
                    ? 'bg-amber-600 text-white shadow-xs animate-pulse'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#B69248]" />
                3. Corrections Requises (Délai 72h)
              </button>
            )}

            {hasInterview && (
              <button
                onClick={() => setActiveTab('convocation')}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'convocation' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                4. Convocation à l'Entretien
              </button>
            )}

            {isDeliberated && (
              <button
                onClick={() => setActiveTab('resultats')}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'resultats' ? 'bg-[#17365D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                5. Décision de la Commission
              </button>
            )}

            {isAdmitted && (
              <button
                onClick={() => setActiveTab('inscription')}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'inscription' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                6. Inscription en Présentiel & Charte
              </button>
            )}
          </div>

          {/* TAB 1 : Choix du sujet & Projet */}
          {activeTab === 'dossier' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#17365D]">
                    Sujet de Thèse Retenu & Encadrement
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isSubmitted
                      ? 'Votre candidature est définitivement soumise. Ce sujet est irrévocablement verrouillé.'
                      : 'Brouillon modifiable avant la soumission définitive.'}
                  </p>
                </div>
                {isSubmitted ? (
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5 self-start">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#B69248]" /> Sujet Verrouillé
                  </span>
                ) : (
                  <button
                    onClick={() => onNavigate('subjects_catalog')}
                    className="text-xs font-semibold text-[#17365D] hover:underline cursor-pointer"
                  >
                    Changer de sujet (Catalogue)
                  </button>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-[#B69248] uppercase tracking-wider">
                  Discipline : {currentApplication.domain}
                </span>
                <h4 className="font-serif font-bold text-base text-[#17365D]">
                  {currentApplication.subjectTitle}
                </h4>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#B69248]" />
                  <span>Directeur de thèse : <strong>{currentApplication.supervisorName}</strong></span>
                </div>
              </div>

              {/* Résumé du projet / motivations */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Résumé du Projet de Recherche & Adéquation du Profil (Avant-projet)
                </label>
                <textarea
                  rows={4}
                  disabled={isSubmitted}
                  value={researchSummary}
                  onChange={(e) => setResearchSummary(e.target.value)}
                  placeholder="Exposez brièvement vos travaux antérieurs, la méthodologie envisagée et vos motivations scientifiques..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#17365D] focus:ring-1 focus:ring-[#17365D] outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {/* Bouton de soumission définitive */}
              {!isSubmitted && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Vérifiez que vos pièces justificatives sont déposées avant de soumettre.
                  </div>
                  <button
                    onClick={handleSubmitApplication}
                    className="px-6 py-2.5 rounded-xl bg-[#17365D] hover:bg-[#102742] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-[#B69248]" />
                    Soumettre Définitivement Ma Candidature
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 : Pièces Justificatives */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="font-serif text-lg font-bold text-[#17365D]">
                  Coffre-fort des Pièces Justificatives
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Format PDF exclusivement. Taille maximale : 5 Mo par pièce (8 Mo pour les relevés de notes complets).
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {documentTypes.map((docType) => {
                  const uploaded = currentApplication.documents.find((d) => d.documentTypeCode === docType.code);
                  const isBeingUploaded = isUploading === docType.code;

                  return (
                    <div key={docType.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{docType.label}</span>
                          {docType.isRequired ? (
                            <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded font-semibold">
                              Obligatoire
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                              Facultatif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{docType.description}</p>
                        {uploaded && (
                          <div className="text-[11px] text-emerald-800 font-mono font-medium flex items-center gap-1.5 pt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Fichier déposé : {uploaded.originalName} ({(uploaded.sizeBytes / (1024 * 1024)).toFixed(2)} Mo)
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {uploaded ? (
                          <button
                            onClick={() => handleSimulateUpload(docType.code)}
                            disabled={isSubmitted && !is72hActive}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs text-slate-700 font-semibold cursor-pointer disabled:opacity-50"
                          >
                            Remplacer
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSimulateUpload(docType.code)}
                            disabled={isBeingUploaded || (isSubmitted && !is72hActive)}
                            className="px-4 py-2 rounded-xl bg-[#17365D] hover:bg-[#102742] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {isBeingUploaded ? 'Téléversement...' : 'Téléverser le PDF'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3 : PROTOCOLE 72H - CORRECTIONS DEMANDÉES */}
          {activeTab === 'corrections' && currentApplication.correctionRequest && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-300 shadow-lg space-y-6">
              <div className="pb-4 border-b border-amber-200">
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Procédure Réglementaire d'Instruction (Arrêté 1886.23)
                </span>
                <h3 className="font-serif text-xl font-black text-[#17365D] mt-2">
                  Dossier Incomplet — Délai Impératif de 72 Heures
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Demande émise par {currentApplication.correctionRequest.requestedByName} le {new Date(currentApplication.correctionRequest.createdAt).toLocaleString('fr-FR')}.
                </p>
              </div>

              {/* Compte à rebours temps réel */}
              <CountdownTimer deadlineAt={currentApplication.correctionRequest.deadlineAt} onExpire={handleSimulate72hExpiry} />

              {/* Instructions officielles du responsable */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  Observations & Pièces à Régulariser :
                </div>
                <p className="text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                  {currentApplication.correctionRequest.instructions}
                </p>
              </div>

              {/* Zone de rectification des pièces manquantes */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-sm text-[#17365D]">
                  Pièces concernées par la demande de correction :
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  {currentApplication.correctionRequest.missingItems.map((code) => {
                    const docType = documentTypes.find((t) => t.code === code);
                    const uploaded = currentApplication.documents.find((d) => d.documentTypeCode === code);

                    return (
                      <div key={code} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-xs text-slate-900">{docType?.label || code}</div>
                          <div className="text-[11px] text-slate-500">
                            {uploaded ? `Dernier fichier : ${uploaded.originalName}` : 'Aucun fichier rectifié encore téléversé'}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSimulateUpload(code)}
                          className="px-3 py-1.5 rounded-lg bg-[#17365D] text-white text-xs font-semibold hover:bg-[#102742] cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Téléverser la pièce conforme
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bouton de confirmation de soumission avant 72h */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleSimulate72hExpiry}
                  title="Simuler ce qui se passe si le candidat ne répond pas avant 72h"
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-semibold cursor-pointer"
                >
                  Tester le Rejet Automatique 72h
                </button>

                <button
                  onClick={handleSubmitCorrections}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Valider et Transmettre les Pièces Rectifiées
                </button>
              </div>
            </div>
          )}

          {/* TAB 4 : Convocation à l'Entretien */}
          {activeTab === 'convocation' && currentApplication.interview && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#17365D] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
                    Convocation Officielle
                  </span>
                  <h3 className="font-serif text-xl font-black text-[#17365D] mt-2">
                    Audition Orale devant la Commission Doctorale
                  </h3>
                </div>
                <Calendar className="w-8 h-8 text-[#B69248]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Date & Heure</span>
                  <div className="font-serif font-bold text-base text-[#17365D] mt-1">
                    {new Date(currentApplication.interview.scheduledDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700">
                    {new Date(currentApplication.interview.scheduledDate).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    (Durée : {currentApplication.interview.durationMinutes} min)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Lieu / Salle</span>
                  <div className="font-serif font-bold text-base text-[#17365D] mt-1">
                    {currentApplication.interview.roomLocation}
                  </div>
                  <div className="text-xs text-slate-500">Présentation physique obligatoire</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Statut</span>
                  <div className="font-serif font-bold text-base text-emerald-700 mt-1">
                    {currentApplication.interview.isCompleted ? 'Entretien Réalisé' : 'Programmé'}
                  </div>
                  <div className="text-xs text-slate-500">Évaluation collégiale /20</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs text-slate-700">
                <div className="font-bold text-[#17365D]">Membres de la Commission de Sélection :</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {currentApplication.interview.committeeMembers.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
                <p className="mt-2 text-slate-600">
                  <strong>Consignes :</strong> Présentez-vous 15 minutes à l'avance muni de votre Carte d'Identité Nationale (CIN) originale et d'un support de présentation de votre projet de recherche (15 minutes d'exposé suivies de 15 minutes d'échanges scientifiques).
                </p>
              </div>
            </div>
          )}

          {/* TAB 5 : Résultats Officiels */}
          {activeTab === 'resultats' && currentApplication.deliberation?.isPublished && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Décision Officielle Publiée
                </span>
                <h3 className="font-serif text-2xl font-black text-[#17365D] mt-2">
                  Procès-Verbal des Délibérations de la Commission
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publié officiellement le {new Date(currentApplication.deliberation.publishedAt || '').toLocaleString('fr-FR')}.
                </p>
              </div>

              <div
                className={`p-6 rounded-2xl border text-center space-y-3 ${
                  currentApplication.deliberation.decision === 'ADMIS'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : currentApplication.deliberation.decision === 'LISTE_ATTENTE'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-red-50 border-red-300 text-red-950'
                }`}
              >
                <span className="text-xs uppercase font-bold tracking-wider">Résultat Final</span>
                <div className="font-serif text-3xl font-black">
                  {currentApplication.deliberation.decision === 'ADMIS' && 'FÉLICITATIONS : CANDIDAT ADMIS'}
                  {currentApplication.deliberation.decision === 'LISTE_ATTENTE' &&
                    `RETENU SUR LISTE D'ATTENTE — RANG N° ${currentApplication.deliberation.waitingListRank}`}
                  {currentApplication.deliberation.decision === 'REFUSE' && 'CANDIDATURE NON RETENUE'}
                </div>
                {currentApplication.deliberation.finalScore && (
                  <p className="text-xs font-mono font-bold">
                    Note globale attribuée par la commission : {currentApplication.deliberation.finalScore.toFixed(2)} / 20
                  </p>
                )}
                {currentApplication.deliberation.promotedFromWait && (
                  <p className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 p-2 rounded-lg max-w-lg mx-auto">
                    Promotion actée depuis la liste d'attente suite à désistement ({currentApplication.deliberation.promotionReason})
                  </p>
                )}
              </div>

              {currentApplication.deliberation.decision === 'ADMIS' && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setActiveTab('inscription')}
                    className="px-6 py-3 rounded-xl bg-[#17365D] hover:bg-[#102742] text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-[#B69248]" />
                    Consulter les Instructions d'Inscription Administrative en Présentiel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6 : Inscription Administrative en Présentiel */}
          {activeTab === 'inscription' && isAdmitted && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-300 shadow-md space-y-6">
              <div className="pb-4 border-b border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Dernière Étape Réglementaire
                </span>
                <h3 className="font-serif text-2xl font-black text-[#17365D] mt-2">
                  Inscription Administrative Initiale en Présentiel
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  L'inscription finale ne se fait pas entièrement en ligne : elle requiert le contrôle physique des diplômes originaux et la signature de la <strong>Charte de Thèse</strong> au CED.
                </p>
              </div>

              {currentApplication.enrollment?.isConfirmed ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-serif font-black text-xl text-emerald-900">
                    Inscription Administrative Officiellement Confirmée (100 %)
                  </h4>
                  <p className="text-xs text-slate-600">
                    Validée en présentiel le {new Date(currentApplication.enrollment.confirmedAt || '').toLocaleDateString('fr-FR')} par {currentApplication.enrollment.verifiedByName}.
                  </p>
                  <p className="text-xs text-emerald-800 font-medium pt-2">
                    Votre carte d'étudiant doctorant et attestation d'inscription sont disponibles au secrétariat du CED.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-serif font-bold text-sm text-[#17365D]">
                      Pièces originales à présenter physiquement au Centre d'Études Doctorales (CED) :
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pl-1">
                      <li>Diplôme de Baccalauréat original + copie légalisée</li>
                      <li>Diplôme de Master ou Diplôme d'Ingénieur d'État original + copie légalisée</li>
                      <li>Relevés de notes originaux de l'ensemble du cycle universitaire (S1 à S4)</li>
                      <li>Extrait d'acte de naissance ou copie de la CIN</li>
                      <li>2 photos d'identité récentes</li>
                      <li>
                        <strong>Charte de Thèse</strong> paraphée et signée par le candidat et le directeur de thèse.
                      </li>
                    </ul>
                  </div>

                  {/* Charte de Thèse Téléchargement */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-[#17365D]">Modèle Officiel de la Charte de Thèse (USMBA)</div>
                      <p className="text-[11px] text-slate-600">Document contractuel régissant les droits et engagements réciproques du doctorant et de son directeur.</p>
                    </div>
                    <button
                      onClick={() => alert('Téléchargement du gabarit officiel de la Charte de Thèse (Format PDF réglementaire).')}
                      className="px-4 py-2 rounded-xl bg-[#17365D] hover:bg-[#102742] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-[#B69248]" /> Télécharger la Charte PDF
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900">
                    <strong>Horaires de dépôt :</strong> Du lundi au vendredi de 09h00 à 15h30 au Centre d'Études Doctorales, Présidence de l'Université Sidi Mohamed Ben Abdellah, Route d'Imouzzer, Fès.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
