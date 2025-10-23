'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Course {
  id: string;
  title: string;
  category: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface GeneratedQuiz {
  quiz_title: string;
  questions: QuizQuestion[];
}

export default function QuizGeneratorPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch(`${backendUrl}/admin/courses/management`);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse) return;

    try {
      setLoading(true);
      setSuccessMessage('');
      const response = await fetch(`${backendUrl}/ai/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: selectedCourse,
          difficulty: difficulty,
        }),
      });

      const data = await response.json();
      setGeneratedQuiz(data);
      setSuccessMessage('Quiz generated successfully! It has been saved to the database.');
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedQuiz(null);
    setSuccessMessage('');
    setSelectedCourse('');
    setDifficulty('medium');
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    hard: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-10 h-10" />
            <h1 className="text-4xl font-bold">AI Quiz Generator</h1>
          </div>
          <p className="text-xl text-white/90">Create intelligent quiz questions automatically using AI</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Generation Form */}
        {!generatedQuiz && (
          <Card className="p-8 mb-8">
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Course Selection */}
              <div>
                <Label htmlFor="course" className="text-lg font-semibold mb-2 block">
                  Select Course
                </Label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Selection */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">
                  Quiz Difficulty
                </Label>
                <div className="flex gap-4">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 px-6 py-4 rounded-lg border-2 font-semibold capitalize transition-all ${
                        difficulty === level
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                type="submit"
                disabled={loading || !selectedCourse}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                    Generating AI Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Quiz with AI
                  </>
                )}
              </Button>
            </form>
          </Card>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Generated Quiz Display */}
        {generatedQuiz && (
          <div className="space-y-6">
            {/* Quiz Header */}
            <Card className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {generatedQuiz.quiz_title}
                  </h2>
                  <div className="flex items-center gap-3">
                    <Badge className={difficultyColors[difficulty]}>
                      {difficulty.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {generatedQuiz.questions.length} Questions
                    </Badge>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>
                </div>
                <Button onClick={handleReset} variant="outline">
                  Generate New Quiz
                </Button>
              </div>
            </Card>

            {/* Questions */}
            <div className="space-y-6">
              {generatedQuiz.questions.map((question, index) => (
                <Card key={index} className="p-6">
                  <div className="flex gap-4">
                    {/* Question Number */}
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>

                    {/* Question Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {question.question}
                      </h3>

                      {/* Options */}
                      <div className="space-y-3 mb-4">
                        {question.options.map((option, optIdx) => {
                          const isCorrect = option.startsWith(question.correct_answer);
                          return (
                            <div
                              key={optIdx}
                              className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
                                isCorrect
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                              )}
                              <span className={`flex-1 ${isCorrect ? 'font-semibold text-green-900' : 'text-gray-700'}`}>
                                {option}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                            <p className="text-sm text-gray-700">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Generate Another Quiz
              </Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                Publish Quiz
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
