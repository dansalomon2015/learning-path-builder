import { Link } from 'react-router-dom';
import { BookOpen, Users, Target, ArrowRight } from 'lucide-react';

export function HomePage(): JSX.Element {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
          Build your
          <span className="text-primary-600"> learning path</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          Create, organize and track your personalized learning paths. Transform
          your goals into concrete and measurable steps.
        </p>
        <div className="mt-10 flex justify-center space-x-4">
          <Link to="/learning-paths" className="btn btn-primary btn-lg">
            Discover Learning Paths
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link to="/profile" className="btn btn-outline btn-lg">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Why choose Learning Path Builder?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Powerful tools to structure your learning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card p-8 text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Structured Paths</h3>
            <p className="text-gray-600">
              Organize your learning resources into logical and progressive paths.
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Clear Goals</h3>
            <p className="text-gray-600">
              Define precise goals and measure your progress step by step.
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Community</h3>
            <p className="text-gray-600">
              Share your paths and discover those created by other learners.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to start your learning journey?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of learners who are turning their goals into reality.
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
