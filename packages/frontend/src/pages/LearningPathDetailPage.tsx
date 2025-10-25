import {useParams} from "react-router-dom";
import {Clock, Users, Star, Play, CheckCircle} from "lucide-react";

// Mock data - à remplacer par des appels API
const mockLearningPath = {
    id: "1",
    title: "Apprendre React de A à Z",
    description:
        "Un parcours complet pour maîtriser React, des bases aux concepts avancés. Ce parcours vous guidera à travers tous les aspects essentiels de React, des composants aux hooks avancés.",
    difficulty: "intermediate",
    estimatedDuration: 40,
    topics: ["React", "JavaScript", "TypeScript", "JSX", "Hooks"],
    rating: 4.8,
    studentsCount: 1250,
    isPublished: true,
    resources: [
        {
            id: "1",
            title: "Introduction à React",
            type: "video",
            duration: 45,
            description: "Découvrez les concepts fondamentaux de React",
            completed: true,
        },
        {
            id: "2",
            title: "Composants et Props",
            type: "article",
            duration: 30,
            description: "Apprenez à créer et utiliser des composants",
            completed: true,
        },
        {
            id: "3",
            title: "State et Lifecycle",
            type: "video",
            duration: 60,
            description: "Maîtrisez la gestion d'état dans React",
            completed: false,
        },
        {
            id: "4",
            title: "Hooks en détail",
            type: "course",
            duration: 90,
            description: "Explorez les hooks React modernes",
            completed: false,
        },
    ],
};

export function LearningPathDetailPage() {
    const {id} = useParams<{id: string}>();

    // En réalité, on ferait un appel API avec l'id
    const learningPath = mockLearningPath;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "beginner":
                return "bg-green-100 text-green-800";
            case "intermediate":
                return "bg-yellow-100 text-yellow-800";
            case "advanced":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case "beginner":
                return "Débutant";
            case "intermediate":
                return "Intermédiaire";
            case "advanced":
                return "Avancé";
            default:
                return difficulty;
        }
    };

    const getResourceTypeIcon = (type: string) => {
        switch (type) {
            case "video":
                return "🎥";
            case "article":
                return "📄";
            case "course":
                return "🎓";
            case "book":
                return "📚";
            case "tutorial":
                return "🔧";
            default:
                return "📝";
        }
    };

    const completedResources = learningPath.resources.filter(
        (r) => r.completed
    ).length;
    const progressPercentage =
        (completedResources / learningPath.resources.length) * 100;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="card p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                                    learningPath.difficulty
                                )}`}
                            >
                                {getDifficultyLabel(learningPath.difficulty)}
                            </span>
                            <div className="flex items-center space-x-1 text-yellow-500">
                                <Star className="h-5 w-5 fill-current" />
                                <span className="font-medium">
                                    {learningPath.rating}
                                </span>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {learningPath.title}
                        </h1>

                        <p className="text-lg text-gray-600 mb-6">
                            {learningPath.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {learningPath.topics.map((topic) => (
                                <span
                                    key={topic}
                                    className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center space-x-6 text-gray-600">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5" />
                                <span>{learningPath.estimatedDuration}h</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Users className="h-5 w-5" />
                                <span>
                                    {learningPath.studentsCount} apprenants
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Progression
                        </span>
                        <span className="text-sm text-gray-500">
                            {completedResources}/{learningPath.resources.length}{" "}
                            ressources
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{width: `${progressPercentage}%`}}
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {Math.round(progressPercentage)}% complété
                    </p>
                </div>

                <button className="btn btn-primary btn-lg">
                    <Play className="mr-2 h-5 w-5" />
                    Continuer le parcours
                </button>
            </div>

            {/* Resources */}
            <div className="card p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Ressources du parcours
                </h2>

                <div className="space-y-4">
                    {learningPath.resources.map((resource, index) => (
                        <div
                            key={resource.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                resource.completed
                                    ? "border-green-200 bg-green-50"
                                    : "border-gray-200 bg-white hover:border-primary-200"
                            }`}
                        >
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                            resource.completed
                                                ? "bg-green-100 text-green-600"
                                                : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {resource.completed ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <span>{index + 1}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-lg">
                                            {getResourceTypeIcon(resource.type)}
                                        </span>
                                        <h3
                                            className={`text-lg font-semibold ${
                                                resource.completed
                                                    ? "text-green-800"
                                                    : "text-gray-900"
                                            }`}
                                        >
                                            {resource.title}
                                        </h3>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                            {resource.type}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 mb-3">
                                        {resource.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <span>{resource.duration} min</span>
                                        </div>

                                        <button
                                            className={`btn btn-sm ${
                                                resource.completed
                                                    ? "btn-secondary"
                                                    : "btn-primary"
                                            }`}
                                        >
                                            {resource.completed
                                                ? "Réviser"
                                                : "Commencer"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
