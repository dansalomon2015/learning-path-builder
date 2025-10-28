import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface AuthFormProps {
  onSuccess: () => void;
  onSwitchMode: () => void;
  mode: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onSwitchMode, mode }) => {
  const { signIn, signUp, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (mode === 'login') {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.name);
      }
      toast.success(mode === 'login' ? 'Connexion réussie !' : 'Compte créé avec succès !');
      onSuccess();
    } catch (error: any) {
      toast.error(error || 'Une erreur est survenue.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  onClick={onSwitchMode}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  onClick={onSwitchMode}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="label">
                  Nom complet
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={mode === 'register'}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Votre nom complet"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="input"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {mode === 'login' ? 'Connexion...' : 'Création...'}
                </div>
              ) : mode === 'login' ? (
                'Se connecter'
              ) : (
                'Créer le compte'
              )}
            </button>
          </div>

          {mode === 'login' && (
            <div className="text-center">
              <button type="button" className="text-sm text-indigo-600 hover:text-indigo-500">
                Mot de passe oublié ?
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
