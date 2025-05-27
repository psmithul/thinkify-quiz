'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabaseClient';

export default function SetupSampleDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createSampleData = async () => {
    setIsLoading(true);
    setError(null);
    setMessage('Creating sample data...');

    try {
      // Create sample users first
      const sampleUsers = [
        {
          id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          email: 'john.doe@creator.com',
          full_name: 'John Doe',
          bio: 'Full-stack developer with 5+ years of experience in React, Node.js, and modern web technologies. Passionate about teaching and sharing knowledge.',
          profile_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          role: 'creator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
          email: 'sarah.smith@creator.com',
          full_name: 'Sarah Smith',
          bio: 'Senior software engineer specializing in frontend development, UX/UI design, and modern JavaScript frameworks.',
          profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          role: 'creator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
          email: 'mike.johnson@creator.com',
          full_name: 'Mike Johnson',
          bio: 'Data scientist and Python expert with expertise in machine learning, data analysis, and backend development.',
          profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          role: 'creator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      console.log('Inserting users...');
      const { error: usersError } = await supabase
        .from('users')
        .upsert(sampleUsers, { onConflict: 'id' });

      if (usersError) {
        console.error('Users error:', usersError);
        throw new Error(`Failed to create users: ${usersError.message}`);
      }

      setMessage('Users created! Creating quizzes...');

      // Create sample quizzes
      const sampleQuizzes = [
        {
          id: '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
          title: 'React Fundamentals',
          description: 'Master the basics of React including components, props, state, and hooks. Perfect for beginners and intermediate developers.',
          is_published: true,
          price: 0,
          creator_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7ba7b811-9dad-11d1-80b4-00c04fd430c8',
          title: 'JavaScript ES6+ Features',
          description: 'Explore modern JavaScript features including arrow functions, destructuring, promises, async/await, and modules.',
          is_published: true,
          price: 0,
          creator_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7ba7b812-9dad-11d1-80b4-00c04fd430c8',
          title: 'CSS Grid & Flexbox',
          description: 'Learn modern CSS layout techniques with practical examples and hands-on exercises.',
          is_published: true,
          price: 0,
          creator_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7ba7b813-9dad-11d1-80b4-00c04fd430c8',
          title: 'Python Data Analysis',
          description: 'Introduction to data analysis with Python using pandas, numpy, and matplotlib.',
          is_published: true,
          price: 0,
          creator_id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7ba7b814-9dad-11d1-80b4-00c04fd430c8',
          title: 'Node.js Backend Development',
          description: 'Build scalable backend applications with Node.js, Express, and MongoDB.',
          is_published: true,
          price: 0,
          creator_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7ba7b815-9dad-11d1-80b4-00c04fd430c8',
          title: 'Vue.js Essentials',
          description: 'Learn Vue.js framework fundamentals including directives, components, and Vuex state management.',
          is_published: true,
          price: 0,
          creator_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      console.log('Inserting quizzes...');
      const { error: quizzesError } = await supabase
        .from('quizzes')
        .upsert(sampleQuizzes, { onConflict: 'id' });

      if (quizzesError) {
        console.error('Quizzes error:', quizzesError);
        throw new Error(`Failed to create quizzes: ${quizzesError.message}`);
      }

      setMessage('Quizzes created! Creating questions...');

      // Create sample questions
      const sampleQuestions = [
        {
          id: '8ba7b810-9dad-11d1-80b4-00c04fd430c8',
          quiz_id: '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
          question: 'What is React?',
          question_type: 'multiple_choice',
          points: 1,
          position: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '8ba7b811-9dad-11d1-80b4-00c04fd430c8',
          quiz_id: '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
          question: 'Which hook is used to manage state in functional components?',
          question_type: 'multiple_choice',
          points: 1,
          position: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '8ba7b812-9dad-11d1-80b4-00c04fd430c8',
          quiz_id: '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
          question: 'What is JSX?',
          question_type: 'multiple_choice',
          points: 1,
          position: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      console.log('Inserting questions...');
      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .upsert(sampleQuestions, { onConflict: 'id' });

      if (questionsError) {
        console.error('Questions error:', questionsError);
        throw new Error(`Failed to create questions: ${questionsError.message}`);
      }

      setMessage('Questions created! Creating options...');

      // Create sample options
      const sampleOptions = [
        // React question options
        {
          question_id: '8ba7b810-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'A JavaScript library for building user interfaces',
          is_correct: true,
          position: 1
        },
        {
          question_id: '8ba7b810-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'A database management system',
          is_correct: false,
          position: 2
        },
        {
          question_id: '8ba7b810-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'A server-side framework',
          is_correct: false,
          position: 3
        },
        {
          question_id: '8ba7b810-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'A CSS framework',
          is_correct: false,
          position: 4
        },
        // useState hook options
        {
          question_id: '8ba7b811-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'useState',
          is_correct: true,
          position: 1
        },
        {
          question_id: '8ba7b811-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'useEffect',
          is_correct: false,
          position: 2
        },
        {
          question_id: '8ba7b811-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'useContext',
          is_correct: false,
          position: 3
        },
        {
          question_id: '8ba7b811-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'useReducer',
          is_correct: false,
          position: 4
        },
        // JSX options
        {
          question_id: '8ba7b812-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'JavaScript XML syntax extension',
          is_correct: true,
          position: 1
        },
        {
          question_id: '8ba7b812-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'A new programming language',
          is_correct: false,
          position: 2
        },
        {
          question_id: '8ba7b812-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'A database query language',
          is_correct: false,
          position: 3
        },
        {
          question_id: '8ba7b812-9dad-11d1-80b4-00c04fd430c8',
          option_text: 'A CSS preprocessor',
          is_correct: false,
          position: 4
        }
      ];

      console.log('Inserting options...');
      const { error: optionsError } = await supabase
        .from('quiz_options')
        .upsert(sampleOptions, { onConflict: 'question_id,position' });

      if (optionsError) {
        console.error('Options error:', optionsError);
        throw new Error(`Failed to create options: ${optionsError.message}`);
      }

      setMessage('✅ Sample data created successfully! You can now browse creators and quizzes.');

    } catch (err) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create sample data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="text-4xl">🧠</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Thinkify Setup
              </h1>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Sample Data</h2>
            <p className="text-gray-600">
              Click the button below to create sample creators and quizzes for browsing without login.
            </p>
          </div>

          <div className="space-y-6">
            <Button
              onClick={createSampleData}
              isLoading={isLoading}
              fullWidth
              size="lg"
              variant="primary"
            >
              {isLoading ? 'Creating Sample Data...' : 'Create Sample Data'}
            </Button>

            {message && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="mt-8 space-y-3 text-center">
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/creators'}
                >
                  View Creators
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/browse'}
                >
                  Browse Quizzes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 