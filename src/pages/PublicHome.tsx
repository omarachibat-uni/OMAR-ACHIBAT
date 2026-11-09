import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  FileCheck,
  Users,
  Building,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Campaign, ThesisSubject } from '../types';

interface PublicHomeProps {
  campaign: Campaign;
  subjects: ThesisSubject[];
  onNavigate: (view: string) => void;
  onSelectSubject?: (subjectId: string) => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  campaign,
  subjects,
  onNavigate,
  onSelectSubject,
}) => {
  const publishedSubjects = subjects.filter((s) => s.isPublished);

  const TIMELINE = [
    { date: '15 Octobre 2026', title: 'Ouverture du Portail', desc: 'Publication officielle des sujets & début des dépôts' },
    { date: '15 Décembre 2026', title: 'Clôture des Candidatures', desc: 'Verrouillage des nouveaux dépôts à 23h59' },
    { date: '20 - 30 Décembre 2026', title: 'Contrôle & Recevabilité', desc: 'Vérification des pièces et délai strict de 72h' },
    { date: '05 - 15 Janvier 2027', title: 'Entretiens Orales', desc: 'Audition devant les commissions de sélection' },
    { date: '20 Janvier 2027', title: 'Résultats Officiels', desc: 'Publication des listes des admis et listes d\'attente' },
    { date: '25 Janvier - 05 Février 2027', title: 'Inscription en Présentiel', desc: 'Signature de la charte de thèse au CED' },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Banner Institutionnel */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#17365D] via-[#102742] to-[#0A192B] text-white p-8 sm:p-12 shadow-xl border border-[#B69248]/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B69248]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B69248]/20 border border-[#B69248]/40 text-[#f5d799] text-xs font-semibold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Campagne Nationale d'Admission au Doctorat {campaign.academicYear}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight">
            Plateforme Officielle de Gestion des Candidatures au Doctorat
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Centre d'Études Doctorales (CED) de l'Université Sidi Mohamed Ben Abdellah. Dispositif officiel de sélection, d'instruction dématérialisée et d'inscription administrative des doctorants, établi en application stricte de la réglementation marocaine relative aux études doctorales (décision ministérielle n° 1886.23 du 1er août 2024).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('subjects_catalog')}
              className="px-6 py-3 rounded-xl bg-[#B69248] hover:bg-[#a38038] text-white font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Consulter les Sujets de Thèse ({publishedSubjects.length})
            </button>

            <button
              onClick={() => onNavigate('candidate_space')}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#B69248]" />
              Accéder à Mon Dossier de Candidature
            </button>
          </div>

          {/* Règle réglementaire d'or */}
          <div className="mt-6 pt-4 border-t border-white/15 flex items-start gap-3 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-[#B69248] shrink-0 mt-0.5" />
            <span>
              <strong>Règle réglementaire impérative :</strong> Chaque candidat ne peut postuler qu'à <strong>un seul sujet de thèse</strong> pour l'ensemble de la campagne. Tout dossier déclaré incomplet bénéficie d'un délai impératif et souverain de <strong>72 heures</strong> pour régularisation.
            </span>
          </div>
        </div>
      </section>

      {/* Statistiques clés de la campagne */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sujets Ouverts</span>
            <BookOpen className="w-4 h-4 text-[#17365D]" />
          </div>
          <div className="text-2xl font-black text-[#17365D] font-mono">{publishedSubjects.length}</div>
          <p className="text-xs text-slate-500 mt-1">Disciplines scientifiques & techniques</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Laboratoires</span>
            <Building className="w-4 h-4 text-[#B69248]" />
          </div>
          <div className="text-2xl font-black text-[#17365D] font-mono">14</div>
          <p className="text-xs text-slate-500 mt-1">Structures de recherche accréditées</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Délai Régularisation</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">72h 00m</div>
          <p className="text-xs text-slate-500 mt-1">Délai souverain en cas de dossier incomplet</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Évaluation Orale</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#17365D] font-mono">Note /20</div>
          <p className="text-xs text-slate-500 mt-1">Audition collégiale sans seuil couperet</p>
        </div>
      </section>

      {/* Calendrier officiel de la sélection */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#17365D]">
              Calendrier Officiel de la Campagne {campaign.academicYear}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Étapes d'instruction et dates impératives du processus d'admission
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" /> Statut : {campaign.status}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TIMELINE.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/40 hover:border-[#17365D]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-[#B69248] uppercase tracking-wider">
                  Étape {idx + 1}
                </span>
                <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">{step.date}</div>
                <h4 className="font-serif font-bold text-sm text-[#17365D] mt-2">{step.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Aperçu des sujets de thèse récents */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#17365D]">
              Derniers Sujets de Thèse Publiés
            </h3>
            <p className="text-xs text-slate-500">
              Proposés par les professeurs habilités et rattachés aux laboratoires accrédités
            </p>
          </div>
          <button
            onClick={() => onNavigate('subjects_catalog')}
            className="text-xs font-bold text-[#17365D] hover:text-[#B69248] flex items-center gap-1 cursor-pointer"
          >
            Voir tous les sujets <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publishedSubjects.slice(0, 4).map((subj) => (
            <div
              key={subj.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-[#B69248] transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#B69248] bg-[#B69248]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {subj.domain}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">1 place</span>
                </div>

                <h4 className="font-serif font-bold text-sm text-[#17365D] group-hover:text-[#B69248] transition-colors leading-snug">
                  {subj.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {subj.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {subj.keywords.map((kw, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Directeur de thèse :</span>
                  <span className="font-semibold text-slate-800">{subj.supervisorName}</span>
                </div>
                <button
                  onClick={() => {
                    if (onSelectSubject) onSelectSubject(subj.id);
                    onNavigate('subjects_catalog');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 group-hover:bg-[#17365D] group-hover:text-white text-[#17365D] font-semibold text-xs transition-colors cursor-pointer"
                >
                  Détails & Postuler
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rappel du protocole ministériel */}
      <section className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 text-xs text-amber-950 space-y-2">
        <h4 className="font-serif font-bold text-sm text-[#917130] uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#B69248]" />
          Dispositions Réglementaires Clés (Décision Ministérielle 1886.23)
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
          <li><strong>Unicité du choix :</strong> Chaque candidat ne peut soumettre qu'un seul dossier pour un seul sujet au cours d'une même campagne.</li>
          <li><strong>Verrouillage du sujet :</strong> Dès la soumission du dossier, le sujet de recherche choisi est irréversiblement verrouillé.</li>
          <li><strong>Délai de correction de 72h :</strong> En cas de pièces non conformes, un délai impératif de 72h précises est déclenché par le système. Tout retard entraîne l'irrecevabilité automatique du dossier sans recours.</li>
          <li><strong>Inscription administrative finale en présentiel :</strong> L'admission officielle requiert obligatoirement la présentation physique du candidat, la vérification des diplômes originaux et la signature de la Charte de Thèse au CED.</li>
        </ul>
      </section>
    </div>
  );
};
