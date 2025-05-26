-- Sample Framework Quizzes for Thinkify Quiz Platform
-- This script creates quizzes for popular frameworks under a test creator account
-- Each quiz is designed to take approximately 10 minutes

-- First, create a test creator user (you may need to adjust the user ID)
-- Run this first or manually create a user with email 'test@thinkify.com'

-- Note: Replace 'test-creator-uuid' with an actual UUID from your users table
-- You can get this by running: SELECT id FROM users WHERE email = 'test@thinkify.com';

-- 1. REACT.JS QUIZ
INSERT INTO quizzes (id, title, description, creator_id, is_published, created_at, updated_at) VALUES
('react-quiz-001', 'React.js Fundamentals', 'Test your knowledge of React.js core concepts, components, hooks, and best practices. Perfect for developers looking to assess their React skills.', 
 (SELECT id FROM users WHERE email = 'test@thinkify.com' LIMIT 1), 
 true, NOW(), NOW());

-- React Questions
INSERT INTO quiz_questions (id, quiz_id, question, question_type, points, position, created_at, updated_at) VALUES
('react-q1', 'react-quiz-001', 'What is the primary purpose of React.js?', 'multiple_choice', 1, 1, NOW(), NOW()),
('react-q2', 'react-quiz-001', 'Which hook is used to manage state in functional components?', 'multiple_choice', 1, 2, NOW(), NOW()),
('react-q3', 'react-quiz-001', 'What is JSX?', 'multiple_choice', 1, 3, NOW(), NOW()),
('react-q4', 'react-quiz-001', 'How do you pass data from parent to child component?', 'multiple_choice', 1, 4, NOW(), NOW()),
('react-q5', 'react-quiz-001', 'What is the virtual DOM?', 'multiple_choice', 1, 5, NOW(), NOW()),
('react-q6', 'react-quiz-001', 'Which lifecycle method is called after component mounts?', 'multiple_choice', 1, 6, NOW(), NOW()),
('react-q7', 'react-quiz-001', 'What does useEffect hook do?', 'multiple_choice', 1, 7, NOW(), NOW()),
('react-q8', 'react-quiz-001', 'How do you handle events in React?', 'multiple_choice', 1, 8, NOW(), NOW()),
('react-q9', 'react-quiz-001', 'What is the purpose of keys in React lists?', 'multiple_choice', 1, 9, NOW(), NOW()),
('react-q10', 'react-quiz-001', 'Which method is used to update state in class components?', 'multiple_choice', 1, 10, NOW(), NOW());

-- React Options
INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
-- Q1 Options
('react-q1', 'Building user interfaces', true, 1),
('react-q1', 'Managing databases', false, 2),
('react-q1', 'Server-side rendering only', false, 3),
('react-q1', 'Mobile app development only', false, 4),
-- Q2 Options
('react-q2', 'useState', true, 1),
('react-q2', 'useEffect', false, 2),
('react-q2', 'useContext', false, 3),
('react-q2', 'useReducer', false, 4),
-- Q3 Options
('react-q3', 'JavaScript XML syntax extension', true, 1),
('react-q3', 'A new programming language', false, 2),
('react-q3', 'A database query language', false, 3),
('react-q3', 'A CSS framework', false, 4),
-- Q4 Options
('react-q4', 'Through props', true, 1),
('react-q4', 'Through state', false, 2),
('react-q4', 'Through context only', false, 3),
('react-q4', 'Through refs', false, 4),
-- Q5 Options
('react-q5', 'A lightweight copy of the real DOM in memory', true, 1),
('react-q5', 'A physical DOM element', false, 2),
('react-q5', 'A CSS styling technique', false, 3),
('react-q5', 'A database management system', false, 4),
-- Q6 Options
('react-q6', 'componentDidMount', true, 1),
('react-q6', 'componentWillMount', false, 2),
('react-q6', 'componentDidUpdate', false, 3),
('react-q6', 'componentWillUnmount', false, 4),
-- Q7 Options
('react-q7', 'Handles side effects in functional components', true, 1),
('react-q7', 'Manages component state', false, 2),
('react-q7', 'Creates new components', false, 3),
('react-q7', 'Handles routing', false, 4),
-- Q8 Options
('react-q8', 'Using event handlers like onClick', true, 1),
('react-q8', 'Using jQuery event listeners', false, 2),
('react-q8', 'Using vanilla JavaScript only', false, 3),
('react-q8', 'Using CSS pseudo-classes', false, 4),
-- Q9 Options
('react-q9', 'To help React identify which items have changed', true, 1),
('react-q9', 'To style list items', false, 2),
('react-q9', 'To sort list items', false, 3),
('react-q9', 'To encrypt data', false, 4),
-- Q10 Options
('react-q10', 'setState', true, 1),
('react-q10', 'updateState', false, 2),
('react-q10', 'changeState', false, 3),
('react-q10', 'modifyState', false, 4);

