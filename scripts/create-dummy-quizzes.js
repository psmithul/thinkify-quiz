import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample creators
const creators = [
  {
    email: 'creator1@example.com',
    password: 'Password123!',
    full_name: 'Jane Creator',
    bio: 'JavaScript expert with 10 years of experience. I create quizzes to test your coding knowledge.',
    profile_image: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    email: 'creator2@example.com',
    password: 'Password123!',
    full_name: 'John Smith',
    bio: 'Frontend developer specializing in React. My quizzes will challenge your UI/UX knowledge!',
    profile_image: 'https://randomuser.me/api/portraits/men/33.jpg'
  },
  {
    email: 'creator3@example.com',
    password: 'Password123!',
    full_name: 'Alex Johnson',
    bio: 'Full-stack developer who loves to teach. My quizzes cover everything from databases to deployment.',
    profile_image: 'https://randomuser.me/api/portraits/women/66.jpg'
  }
];

// Sample quizzes with questions
const quizTemplates = [
  {
    title: 'JavaScript Fundamentals',
    description: 'Test your knowledge of JavaScript basics, from variables to functions and beyond.',
    price: null,
    category: 'JavaScript',
    is_published: true,
    questions: [
      {
        prompt: 'What is the output of: console.log(typeof null);',
        type: 'multiple_choice',
        options: ['null', 'undefined', 'object', 'number'],
        correct_answer: 'object'
      },
      {
        prompt: 'Which method removes the last element from an array and returns it?',
        type: 'multiple_choice',
        options: ['shift()', 'pop()', 'unshift()', 'push()'],
        correct_answer: 'pop()'
      },
      {
        prompt: 'What is a closure in JavaScript?',
        type: 'text',
        options: null,
        correct_answer: 'A function that has access to variables from its outer scope'
      },
      {
        prompt: 'What is the result of 2 + "2" in JavaScript?',
        type: 'multiple_choice',
        options: ['4', '"22"', '22', 'Error'],
        correct_answer: '"22"'
      },
      {
        prompt: 'How do you declare a constant in JavaScript?',
        type: 'multiple_choice',
        options: ['var', 'let', 'const', 'constant'],
        correct_answer: 'const'
      }
    ]
  },
  {
    title: 'React.js Essentials',
    description: 'A comprehensive quiz on React fundamentals, hooks, and component lifecycle.',
    price: 9.99,
    category: 'React',
    is_published: true,
    questions: [
      {
        prompt: 'What is JSX?',
        type: 'text',
        options: null,
        correct_answer: 'JavaScript XML - a syntax extension for JavaScript recommended for use with React'
      },
      {
        prompt: 'Which hook is used to perform side effects in a React component?',
        type: 'multiple_choice',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correct_answer: 'useEffect'
      },
      {
        prompt: 'What is the correct way to render a list in React?',
        type: 'multiple_choice',
        options: [
          'Using a for loop in the render method',
          'Using the map() method and keys',
          'Using the forEach() method',
          'Using a while loop'
        ],
        correct_answer: 'Using the map() method and keys'
      },
      {
        prompt: 'What is the purpose of the useState hook?',
        type: 'text',
        options: null,
        correct_answer: 'To add state to functional components'
      },
      {
        prompt: 'Which lifecycle method is called after a component is rendered for the first time?',
        type: 'multiple_choice',
        options: ['componentDidMount', 'componentWillMount', 'componentDidUpdate', 'componentWillUpdate'],
        correct_answer: 'componentDidMount'
      }
    ]
  },
  {
    title: 'CSS Mastery',
    description: 'Challenge yourself with advanced CSS concepts, layouts, and animations.',
    price: 4.99,
    category: 'CSS',
    is_published: true,
    questions: [
      {
        prompt: 'What does CSS stand for?',
        type: 'text',
        options: null,
        correct_answer: 'Cascading Style Sheets'
      },
      {
        prompt: 'Which property is used to change the spacing between lines of text?',
        type: 'multiple_choice',
        options: ['text-spacing', 'line-height', 'letter-spacing', 'text-height'],
        correct_answer: 'line-height'
      },
      {
        prompt: 'What is the CSS box model?',
        type: 'text',
        options: null,
        correct_answer: 'A box that wraps around HTML elements, consisting of margins, borders, padding, and the content'
      },
      {
        prompt: 'Which property is used to create a flexbox layout?',
        type: 'multiple_choice',
        options: ['flex', 'display: flex', 'flex-box', 'flex-layout'],
        correct_answer: 'display: flex'
      },
      {
        prompt: 'Which CSS selector has the highest specificity?',
        type: 'multiple_choice',
        options: ['ID selector', 'Class selector', 'Element selector', 'Universal selector'],
        correct_answer: 'ID selector'
      }
    ]
  },
  {
    title: 'Node.js Fundamentals',
    description: 'Test your knowledge of Node.js concepts, from modules to servers and beyond.',
    price: 7.99,
    category: 'Node.js',
    is_published: true,
    questions: [
      {
        prompt: 'What is the package manager for Node.js?',
        type: 'multiple_choice',
        options: ['npm', 'yarn', 'pnpm', 'All of the above'],
        correct_answer: 'All of the above'
      },
      {
        prompt: 'Which of these is NOT a core module in Node.js?',
        type: 'multiple_choice',
        options: ['http', 'fs', 'path', 'react'],
        correct_answer: 'react'
      },
      {
        prompt: 'What does the fs module do in Node.js?',
        type: 'text',
        options: null,
        correct_answer: 'Provides file system operations'
      },
      {
        prompt: 'How do you include a module in Node.js?',
        type: 'multiple_choice',
        options: [
          'import module from "module"',
          'require("module")',
          'include "module"',
          'using module'
        ],
        correct_answer: 'require("module")'
      },
      {
        prompt: 'What is the event-driven architecture in Node.js?',
        type: 'text',
        options: null,
        correct_answer: 'A programming paradigm where the flow of the program is determined by events'
      }
    ]
  }
];

