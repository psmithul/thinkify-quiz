import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating sample data...');

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    // Insert sample creator users
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

    const { error: usersError } = await supabaseAdmin
      .from('users')
      .upsert(sampleUsers, { onConflict: 'id' });

    if (usersError) {
      console.error('Error creating users:', usersError);
      throw usersError;
    }

    console.log('Sample users created successfully');

    // Insert sample quizzes
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

    const { error: quizzesError } = await supabaseAdmin
      .from('quizzes')
      .upsert(sampleQuizzes, { onConflict: 'id' });

    if (quizzesError) {
      console.error('Error creating quizzes:', quizzesError);
      throw quizzesError;
    }

    console.log('Sample quizzes created successfully');

    // Insert sample quiz questions
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

    const { error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .upsert(sampleQuestions, { onConflict: 'id' });

    if (questionsError) {
      console.error('Error creating questions:', questionsError);
      throw questionsError;
    }

    console.log('Sample questions created successfully');

    // Insert sample quiz options
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

    const { error: optionsError } = await supabaseAdmin
      .from('quiz_options')
      .upsert(sampleOptions, { onConflict: 'question_id,position' });

    if (optionsError) {
      console.error('Error creating options:', optionsError);
      throw optionsError;
    }

    console.log('Sample options created successfully');

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        users: sampleUsers.length,
        quizzes: sampleQuizzes.length,
        questions: sampleQuestions.length,
        options: sampleOptions.length
      }
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create sample data' },
      { status: 500 }
    );
  }
} 