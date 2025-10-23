'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { Clock, Award, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

interface Quiz {
  id: string;
  title: string;
  course_name: string;
  questions_count: number;
  passing_score: number;
  duration: string;
  attempts: any[];
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

interface QuizDetail {
  id: string;
  title: string;
  description: string;
  duration: string;
  passing_score: number;
  questions: Question[];
}

export default function PracticePage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetail | null>(null);
  const [answers, setAnswers] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const response = await axios.get(`${API}/quizzes/by-course`);
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quizId: string) => {
    try {
      const response = await axios.get(`${API}/quizzes/${quizId}`);
      setSelectedQuiz(response.data);
      setAnswers({});
      setResult(null);
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const submitQuiz = async () => {
    if (!selectedQuiz || !user) return;
    setSubmitting(true);

    try {
      const response = await axios.post(`${API}/quizzes/${selectedQuiz.id}/attempt`, {
        quiz_id: selectedQuiz.id,
        user_id: user.id,
        answers: answers
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setAnswers({});
    setResult(null);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  // Quiz Results View
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              {result.passed ? (
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              <h2 className="text-3xl font-bold mb-2">
                {result.passed ? 'Congratulations! 🎉' : 'Keep Practicing! 💪'}
              </h2>
              <p className="text-gray-600 mb-6">
                You scored {result.percentage}%
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Your Score</p>
                  <p className="text-2xl font-bold text-gray-900">{result.percentage}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Passing Score</p>
                  <p className="text-2xl font-bold text-gray-900">70%</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={resetQuiz} variant="outline" className="flex-1">
                  Back to Quizzes
                </Button>
                <Button onClick={() => startQuiz(selectedQuiz!.id)} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  if (selectedQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedQuiz.title}</h1>
                  <p className="text-gray-600">{selectedQuiz.description}</p>
                </div>
                <Button variant="outline" onClick={resetQuiz}>
                  Exit
                </Button>
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedQuiz.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Passing Score: {selectedQuiz.passing_score}%
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {selectedQuiz.questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">
                    {index + 1}. {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswerChange(question.id, optionIndex)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                          answers[question.id] === optionIndex
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Button
              onClick={submitQuiz}
              disabled={Object.keys(answers).length !== selectedQuiz.questions.length || submitting}
              className="w-full bg-teal-600 hover:bg-teal-700 py-6 text-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz List View
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Practice & Quizzes</h1>
          <p className="text-gray-600">Test your knowledge and track your progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{quiz.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{quiz.course_name}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{quiz.questions_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{quiz.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Passing Score:</span>
                    <span className="font-medium">{quiz.passing_score}%</span>
                  </div>
                </div>
                <Button
                  onClick={() => startQuiz(quiz.id)}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
