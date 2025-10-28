import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenIcon, SparklesIcon, TrophyIcon } from '../components/icons';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleSignUp = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <BookOpenIcon className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900">FlashLearn AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogin}
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                Se connecter
              </button>
              <button onClick={handleSignUp} className="btn btn-primary">
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Apprenez avec l'IA
            <span className="text-indigo-600"> FlashLearn</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Transformez vos documents en flashcards intelligentes et progressez avec un système
            d'apprentissage adaptatif.
          </p>
          <div className="flex justify-center space-x-4">
            <button onClick={handleSignUp} className="btn btn-primary btn-lg">
              Commencer gratuitement
            </button>
            <button onClick={handleLogin} className="btn btn-secondary btn-lg">
              Se connecter
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <SparklesIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Génération IA</h3>
            <p className="text-slate-600">
              Créez automatiquement des flashcards à partir de vos documents avec l'IA Gemini.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <BookOpenIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Apprentissage Adaptatif</h3>
            <p className="text-slate-600">
              Le système s'adapte à votre niveau et ajuste la difficulté automatiquement.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <TrophyIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Suivi des Progrès</h3>
            <p className="text-slate-600">
              Visualisez vos progrès avec des statistiques détaillées et des recommandations.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpenIcon className="h-6 w-6 text-indigo-400" />
            <span className="text-xl font-bold">FlashLearn AI</span>
          </div>
          <p className="text-slate-400">© 2024 FlashLearn AI. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
