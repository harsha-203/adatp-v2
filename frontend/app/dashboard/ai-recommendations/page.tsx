'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, TrendingUp, BookOpen, Target, Clock, CheckCircle2, Brain } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface RecommendedCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnail_url?: string;
  ai_reason: string;
  match_score: number;
}

interface Milestone {
  week: number;
  title: string;
  description: string;
  skills: string[];
}

interface LearningPath {
  path_name: string;
  duration_weeks: number;
  milestones: Milestone[];
  recommended_courses: string[];
}

type TabType = 'recommendations' | 'learning-path';

export default function AIRecommendationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('recommendations');
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState('');
  const [pathLoading, setPathLoading] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/ai/recommend-courses?user_id=${user.id}&limit=10`);
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePath = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !goal.trim()) return;

    try {
      setPathLoading(true);
      const response = await fetch(`${backendUrl}/api/ai/learning-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          goal: goal.trim(),
        }),
      });

      const data = await response.json();
      setLearningPath(data);
    } catch (error) {
      console.error('Error generating learning path:', error);
      alert('Failed to generate learning path');
    } finally {
      setPathLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Learning Assistant</h1>
          </div>
          <p className="text-gray-600">Get personalized course recommendations and custom learning paths powered by AI</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-8 pt-6">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'recommendations'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Course Recommendations</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('learning-path')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'learning-path'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span>Learning Path Generator</span>
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Course Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div>
            {recommendations.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No recommendations yet</h3>
                <p className="text-gray-600 mb-4">Start enrolling in courses to get personalized recommendations</p>
                <Button onClick={() => router.push('/courses')} className="bg-teal-600 hover:bg-teal-700">
                  Browse Courses
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {recommendations.map((course) => (
                  <Card 
                    key={course.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    <div className="flex gap-6">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-48 h-32 bg-gray-200 rounded-lg overflow-hidden">
                        {course.thumbnail_url && (
                          <img 
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                                {course.category}
                              </Badge>
                              <Badge variant="outline">
                                {course.difficulty}
                              </Badge>
                              <div className="flex items-center gap-1 text-yellow-500">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm font-semibold">{course.match_score}% Match</span>
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {course.title}
                            </h3>
                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {course.description}
                            </p>
                          </div>
                        </div>

                        {/* AI Reason */}
                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-100">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-teal-900 mb-1">Why we recommend this:</p>
                              <p className="text-sm text-gray-700">{course.ai_reason}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Learning Path Generator Tab */}
        {activeTab === 'learning-path' && (
          <div>
            {/* Goal Input Form */}
            <Card className="p-8 mb-8">
              <form onSubmit={handleGeneratePath}>
                <Label htmlFor="goal" className="text-lg font-semibold mb-2 block">
                  What's your learning goal?
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Example: "Become a full-stack web developer", "Master data science", "Learn digital marketing"
                </p>
                <div className="flex gap-4">
                  <Input
                    id="goal"
                    placeholder="Enter your learning goal..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={pathLoading || !goal.trim()}
                    className="bg-teal-600 hover:bg-teal-700 px-8"
                  >
                    {pathLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Path
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Learning Path Result */}
            {learningPath && (
              <div className="space-y-6">
                {/* Overview */}
                <Card className="p-8 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {learningPath.path_name}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{learningPath.duration_weeks} weeks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>{learningPath.milestones.length} milestones</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Milestones Timeline */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Learning Journey</h3>
                  <div className="space-y-4">
                    {learningPath.milestones.map((milestone, index) => (
                      <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex gap-6">
                          {/* Week Badge */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-xs text-teal-600 font-medium">Week</div>
                                <div className="text-xl font-bold text-teal-700">{milestone.week}</div>
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                              {milestone.title}
                            </h4>
                            <p className="text-gray-700 mb-4">
                              {milestone.description}
                            </p>

                            {/* Skills */}
                            <div>
                              <p className="text-sm font-semibold text-gray-600 mb-2">Skills you'll learn:</p>
                              <div className="flex flex-wrap gap-2">
                                {milestone.skills.map((skill, idx) => (
                                  <Badge key={idx} variant="secondary" className="bg-gray-100">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Recommended Courses */}
                {learningPath.recommended_courses.length > 0 && (
                  <Card className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Recommended Courses</h3>
                    <p className="text-gray-600 mb-4">
                      These courses will help you achieve your goal. Enroll now to get started!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {learningPath.recommended_courses.map((courseId, idx) => (
                        <Badge key={idx} className="bg-teal-600 text-white">
                          Course {idx + 1}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button onClick={() => setLearningPath(null)} variant="outline">
                    Generate New Path
                  </Button>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => router.push('/courses')}>
                    Start Learning
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
