import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Target, Sparkles, TrendingUp, BookOpen, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';

// eslint-disable-next-line max-lines-per-function
export default function LandingPage(): JSX.Element {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="lg" />
            <span className="text-2xl font-bold text-balance">FlashLearn AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Adaptive learning powered by AI</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
            Master any subject with an AI-powered approach
          </h1>

          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
            Create personalized learning paths tailored to your goals. Smart flashcards, adaptive
            quizzes, and AI-powered content help you identify your knowledge gaps, learn faster and
            more effectively.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to={isAuthenticated ? '/dashboard' : '/auth'}>
              <Button size="lg" className="text-lg px-8">
                Start for free
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Discover features
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-balance">How it works</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            A 4-step AI-powered approach to identify gaps and master any subject
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Define your goals</CardTitle>
              <CardDescription>
                Create personalized learning objectives with a target level and deadline
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Logo size="md" />
              </div>
              <CardTitle>AI Assessment</CardTitle>
              <CardDescription>
                Take an AI-generated assessment to identify your knowledge gaps and current level
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Adaptive paths</CardTitle>
              <CardDescription>
                Receive personalized learning paths with progressive modules and flashcards
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Validate your knowledge</CardTitle>
              <CardDescription>
                Complete validation quizzes to unlock new modules and progress
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-balance">Why FlashLearn AI?</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <TrendingUp className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">Adaptive learning</p>
                        <p className="text-muted-foreground text-sm">
                          Content adapts to your level and progress
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Sparkles className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">AI-generated content</p>
                        <p className="text-muted-foreground text-sm">
                          Flashcards and quizzes automatically created for each subject
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Target className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">Progress tracking</p>
                        <p className="text-muted-foreground text-sm">
                          Track your progress, identify knowledge gaps, and unlock targeted content
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <img src="/icon-512.png" alt="FlashLearn AI" className="h-48 w-48 relative" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8 bg-primary text-primary-foreground rounded-2xl p-12">
          <h2 className="text-4xl font-bold text-balance">Ready to transform your learning?</h2>
          <p className="text-lg text-pretty opacity-90">
            Join thousands of learners using AI to identify their knowledge gaps and master any
            subject faster.
          </p>
          <Link to={isAuthenticated ? '/dashboard' : '/auth'}>
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo size="md" />
              <span className="font-semibold">FlashLearn AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 FlashLearn AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
