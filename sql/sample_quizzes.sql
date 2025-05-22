-- Sample Quizzes for React, Angular, and JavaScript Topics
-- Run this after the complete_setup.sql script

-- Find a creator user to assign the quizzes to
DO $$
DECLARE
    creator_id UUID;
BEGIN
    -- Get the first user with creator or admin role
    SELECT id INTO creator_id FROM users WHERE role IN ('creator', 'admin') LIMIT 1;
    
    -- If no creator found, take any user and make them a creator
    IF creator_id IS NULL THEN
        SELECT id INTO creator_id FROM users LIMIT 1;
        
        IF creator_id IS NOT NULL THEN
            UPDATE users SET role = 'creator' WHERE id = creator_id;
        END IF;
    END IF;
    
    -- Insert sample quizzes if we have a creator
    IF creator_id IS NOT NULL THEN
        -- 1. React Quiz
        INSERT INTO quizzes (title, description, is_published, price, creator_id, created_at, updated_at)
        VALUES (
            'React Fundamentals Quiz',
            'Test your knowledge of React core concepts including components, props, state, and hooks.',
            true,
            0,
            creator_id,
            NOW(),
            NOW()
        ) RETURNING id INTO STRICT react_quiz_id;
        
        -- 2. Angular Quiz
        INSERT INTO quizzes (title, description, is_published, price, creator_id, created_at, updated_at)
        VALUES (
            'Angular Essentials',
            'Check your understanding of Angular framework concepts including components, services, directives, and dependency injection.',
            true,
            0,
            creator_id,
            NOW(),
            NOW()
        ) RETURNING id INTO STRICT angular_quiz_id;
        
        -- 3. JavaScript Quiz
        INSERT INTO quizzes (title, description, is_published, price, creator_id, created_at, updated_at)
        VALUES (
            'JavaScript Core Concepts',
            'Test your knowledge of JavaScript fundamentals including variables, functions, closures, promises, and ES6+ features.',
            true,
            0,
            creator_id,
            NOW(),
            NOW()
        ) RETURNING id INTO STRICT js_quiz_id;
        
        -- Add questions to React Quiz
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES 
            (react_quiz_id, 'What is the correct way to create a functional component in React?', 'multiple_choice', 1, 1, NOW(), NOW()) RETURNING id INTO STRICT q1_id,
            (react_quiz_id, 'Which hook is used to manage state in functional components?', 'multiple_choice', 1, 2, NOW(), NOW()) RETURNING id INTO STRICT q2_id,
            (react_quiz_id, 'What is the purpose of the useEffect hook?', 'multiple_choice', 1, 3, NOW(), NOW()) RETURNING id INTO STRICT q3_id,
            (react_quiz_id, 'How do you pass data from a parent to a child component?', 'multiple_choice', 1, 4, NOW(), NOW()) RETURNING id INTO STRICT q4_id,
            (react_quiz_id, 'What is the purpose of React context?', 'multiple_choice', 1, 5, NOW(), NOW()) RETURNING id INTO STRICT q5_id;
        
        -- Add options for React questions
        INSERT INTO quiz_options (question_id, option_text, is_correct, position)
        VALUES
            -- Q1 options
            (q1_id, 'function MyComponent() { return <div>Hello</div>; }', true, 1),
            (q1_id, 'class MyComponent { render() { return <div>Hello</div>; } }', false, 2),
            (q1_id, 'const MyComponent = function() => { return <div>Hello</div>; }', false, 3),
            (q1_id, 'component MyComponent() { return <div>Hello</div>; }', false, 4),
            
            -- Q2 options
            (q2_id, 'useState', true, 1),
            (q2_id, 'useStateful', false, 2),
            (q2_id, 'useData', false, 3),
            (q2_id, 'reactState', false, 4),
            
            -- Q3 options
            (q3_id, 'To perform side effects in functional components', true, 1),
            (q3_id, 'To style React components', false, 2),
            (q3_id, 'To create new React components dynamically', false, 3),
            (q3_id, 'To replace class components', false, 4),
            
            -- Q4 options
            (q4_id, 'Using props', true, 1),
            (q4_id, 'Using state', false, 2),
            (q4_id, 'Using context only', false, 3),
            (q4_id, 'Using global variables', false, 4),
            
            -- Q5 options
            (q5_id, 'To share data across components without prop drilling', true, 1),
            (q5_id, 'To style components conditionally', false, 2),
            (q5_id, 'To enable routing in React', false, 3),
            (q5_id, 'To connect to external APIs', false, 4);
        
        -- Add questions to Angular Quiz
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES 
            (angular_quiz_id, 'What decorator is used to define an Angular component?', 'multiple_choice', 1, 1, NOW(), NOW()) RETURNING id INTO STRICT ang_q1_id,
            (angular_quiz_id, 'Which of the following is used for dependency injection in Angular?', 'multiple_choice', 1, 2, NOW(), NOW()) RETURNING id INTO STRICT ang_q2_id,
            (angular_quiz_id, 'What is the purpose of NgModule?', 'multiple_choice', 1, 3, NOW(), NOW()) RETURNING id INTO STRICT ang_q3_id,
            (angular_quiz_id, 'Which directive is used for repeating elements in Angular?', 'multiple_choice', 1, 4, NOW(), NOW()) RETURNING id INTO STRICT ang_q4_id,
            (angular_quiz_id, 'What is Angular Ivy?', 'multiple_choice', 1, 5, NOW(), NOW()) RETURNING id INTO STRICT ang_q5_id;
        
        -- Add options for Angular questions
        INSERT INTO quiz_options (question_id, option_text, is_correct, position)
        VALUES
            -- Q1 options
            (ang_q1_id, '@Component', true, 1),
            (ang_q1_id, '@NgComponent', false, 2),
            (ang_q1_id, '@Template', false, 3),
            (ang_q1_id, '@AngularComponent', false, 4),
            
            -- Q2 options
            (ang_q2_id, 'Providers array in the module or component', true, 1),
            (ang_q2_id, 'Dependencies array', false, 2),
            (ang_q2_id, 'Imports array only', false, 3),
            (ang_q2_id, 'Exports array', false, 4),
            
            -- Q3 options
            (ang_q3_id, 'To organize an application into cohesive blocks of functionality', true, 1),
            (ang_q3_id, 'To style Angular components', false, 2),
            (ang_q3_id, 'To connect to external APIs', false, 3),
            (ang_q3_id, 'To handle HTTP requests only', false, 4),
            
            -- Q4 options
            (ang_q4_id, '*ngFor', true, 1),
            (ang_q4_id, '*ngIf', false, 2),
            (ang_q4_id, '*ngRepeat', false, 3),
            (ang_q4_id, '*ngEach', false, 4),
            
            -- Q5 options
            (ang_q5_id, 'Angular's next-generation compilation and rendering pipeline', true, 1),
            (ang_q5_id, 'A CSS framework for Angular', false, 2),
            (ang_q5_id, 'An Angular testing framework', false, 3),
            (ang_q5_id, 'A database integration for Angular', false, 4);
        
        -- Add questions to JavaScript Quiz
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES 
            (js_quiz_id, 'What is the difference between let and var in JavaScript?', 'multiple_choice', 1, 1, NOW(), NOW()) RETURNING id INTO STRICT js_q1_id,
            (js_quiz_id, 'What is a closure in JavaScript?', 'multiple_choice', 1, 2, NOW(), NOW()) RETURNING id INTO STRICT js_q2_id,
            (js_quiz_id, 'What is the purpose of the Promise object?', 'multiple_choice', 1, 3, NOW(), NOW()) RETURNING id INTO STRICT js_q3_id,
            (js_quiz_id, 'What does the spread operator (...) do?', 'multiple_choice', 1, 4, NOW(), NOW()) RETURNING id INTO STRICT js_q4_id,
            (js_quiz_id, 'Which method is used to serialize a JavaScript object into a JSON string?', 'multiple_choice', 1, 5, NOW(), NOW()) RETURNING id INTO STRICT js_q5_id;
        
        -- Add options for JavaScript questions
        INSERT INTO quiz_options (question_id, option_text, is_correct, position)
        VALUES
            -- Q1 options
            (js_q1_id, 'let has block scope, while var has function scope', true, 1),
            (js_q1_id, 'var has block scope, while let has function scope', false, 2),
            (js_q1_id, 'let can be redeclared, var cannot', false, 3),
            (js_q1_id, 'There is no difference, they are synonyms', false, 4),
            
            -- Q2 options
            (js_q2_id, 'A function that has access to variables from its outer (enclosing) function's scope', true, 1),
            (js_q2_id, 'A way to close JavaScript applications', false, 2),
            (js_q2_id, 'A method to merge two objects', false, 3),
            (js_q2_id, 'A way to hide code from other developers', false, 4),
            
            -- Q3 options
            (js_q3_id, 'To handle asynchronous operations', true, 1),
            (js_q3_id, 'To guarantee code execution in order of appearance', false, 2),
            (js_q3_id, 'To make synchronous operations faster', false, 3),
            (js_q3_id, 'To encrypt sensitive data', false, 4),
            
            -- Q4 options
            (js_q4_id, 'Expands an array or object into individual elements', true, 1),
            (js_q4_id, 'Compresses multiple elements into an array', false, 2),
            (js_q4_id, 'Creates space between HTML elements', false, 3),
            (js_q4_id, 'Indicates a rest parameter function', false, 4),
            
            -- Q5 options
            (js_q5_id, 'JSON.stringify()', true, 1),
            (js_q5_id, 'JSON.parse()', false, 2),
            (js_q5_id, 'JSON.toText()', false, 3),
            (js_q5_id, 'JSON.serialize()', false, 4);
    END IF;
END
$$; 