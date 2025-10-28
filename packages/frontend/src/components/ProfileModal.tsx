import React, { useState } from 'react';
import { User } from '@/types';
import { AuthService } from '@/services/firebase';
import { toast } from 'react-hot-toast';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    skillLevel: user.skillLevel,
    language: user.preferences.language,
    studyMode: user.preferences.studyMode,
    sessionLength: user.preferences.sessionLength,
    notifications: user.preferences.notifications,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user profile in Firestore
      const updatedUser: User = {
        ...user,
        name: formData.name,
        skillLevel: formData.skillLevel as 'beginner' | 'intermediate' | 'advanced',
        preferences: {
          ...user.preferences,
          language: formData.language,
          studyMode: formData.studyMode,
          sessionLength: formData.sessionLength,
          notifications: formData.notifications,
        },
        updatedAt: new Date().toISOString(),
      };

      // Here you would call your API service to update the user profile
      // await apiService.updateUserProfile(user.id, updatedUser);

      onUpdate(updatedUser);
      toast.success('Profil mis à jour avec succès !');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Modifier le profil</h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Nom complet
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="skillLevel" className="label">
              Niveau de compétence
            </label>
            <select
              id="skillLevel"
              name="skillLevel"
              value={formData.skillLevel}
              onChange={handleInputChange}
              className="input"
            >
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
            </select>
          </div>

          <div>
            <label htmlFor="language" className="label">
              Langue
            </label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="input"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div>
            <label htmlFor="studyMode" className="label">
              Mode d'étude
            </label>
            <select
              id="studyMode"
              name="studyMode"
              value={formData.studyMode}
              onChange={handleInputChange}
              className="input"
            >
              <option value="flashcards">Flashcards uniquement</option>
              <option value="quiz">Quiz uniquement</option>
              <option value="mixed">Mixte</option>
            </select>
          </div>

          <div>
            <label htmlFor="sessionLength" className="label">
              Durée de session (minutes)
            </label>
            <input
              id="sessionLength"
              name="sessionLength"
              type="number"
              min="5"
              max="60"
              value={formData.sessionLength}
              onChange={handleInputChange}
              className="input"
            />
          </div>

          <div className="flex items-center">
            <input
              id="notifications"
              name="notifications"
              type="checkbox"
              checked={formData.notifications}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
            <label htmlFor="notifications" className="ml-2 text-sm text-slate-700">
              Recevoir les notifications
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Mise à jour...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
