'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, Award, TrendingUp, Target, Flame, Activity, BarChart3, CheckCircle, MessageSquare, Zap, Trophy, Calendar } from 'lucide-react';
import Link from 'next/link';
import ContentSuggestionsWidget from '@/components/dashboard/content-suggestions-widget';
import axios from 'axios';

interface EnrollmentWithCourse {
  id: string;
  progress_percentage: number;
  last_accessed: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
    category: string;
    difficulty: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    certificatesEarned: 0,
    averageProgress: 0,
    practiceScore: 0,
    learningStreak: 0,
    totalActivities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Student');
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, learning_streak, last_activity_date')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setUserName(profile.full_name || 'Student');
      }

      // Get enrollments with course details
      const { data: enrollmentsData, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress_percentage,
          last_accessed,
          completed_at,
          certificate_issued,
          course:courses (
            id,
            title,
            thumbnail_url,
            category,
            difficulty
          )
        `)
        .eq('user_id', user?.id)
        .order('last_accessed', { ascending: false })
        .limit(4);

      if (error) throw error;

      setEnrollments(enrollmentsData as any);

      // Calculate stats
      const total = enrollmentsData?.length || 0;
      const completed = enrollmentsData?.filter(e => e.completed_at)?.length || 0;
      const inProgress = enrollmentsData?.filter(e => !e.completed_at && e.progress_percentage > 0)?.length || 0;
      const certificates = enrollmentsData?.filter(e => e.certificate_issued)?.length || 0;
      
      // Calculate average progress
      const avgProgress = total > 0 
        ? Math.round(enrollmentsData.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / total)
        : 0;

      // Get quiz scores for practice score calculation
      const { data: quizAttempts } = await supabase
        .from('progress')
        .select('score, quiz_id')
        .eq('user_id', user?.id)
        .not('quiz_id', 'is', null);

      const practiceScore = quizAttempts && quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, q) => sum + (q.score || 0), 0) / quizAttempts.length)
        : 0;

      // Calculate learning streak
      const today = new Date();
      const lastActivity = profile?.last_activity_date ? new Date(profile.last_activity_date) : null;
      let streak = profile?.learning_streak || 0;
      
      if (lastActivity) {
        const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          streak = 0;
        }
      }

      // Get total activities count
      const { count: activitiesCount } = await supabase
        .from('progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get recent activities
      const { data: activities } = await supabase
        .from('progress')
        .select(`
          *,
          course:courses(title),
          lesson:lessons(title),
          quiz:quizzes(title)
        `)
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      setRecentActivities(activities || []);

      setStats({
        totalCourses: total,
        completedCourses: completed,
        inProgressCourses: inProgress,
        certificatesEarned: certificates,
        averageProgress: avgProgress,
        practiceScore,
        learningStreak: streak,
        totalActivities: activitiesCount || 0,
      });

      // Load AI insights
      await loadAIInsights();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await axios.post(`${apiUrl}/api/ai/learning-insights`, {
        user_id: user?.id
      });
      setAiInsights(response.data);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      // Set default insights if API fails
      setAiInsights({
        strengths: ['Consistent learner', 'Quick learner'],
        journey: ['Getting started on your learning path'],
        recommendations: ['Continue with your current courses'],
        milestone: 'Keep up the great work!'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Welcome Section with View Full Analytics Button */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-600">Continue your learning journey</p>
        </div>
        <Button asChild variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
          <Link href="/student/analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Full Analytics
          </Link>
        </Button>
      </div>

      {/* Stats Cards - All 8 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressCourses}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.certificatesEarned}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Stat Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Practice Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.practiceScore}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Learning Streak</p>
                <p className="text-2xl font-bold text-gray-900">{stats.learningStreak} days</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActivities}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="my-learning" className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="my-learning">My Learning</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Tab 1: My Learning */}
        <TabsContent value="my-learning">
          {enrollments.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
                <Button asChild variant="outline">
                  <Link href="/dashboard/my-courses">View All</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                    <div className="relative h-48 bg-gradient-to-br from-teal-100 to-blue-100 rounded-t-lg">
                      {enrollment.course.thumbnail_url && (
                        <img
                          src={enrollment.course.thumbnail_url}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                        {enrollment.course.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {enrollment.course.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {enrollment.course.difficulty}
                        </span>
                      </div>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{enrollment.progress_percentage}%</span>
                        </div>
                        <Progress value={enrollment.progress_percentage} className="h-2" />
                      </div>
                      <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                        <Link href={`/courses/${enrollment.course.id}/learn`}>Continue</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Yet</h3>
                <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course</p>
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: AI Insights */}
        <TabsContent value="ai-insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strength Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-teal-600" />
                  Strength Areas
                </CardTitle>
                <CardDescription>Your top performing topics</CardDescription>
              </CardHeader>
              <CardContent>
                {aiInsights?.strengths?.length > 0 ? (
                  <div className="space-y-4">
                    {aiInsights.strengths.slice(0, 3).map((strength: string, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{strength}</p>
                          <Progress value={85 - index * 10} className="h-2 mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Complete more courses to see your strengths</p>
                )}
              </CardContent>
            </Card>

            {/* Progress Journey */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Progress Journey
                </CardTitle>
                <CardDescription>Your learning milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Courses Completed</p>
                      <p className="text-sm text-gray-600">{stats.completedCourses} courses finished</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Current Streak</p>
                      <p className="text-sm text-gray-600">{stats.learningStreak} days of consistent learning</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Average Progress</p>
                      <p className="text-sm text-gray-600">{stats.averageProgress}% across all courses</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>Personalized suggestions for you</CardDescription>
              </CardHeader>
              <CardContent>
                {aiInsights?.recommendations?.length > 0 ? (
                  <ul className="space-y-3">
                    {aiInsights.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">Keep learning to get personalized recommendations</p>
                )}
                <Button asChild className="w-full mt-6 bg-teal-600 hover:bg-teal-700">
                  <Link href="/dashboard/ai-recommendations">View All Recommendations</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Milestone Messages */}
            <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-600" />
                  Milestone Achievement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {aiInsights?.milestone || 'Keep up the great work!'}
                </p>
                <p className="text-gray-700 mb-4">
                  You're making excellent progress on your learning journey. Stay consistent and you'll achieve your goals!
                </p>
                <div className="flex items-center gap-2 text-teal-600">
                  <Flame className="w-5 h-5" />
                  <span className="font-medium">Keep your streak alive!</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Recent Activity */}
        <TabsContent value="recent-activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {recentActivities.map((activity, index) => {
                    const activityType = activity.lesson_id ? 'lesson' : 'quiz';
                    const activityTitle = activity.lesson?.title || activity.quiz?.title || 'Activity';
                    const courseTitle = activity.course?.title || 'Course';
                    
                    return (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          activityType === 'lesson' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {activityType === 'lesson' ? (
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Target className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {activityType === 'lesson' ? 'Completed Lesson' : 'Completed Quiz'}
                          </p>
                          <p className="text-sm text-gray-600 truncate">{activityTitle}</p>
                          <p className="text-xs text-gray-500 mt-1">{courseTitle}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500">
                            {new Date(activity.updated_at).toLocaleDateString()}
                          </p>
                          {activity.score && (
                            <p className="text-sm font-medium text-teal-600 mt-1">{activity.score}%</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
                  <p className="text-gray-600 mb-6">Start learning to see your activity history</p>
                  <Button asChild className="bg-teal-600 hover:bg-teal-700">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Content Suggestions Widget */}
      {user && <ContentSuggestionsWidget userId={user.id} />}
    </div>
  );
}
