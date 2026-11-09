import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { User as UserModel } from '../types';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

interface AuthPagesProps {
  onSuccessLogin: (user: UserModel) => void;
  onNavigate: (view: string) => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  onSuccessLogin,
  onNavigate,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Champs Connexion
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Champs Inscription Candidat
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [phone, setPhone] = useState('');
  const [cin, setCin] = useState('');
  const [cne, setCne] = useState('');
  const [degreeName, setDegreeName] = useState('Master Spécialisé en Sciences et Techniques');
  const [institution, setInstitution] = useState('Université Sidi Mohamed Ben Abdellah - Fès');

  // Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.login(loginEmail, loginPass);
      setIsLoading(false);

      if (res.success && res.user) {
        onSuccessLogin(res.user);
      } else {
        setErrorMsg(res.error || 'Identifiants invalides : adresse email ou mot de passe incorrect.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Une erreur est survenue lors de la tentative de connexion.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim() || !regEmail.trim() || !cin.trim() || !regPass.trim()) {
      setErrorMsg('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    if (regPass.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au minimum 6 caractères.');
      return;
    }

    const res = storageService.registerCandidate({
      firstName,
      lastName,
      email: regEmail,
      password: regPass,
      phone,
      cin,
      cneCnie: cne,
      degreeName,
      institution,
    });

    if (res.success && res.user) {
      setSuccessMsg('Compte candidat créé avec succès ! Redirection en cours...');
      setTimeout(() => {
        onSuccessLogin(res.user!);
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Erreur lors de la création du compte candidat.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 sm:px-0">
      <div className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-xl space-y-6">
        {/* En-tête Institutionnel avec Logo Universitaire */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#17365D] to-[#0A192B] text-[#B69248] mx-auto flex items-center justify-center shadow-md border-2 border-[#B69248]/40">
            <GraduationCap className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B69248] block">
              Université Sidi Mohamed Ben Abdellah — Fès
            </span>
            <h2 className="font-serif text-2xl font-black text-[#17365D] mt-1">
              {mode === 'login' && 'Authentification'}
              {mode === 'register' && 'Inscription Candidat'}
              {mode === 'forgot' && 'Mot de Passe Oublié'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Centre d'Études Doctorales (CED) — Portail Officiel des Candidatures
            </p>
          </div>
        </div>

        {/* Message d'erreur */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* Message de succès */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Formulaire de Connexion Sécurisé */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Adresse Email Professionnelle ou Étudiante
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="exemple@demo.ma"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#17365D] focus:ring-1 focus:ring-[#17365D] outline-hidden text-xs sm:text-sm bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Mot de Passe</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-[#17365D] hover:underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#17365D] focus:ring-1 focus:ring-[#17365D] outline-hidden text-xs sm:text-sm bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#17365D] hover:bg-[#102742] text-white font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <span>Vérification des identifiants...</span>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4 text-[#B69248]" />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-100 text-center space-y-2">
              <p className="text-slate-600 text-xs">
                Nouveau candidat au doctorat ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setMode('register');
                  }}
                  className="font-bold text-[#17365D] hover:underline cursor-pointer"
                >
                  Créer un compte
                </button>
              </p>
              <button
                type="button"
                onClick={() => onNavigate('public_home')}
                className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Retour à l'accueil
              </button>
            </div>
          </form>
        )}

        {/* Formulaire Inscription Candidat */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">CIN / Passeport *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : CD123456"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-slate-50/50 uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">CNE / Code MASSAR</label>
                <input
                  type="text"
                  placeholder="Ex : N132456789"
                  value={cne}
                  onChange={(e) => setCne(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Adresse Email *</label>
              <input
                type="email"
                required
                placeholder="prenom.nom@domaine.ma"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mot de Passe * (min. 6 car.)</label>
              <div className="relative">
                <input
                  type={showRegPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass(!showRegPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Téléphone de Contact</label>
              <input
                type="tel"
                placeholder="+212 6 XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Diplôme d'Accès (Master ou Ingénieur)</label>
              <input
                type="text"
                required
                value={degreeName}
                onChange={(e) => setDegreeName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Établissement d'Origine</label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 text-[#17365D] border border-blue-200 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B69248] shrink-0 mt-0.5" />
              <span>
                L'inscription autonome est réservée aux candidats. Les comptes des Directeurs de thèse, Directeurs de CED et Administrateurs sont attribués par l'université.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#17365D] hover:bg-[#102742] text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
            >
              Créer Mon Compte Candidat
            </button>

            <div className="text-center pt-2 text-slate-600">
              Déjà inscrit ?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('login');
                }}
                className="font-bold text-[#17365D] hover:underline cursor-pointer"
              >
                Se connecter
              </button>
            </div>
          </form>
        )}

        {/* Formulaire Mot de passe oublié */}
        {mode === 'forgot' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Saisissez l'adresse email associée à votre compte universitaire. Un lien sécurisé de réinitialisation vous sera adressé conformément aux consignes de sécurité.
            </p>
            <input
              type="email"
              required
              placeholder="votre.email@demo.ma"
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs sm:text-sm"
            />
            <button
              type="button"
              onClick={() => {
                alert('Un lien de réinitialisation a été consigné dans les journaux d\'envoi email de la plateforme.');
                setMode('login');
              }}
              className="w-full py-3 rounded-xl bg-[#17365D] text-white font-bold text-sm shadow-md cursor-pointer hover:bg-[#102742]"
            >
              Envoyer les instructions
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('login');
                }}
                className="font-bold text-slate-600 hover:underline cursor-pointer"
              >
                Retour à la page de connexion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
