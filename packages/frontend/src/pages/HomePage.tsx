import { Link } from 'react-router-dom';
import { BookOpen, Users, Target, ArrowRight } from 'lucide-react';

export function HomePage(): JSX.Element {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
          Construisez votre
          <span className="text-primary-600"> parcours d&apos;apprentissage</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          Créez, organisez et suivez vos parcours d&apos;apprentissage personnalisés. Transformez
          vos objectifs en étapes concrètes et mesurables.
        </p>
        <div className="mt-10 flex justify-center space-x-4">
          <Link to="/learning-paths" className="btn btn-primary btn-lg">
            Découvrir les parcours
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link to="/profile" className="btn btn-outline btn-lg">
            Commencer maintenant
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Pourquoi choisir Learning Path Builder ?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Des outils puissants pour structurer votre apprentissage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card p-8 text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Parcours Structurés</h3>
            <p className="text-gray-600">
              Organisez vos ressources d&apos;apprentissage en parcours logiques et progressifs.
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Objectifs Clairs</h3>
            <p className="text-gray-600">
              Définissez des objectifs précis et mesurez vos progrès étape par étape.
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Communauté</h3>
            <p className="text-gray-600">
              Partagez vos parcours et découvrez ceux créés par d&apos;autres apprenants.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Prêt à commencer votre parcours ?</h2>
        <p className="text-xl mb-8 opacity-90">
          Rejoignez des milliers d&apos;apprenants qui transforment leurs objectifs en réalité.
        </p>
        <Link
          to="/learning-paths"
          className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg"
        >
          Explorer les parcours
        </Link>
      </section>
    </div>
  );
}