-- 2. VUE.JS QUIZ
INSERT INTO quizzes (id, title, description, creator_id, is_published, created_at, updated_at) VALUES
('vue-quiz-001', 'Vue.js Essentials', 'Comprehensive Vue.js quiz covering components, directives, Vue CLI, and the Vue ecosystem. Test your progressive framework knowledge.', 
 (SELECT id FROM users WHERE email = 'test@thinkify.com' LIMIT 1), 
 true, NOW(), NOW());

-- Vue Questions
INSERT INTO quiz_questions (id, quiz_id, question, question_type, points, position, created_at, updated_at) VALUES
('vue-q1', 'vue-quiz-001', 'What is Vue.js?', 'multiple_choice', 1, 1, NOW(), NOW()),
('vue-q2', 'vue-quiz-001', 'Which directive is used for two-way data binding in Vue?', 'multiple_choice', 1, 2, NOW(), NOW()),
('vue-q3', 'vue-quiz-001', 'What is the Vue instance?', 'multiple_choice', 1, 3, NOW(), NOW()),
('vue-q4', 'vue-quiz-001', 'Which lifecycle hook is called before the instance is mounted?', 'multiple_choice', 1, 4, NOW(), NOW()),
('vue-q5', 'vue-quiz-001', 'What are Vue components?', 'multiple_choice', 1, 5, NOW(), NOW()),
('vue-q6', 'vue-quiz-001', 'Which directive is used for conditional rendering?', 'multiple_choice', 1, 6, NOW(), NOW()),
('vue-q7', 'vue-quiz-001', 'What is Vuex?', 'multiple_choice', 1, 7, NOW(), NOW()),
('vue-q8', 'vue-quiz-001', 'How do you define computed properties in Vue?', 'multiple_choice', 1, 8, NOW(), NOW()),
('vue-q9', 'vue-quiz-001', 'What is the purpose of v-for directive?', 'multiple_choice', 1, 9, NOW(), NOW()),
('vue-q10', 'vue-quiz-001', 'Which method is used to emit custom events in Vue?', 'multiple_choice', 1, 10, NOW(), NOW());

