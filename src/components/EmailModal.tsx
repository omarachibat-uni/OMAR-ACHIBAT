import React, { useState } from 'react';
import { X, Mail, CheckCircle2, RotateCw, Send, Eye } from 'lucide-react';
import { EmailLog } from '../types';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailLogs: EmailLog[];
  onResend?: (email: EmailLog) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, emailLogs, onResend }) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#17365D] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Mail className="w-5 h-5 text-[#B69248]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg">Centre d'Envoi des Notifications Email</h3>
              <p className="text-xs text-slate-300">
                Simulation SMTP & Traçabilité des courriels officiels (Arrêté 1886.23)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps : Liste à gauche, Détail à droite */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Liste */}
          <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto p-3 space-y-2 bg-slate-50">
            <div className="text-[11px] font-bold text-slate-500 uppercase px-2 mb-1 flex items-center justify-between">
              <span>Courriels envoyés ({emailLogs.length})</span>
              <span className="text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                Mode SMTP Simulé
              </span>
            </div>

            {emailLogs.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">Aucun courriel tracé.</p>
            ) : (
              emailLogs.map((mail) => {
                const isSelected = selectedEmail?.id === mail.id;
                return (
                  <div
                    key={mail.id}
                    onClick={() => setSelectedEmail(mail)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-[#17365D] shadow-xs ring-1 ring-[#17365D]'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#17365D] truncate max-w-[170px]">
                        {mail.recipientName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(mail.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{mail.subject}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                      <span className="truncate max-w-[140px] font-mono">{mail.recipientEmail}</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Délivré
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Détail du message sélectionné */}
          <div className="md:col-span-7 p-6 overflow-y-auto bg-white flex flex-col justify-between">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-[#17365D] font-mono font-semibold">
                      {selectedEmail.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(selectedEmail.sentAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-[#17365D] mt-2 leading-tight">
                    {selectedEmail.subject}
                  </h4>
                  <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                    <p>
                      <strong>Destinataire :</strong> {selectedEmail.recipientName} &lt;{selectedEmail.recipientEmail}&gt;
                    </p>
                    <p>
                      <strong>Expéditeur :</strong> Centre d'Études Doctorales USMBA &lt;ced.admissions@usmba.ac.ma&gt;
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedEmail.body}
                </div>

                {onResend && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => onResend(selectedEmail)}
                      className="px-3 py-1.5 text-xs font-medium text-[#17365D] bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Réémettre ce courriel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16 text-center">
                <Eye className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Sélectionnez un courriel dans la colonne de gauche pour lire son contenu.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
