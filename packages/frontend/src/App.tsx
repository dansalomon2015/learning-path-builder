import type React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePageRoute from './pages/ProfilePageRoute';
import StudyPage from './pages/StudyPage';
import ObjectivePathPage from './pages/ObjectivePathPage';
import ObjectivePathsListPage from './pages/ObjectivePathsListPage';
import ModuleLearnPage from './pages/ModuleLearnPage';
import AssessmentPage from './pages/AssessmentPage';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = (): JSX.Element => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePageRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/study/:planId"
                element={
                  <ProtectedRoute>
                    <StudyPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/objectives/:objectiveId/paths"
                element={
                  <ProtectedRoute>
                    <ObjectivePathsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/objectives/:objectiveId/paths/:pathId"
                element={
                  <ProtectedRoute>
                    <ObjectivePathPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/objectives/:objectiveId/paths/:pathId/modules/:moduleId/learn"
                element={
                  <ProtectedRoute>
                    <ModuleLearnPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessment/:objectiveId"
                element={
                  <ProtectedRoute>
                    <AssessmentPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