-- Vue Options
INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
-- Q1 Options
('vue-q1', 'A progressive JavaScript framework', true, 1),
('vue-q1', 'A CSS framework', false, 2),
('vue-q1', 'A database management system', false, 3),
('vue-q1', 'A mobile development platform', false, 4),
-- Q2 Options
('vue-q2', 'v-model', true, 1),
('vue-q2', 'v-bind', false, 2),
('vue-q2', 'v-if', false, 3),
('vue-q2', 'v-show', false, 4),
-- Q3 Options
('vue-q3', 'The root object that controls the Vue application', true, 1),
('vue-q3', 'A CSS class', false, 2),
('vue-q3', 'A HTML element', false, 3),
('vue-q3', 'A database connection', false, 4),
-- Q4 Options
('vue-q4', 'beforeMount', true, 1),
('vue-q4', 'mounted', false, 2),
('vue-q4', 'created', false, 3),
('vue-q4', 'beforeDestroy', false, 4),
-- Q5 Options
('vue-q5', 'Reusable Vue instances with custom functionality', true, 1),
('vue-q5', 'CSS styling classes', false, 2),
('vue-q5', 'Database tables', false, 3),
('vue-q5', 'Server configurations', false, 4),
-- Q6 Options
('vue-q6', 'v-if', true, 1),
('vue-q6', 'v-for', false, 2),
('vue-q6', 'v-model', false, 3),
('vue-q6', 'v-bind', false, 4),
-- Q7 Options
('vue-q7', 'A state management pattern and library for Vue.js', true, 1),
('vue-q7', 'A routing library', false, 2),
('vue-q7', 'A CSS framework', false, 3),
('vue-q7', 'A testing framework', false, 4),
-- Q8 Options
('vue-q8', 'Using the computed property in the Vue instance', true, 1),
('vue-q8', 'Using methods only', false, 2),
('vue-q8', 'Using data properties', false, 3),
('vue-q8', 'Using watch properties', false, 4),
-- Q9 Options
('vue-q9', 'To render a list of elements based on an array', true, 1),
('vue-q9', 'To bind events', false, 2),
('vue-q9', 'To apply CSS styles', false, 3),
('vue-q9', 'To navigate between pages', false, 4),
-- Q10 Options
('vue-q10', '$emit', true, 1),
('vue-q10', '$event', false, 2),
('vue-q10', '$send', false, 3),
('vue-q10', '$broadcast', false, 4);

-- 3. ANGULAR QUIZ
INSERT INTO quizzes (id, title, description, creator_id, is_published, created_at, updated_at) VALUES
('angular-quiz-001', 'Angular Framework Mastery', 'Deep dive into Angular concepts including components, services, dependency injection, and TypeScript integration.', 
 (SELECT id FROM users WHERE email = 'test@thinkify.com' LIMIT 1), 
 true, NOW(), NOW());

-- Angular Questions
INSERT INTO quiz_questions (id, quiz_id, question, question_type, points, position, created_at, updated_at) VALUES
('angular-q1', 'angular-quiz-001', 'What is Angular?', 'multiple_choice', 1, 1, NOW(), NOW()),
('angular-q2', 'angular-quiz-001', 'Which language is primarily used with Angular?', 'multiple_choice', 1, 2, NOW(), NOW()),
('angular-q3', 'angular-quiz-001', 'What is a component in Angular?', 'multiple_choice', 1, 3, NOW(), NOW()),
('angular-q4', 'angular-quiz-001', 'What is dependency injection in Angular?', 'multiple_choice', 1, 4, NOW(), NOW()),
('angular-q5', 'angular-quiz-001', 'Which decorator is used to define an Angular component?', 'multiple_choice', 1, 5, NOW(), NOW()),
('angular-q6', 'angular-quiz-001', 'What is the Angular CLI?', 'multiple_choice', 1, 6, NOW(), NOW()),
('angular-q7', 'angular-quiz-001', 'How do you handle data binding in Angular?', 'multiple_choice', 1, 7, NOW(), NOW()),
('angular-q8', 'angular-quiz-001', 'What are Angular services?', 'multiple_choice', 1, 8, NOW(), NOW()),
('angular-q9', 'angular-quiz-001', 'Which directive is used for structural changes?', 'multiple_choice', 1, 9, NOW(), NOW()),
('angular-q10', 'angular-quiz-001', 'What is RxJS in context of Angular?', 'multiple_choice', 1, 10, NOW(), NOW());