// Function to create a creator
async function createCreator(creatorData) {
  try {
    // Check if creator already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', creatorData.email)
      .single();
    
    if (existingUser) {
      console.log(`Creator ${creatorData.email} already exists, skipping creation.`);
      return existingUser.id;
    }
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: creatorData.email,
      password: creatorData.password
    });
    
    if (authError) throw authError;
    
    if (!authData?.user?.id) {
      throw new Error('Failed to create auth user');
    }
    
    // Create user profile
    const userId = authData.user.id;
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: creatorData.email,
        role: 'creator',
        full_name: creatorData.full_name,
        bio: creatorData.bio,
        profile_image: creatorData.profile_image
      }]);
      
    if (userError) throw userError;
    
    console.log(`Created creator: ${creatorData.full_name} (${creatorData.email})`);
    return userId;
    
  } catch (error) {
    console.error(`Error creating creator ${creatorData.email}:`, error);
    return null;
  }
}

// Function to create a quiz with questions
async function createQuiz(quizData, creatorId) {
  try {
    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{
        title: quizData.title,
        description: quizData.description,
        price: quizData.price,
        category: quizData.category,
        is_published: quizData.is_published,
        creator_id: creatorId
      }])
      .select()
      .single();
      
    if (quizError) throw quizError;
    
    // Create questions
    const questions = quizData.questions.map(q => ({
      quiz_id: quiz.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options,
      correct_answer: q.correct_answer
    }));
    
    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questions);
      
    if (questionsError) throw questionsError;
    
    console.log(`Created quiz: ${quizData.title} with ${questions.length} questions`);
    
  } catch (error) {
    console.error(`Error creating quiz ${quizData.title}:`, error);
  }
}

// Main function to populate database
async function populateDatabase() {
  console.log('Starting to populate database with dummy data...');
  
  // Create creators
  const creatorIds = [];
  for (const creator of creators) {
    const creatorId = await createCreator(creator);
    if (creatorId) creatorIds.push(creatorId);
  }
  
  if (creatorIds.length === 0) {
    console.error('Failed to create any creators. Exiting.');
    process.exit(1);
  }
  
  // Create quizzes for each creator
  for (let i = 0; i < quizTemplates.length; i++) {
    const creatorIndex = i % creatorIds.length;
    await createQuiz(quizTemplates[i], creatorIds[creatorIndex]);
  }
  
  console.log('Database population completed successfully!');
  process.exit(0);
}

// Run the script
populateDatabase(); 