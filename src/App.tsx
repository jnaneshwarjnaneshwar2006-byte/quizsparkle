import React, { useState, useEffect } from 'react';
import type { Quiz, Option, StudentAnswer, UserProfile } from './types/quiz';
import { authService } from './services/authService';
import { Navbar } from './components/common/Navbar';
import { LoginPage } from './components/auth/LoginPage';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { SupabaseSetupModal } from './components/teacher/SupabaseSetupModal';
import { JoinQuizModal } from './components/student/JoinQuizModal';
import { GameLobby } from './components/student/GameLobby';
import { QuizScreen } from './components/student/QuizScreen';
import { InstantFeedback } from './components/student/InstantFeedback';
import { QuestionLeaderboard } from './components/student/QuestionLeaderboard';
import { FinalResults } from './components/student/FinalResults';

type StudentState = 'join' | 'lobby' | 'quiz' | 'feedback' | 'leaderboard' | 'results';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Check existing login session on mount
  useEffect(() => {
    const savedUser = authService.getUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  // Student Game Flow State
  const [studentState, setStudentState] = useState<StudentState>('join');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('🚀');
  const [studentId, setStudentId] = useState<string>('');

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);

  // Current Feedback State
  const [lastSelectedOption, setLastSelectedOption] = useState<Option | null>(null);
  const [lastPointsEarned, setLastPointsEarned] = useState<number>(0);
  const [lastSpeedBonus, setLastSpeedBonus] = useState<number>(0);

  const [startTimeMs, setStartTimeMs] = useState<number>(0);
  const [totalTimeTakenSeconds, setTotalTimeTakenSeconds] = useState<number>(0);

  // Handle Login Success
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'student') {
      setStudentName(user.name);
      setAvatar(user.avatar || '🚀');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setActiveQuiz(null);
    setStudentState('join');
  };

  // Handle Joining Quiz
  const handleJoinQuiz = (quiz: Quiz, name: string, userAvatar: string) => {
    setActiveQuiz(quiz);
    setStudentName(name || currentUser?.name || 'Player');
    setAvatar(userAvatar || currentUser?.avatar || '🚀');
    setStudentId(`guest-${Date.now()}`);
    setCurrentQuestionIdx(0);
    setStudentAnswers([]);
    setTotalScore(0);
    setStudentState('lobby');
  };

  // Start Game from Lobby
  const handleStartGame = () => {
    if (activeQuiz) localStorage.setItem(`quiz-start-${activeQuiz.id}`, Date.now().toString());
    setStudentState('quiz');
    setStartTimeMs(Date.now());
  };

  // Answer selected on QuizScreen - now with in-place instant answer reveal & smooth transitions
  const handleAnswerSelected = (
    option: Option | null,
    responseTimeMs: number,
    viewLeaderboard: boolean = false
  ) => {
    if (!activeQuiz) return;
    const currentQ = activeQuiz.questions[currentQuestionIdx];
    const isCorrect = option?.is_correct ?? false;

    let points = 0;
    let speedBonus = 0;

    if (isCorrect) {
      const basePoints = 500;
      const maxTimeMs = (currentQ.timer_seconds || 20) * 1000;
      const speedRatio = Math.max(0, (maxTimeMs - responseTimeMs) / maxTimeMs);
      speedBonus = Math.round(speedRatio * 500);
      points = basePoints + speedBonus;
    }

    const newAnswer: StudentAnswer = {
      question_id: currentQ.id,
      selected_option_id: option?.id || '',
      is_correct: isCorrect,
      points_earned: points,
      response_time_ms: responseTimeMs
    };

    setStudentAnswers(prev => [...prev, newAnswer]);
    setTotalScore(prev => prev + points);
    setLastSelectedOption(option);
    setLastPointsEarned(points);
    setLastSpeedBonus(speedBonus);

    // If student explicitly requested leaderboard, navigate there; otherwise proceed directly
    if (viewLeaderboard) {
      setStudentState('leaderboard');
    } else {
      if (currentQuestionIdx < activeQuiz.questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setStudentState('quiz');
      } else {
        const totalSeconds = Math.round((Date.now() - startTimeMs) / 1000);
        setTotalTimeTakenSeconds(totalSeconds);
        setStudentState('leaderboard');
      }
    }
  };

  // Move from Instant Feedback to Leaderboard
  const handleFeedbackNext = () => {
    if (!activeQuiz) return;
    setStudentState('leaderboard');
  };

  // Move from Leaderboard to Next Question or Final Results
  const handleNextQuestion = () => {
    if (!activeQuiz) return;

    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setStudentState('quiz');
    } else {
      const totalSeconds = Math.round((Date.now() - startTimeMs) / 1000);
      setTotalTimeTakenSeconds(totalSeconds);
      setStudentState('results');
    }
  };

  // Reset Student Game
  const handleResetStudent = () => {
    setActiveQuiz(null);
    setStudentState('join');
    setStudentId('');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'} transition-colors duration-200 flex flex-col font-sans selection:bg-purple-500 selection:text-white`}>

      {/* NAVBAR */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* IF NOT LOGGED IN -> DISPLAY SEPARATE LOGIN / AUTH PAGE */}
        {!currentUser && !activeQuiz ? (
          new URLSearchParams(window.location.search).has('quiz') ? (
            <JoinQuizModal onJoinSuccess={handleJoinQuiz} />
          ) : (
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          )
        ) : (
          <>
            {/* TEACHER DASHBOARD */}
            {currentUser?.role === 'teacher' && !activeQuiz && (
              <TeacherDashboard />
            )}

            {/* QUIZ GAME FLOW FOR ANONYMOUS STUDENTS */}
            {activeQuiz && (
              <>
                {studentState === 'join' && (
                  <JoinQuizModal onJoinSuccess={handleJoinQuiz} />
                )}

                {studentState === 'lobby' && activeQuiz && (
                  <GameLobby
                    quiz={activeQuiz}
                    studentName={studentName || currentUser?.name || 'Player'}
                    avatar={avatar}
                    onStartGame={handleStartGame}
                    onLeave={handleResetStudent}
                  />
                )}

                {studentState === 'quiz' && activeQuiz && (
                  <QuizScreen
                    question={activeQuiz.questions[currentQuestionIdx]}
                    questionIndex={currentQuestionIdx}
                    totalQuestions={activeQuiz.questions.length}
                    currentScore={totalScore}
                    onAnswerSelected={handleAnswerSelected}
                    onExitQuiz={handleResetStudent}
                  />
                )}

                {studentState === 'feedback' && activeQuiz && (
                  <InstantFeedback
                    question={activeQuiz.questions[currentQuestionIdx]}
                    selectedOption={lastSelectedOption}
                    pointsEarned={lastPointsEarned}
                    speedBonus={lastSpeedBonus}
                    totalScore={totalScore}
                    onNext={handleFeedbackNext}
                  />
                )}

                {studentState === 'leaderboard' && activeQuiz && (
                  <QuestionLeaderboard
                    quiz={activeQuiz}
                    studentName={studentName || currentUser?.name || 'Player'}
                    currentScore={totalScore}
                    questionIndex={currentQuestionIdx}
                    totalQuestions={activeQuiz.questions.length}
                    onNextQuestion={handleNextQuestion}
                  />
                )}

                {studentState === 'results' && activeQuiz && (
                  <FinalResults
                    quiz={activeQuiz}
                    studentName={studentName || currentUser?.name || 'Player'}
                    studentId={studentId || currentUser?.id || `guest-${Date.now()}`}
                    avatar={avatar}
                    answers={studentAnswers}
                    totalScore={totalScore}
                    totalTimeSeconds={totalTimeTakenSeconds}
                    onRestart={handleResetStudent}
                  />
                )}
              </>
            )}
          </>
        )}

      </main>

      {/* SUPABASE SETUP MODAL */}
      {isSupabaseModalOpen && (
        <SupabaseSetupModal onClose={() => setIsSupabaseModalOpen(false)} />
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>QuizSpark • Assessments for Strategic Growth</p>
      </footer>

    </div>
  );
};

export default App;
