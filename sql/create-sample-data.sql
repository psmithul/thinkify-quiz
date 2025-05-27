-- Create sample creators and quizzes for public browsing
-- This script creates visible content for anonymous users

-- Insert sample creator users
INSERT INTO users (id, email, full_name, bio, profile_image, role, created_at, updated_at) VALUES
(
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'john.doe@creator.com',
  'John Doe',
  'Full-stack developer with 5+ years of experience in React, Node.js, and modern web technologies. Passionate about teaching and sharing knowledge.',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'creator',
  NOW(),
  NOW()
),
(
  '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  'sarah.smith@creator.com',
  'Sarah Smith',
  'Senior software engineer specializing in frontend development, UX/UI design, and modern JavaScript frameworks.',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  'creator',
  NOW(),
  NOW()
),
(
  '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  'mike.johnson@creator.com',
  'Mike Johnson',
  'Data scientist and Python expert with expertise in machine learning, data analysis, and backend development.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'creator',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  bio = EXCLUDED.bio,
  profile_image = EXCLUDED.profile_image,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Insert sample quizzes
INSERT INTO quizzes (id, title, description, is_published, price, creator_id, created_at, updated_at) VALUES
(
  '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'React Fundamentals',
  'Master the basics of React including components, props, state, and hooks. Perfect for beginners and intermediate developers.',
  TRUE,
  0,
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  NOW(),
  NOW()
),
(
  '7ba7b811-9dad-11d1-80b4-00c04fd430c8',
  'JavaScript ES6+ Features',
  'Explore modern JavaScript features including arrow functions, destructuring, promises, async/await, and modules.',
  TRUE,
  0,
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  NOW(),
  NOW()
),
(
  '7ba7b812-9dad-11d1-80b4-00c04fd430c8',
  'CSS Grid & Flexbox',
  'Learn modern CSS layout techniques with practical examples and hands-on exercises.',
  TRUE,
  0,
  '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  NOW(),
  NOW()
),
(
  '7ba7b813-9dad-11d1-80b4-00c04fd430c8',
  'Python Data Analysis',
  'Introduction to data analysis with Python using pandas, numpy, and matplotlib.',
  TRUE,
  0,
  '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  NOW(),
  NOW()
),
(
  '7ba7b814-9dad-11d1-80b4-00c04fd430c8',
  'Node.js Backend Development',
  'Build scalable backend applications with Node.js, Express, and MongoDB.',
  TRUE,
  0,
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  NOW(),
  NOW()
),
(
  '7ba7b815-9dad-11d1-80b4-00c04fd430c8',
  'Vue.js Essentials',
  'Learn Vue.js framework fundamentals including directives, components, and Vuex state management.',
  TRUE,
  0,
  '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_published = EXCLUDED.is_published,
  price = EXCLUDED.price,
  creator_id = EXCLUDED.creator_id,
  updated_at = NOW();

-- Insert sample quiz questions for React Fundamentals quiz
INSERT INTO quiz_questions (id, quiz_id, question, question_type, points, position, created_at, updated_at) VALUES
(
  '8ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'What is React?',
  'multiple_choice',
  1,
  1,
  NOW(),
  NOW()
),
(
  '8ba7b811-9dad-11d1-80b4-00c04fd430c8',
  '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'Which hook is used to manage state in functional components?',
  'multiple_choice',
  1,
  2,
  NOW(),
  NOW()
),
(
  '8ba7b812-9dad-11d1-80b4-00c04fd430c8',
  '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'What is JSX?',
  'multiple_choice',
  1,
  3,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  question_type = EXCLUDED.question_type,
  points = EXCLUDED.points,
  position = EXCLUDED.position,
  updated_at = NOW();

-- Insert sample quiz options
INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
-- React question options
('8ba7b810-9dad-11d1-80b4-00c04fd430c8', 'A JavaScript library for building user interfaces', TRUE, 1),
('8ba7b810-9dad-11d1-80b4-00c04fd430c8', 'A database management system', FALSE, 2),
('8ba7b810-9dad-11d1-80b4-00c04fd430c8', 'A server-side framework', FALSE, 3),
('8ba7b810-9dad-11d1-80b4-00c04fd430c8', 'A CSS framework', FALSE, 4),

-- useState hook options
('8ba7b811-9dad-11d1-80b4-00c04fd430c8', 'useState', TRUE, 1),
('8ba7b811-9dad-11d1-80b4-00c04fd430c8', 'useEffect', FALSE, 2),
('8ba7b811-9dad-11d1-80b4-00c04fd430c8', 'useContext', FALSE, 3),
('8ba7b811-9dad-11d1-80b4-00c04fd430c8', 'useReducer', FALSE, 4),

-- JSX options
('8ba7b812-9dad-11d1-80b4-00c04fd430c8', 'JavaScript XML syntax extension', TRUE, 1),
('8ba7b812-9dad-11d1-80b4-00c04fd430c8', 'A new programming language', FALSE, 2),
('8ba7b812-9dad-11d1-80b4-00c04fd430c8', 'A database query language', FALSE, 3),
('8ba7b812-9dad-11d1-80b4-00c04fd430c8', 'A CSS preprocessor', FALSE, 4)

ON CONFLICT (question_id, position) DO UPDATE SET
  option_text = EXCLUDED.option_text,
  is_correct = EXCLUDED.is_correct; 