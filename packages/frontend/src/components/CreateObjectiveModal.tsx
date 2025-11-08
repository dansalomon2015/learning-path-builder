import type React from 'react';
import { useState } from 'react';
import { Target, Calendar, Trophy, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CreateObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (objectiveData: {
    title: string;
    description: string;
    category: string;
    targetRole: string;
    targetTimeline: number;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }) => Promise<boolean> | boolean;
}

// eslint-disable-next-line max-lines-per-function
const CreateObjectiveModal: React.FC<CreateObjectiveModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}): JSX.Element | null => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    targetRole: '',
    targetTimeline: 6,
    currentLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    targetLevel: 'advanced' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
  });

  const [isCreating, setIsCreating] = useState(false);

  const categories = [
    'Programming',
    'Design',
    'Data Science',
    'Marketing',
    'Management',
    'Sales',
    'Finance',
    'Healthcare',
    'Education',
    'Other',
  ];

  const popularRoles = {
    Programming: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Mobile Developer',
      'DevOps Engineer',
      'Data Engineer',
      'Machine Learning Engineer',
      'Software Architect',
    ],
    Design: [
      'UI/UX Designer',
      'Graphic Designer',
      'Product Designer',
      'Web Designer',
      'Motion Designer',
      'Design System Designer',
    ],
    'Data Science': [
      'Data Scientist',
      'Data Analyst',
      'Business Intelligence Analyst',
      'Machine Learning Engineer',
      'Data Engineer',
    ],
    Marketing: [
      'Digital Marketing Specialist',
      'Content Marketing Manager',
      'SEO Specialist',
      'Social Media Manager',
      'Marketing Manager',
    ],
    Management: [
      'Project Manager',
      'Product Manager',
      'Engineering Manager',
      'Team Lead',
      'Scrum Master',
    ],
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (
      formData.title === '' ||
      formData.description === '' ||
      formData.category === '' ||
      formData.targetRole === ''
    ) {
      return;
    }

    setIsCreating(true);
    try {
      const created = await onCreate(formData);
      if (created === true) {
        handleClose();
      }
    } catch (error: unknown) {
      console.error('Error creating objective:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = (): void => {
    setFormData({
      title: '',
      description: '',
      category: '',
      targetRole: '',
      targetTimeline: 6,
      currentLevel: 'beginner',
      targetLevel: 'advanced',
    });
    onClose();
  };

  const handleCategoryChange = (category: string): void => {
    setFormData((prev): typeof formData => ({
      ...prev,
      category,
      targetRole: '', // Reset target role when category changes
    }));
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean): void => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">Create Learning Objective</DialogTitle>
          </div>
          <DialogDescription>
            Define your learning objective and we&apos;ll create a personalized learning path for
            you
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="title">Objective Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Become Senior Java Developer"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                    setFormData((prev): typeof formData => ({ ...prev, title: e.target.value }));
                  }}
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you want to achieve and why it's important to you..."
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => {
                    setFormData((prev): typeof formData => ({
                      ...prev,
                      description: e.target.value,
                    }));
                  }}
                  rows={3}
                  required
                  disabled={isCreating}
                />
              </div>
            </div>

            {/* Category and Role */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Career Focus</h3>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                  required
                  disabled={isCreating}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(
                      (category: string): JSX.Element => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {formData.category !== '' && formData.category in popularRoles && (
                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role *</Label>
                  <Select
                    value={formData.targetRole}
                    onValueChange={(value: string): void => {
                      setFormData((prev): typeof formData => ({
                        ...prev,
                        targetRole: value,
                      }));
                    }}
                    required
                    disabled={isCreating}
                  >
                    <SelectTrigger id="targetRole">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularRoles[formData.category as keyof typeof popularRoles].map(
                        (role: string): JSX.Element => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.category !== '' && !(formData.category in popularRoles) && (
                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role *</Label>
                  <Input
                    id="targetRole"
                    type="text"
                    placeholder="Enter your target role"
                    value={formData.targetRole}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                      setFormData((prev): typeof formData => ({
                        ...prev,
                        targetRole: e.target.value,
                      }));
                    }}
                    required
                    disabled={isCreating}
                  />
                </div>
              )}
            </div>

            {/* Timeline and Levels */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Learning Plan</h3>

              <div className="space-y-2">
                <Label htmlFor="timeline">Target Timeline (months)</Label>
                <div className="flex items-center gap-4">
                  <input
                    id="timeline"
                    type="range"
                    min="1"
                    max="24"
                    value={formData.targetTimeline}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                      setFormData((prev): typeof formData => ({
                        ...prev,
                        targetTimeline: parseInt(e.target.value, 10),
                      }));
                    }}
                    className="flex-1"
                    disabled={isCreating}
                  />
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    <span>{formData.targetTimeline} months</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentLevel">Current Level</Label>
                  <Select
                    value={formData.currentLevel}
                    onValueChange={(value: string): void => {
                      if (
                        value === 'beginner' ||
                        value === 'intermediate' ||
                        value === 'advanced'
                      ) {
                        setFormData((prev): typeof formData => ({ ...prev, currentLevel: value }));
                      }
                    }}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="currentLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetLevel">Target Level</Label>
                  <Select
                    value={formData.targetLevel}
                    onValueChange={(value: string): void => {
                      if (
                        value === 'beginner' ||
                        value === 'intermediate' ||
                        value === 'advanced' ||
                        value === 'expert'
                      ) {
                        setFormData((prev): typeof formData => ({ ...prev, targetLevel: value }));
                      }
                    }}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="targetLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* AI-Powered Suggestions */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-semibold">AI-Powered Learning Path</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Once you create this objective, our AI will generate a personalized learning path
                with:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Skill assessment to evaluate your current level</li>
                <li>Structured learning modules tailored to your timeline</li>
                <li>Milestones and progress tracking</li>
                <li>Practice projects and real-world applications</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isCreating ||
                formData.title === '' ||
                formData.description === '' ||
                formData.category === '' ||
                formData.targetRole === ''
              }
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  Create Objective
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateObjectiveModal;