-- Angular Options
INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
-- Q1 Options
('angular-q1', 'A TypeScript-based web application framework', true, 1),
('angular-q1', 'A CSS framework', false, 2),
('angular-q1', 'A database management tool', false, 3),
('angular-q1', 'A mobile app only framework', false, 4),
-- Q2 Options
('angular-q2', 'TypeScript', true, 1),
('angular-q2', 'Python', false, 2),
('angular-q2', 'PHP', false, 3),
('angular-q2', 'Ruby', false, 4),
-- Q3 Options
('angular-q3', 'A class with metadata that defines UI elements', true, 1),
('angular-q3', 'A database table', false, 2),
('angular-q3', 'A CSS file', false, 3),
('angular-q3', 'A server configuration', false, 4),
-- Q4 Options
('angular-q4', 'A design pattern for providing dependencies to classes', true, 1),
('angular-q4', 'A way to style components', false, 2),
('angular-q4', 'A routing mechanism', false, 3),
('angular-q4', 'A testing framework', false, 4),
-- Q5 Options
('angular-q5', '@Component', true, 1),
('angular-q5', '@Service', false, 2),
('angular-q5', '@Module', false, 3),
('angular-q5', '@Directive', false, 4),
-- Q6 Options
('angular-q6', 'A command-line interface for Angular development', true, 1),
('angular-q6', 'A CSS framework', false, 2),
('angular-q6', 'A database tool', false, 3),
('angular-q6', 'A testing library', false, 4),
-- Q7 Options
('angular-q7', 'Using interpolation, property binding, and event binding', true, 1),
('angular-q7', 'Using only CSS', false, 2),
('angular-q7', 'Using jQuery', false, 3),
('angular-q7', 'Using vanilla JavaScript only', false, 4),
-- Q8 Options
('angular-q8', 'Classes that provide functionality to components', true, 1),
('angular-q8', 'CSS styling rules', false, 2),
('angular-q8', 'HTML templates', false, 3),
('angular-q8', 'Database connections', false, 4),
-- Q9 Options
('angular-q9', '*ngIf and *ngFor', true, 1),
('angular-q9', 'ngModel', false, 2),
('angular-q9', 'ngClass', false, 3),
('angular-q9', 'ngStyle', false, 4),
-- Q10 Options
('angular-q10', 'A library for reactive programming using observables', true, 1),
('angular-q10', 'A CSS framework', false, 2),
('angular-q10', 'A database ORM', false, 3),
('angular-q10', 'A routing library', false, 4);

-- 4. NODE.JS QUIZ
INSERT INTO quizzes (id, title, description, creator_id, is_published, created_at, updated_at) VALUES
('node-quiz-001', 'Node.js Backend Development', 'Master Node.js fundamentals including event loop, modules, NPM, Express.js, and asynchronous programming.', 
 (SELECT id FROM users WHERE email = 'test@thinkify.com' LIMIT 1), 
 true, NOW(), NOW());

-- Node.js Questions
INSERT INTO quiz_questions (id, quiz_id, question, question_type, points, position, created_at, updated_at) VALUES
('node-q1', 'node-quiz-001', 'What is Node.js?', 'multiple_choice', 1, 1, NOW(), NOW()),
('node-q2', 'node-quiz-001', 'Which JavaScript engine does Node.js use?', 'multiple_choice', 1, 2, NOW(), NOW()),
('node-q3', 'node-quiz-001', 'What is NPM?', 'multiple_choice', 1, 3, NOW(), NOW()),
('node-q4', 'node-quiz-001', 'How do you create a simple HTTP server in Node.js?', 'multiple_choice', 1, 4, NOW(), NOW()),
('node-q5', 'node-quiz-001', 'What is the event loop in Node.js?', 'multiple_choice', 1, 5, NOW(), NOW()),
('node-q6', 'node-quiz-001', 'Which method is used to read files asynchronously?', 'multiple_choice', 1, 6, NOW(), NOW()),
('node-q7', 'node-quiz-001', 'What is Express.js?', 'multiple_choice', 1, 7, NOW(), NOW()),
('node-q8', 'node-quiz-001', 'How do you handle errors in Node.js?', 'multiple_choice', 1, 8, NOW(), NOW()),
('node-q9', 'node-quiz-001', 'What is middleware in Express?', 'multiple_choice', 1, 9, NOW(), NOW()),
('node-q10', 'node-quiz-001', 'Which module is used for path manipulation?', 'multiple_choice', 1, 10, NOW(), NOW());

