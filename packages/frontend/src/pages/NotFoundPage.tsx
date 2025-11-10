import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage(): JSX.Element {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="space-y-4">
          <Link to="/" className="btn btn-primary btn-lg inline-flex items-center">
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Link>

          <div>
            <button
              onClick={(): void => {
                window.history.back();
              }}
              className="btn btn-outline inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
