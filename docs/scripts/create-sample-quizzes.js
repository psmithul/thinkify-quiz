// Script to create sample quizzes using Supabase JS client
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSampleQuizzes() {
  console.log('Creating sample quizzes...');
  
  try {
    // Find a creator user or make one
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role')
      .in('role', ['creator', 'admin'])
      .limit(1);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    let creatorId;
    
    if (users && users.length > 0) {
      creatorId = users[0].id;
      console.log(`Using existing creator/admin with ID: ${creatorId}`);
    } else {
      // Find any user and make them a creator
      const { data: anyUser, error: anyUserError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      if (anyUserError || !anyUser || anyUser.length === 0) {
        console.error('No users found in the database.');
        return;
      }
      
      creatorId = anyUser[0].id;
      
      // Update user to creator role
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'creator' })
        .eq('id', creatorId);
        
      if (updateError) {
        console.error('Error updating user to creator:', updateError);
        return;
      }
      
      console.log(`Updated user ${creatorId} to creator role`);
    }
    
    // Create React Quiz
    const { data: reactQuiz, error: reactQuizError } = await supabase
      .from('quizzes')
      .insert({
        title: 'React Fundamentals Quiz',
        description: 'Test your knowledge of React core concepts including components, props, state, and hooks.',
        is_published: true,
        price: 0,
        creator_id: creatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (reactQuizError) {
      console.error('Error creating React quiz:', reactQuizError);
    } else {
      console.log(`Created React quiz with ID: ${reactQuiz.id}`);
      
      // Create questions for React quiz
      const reactQuestions = [
        {
          quiz_id: reactQuiz.id,
          question: 'What is the correct way to create a functional component in React?',
          question_type: 'multiple_choice',
          points: 1,
          position: 1
        },
        {
          quiz_id: reactQuiz.id,
          question: 'Which hook is used to manage state in functional components?',
          question_type: 'multiple_choice',
          points: 1,
          position: 2
        },
        {
          quiz_id: reactQuiz.id,
          question: 'What is the purpose of the useEffect hook?',
          question_type: 'multiple_choice',
          points: 1,
          position: 3
        },
        {
          quiz_id: reactQuiz.id,
          question: 'How do you pass data from a parent to a child component?',
          question_type: 'multiple_choice',
          points: 1,
          position: 4
        },
        {
          quiz_id: reactQuiz.id,
          question: 'What is the purpose of React context?',
          question_type: 'multiple_choice',
          points: 1,
          position: 5
        }
      ];
      
      const { data: reactQuestionsData, error: reactQuestionsError } = await supabase
        .from('quiz_questions')
        .insert(reactQuestions)
        .select();
        
      if (reactQuestionsError) {
        console.error('Error creating React questions:', reactQuestionsError);
      } else {
        console.log(`Created ${reactQuestionsData.length} React questions`);
        
        // Create options for React questions
        const reactOptions = [
          // Question 1 options
          {
            question_id: reactQuestionsData[0].id,
            option_text: 'function MyComponent() { return <div>Hello</div>; }',
            is_correct: true,
            position: 1
          },
          {
            question_id: reactQuestionsData[0].id,
            option_text: 'class MyComponent { render() { return <div>Hello</div>; } }',
            is_correct: false,
            position: 2
          },
          {
            question_id: reactQuestionsData[0].id,
            option_text: 'const MyComponent = function() => { return <div>Hello</div>; }',
            is_correct: false,
            position: 3
          },
          {
            question_id: reactQuestionsData[0].id,
            option_text: 'component MyComponent() { return <div>Hello</div>; }',
            is_correct: false,
            position: 4
          },
          
          // Question 2 options
          {
            question_id: reactQuestionsData[1].id,
            option_text: 'useState',
            is_correct: true,
            position: 1
          },
          {
            question_id: reactQuestionsData[1].id,
            option_text: 'useStateful',
            is_correct: false,
            position: 2
          },
          {
            question_id: reactQuestionsData[1].id,
            option_text: 'useData',
            is_correct: false,
            position: 3
          },
          {
            question_id: reactQuestionsData[1].id,
            option_text: 'reactState',
            is_correct: false,
            position: 4
          },
          
          // Question 3 options
          {
            question_id: reactQuestionsData[2].id,
            option_text: 'To perform side effects in functional components',
            is_correct: true,
            position: 1
          },
          {
            question_id: reactQuestionsData[2].id,
            option_text: 'To style React components',
            is_correct: false,
            position: 2
          },
          {
            question_id: reactQuestionsData[2].id,
            option_text: 'To create new React components dynamically',
            is_correct: false,
            position: 3
          },
          {
            question_id: reactQuestionsData[2].id,
            option_text: 'To replace class components',
            is_correct: false,
            position: 4
          },
          
          // Question 4 options
          {
            question_id: reactQuestionsData[3].id,
            option_text: 'Using props',
            is_correct: true,
            position: 1
          },
          {
            question_id: reactQuestionsData[3].id,
            option_text: 'Using state',
            is_correct: false,
            position: 2
          },
          {
            question_id: reactQuestionsData[3].id,
            option_text: 'Using context only',
            is_correct: false,
            position: 3
          },
          {
            question_id: reactQuestionsData[3].id,
            option_text: 'Using global variables',
            is_correct: false,
            position: 4
          },
          
          // Question 5 options
          {
            question_id: reactQuestionsData[4].id,
            option_text: 'To share data across components without prop drilling',
            is_correct: true,
            position: 1
          },
          {
            question_id: reactQuestionsData[4].id,
            option_text: 'To style components conditionally',
            is_correct: false,
            position: 2
          },
          {
            question_id: reactQuestionsData[4].id,
            option_text: 'To enable routing in React',
            is_correct: false,
            position: 3
          },
          {
            question_id: reactQuestionsData[4].id,
            option_text: 'To connect to external APIs',
            is_correct: false,
            position: 4
          }
        ];
        
        const { error: reactOptionsError } = await supabase
          .from('quiz_options')
          .insert(reactOptions);
          
        if (reactOptionsError) {
          console.error('Error creating React options:', reactOptionsError);
        } else {
          console.log(`Created options for React questions`);
        }
      }
    }
    
    // Create Angular Quiz
    const { data: angularQuiz, error: angularQuizError } = await supabase
      .from('quizzes')
      .insert({
        title: 'Angular Essentials',
        description: 'Check your understanding of Angular framework concepts including components, services, directives, and dependency injection.',
        is_published: true,
        price: 0,
        creator_id: creatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (angularQuizError) {
      console.error('Error creating Angular quiz:', angularQuizError);
    } else {
      console.log(`Created Angular quiz with ID: ${angularQuiz.id}`);
      
      // Create questions for Angular quiz (similar pattern as React quiz)
      // ... (implementation similar to React questions)
    }
    
    // Create JavaScript Quiz
    const { data: jsQuiz, error: jsQuizError } = await supabase
      .from('quizzes')
      .insert({
        title: 'JavaScript Core Concepts',
        description: 'Test your knowledge of JavaScript fundamentals including variables, functions, closures, promises, and ES6+ features.',
        is_published: true,
        price: 0,
        creator_id: creatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (jsQuizError) {
      console.error('Error creating JavaScript quiz:', jsQuizError);
    } else {
      console.log(`Created JavaScript quiz with ID: ${jsQuiz.id}`);
      
      // Create questions for JavaScript quiz (similar pattern as React quiz)
      // ... (implementation similar to React questions)
    }
    
    console.log('✅ Sample quizzes created successfully!');
    
  } catch (error) {
    console.error('Error creating sample quizzes:', error);
  }
}

// Run the function
createSampleQuizzes(); 