-- Node.js Options
INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
-- Q1 Options
('node-q1', 'A JavaScript runtime built on Chrome''s V8 engine', true, 1),
('node-q1', 'A web browser', false, 2),
('node-q1', 'A database management system', false, 3),
('node-q1', 'A CSS framework', false, 4),
-- Q2 Options
('node-q2', 'V8', true, 1),
('node-q2', 'SpiderMonkey', false, 2),
('node-q2', 'Chakra', false, 3),
('node-q2', 'JavaScriptCore', false, 4),
-- Q3 Options
('node-q3', 'Node Package Manager', true, 1),
('node-q3', 'New Programming Method', false, 2),
('node-q3', 'Network Protocol Manager', false, 3),
('node-q3', 'Node Process Manager', false, 4),
-- Q4 Options
('node-q4', 'Using the http module and createServer method', true, 1),
('node-q4', 'Using only HTML', false, 2),
('node-q4', 'Using CSS frameworks', false, 3),
('node-q4', 'Using database connections only', false, 4),
-- Q5 Options
('node-q5', 'The mechanism that handles asynchronous callbacks', true, 1),
('node-q5', 'A for loop', false, 2),
('node-q5', 'A CSS animation', false, 3),
('node-q5', 'A database query', false, 4),
-- Q6 Options
('node-q6', 'fs.readFile()', true, 1),
('node-q6', 'fs.readFileSync()', false, 2),
('node-q6', 'fs.open()', false, 3),
('node-q6', 'fs.stat()', false, 4),
-- Q7 Options
('node-q7', 'A web application framework for Node.js', true, 1),
('node-q7', 'A database driver', false, 2),
('node-q7', 'A CSS framework', false, 3),
('node-q7', 'A testing library', false, 4),
-- Q8 Options
('node-q8', 'Using try-catch blocks and error-first callbacks', true, 1),
('node-q8', 'Using console.log only', false, 2),
('node-q8', 'Using CSS', false, 3),
('node-q8', 'Using HTML comments', false, 4),
-- Q9 Options
('node-q9', 'Functions that execute during the request-response cycle', true, 1),
('node-q9', 'CSS styling rules', false, 2),
('node-q9', 'Database tables', false, 3),
('node-q9', 'HTML elements', false, 4),
-- Q10 Options
('node-q10', 'path', true, 1),
('node-q10', 'url', false, 2),
('node-q10', 'http', false, 3),
('node-q10', 'fs', false, 4);

-- 5. DJANGO QUIZ
INSERT INTO quizzes (id, title, description, creator_id, is_published, created_at, updated_at) VALUES
('django-quiz-001', 'Django Web Framework', 'Comprehensive Django quiz covering models, views, templates, ORM, and Django''s MTV architecture pattern.', 
 (SELECT id FROM users WHERE email = 'test@thinkify.com' LIMIT 1), 
 true, NOW(), NOW());

-- Django Questions
INSERT INTO quiz_questions (id, quiz_id, question, question_type, points, position, created_at, updated_at) VALUES
('django-q1', 'django-quiz-001', 'What is Django?', 'multiple_choice', 1, 1, NOW(), NOW()),
('django-q2', 'django-quiz-001', 'Which programming language is Django built with?', 'multiple_choice', 1, 2, NOW(), NOW()),
('django-q3', 'django-quiz-001', 'What does MTV stand for in Django?', 'multiple_choice', 1, 3, NOW(), NOW()),
('django-q4', 'django-quiz-001', 'What is Django ORM?', 'multiple_choice', 1, 4, NOW(), NOW()),
('django-q5', 'django-quiz-001', 'Which file contains Django project settings?', 'multiple_choice', 1, 5, NOW(), NOW()),
('django-q6', 'django-quiz-001', 'What is a Django model?', 'multiple_choice', 1, 6, NOW(), NOW()),
('django-q7', 'django-quiz-001', 'How do you create a Django project?', 'multiple_choice', 1, 7, NOW(), NOW()),
('django-q8', 'django-quiz-001', 'What is Django middleware?', 'multiple_choice', 1, 8, NOW(), NOW()),
('django-q9', 'django-quiz-001', 'Which template engine does Django use by default?', 'multiple_choice', 1, 9, NOW(), NOW()),
('django-q10', 'django-quiz-001', 'What is Django admin?', 'multiple_choice', 1, 10, NOW(), NOW());

