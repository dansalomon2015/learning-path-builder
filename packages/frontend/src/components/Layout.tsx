import {ReactNode} from "react";
import {Link, useLocation} from "react-router-dom";
import {BookOpen, User, Home, Menu, X} from "lucide-react";
import {useState} from "react";
import {clsx} from "clsx";

interface LayoutProps {
    children: ReactNode;
}

export function Layout({children}: LayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        {name: "Accueil", href: "/", icon: Home},
        {name: "Parcours", href: "/learning-paths", icon: BookOpen},
        {name: "Profil", href: "/profile", icon: User},
    ];

    const isActive = (path: string) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <BookOpen className="h-8 w-8 text-primary-600" />
                            <span className="text-xl font-bold text-gray-900">
                                Learning Path Builder
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-8">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={clsx(
                                            "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                            isActive(item.href)
                                                ? "text-primary-600 bg-primary-50"
                                                : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                        >
                            {isMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={clsx(
                                            "flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors",
                                            isActive(item.href)
                                                ? "text-primary-600 bg-primary-50"
                                                : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-600">
                        <p>
                            &copy; 2024 Learning Path Builder. Tous droits
                            réservés.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
