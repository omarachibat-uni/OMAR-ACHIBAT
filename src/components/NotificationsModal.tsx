import React from 'react';
import { X, Bell, Check, Clock, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { NotificationItem } from '../types';
import { storageService } from '../services/storageService';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onNotificationRead: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationRead,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    notifications.forEach((n) => storageService.markNotificationRead(n.id));
    onNotificationRead();
  };

  const handleClickItem = (n: NotificationItem) => {
    storageService.markNotificationRead(n.id);
    onNotificationRead();
    if (n.linkTab && onNavigateTab) {
      onNavigateTab(n.linkTab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* En-tête */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#17365D] text-white rounded-lg">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#17365D] text-base">Notifications Système</h3>
              <p className="text-xs text-slate-500">Alertes réglementaires, convocations et suivis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#17365D] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Tout marquer lu
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Aucune notification pour le moment.</p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = !item.isRead;
              return (
                <div
                  key={item.id}
                  onClick={() => handleClickItem(item)}
                  className={`pt-2.5 first:pt-0 cursor-pointer p-3 rounded-xl transition-all ${
                    isUnread ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {item.type === 'DEADLINE' && <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />}
                      {item.type === 'CONVOCATION' && <Clock className="w-5 h-5 text-[#B69248]" />}
                      {item.type === 'SUCCESS' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                      {item.type === 'ERROR' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                      {item.type === 'INFO' && <Info className="w-5 h-5 text-[#17365D]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${isUnread ? 'text-[#17365D]' : 'text-slate-700'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                      {item.linkTab && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#17365D] mt-2">
                          Accéder à la section <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
