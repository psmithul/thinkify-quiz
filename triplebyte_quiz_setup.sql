-- Triplebyte Quiz Setup Script
-- This script creates a Triplebyte-style quiz with programming questions
-- Run this after ensuring you have a creator user in your database

DO $$
DECLARE
    creator_id UUID;
    triplebyte_quiz_id UUID;
    -- Question IDs for the JavaScript/Programming questions
    q1_id UUID; q2_id UUID; q3_id UUID; q4_id UUID; q5_id UUID;
    q6_id UUID; q7_id UUID; q8_id UUID; q9_id UUID; q10_id UUID;
    q11_id UUID; q12_id UUID; q13_id UUID; q14_id UUID; q15_id UUID;
    
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
    
    -- Insert the Triplebyte Quiz if we have a creator
    IF creator_id IS NOT NULL THEN
        
        -- Create the main Triplebyte Quiz
        INSERT INTO quizzes (title, description, category, is_published, price, creator_id, time_limit_minutes, created_at, updated_at)
        VALUES (
            'Triplebyte Programming Assessment',
            'A comprehensive programming quiz covering JavaScript, algorithms, data structures, and general programming concepts. Based on real Triplebyte interview questions.',
            'Programming',
            true,
            0,
            creator_id,
            45, -- 45 minute time limit
            NOW(),
            NOW()
        ) RETURNING id INTO triplebyte_quiz_id;
        
        -- Add JavaScript/Programming Questions (Insert each question individually)
        
        -- Question 1: Closures
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What will be the output of the following JavaScript code?

```javascript
function outer() {
    var x = 1;
    function inner() {
        console.log(x);
    }
    x = 2;
    return inner;
}
var fn = outer();
fn();
```', 'multiple_choice', 1, 1, NOW(), NOW())
        RETURNING id INTO q1_id;

        -- Question 2: Async/Promises
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What is the output of this code?

```javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
```', 'multiple_choice', 1, 2, NOW(), NOW())
        RETURNING id INTO q2_id;

        -- Question 3: Array methods
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What does this code return?

```javascript
[1, 2, 3].map(x => x * 2).filter(x => x > 3)
```', 'multiple_choice', 1, 3, NOW(), NOW())
        RETURNING id INTO q3_id;

        -- Question 4: Object properties
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What will be logged to the console?

```javascript
const obj = { a: 1 };
const key = "a";
console.log(obj.key);
console.log(obj[key]);
```', 'multiple_choice', 1, 4, NOW(), NOW())
        RETURNING id INTO q4_id;

        -- Question 5: Hoisting
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What is the output of this code?

```javascript
console.log(x);
var x = 5;
console.log(x);
```', 'multiple_choice', 1, 5, NOW(), NOW())
        RETURNING id INTO q5_id;

        -- Question 6: Arrow functions and this
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'In which scenario will the arrow function NOT work as expected?

```javascript
const obj = {
    name: "Test",
    greet: () => {
        console.log("Hello, " + this.name);
    }
};
```', 'multiple_choice', 1, 6, NOW(), NOW())
        RETURNING id INTO q6_id;

        -- Question 7: Deep vs Shallow copy
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What happens when you run this code?

```javascript
const original = { a: { b: 1 } };
const copy = { ...original };
copy.a.b = 2;
console.log(original.a.b);
```', 'multiple_choice', 1, 7, NOW(), NOW())
        RETURNING id INTO q7_id;

        -- Question 8: Event Loop
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'In what order will the numbers be logged?

```javascript
console.log(1);
setTimeout(() => console.log(2), 0);
setImmediate(() => console.log(3));
process.nextTick(() => console.log(4));
console.log(5);
```', 'multiple_choice', 1, 8, NOW(), NOW())
        RETURNING id INTO q8_id;

        -- Question 9: Prototype chain
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What will this code output?

```javascript
function Person(name) {
    this.name = name;
}
Person.prototype.greet = function() {
    return "Hello, " + this.name;
};
const person = new Person("Alice");
console.log(person.greet());
```', 'multiple_choice', 1, 9, NOW(), NOW())
        RETURNING id INTO q9_id;

        -- Question 10: Type coercion
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What is the result of this comparison?

```javascript
console.log([] == ![]);
```', 'multiple_choice', 1, 10, NOW(), NOW())
        RETURNING id INTO q10_id;

        -- Question 11: Algorithm - Time Complexity
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What is the time complexity of this algorithm?

```javascript
function findDuplicates(arr) {
    const seen = new Set();
    const duplicates = [];
    for (let item of arr) {
        if (seen.has(item)) {
            duplicates.push(item);
        } else {
            seen.add(item);
        }
    }
    return duplicates;
}
```', 'multiple_choice', 1, 11, NOW(), NOW())
        RETURNING id INTO q11_id;

        -- Question 12: Data Structures
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'Which data structure would be most efficient for implementing a LRU (Least Recently Used) cache?', 'multiple_choice', 1, 12, NOW(), NOW())
        RETURNING id INTO q12_id;

        -- Question 13: Recursion
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What does this recursive function calculate?

