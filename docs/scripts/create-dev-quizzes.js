import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Development quizzes data
const devQuizzes = [
  {
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of JavaScript basics including variables, functions, and control flow.",
    questions: [
      {
        prompt: "Which of these is not a JavaScript data type?",
        type: "multiple_choice",
        options: ["String", "Boolean", "Integer", "Symbol"],
        correct_answer: "Integer"
      },
      {
        prompt: "What will console.log(typeof []) output?",
        type: "multiple_choice",
        options: ["array", "object", "undefined", "null"],
        correct_answer: "object"
      },
      {
        prompt: "What is the result of '2' + 2 in JavaScript?",
        type: "multiple_choice",
        options: ["4", "22", "Error", "undefined"],
        correct_answer: "22"
      },
      {
        prompt: "Which method is used to add an element to the end of an array?",
        type: "multiple_choice",
        options: ["push()", "pop()", "shift()", "unshift()"],
        correct_answer: "push()"
      },
      {
        prompt: "What is closure in JavaScript?",
        type: "multiple_choice",
        options: [
          "A way to secure your code from external access",
          "A function that has access to variables from its outer scope",
          "A method to close browser windows",
          "A special type of object"
        ],
        correct_answer: "A function that has access to variables from its outer scope"
      }
    ]
  },
  {
    title: "React Basics",
    description: "Test your understanding of React fundamentals, components, and state management.",
    questions: [
      {
        prompt: "What is JSX in React?",
        type: "multiple_choice",
        options: [
          "A JavaScript XML syntax extension",
          "JavaScript Extra",
          "A type of database",
          "JavaScript execution environment"
        ],
        correct_answer: "A JavaScript XML syntax extension"
      },
      {
        prompt: "Which hook is used to perform side effects in a function component?",
        type: "multiple_choice",
        options: ["useState", "useEffect", "useContext", "useReducer"],
        correct_answer: "useEffect"
      },
      {
        prompt: "What is the virtual DOM in React?",
        type: "multiple_choice",
        options: [
          "A lightweight copy of the actual DOM",
          "A special browser mode for React",
          "A database for React components",
          "A type of React component"
        ],
        correct_answer: "A lightweight copy of the actual DOM"
      },
      {
        prompt: "How do you pass data from a parent to a child component?",
        type: "multiple_choice",
        options: ["Using state", "Using props", "Using context only", "Using Redux only"],
        correct_answer: "Using props"
      },
      {
        prompt: "What method is called when a component is first rendered?",
        type: "multiple_choice",
        options: ["componentDidMount", "componentWillMount", "render", "constructor"],
        correct_answer: "render"
      }
    ]
  },
  {
    title: "Node.js Essentials",
    description: "Test your knowledge of Node.js including modules, npm, and basic server concepts.",
    questions: [
      {
        prompt: "What is Node.js?",
        type: "multiple_choice",
        options: [
          "A programming language",
          "A framework for JavaScript",
          "A runtime environment for JavaScript",
          "A database management system"
        ],
        correct_answer: "A runtime environment for JavaScript"
      },
      {
        prompt: "Which of these is not a core module in Node.js?",
        type: "multiple_choice",
        options: ["fs", "http", "path", "react"],
        correct_answer: "react"
      },
      {
        prompt: "What does npm stand for?",
        type: "multiple_choice",
        options: [
          "Node Package Manager",
          "Node Process Manager",
          "New Project Manager",
          "Node Programming Method"
        ],
        correct_answer: "Node Package Manager"
      },
      {
        prompt: "How do you import a module in Node.js?",
        type: "multiple_choice",
        options: [
          "import module from 'module'",
          "require('module')",
          "include 'module'",
          "using module"
        ],
        correct_answer: "require('module')"
      },
      {
        prompt: "What is the purpose of package.json?",
        type: "multiple_choice",
        options: [
          "To store JavaScript objects",
          "To define project metadata and dependencies",
          "To encrypt sensitive data",
          "To configure browser settings"
        ],
        correct_answer: "To define project metadata and dependencies"
      }
    ]
  },
  {
    title: "CSS and Styling",
    description: "Test your knowledge of CSS concepts, selectors, and modern styling techniques.",
    questions: [
      {
        prompt: "What does CSS stand for?",
        type: "multiple_choice",
        options: [
          "Creative Style Sheets",
          "Computer Style Sheets",
          "Cascading Style Sheets",
          "Colorful Style Sheets"
        ],
        correct_answer: "Cascading Style Sheets"
      },
      {
        prompt: "Which CSS property is used to change the text color?",
        type: "multiple_choice",
        options: ["text-color", "color", "font-color", "text-style"],
        correct_answer: "color"
      },
      {
        prompt: "What is the correct CSS syntax for making all paragraph elements bold?",
        type: "multiple_choice",
        options: [
          "p {font-weight: bold;}",
          "p.all {text-weight: bold;}",
          "<p style='font-size: bold;'>",
          "p {text-size: bold;}"
        ],
        correct_answer: "p {font-weight: bold;}"
      },
      {
        prompt: "Which CSS property controls the spacing between elements?",
        type: "multiple_choice",
        options: ["spacing", "margin", "padding", "border"],
        correct_answer: "margin"
      },
      {
        prompt: "What is the purpose of CSS Grid?",
        type: "multiple_choice",
        options: [
          "To create responsive animations",
          "To manage database entries",
          "To create two-dimensional layouts",
          "To optimize image loading"
        ],
        correct_answer: "To create two-dimensional layouts"
      }
    ]
  },
  {
    title: "TypeScript Fundamentals",
    description: "Test your understanding of TypeScript types, interfaces, and advanced features.",
    questions: [
      {
        prompt: "What is TypeScript?",
        type: "multiple_choice",
        options: [
          "A new programming language unrelated to JavaScript",
          "A superset of JavaScript that adds static typing",
          "A library for testing JavaScript code",
          "A framework for building mobile apps"
        ],
        correct_answer: "A superset of JavaScript that adds static typing"
      },
      {
        prompt: "Which is not a basic type in TypeScript?",
        type: "multiple_choice",
        options: ["number", "string", "boolean", "object[]"],
        correct_answer: "object[]"
      },
      {
        prompt: "What is the purpose of an interface in TypeScript?",
        type: "multiple_choice",
        options: [
          "To create new variables",
          "To define the structure of objects",
          "To connect to external APIs",
          "To optimize code execution"
        ],
        correct_answer: "To define the structure of objects"
      },
      {
        prompt: "What does the 'any' type represent in TypeScript?",
        type: "multiple_choice",
        options: [
          "A type that can only hold numbers",
          "A type that can hold any value",
          "A type for arrays only",
          "A type that cannot be changed"
        ],
        correct_answer: "A type that can hold any value"
      },
      {
        prompt: "How do you define a function type in TypeScript?",
        type: "multiple_choice",
        options: [
          "function(x: number): string",
          "(x: number) => string",
          "def(x: number): string",
          "@function(number -> string)"
        ],
        correct_answer: "(x: number) => string"
      }
    ]
  },
  {
    title: "Git and Version Control",
    description: "Test your knowledge of Git commands, workflows, and best practices.",
    questions: [
      {
        prompt: "What is Git?",
        type: "multiple_choice",
        options: [
          "A programming language",
          "A cloud hosting service",
          "A distributed version control system",
          "An IDE for web development"
        ],
        correct_answer: "A distributed version control system"
      },
      {
        prompt: "Which command is used to create a new Git repository?",
        type: "multiple_choice",
        options: ["git start", "git init", "git create", "git new"],
        correct_answer: "git init"
      },
      {
        prompt: "What is a Git branch?",
        type: "multiple_choice",
        options: [
          "A copy of the code that diverges from the main project",
          "A type of merge conflict",
          "A remote repository",
          "A tagged commit"
        ],
        correct_answer: "A copy of the code that diverges from the main project"
      },
      {
        prompt: "How do you stage changes for a commit?",
        type: "multiple_choice",
        options: [
          "git stage",
          "git add",
          "git commit",
          "git push"
        ],
        correct_answer: "git add"
      },
      {
        prompt: "What does 'git pull' do?",
        type: "multiple_choice",
        options: [
          "Uploads local changes to a remote repository",
          "Creates a new branch",
          "Fetches and merges changes from a remote repository",
          "Shows the commit history"
        ],
        correct_answer: "Fetches and merges changes from a remote repository"
      }
    ]
  },
  {
    title: "Database Concepts",
    description: "Test your understanding of databases, SQL, NoSQL, and data modeling.",
    questions: [
      {
        prompt: "What is SQL?",
        type: "multiple_choice",
        options: [
          "Structured Query Language",
          "System Quality License",
          "Sequential Query Language",
          "Structured Question Language"
        ],
        correct_answer: "Structured Query Language"
      },
      {
        prompt: "Which of these is not a NoSQL database?",
        type: "multiple_choice",
        options: ["MongoDB", "Redis", "PostgreSQL", "Cassandra"],
        correct_answer: "PostgreSQL"
      },
      {
        prompt: "What is a primary key?",
        type: "multiple_choice",
        options: [
          "The first column in any table",
          "A column or set of columns that uniquely identifies each row",
          "The main password for database access",
          "The first record in a database"
        ],
        correct_answer: "A column or set of columns that uniquely identifies each row"
      },
      {
        prompt: "What does ACID stand for in database systems?",
        type: "multiple_choice",
        options: [
          "Atomicity, Consistency, Isolation, Durability",
          "Authentication, Compression, Integrity, Decryption",
          "Availability, Consistency, Integration, Durability",
          "Atomicity, Containment, Integrity, Dependency"
        ],
        correct_answer: "Atomicity, Consistency, Isolation, Durability"
      },
      {
        prompt: "Which SQL statement is used to retrieve data from a database?",
        type: "multiple_choice",
        options: ["GET", "EXTRACT", "SELECT", "FETCH"],
        correct_answer: "SELECT"
      }
    ]
  },
  {
    title: "RESTful API Design",
    description: "Test your knowledge of REST principles, API design, and HTTP methods.",
    questions: [
      {
        prompt: "What does REST stand for?",
        type: "multiple_choice",
        options: [
          "Remote Execution Standard Technology",
          "Representational State Transfer",
          "Resource Exchange System Transfer",
          "Responsive Enterprise System Technology"
        ],
        correct_answer: "Representational State Transfer"
      },
      {
        prompt: "Which HTTP method should be used to update a resource?",
        type: "multiple_choice",
        options: ["GET", "POST", "PUT", "DELETE"],
        correct_answer: "PUT"
      },
      {
        prompt: "What is a common format for API responses?",
        type: "multiple_choice",
        options: ["HTML", "JSON", "CSV", "Plain text"],
        correct_answer: "JSON"
      },
      {
        prompt: "What HTTP status code represents a successful response?",
        type: "multiple_choice",
        options: ["200", "404", "500", "302"],
        correct_answer: "200"
      },
      {
        prompt: "What is API versioning?",
        type: "multiple_choice",
        options: [
          "Testing different versions of an API",
          "Including version information in the API URL or headers",
          "Creating multiple copies of an API",
          "Securing API endpoints"
        ],
        correct_answer: "Including version information in the API URL or headers"
      }
    ]
  },
  {
    title: "Web Security Fundamentals",
    description: "Test your knowledge of web security concepts, common vulnerabilities, and best practices.",
    questions: [
      {
        prompt: "What is Cross-Site Scripting (XSS)?",
        type: "multiple_choice",
        options: [
          "A way to share scripts between websites",
          "A vulnerability that allows attackers to inject malicious scripts",
          "A technique for optimizing website performance",
          "A method for cross-browser compatibility"
        ],
        correct_answer: "A vulnerability that allows attackers to inject malicious scripts"
      },
      {
        prompt: "What is HTTPS?",
        type: "multiple_choice",
        options: [
          "HTML Transfer Protocol System",
          "Hypertext Transfer Protocol Secure",
          "High Traffic Protocol Service",
          "Hypertext Testing Protocol Standard"
        ],
        correct_answer: "Hypertext Transfer Protocol Secure"
      },
      {
        prompt: "What is CSRF?",
        type: "multiple_choice",
        options: [
          "Client-Side Rendering Format",
          "Cross-Site Request Forgery",
          "Cascading Style Rules Framework",
          "Content Security Restriction Format"
        ],
        correct_answer: "Cross-Site Request Forgery"
      },
      {
        prompt: "Which of these is a way to store passwords securely?",
        type: "multiple_choice",
        options: [
          "Base64 encoding",
          "Plain text with encryption",
          "Hashing with salt",
          "Simple MD5 hashing"
        ],
        correct_answer: "Hashing with salt"
      },
      {
        prompt: "What is Content Security Policy (CSP)?",
        type: "multiple_choice",
        options: [
          "A way to optimize content delivery",
          "A legal framework for content distribution",
          "A security feature that helps prevent XSS attacks",
          "A method for restricting website access"
        ],
        correct_answer: "A security feature that helps prevent XSS attacks"
      }
    ]
  },
  {
    title: "DevOps and Deployment",
    description: "Test your understanding of DevOps practices, CI/CD, and deployment strategies.",
    questions: [
      {
        prompt: "What is CI/CD?",
        type: "multiple_choice",
        options: [
          "Computer Interface/Computer Design",
          "Continuous Integration/Continuous Deployment",
          "Critical Infrastructure/Critical Design",
          "Content Integration/Content Distribution"
        ],
        correct_answer: "Continuous Integration/Continuous Deployment"
      },
      {
        prompt: "Which of these is not a container technology?",
        type: "multiple_choice",
        options: ["Docker", "Kubernetes", "Jenkins", "Podman"],
        correct_answer: "Jenkins"
      },
      {
        prompt: "What is Infrastructure as Code (IaC)?",
        type: "multiple_choice",
        options: [
          "Writing code that runs infrastructure services",
          "Managing infrastructure through code and automation",
          "Coding on infrastructure servers",
          "Developing code for hardware devices"
        ],
        correct_answer: "Managing infrastructure through code and automation"
      },
      {
        prompt: "What is a blue-green deployment?",
        type: "multiple_choice",
        options: [
          "A deployment using blue and green containers",
          "A technique to deploy eco-friendly applications",
          "A deployment method that maintains two identical environments",
          "A visual representation of deployment progress"
        ],
        correct_answer: "A deployment method that maintains two identical environments"
      },
      {
        prompt: "What tool is commonly used for configuration management?",
        type: "multiple_choice",
        options: ["Git", "Docker", "Ansible", "Webpack"],
        correct_answer: "Ansible"
      }
    ]
  }
];

async function createDevQuizzes() {
  console.log('Creating development quizzes...');
  
  for (const quizData of devQuizzes) {
    try {
      // 1. Create the quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quizData.title,
          description: quizData.description,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (quizError) {
        console.error(`Error creating quiz "${quizData.title}":`, quizError);
        continue;
      }
      
      console.log(`Created quiz: ${quizData.title} (ID: ${quiz.id})`);
      
      // 2. Create questions for the quiz
      const questionsToInsert = quizData.questions.map(q => ({
        quiz_id: quiz.id,
        prompt: q.prompt,
        type: q.type,
        options: q.options,
        correct_answer: q.correct_answer
      }));
      
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select();
        
      if (questionsError) {
        console.error(`Error creating questions for quiz "${quizData.title}":`, questionsError);
        continue;
      }
      
      console.log(`Added ${questions.length} questions to quiz: ${quizData.title}`);
      
    } catch (err) {
      console.error(`Unexpected error processing quiz "${quizData.title}":`, err);
    }
  }
  
  console.log('Finished creating development quizzes!');
}

// Run the script
createDevQuizzes().catch(err => {
  console.error('Failed to create quizzes:', err);
  process.exit(1);
}); 