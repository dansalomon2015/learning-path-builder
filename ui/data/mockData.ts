
import { LearningPlan, User } from '../types';

export const MOCK_USER: User = {
  name: 'Alex Doe',
  email: 'alex.doe@gmail.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=alexdoe'
};

export const MOCK_PLANS: LearningPlan[] = [
  {
    id: 'plan-1',
    title: 'React Hooks',
    level: 'Intermediate',
    flashcards: [
      { id: 'fc-1-1', question: 'What is `useState`?', answer: 'A Hook that lets you add React state to function components.', example: 'const [count, setCount] = useState(0);' },
      { id: 'fc-1-2', question: 'What is `useEffect`?', answer: 'A Hook that lets you perform side effects in function components, like data fetching or subscriptions.', example: 'useEffect(() => {\n  document.title = `You clicked ${count} times`;\n}, [count]);' },
      { id: 'fc-1-3', question: 'What are the rules of Hooks?', answer: '1. Only call Hooks at the top level. 2. Only call Hooks from React functions.' },
      { id: 'fc-1-4', question: 'What does the dependency array in `useEffect` do?', answer: 'It specifies which values the effect depends on. The effect will re-run only if one of these values has changed.' },
    ],
  },
  {
    id: 'plan-2',
    title: 'Advanced CSS',
    level: 'Advanced',
    flashcards: [
      { id: 'fc-2-1', question: 'What is the CSS Box Model?', answer: 'A box that wraps around every HTML element. It consists of: margins, borders, padding, and the actual content.' },
      { id: 'fc-2-2', question: 'What is CSS Grid?', answer: 'A two-dimensional layout system for CSS, allowing for complex and responsive grid structures.' },
      { id: 'fc-2-3', question: 'Explain `flex-grow`, `flex-shrink`, and `flex-basis`.', answer: 'They are properties of flex items. `flex-basis` is the initial size, `flex-grow` defines how much it can grow, and `flex-shrink` defines how much it can shrink.' },
    ],
  },
    {
    id: 'plan-3',
    title: 'History of Ancient Rome',
    level: 'Beginner',
    flashcards: [
      { id: 'fc-3-1', question: 'Who were Romulus and Remus?', answer: 'The mythical twin brothers who are said to have founded Rome.' },
      { id: 'fc-3-2', question: 'What was the Roman Republic?', answer: 'The era of ancient Roman civilization beginning with the overthrow of the Roman Kingdom, lasting from 509 BC to 27 BC.' },
      { id: 'fc-3-3', question: 'Who was the first Roman Emperor?', answer: 'Augustus (previously known as Octavian).' },
    ],
  },
];