```javascript
function mystery(n) {
    if (n <= 1) return 1;
    return n * mystery(n - 1);
}
```', 'multiple_choice', 1, 13, NOW(), NOW())
        RETURNING id INTO q13_id;

        -- Question 14: Binary Search
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What is the time complexity of binary search on a sorted array of n elements?', 'multiple_choice', 1, 14, NOW(), NOW())
        RETURNING id INTO q14_id;

        -- Question 15: SQL/Database
        INSERT INTO quiz_questions (quiz_id, question, question_type, points, position, created_at, updated_at)
        VALUES (triplebyte_quiz_id, 'What type of SQL JOIN returns all records from both tables, filling with NULL where there is no match?', 'multiple_choice', 1, 15, NOW(), NOW())
        RETURNING id INTO q15_id;
        
        -- Add options for all questions
        INSERT INTO quiz_options (question_id, option_text, is_correct, position)
        VALUES
            -- Q1 options (Closures)
            (q1_id, '1', false, 1),
            (q1_id, '2', true, 2),
            (q1_id, 'undefined', false, 3),
            (q1_id, 'ReferenceError', false, 4),
            
            -- Q2 options (Async/Event Loop)
            (q2_id, 'A D B C', false, 1),
            (q2_id, 'A D C B', true, 2),
            (q2_id, 'A B C D', false, 3),
            (q2_id, 'A C D B', false, 4),
            
            -- Q3 options (Array methods)
            (q3_id, '[2, 4, 6]', false, 1),
            (q3_id, '[4, 6]', true, 2),
            (q3_id, '[2, 4]', false, 3),
            (q3_id, '[6]', false, 4),
            
            -- Q4 options (Object properties)
            (q4_id, 'undefined, 1', true, 1),
            (q4_id, '1, 1', false, 2),
            (q4_id, 'undefined, undefined', false, 3),
            (q4_id, '1, undefined', false, 4),
            
            -- Q5 options (Hoisting)
            (q5_id, 'undefined, 5', true, 1),
            (q5_id, 'ReferenceError, 5', false, 2),
            (q5_id, '5, 5', false, 3),
            (q5_id, 'undefined, undefined', false, 4),
            
            -- Q6 options (Arrow functions)
            (q6_id, 'When used as object methods', true, 1),
            (q6_id, 'When used as callbacks', false, 2),
            (q6_id, 'When used with map/filter', false, 3),
            (q6_id, 'When used in modules', false, 4),
            
            -- Q7 options (Shallow copy)
            (q7_id, '1', false, 1),
            (q7_id, '2', true, 2),
            (q7_id, 'undefined', false, 3),
            (q7_id, 'TypeError', false, 4),
            
            -- Q8 options (Event Loop - Node.js specific)
            (q8_id, '1 5 2 3 4', false, 1),
            (q8_id, '1 5 4 2 3', true, 2),
            (q8_id, '1 5 4 3 2', false, 3),
            (q8_id, '1 4 5 2 3', false, 4),
            
            -- Q9 options (Prototype)
            (q9_id, 'Hello, Alice', true, 1),
            (q9_id, 'Hello, undefined', false, 2),
            (q9_id, 'TypeError', false, 3),
            (q9_id, 'ReferenceError', false, 4),
            
            -- Q10 options (Type coercion)
            (q10_id, 'true', true, 1),
            (q10_id, 'false', false, 2),
            (q10_id, 'undefined', false, 3),
            (q10_id, 'TypeError', false, 4),
            
            -- Q11 options (Time complexity)
            (q11_id, 'O(n)', true, 1),
            (q11_id, 'O(n²)', false, 2),
            (q11_id, 'O(n log n)', false, 3),
            (q11_id, 'O(1)', false, 4),
            
            -- Q12 options (LRU Cache)
            (q12_id, 'Hash Map + Doubly Linked List', true, 1),
            (q12_id, 'Array', false, 2),
            (q12_id, 'Binary Search Tree', false, 3),
            (q12_id, 'Stack', false, 4),
            
            -- Q13 options (Recursion - factorial)
            (q13_id, 'Factorial of n', true, 1),
            (q13_id, 'Fibonacci number', false, 2),
            (q13_id, 'Sum of 1 to n', false, 3),
            (q13_id, 'Power of n', false, 4),
            
            -- Q14 options (Binary search complexity)
            (q14_id, 'O(log n)', true, 1),
            (q14_id, 'O(n)', false, 2),
            (q14_id, 'O(n log n)', false, 3),
            (q14_id, 'O(1)', false, 4),
            
            -- Q15 options (SQL JOIN)
            (q15_id, 'FULL OUTER JOIN', true, 1),
            (q15_id, 'INNER JOIN', false, 2),
            (q15_id, 'LEFT JOIN', false, 3),
            (q15_id, 'RIGHT JOIN', false, 4);
            
        RAISE NOTICE 'Triplebyte Quiz created successfully with ID: %', triplebyte_quiz_id;
        
    ELSE
        RAISE EXCEPTION 'No users found. Please create a user first.';
    END IF;
END
$$; 