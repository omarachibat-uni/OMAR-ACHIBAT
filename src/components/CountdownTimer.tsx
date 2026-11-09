import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertOctagon } from 'lucide-react';

interface CountdownTimerProps {
  deadlineAt: string;
  onExpire?: () => void;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadlineAt, onExpire, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(deadlineAt).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [deadlineAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center gap-2 font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg ${compact ? 'px-2 py-1 text-xs' : 'p-3 text-sm'}`}>
        <AlertOctagon className="w-4 h-4 text-red-600 animate-pulse shrink-0" />
        <span>Délai impératif de 72h expiré — Rejet automatique appliqué</span>
      </div>
    );
  }

  const isUrgent = timeLeft.hours < 12;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-semibold ${isUrgent ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-50 text-[#17365D] border border-blue-200'}`}>
        <Clock className="w-3.5 h-3.5 text-[#B69248] animate-spin" style={{ animationDuration: '6s' }} />
        <span>
          {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-4 transition-all shadow-xs ${isUrgent ? 'bg-amber-50/90 border-amber-300' : 'bg-white border-[#B69248]/40'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg shrink-0 ${isUrgent ? 'bg-amber-200 text-amber-900' : 'bg-[#17365D]/10 text-[#17365D]'}`}>
            <AlertTriangle className="w-5 h-5 text-[#B69248]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm tracking-wide uppercase text-[#17365D]">
                Délai Réglementaire de Correction
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#B69248]/15 text-[#917130] font-semibold">
                Arrêté 1886.23
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Échéance stricte fixée au {new Date(deadlineAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(deadlineAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.
            </p>
          </div>
        </div>

        {/* Compteur grand format */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex flex-col items-center bg-[#17365D] text-white px-3 py-1.5 rounded-lg min-w-[54px] shadow-sm">
            <span className="font-mono text-xl font-bold tracking-tight">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">Heures</span>
          </div>
          <span className="text-lg font-bold text-[#17365D]">:</span>
          <div className="flex flex-col items-center bg-[#17365D] text-white px-3 py-1.5 rounded-lg min-w-[54px] shadow-sm">
            <span className="font-mono text-xl font-bold tracking-tight">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">Minutes</span>
          </div>
          <span className="text-lg font-bold text-[#17365D]">:</span>
          <div className="flex flex-col items-center bg-[#B69248] text-white px-3 py-1.5 rounded-lg min-w-[54px] shadow-sm">
            <span className="font-mono text-xl font-bold tracking-tight">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-amber-100 font-medium">Sec</span>
          </div>
        </div>
      </div>
    </div>
  );
};