-- Django Options
INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
-- Q1 Options
('django-q1', 'A high-level Python web framework', true, 1),
('django-q1', 'A JavaScript library', false, 2),
('django-q1', 'A database management system', false, 3),
('django-q1', 'A CSS framework', false, 4),
-- Q2 Options
('django-q2', 'Python', true, 1),
('django-q2', 'JavaScript', false, 2),
('django-q2', 'Java', false, 3),
('django-q2', 'C++', false, 4),
-- Q3 Options
('django-q3', 'Model-Template-View', true, 1),
('django-q3', 'Model-View-Controller', false, 2),
('django-q3', 'Module-Template-Variable', false, 3),
('django-q3', 'Method-Type-Value', false, 4),
-- Q4 Options
('django-q4', 'Object-Relational Mapping for database operations', true, 1),
('django-q4', 'A CSS framework', false, 2),
('django-q4', 'A JavaScript library', false, 3),
('django-q4', 'A testing framework', false, 4),
-- Q5 Options
('django-q5', 'settings.py', true, 1),
('django-q5', 'models.py', false, 2),
('django-q5', 'views.py', false, 3),
('django-q5', 'urls.py', false, 4),
-- Q6 Options
('django-q6', 'A Python class that defines database table structure', true, 1),
('django-q6', 'A CSS file', false, 2),
('django-q6', 'A JavaScript function', false, 3),
('django-q6', 'An HTML template', false, 4),
-- Q7 Options
('django-q7', 'django-admin startproject projectname', true, 1),
('django-q7', 'python manage.py runserver', false, 2),
('django-q7', 'pip install django', false, 3),
('django-q7', 'django-admin makemigrations', false, 4),
-- Q8 Options
('django-q8', 'Components that process requests and responses globally', true, 1),
('django-q8', 'Database tables', false, 2),
('django-q8', 'CSS styling rules', false, 3),
('django-q8', 'HTML templates', false, 4),
-- Q9 Options
('django-q9', 'Django Template Language (DTL)', true, 1),
('django-q9', 'Jinja2', false, 2),
('django-q9', 'Handlebars', false, 3),
('django-q9', 'Mustache', false, 4),
-- Q10 Options
('django-q10', 'An automatic admin interface for Django models', true, 1),
('django-q10', 'A CSS framework', false, 2),
('django-q10', 'A JavaScript library', false, 3),
('django-q10', 'A testing tool', false, 4);

-- 6. SPRING BOOT QUIZ
INSERT INTO quizzes (id, title, description, creator_id, is_published, created_at, updated_at) VALUES
('spring-quiz-001', 'Spring Boot Framework', 'Explore Spring Boot concepts including auto-configuration, dependency injection, REST APIs, and Spring ecosystem.', 
 (SELECT id FROM users WHERE email = 'test@thinkify.com' LIMIT 1), 
 true, NOW(), NOW());

