import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, FileText, Award, Calendar, UserCheck } from 'lucide-react';
import { Application } from '../types';
import { CountdownTimer } from './CountdownTimer';

interface ProgressBarProps {
  application?: Application;
  compact?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ application, compact = false }) => {
  if (!application) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-sm">
        Aucune candidature déposée pour la campagne en cours.
      </div>
    );
  }

  const { status, currentStepIndex, progressPercent, correctionRequest, deliberation, enrollment } = application;

  const isExpired = status === 'REJETEE_DELAI_EXPIRE';
  const isRefused = status === 'REFUSEE';
  const isNonPreselected = status === 'NON_PRESELECTIONNEE';
  const isBlocked = isExpired || isRefused || isNonPreselected;
  const is72hActive = status === 'EN_ATTENTE_CORRECTION' && correctionRequest && !correctionRequest.isResolved;

  const STEPS = [
    { id: 1, title: 'Dépôt du Dossier', icon: FileText, desc: 'Choix du sujet & pièces' },
    { id: 2, title: 'Vérification', icon: Clock, desc: 'Recevabilité & Contrôle 72h' },
    { id: 3, title: 'Présélection', icon: Award, desc: 'Évaluation sur dossier' },
    { id: 4, title: 'Entretien', icon: Calendar, desc: 'Audition devant jury' },
    { id: 5, title: 'Résultats', icon: Award, desc: 'Délibération commission' },
    { id: 6, title: 'Inscription Initiale', icon: UserCheck, desc: 'Présentiel & Charte (100%)' },
  ];

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#17365D]">Avancement du dossier</span>
          <span className="font-bold text-[#17365D]">{isBlocked ? 'Arrêté' : `${progressPercent}%`}</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isBlocked ? 'bg-red-500' : is72hActive ? 'bg-amber-500 animate-pulse' : 'bg-[#17365D]'
            }`}
            style={{ width: `${isBlocked ? 100 : progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
      {/* En-tête de la barre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-bold text-[#17365D]">
              Suivi Réglementaire de la Candidature
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                status === 'INSCRIPTION_CONFIRMEE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isBlocked
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : is72hActive
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                  : 'bg-blue-50 text-[#17365D] border border-blue-200'
              }`}
            >
              {status === 'BROUILLON' && 'Brouillon non soumis'}
              {status === 'SOUMISE' && 'Dossier soumis — En attente d\'examen'}
              {status === 'EN_ATTENTE_CORRECTION' && 'Dossier Incomplet — Délai de 72h actif'}
              {status === 'CORRECTION_SOUMISE' && 'Corrections reçues — En relecture'}
              {status === 'EN_PRESELECTION' && 'Dossier recevable — En présélection'}
              {status === 'PRESELECTIONNEE' && 'Candidature présélectionnée'}
              {status === 'ENTRETIEN_PROGRAMME' && 'Convocation émise'}
              {status === 'ENTRETIEN_EFFECTUE' && 'Entretien passé — En délibération'}
              {status === 'ADMISE' && 'Admis sur liste principale'}
              {status === 'LISTE_ATTENTE' && `Liste d'attente (Rang ${deliberation?.waitingListRank || '-'})`}
              {status === 'NON_PRESELECTIONNEE' && 'Non présélectionné sur dossier'}
              {status === 'REFUSEE' && 'Non retenu après entretien'}
              {status === 'REJETEE_DELAI_EXPIRE' && 'Rejetée pour expiration du délai 72h'}
              {status === 'INSCRIPTION_CONFIRMEE' && 'Inscription confirmée (100 %)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sujet choisi : <strong className="text-slate-800">{application.subjectTitle}</strong> (Directeur : {application.supervisorName})
          </p>
        </div>

        {/* Badge de pourcentage */}
        <div className="flex items-center gap-3">
          {is72hActive && correctionRequest && (
            <CountdownTimer deadlineAt={correctionRequest.deadlineAt} compact />
          )}
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-[#17365D] font-mono leading-none">
              {isBlocked ? '—' : `${progressPercent}%`}
            </span>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
              {status === 'INSCRIPTION_CONFIRMEE' ? 'Complété' : isBlocked ? 'Interrompu' : 'Progression'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerte si le délai de 72h est actif */}
      {is72hActive && correctionRequest && (
        <div className="mt-4">
          <CountdownTimer deadlineAt={correctionRequest.deadlineAt} />
        </div>
      )}

      {/* Alerte si rejet/expiration */}
      {isExpired && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-sm">Candidature déclarée irrecevable par le système informatique</p>
            <p className="mt-0.5 text-red-700">
              Le délai impératif de 72 heures accordé pour téléverser les pièces manquantes a expiré le {correctionRequest ? new Date(correctionRequest.deadlineAt).toLocaleString('fr-FR') : 'échéance'}. Conformément à la réglementation ministérielle, la candidature est définitivement rejetée.
            </p>
          </div>
        </div>
      )}

      {/* Les 6 jalons horizontaux */}
      <div className="mt-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 relative">
          {STEPS.map((step) => {
            const isCompleted = !isBlocked && currentStepIndex > step.id;
            const isCurrent = !isBlocked && currentStepIndex === step.id;
            const isStepFailed = isBlocked && currentStepIndex === step.id;
            const IconComponent = step.icon;

            return (
              <div
                key={step.id}
                className={`relative flex flex-col p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-[#17365D] bg-blue-50/70 ring-2 ring-[#17365D]/15'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : isStepFailed
                    ? 'border-red-300 bg-red-50/70'
                    : 'border-slate-200 bg-slate-50/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Jalon {step.id}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {isCurrent && <Clock className="w-4 h-4 text-[#B69248] animate-spin" style={{ animationDuration: '8s' }} />}
                  {isStepFailed && <XCircle className="w-4 h-4 text-red-600" />}
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isCurrent
                        ? 'bg-[#17365D] text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isStepFailed
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-slate-900 leading-tight">
                    {step.title}
                  </span>
                </div>

                <span className="text-[11px] text-slate-500 mt-auto pt-1 leading-snug">
                  {step.desc}
                </span>

                {step.id === 6 && status === 'INSCRIPTION_CONFIRMEE' && (
                  <span className="mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-center">
                    Validé 100%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
