import React from 'react';
import {
  SparklesIcon,
  BookOpenIcon,
  CodeIcon,
  ScienceIcon,
  HistoryIcon,
  LanguageIcon,
} from './icons';

interface Template {
  id: string;
  title: string;
  description: string;
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  icon: React.ReactNode;
  category: string;
}

interface LearningPlanTemplatesProps {
  onSelectTemplate: (template: Template) => void;
}

const templates: Template[] = [
  {
    id: 'react-basics',
    title: 'React Fundamentals',
    description: 'Learn the core concepts of React including components, props, state, and hooks',
    topic: 'React',
    skillLevel: 'beginner',
    icon: <CodeIcon className="w-6 h-6" />,
    category: 'Programming',
  },
  {
    id: 'javascript-es6',
    title: 'JavaScript ES6+',
    description:
      'Master modern JavaScript features like arrow functions, destructuring, and async/await',
    topic: 'JavaScript',
    skillLevel: 'intermediate',
    icon: <CodeIcon className="w-6 h-6" />,
    category: 'Programming',
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning Basics',
    description: 'Introduction to ML concepts, algorithms, and practical applications',
    topic: 'Machine Learning',
    skillLevel: 'beginner',
    icon: <ScienceIcon className="w-6 h-6" />,
    category: 'Data Science',
  },
  {
    id: 'french-language',
    title: 'French Language',
    description: 'Learn essential French vocabulary, grammar, and conversational phrases',
    topic: 'French',
    skillLevel: 'beginner',
    icon: <LanguageIcon className="w-6 h-6" />,
    category: 'Languages',
  },
  {
    id: 'world-history',
    title: 'World History',
    description: 'Key historical events, civilizations, and their impact on modern society',
    topic: 'History',
    skillLevel: 'intermediate',
    icon: <HistoryIcon className="w-6 h-6" />,
    category: 'Social Sciences',
  },
  {
    id: 'python-data',
    title: 'Python for Data Analysis',
    description: 'Learn pandas, numpy, and matplotlib for data manipulation and visualization',
    topic: 'Python',
    skillLevel: 'intermediate',
    icon: <CodeIcon className="w-6 h-6" />,
    category: 'Programming',
  },
  {
    id: 'web-security',
    title: 'Web Security',
    description: 'Understand common vulnerabilities, authentication, and secure coding practices',
    topic: 'Cybersecurity',
    skillLevel: 'advanced',
    icon: <ScienceIcon className="w-6 h-6" />,
    category: 'Security',
  },
  {
    id: 'spanish-language',
    title: 'Spanish Language',
    description: 'Essential Spanish vocabulary, grammar, and cultural context',
    topic: 'Spanish',
    skillLevel: 'beginner',
    icon: <LanguageIcon className="w-6 h-6" />,
    category: 'Languages',
  },
];

const LearningPlanTemplates: React.FC<LearningPlanTemplatesProps> = ({ onSelectTemplate }) => {
  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Choose a Template</h3>
        <p className="text-sm text-slate-600">
          Start with a pre-made template or create your own custom learning plan
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wide">{category}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates
              .filter(template => template.category === category)
              .map(template => (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-slate-800 group-hover:text-indigo-800">
                        {template.title}
                      </h5>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500 capitalize">
                          {template.skillLevel}
                        </span>
                        <span className="text-xs text-indigo-600 font-medium">
                          {template.topic}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}

      <div className="text-center pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-600">
          Don't see what you're looking for? Create a custom plan below.
        </p>
      </div>
    </div>
  );
};

export default LearningPlanTemplates;