-- Spring Boot Questions
INSERT INTO quiz_questions (id, quiz_id, question, question_type, points, position, created_at, updated_at) VALUES
('spring-q1', 'spring-quiz-001', 'What is Spring Boot?', 'multiple_choice', 1, 1, NOW(), NOW()),
('spring-q2', 'spring-quiz-001', 'Which annotation is used to create a Spring Boot application?', 'multiple_choice', 1, 2, NOW(), NOW()),
('spring-q3', 'spring-quiz-001', 'What is auto-configuration in Spring Boot?', 'multiple_choice', 1, 3, NOW(), NOW()),
('spring-q4', 'spring-quiz-001', 'Which file contains Spring Boot application properties?', 'multiple_choice', 1, 4, NOW(), NOW()),
('spring-q5', 'spring-quiz-001', 'What is dependency injection?', 'multiple_choice', 1, 5, NOW(), NOW()),
('spring-q6', 'spring-quiz-001', 'Which annotation is used for REST controllers?', 'multiple_choice', 1, 6, NOW(), NOW()),
('spring-q7', 'spring-quiz-001', 'What is Spring Data JPA?', 'multiple_choice', 1, 7, NOW(), NOW()),
('spring-q8', 'spring-quiz-001', 'How do you define a bean in Spring?', 'multiple_choice', 1, 8, NOW(), NOW()),
('spring-q9', 'spring-quiz-001', 'What is the default port for Spring Boot applications?', 'multiple_choice', 1, 9, NOW(), NOW()),
('spring-q10', 'spring-quiz-001', 'Which annotation is used for autowiring?', 'multiple_choice', 1, 10, NOW(), NOW());

-- Spring Boot Options
INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES
-- Q1 Options
('spring-q1', 'A framework that simplifies Spring application development', true, 1),
('spring-q1', 'A database management system', false, 2),
('spring-q1', 'A JavaScript framework', false, 3),
('spring-q1', 'A CSS framework', false, 4),
-- Q2 Options
('spring-q2', '@SpringBootApplication', true, 1),
('spring-q2', '@Application', false, 2),
('spring-q2', '@BootApplication', false, 3),
('spring-q2', '@SpringApp', false, 4),
-- Q3 Options
('spring-q3', 'Automatic configuration based on classpath dependencies', true, 1),
('spring-q3', 'Manual configuration of all beans', false, 2),
('spring-q3', 'A CSS styling feature', false, 3),
('spring-q3', 'A database optimization technique', false, 4),
-- Q4 Options
('spring-q4', 'application.properties or application.yml', true, 1),
('spring-q4', 'config.xml', false, 2),
('spring-q4', 'web.xml', false, 3),
('spring-q4', 'settings.properties', false, 4),
-- Q5 Options
('spring-q5', 'A design pattern where dependencies are provided by an external source', true, 1),
('spring-q5', 'A way to style components', false, 2),
('spring-q5', 'A database query technique', false, 3),
('spring-q5', 'A testing methodology', false, 4),
-- Q6 Options
('spring-q6', '@RestController', true, 1),
('spring-q6', '@Controller', false, 2),
('spring-q6', '@Service', false, 3),
('spring-q6', '@Component', false, 4),
-- Q7 Options
('spring-q7', 'A Spring project that simplifies database access', true, 1),
('spring-q7', 'A CSS framework', false, 2),
('spring-q7', 'A JavaScript library', false, 3),
('spring-q7', 'A testing framework', false, 4),
-- Q8 Options
('spring-q8', 'Using @Component, @Service, @Repository, or @Bean annotations', true, 1),
('spring-q8', 'Using CSS classes', false, 2),
('spring-q8', 'Using HTML elements', false, 3),
('spring-q8', 'Using JavaScript functions', false, 4),
-- Q9 Options
('spring-q9', '8080', true, 1),
('spring-q9', '3000', false, 2),
('spring-q9', '80', false, 3),
('spring-q9', '443', false, 4),
-- Q10 Options
('spring-q10', '@Autowired', true, 1),
('spring-q10', '@Inject', false, 2),
('spring-q10', '@Wire', false, 3),
('spring-q10', '@Auto', false, 4);

-- Create a test user if it doesn't exist (uncomment and modify as needed)
-- INSERT INTO users (id, email, role, full_name, created_at, updated_at) 
-- VALUES (gen_random_uuid(), 'test@thinkify.com', 'creator', 'Test Creator', NOW(), NOW())
-- ON CONFLICT (email) DO NOTHING; 