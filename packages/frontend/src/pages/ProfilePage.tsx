import {User, Mail, Calendar, BookOpen, Target} from "lucide-react";

// Mock data - à remplacer par des appels API
const mockUser = {
    id: "1",
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    avatar: null,
    role: "student",
    createdAt: "2024-01-15",
    learningPaths: [
        {
            id: "1",
            title: "Apprendre React de A à Z",
            progress: 75,
            completedResources: 3,
            totalResources: 4,
        },
        {
            id: "2",
            title: "Introduction à TypeScript",
            progress: 100,
            completedResources: 5,
            totalResources: 5,
        },
    ],
    stats: {
        totalLearningPaths: 2,
        completedPaths: 1,
        totalHours: 60,
        averageRating: 4.7,
    },
};

export function ProfilePage() {
    const user = mockUser;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
                <p className="mt-2 text-gray-600">
                    Gérez vos informations et suivez vos progrès
                </p>
            </div>

            {/* User Info */}
            <div className="card p-8">
                <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="h-10 w-10 text-primary-600" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {user.name}
                        </h2>

                        <div className="space-y-2 text-gray-600">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Membre depuis{" "}
                                    {new Date(
                                        user.createdAt
                                    ).toLocaleDateString("fr-FR")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card p-6 text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {user.stats.totalLearningPaths}
                    </h3>
                    <p className="text-gray-600">Parcours suivis</p>
                </div>

                <div className="card p-6 text-center">
                    <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                        <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {user.stats.completedPaths}
                    </h3>
                    <p className="text-gray-600">Parcours terminés</p>
                </div>

                <div className="card p-6 text-center">
                    <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                        <Calendar className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {user.stats.totalHours}h
                    </h3>
                    <p className="text-gray-600">Heures d'apprentissage</p>
                </div>

                <div className="card p-6 text-center">
                    <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                        <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {user.stats.averageRating}
                    </h3>
                    <p className="text-gray-600">Note moyenne</p>
                </div>
            </div>

            {/* Learning Paths */}
            <div className="card p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Mes Parcours
                </h2>

                <div className="space-y-6">
                    {user.learningPaths.map((path) => (
                        <div
                            key={path.id}
                            className="border border-gray-200 rounded-lg p-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {path.title}
                                </h3>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        path.progress === 100
                                            ? "bg-green-100 text-green-800"
                                            : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                    {path.progress === 100
                                        ? "Terminé"
                                        : "En cours"}
                                </span>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Progression
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {path.completedResources}/
                                        {path.totalResources} ressources
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                        style={{width: `${path.progress}%`}}
                                    />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {path.progress}% complété
                                </p>
                            </div>

                            <button className="btn btn-primary">
                                {path.progress === 100
                                    ? "Réviser"
                                    : "Continuer"}
                            </button>
                        </div>
                    ))}
                </div>

                {user.learningPaths.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">
                            Aucun parcours suivi
                        </p>
                        <p className="text-gray-400">
                            Commencez par explorer nos parcours d'apprentissage
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
