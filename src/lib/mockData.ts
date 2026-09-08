import type { Quiz } from '../types/quiz';

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-starter-science',
    title: '🌌 Cosmic Wonders & Science Trivia',
    description: 'Test your knowledge of the solar system, physics, and natural wonders with instant answers and explanations!',
    code: '742-108',
    status: 'published',
    default_timer: 20,
    cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-sci-1',
        quiz_id: 'quiz-starter-science',
        question_text: 'Which planet in our solar system has the most confirmed moons?',
        question_type: 'multiple_choice',
        timer_seconds: 20,
        explanation: 'Saturn has 146 recognized moons, officially surpassing Jupiter (95 moons) as the king of moons in our solar system!',
        media_url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=800&q=80',
        media_type: 'image',
        order_index: 0,
        options: [
          { id: 'opt-sci-1a', option_text: 'Saturn', option_color: 'red', is_correct: true, order_index: 0 },
          { id: 'opt-sci-1b', option_text: 'Jupiter', option_color: 'blue', is_correct: false, order_index: 1 },
          { id: 'opt-sci-1c', option_text: 'Neptune', option_color: 'yellow', is_correct: false, order_index: 2 },
          { id: 'opt-sci-1d', option_text: 'Mars', option_color: 'green', is_correct: false, order_index: 3 }
        ]
      },
      {
        id: 'q-sci-2',
        quiz_id: 'quiz-starter-science',
        question_text: 'What is the hardest naturally occurring mineral on Earth?',
        question_type: 'multiple_choice',
        timer_seconds: 15,
        explanation: 'Diamond is formed from pure carbon under immense heat and pressure, ranking at a perfect 10 on the Mohs mineral hardness scale.',
        media_url: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80',
        media_type: 'image',
        order_index: 1,
        options: [
          { id: 'opt-sci-2a', option_text: 'Titanium', option_color: 'red', is_correct: false, order_index: 0 },
          { id: 'opt-sci-2b', option_text: 'Diamond', option_color: 'blue', is_correct: true, order_index: 1 },
          { id: 'opt-sci-2c', option_text: 'Quartz', option_color: 'yellow', is_correct: false, order_index: 2 },
          { id: 'opt-sci-2d', option_text: 'Granite', option_color: 'green', is_correct: false, order_index: 3 }
        ]
      },
      {
        id: 'q-sci-3',
        quiz_id: 'quiz-starter-science',
        question_text: 'Sound travels faster in water than in air.',
        question_type: 'true_false',
        timer_seconds: 15,
        explanation: 'True! Sound waves travel at ~1,480 m/s in water compared to ~343 m/s in air because liquid molecules are packed much closer together.',
        media_type: 'none',
        order_index: 2,
        options: [
          { id: 'opt-sci-3a', option_text: 'True', option_color: 'blue', is_correct: true, order_index: 0 },
          { id: 'opt-sci-3b', option_text: 'False', option_color: 'red', is_correct: false, order_index: 1 }
        ]
      },
      {
        id: 'q-sci-4',
        quiz_id: 'quiz-starter-science',
        question_text: 'Roughly how long does sunlight take to travel across space to Earth?',
        question_type: 'multiple_choice',
        timer_seconds: 20,
        explanation: 'At 300,000 km per second, light takes about 499 seconds (8 minutes and 19 seconds) to traverse the 149.6 million km to Earth.',
        media_url: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=800&q=80',
        media_type: 'image',
        order_index: 3,
        options: [
          { id: 'opt-sci-4a', option_text: 'Around 8 minutes 20 seconds', option_color: 'red', is_correct: true, order_index: 0 },
          { id: 'opt-sci-4b', option_text: 'Exactly 1 minute', option_color: 'blue', is_correct: false, order_index: 1 },
          { id: 'opt-sci-4c', option_text: '24 hours', option_color: 'yellow', is_correct: false, order_index: 2 },
          { id: 'opt-sci-4d', option_text: 'Instantaneous (0 seconds)', option_color: 'green', is_correct: false, order_index: 3 }
        ]
      }
    ]
  },
  {
    id: 'quiz-starter-general',
    title: '⚡ BrainSpark Trivia Challenge',
    description: 'A lightning-fast quiz testing your knowledge of geography, technology, and world wonders!',
    code: '319-582',
    status: 'published',
    default_timer: 15,
    cover_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-gen-1',
        quiz_id: 'quiz-starter-general',
        question_text: 'What does "HTTP" stand for in web browsing?',
        question_type: 'multiple_choice',
        timer_seconds: 15,
        explanation: 'HyperText Transfer Protocol is the foundation of data communication for the World Wide Web.',
        media_type: 'none',
        order_index: 0,
        options: [
          { id: 'opt-gen-1a', option_text: 'HyperText Transfer Protocol', option_color: 'red', is_correct: true, order_index: 0 },
          { id: 'opt-gen-1b', option_text: 'High Time Technical Program', option_color: 'blue', is_correct: false, order_index: 1 },
          { id: 'opt-gen-1c', option_text: 'Hyper Terminal Text Provider', option_color: 'yellow', is_correct: false, order_index: 2 },
          { id: 'opt-gen-1d', option_text: 'Home Tool Transfer Process', option_color: 'green', is_correct: false, order_index: 3 }
        ]
      },
      {
        id: 'q-gen-2',
        quiz_id: 'quiz-starter-general',
        question_text: 'Which is the longest river in the world?',
        question_type: 'multiple_choice',
        timer_seconds: 15,
        explanation: 'The Nile River in northeastern Africa spans roughly 6,650 kilometers (4,132 miles), making it the longest river system on Earth.',
        media_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        media_type: 'image',
        order_index: 1,
        options: [
          { id: 'opt-gen-2a', option_text: 'Amazon River', option_color: 'red', is_correct: false, order_index: 0 },
          { id: 'opt-gen-2b', option_text: 'Nile River', option_color: 'blue', is_correct: true, order_index: 1 },
          { id: 'opt-gen-2c', option_text: 'Yangtze River', option_color: 'yellow', is_correct: false, order_index: 2 },
          { id: 'opt-gen-2d', option_text: 'Mississippi River', option_color: 'green', is_correct: false, order_index: 3 }
        ]
      },
      {
        id: 'q-gen-3',
        quiz_id: 'quiz-starter-general',
        question_text: 'The Eiffel Tower in Paris can grow taller in the summer.',
        question_type: 'true_false',
        timer_seconds: 15,
        explanation: 'True! Due to thermal expansion of the iron during summer heat, the Eiffel Tower can grow up to 15 centimeters (6 inches) taller!',
        media_type: 'none',
        order_index: 2,
        options: [
          { id: 'opt-gen-3a', option_text: 'True', option_color: 'blue', is_correct: true, order_index: 0 },
          { id: 'opt-gen-3b', option_text: 'False', option_color: 'red', is_correct: false, order_index: 1 }
        ]
      }
    ]
  }
];
