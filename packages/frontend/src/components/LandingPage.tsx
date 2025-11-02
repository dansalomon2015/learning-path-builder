import type React from 'react';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignUp }): JSX.Element => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-10rem)] animate-fade-in">
      <div className="md:w-1/2 text-center md:text-left p-8">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-4">
          Master Anything with <span className="text-indigo-600">Adaptive Flashcards</span>.
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Your personal AI-powered learning assistant. Create study plans in seconds and conquer any
          subject with smart, animated flashcards tailored just for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={onLogin} className="btn btn-primary btn-lg px-8 py-4">
            Login
          </button>
          <button onClick={onSignUp} className="btn btn-outline btn-lg px-8 py-4">
            Create Account
          </button>
        </div>
      </div>
      <div className="md:w-1/2 p-8">
        <img
          src="https://picsum.photos/seed/learning/600/500"
          alt="Illustrative image of learning"
          className="rounded-2xl shadow-2xl w-full h-auto object-cover"
        />
      </div>
    </div>
  );
};

export default LandingPage;
