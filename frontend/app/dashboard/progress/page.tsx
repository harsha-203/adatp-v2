'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';

export default function ProgressPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    try {
      // Get enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          progress_percentage,
          enrolled_at,
          completed_at,
          courses (
            title,
            category,
            difficulty,
            duration
          )
        `)
        .eq('user_id', user?.id);

      // Get quiz attempts
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('score, attempted_at')
        .eq('user_id', user?.id)
        .order('attempted_at', { ascending: false });

      // Calculate statistics
      const totalCourses = enrollments?.length || 0;
      const completedCourses = enrollments?.filter(e => e.completed_at)?.length || 0;
      const inProgressCourses = enrollments?.filter(e => e.progress_percentage > 0 && !e.completed_at)?.length || 0;
      const averageProgress = enrollments?.length 
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length)
        : 0;

      // Calculate total study time (estimate: 1% progress = 1 hour)
      const totalStudyHours = Math.round(
        enrollments?.reduce((sum, e) => sum + (e.progress_percentage / 100) * 40, 0) || 0
      );

      // Quiz performance
      const averageQuizScore = quizAttempts?.length
        ? Math.round(quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length)
        : 0;

      // Category breakdown
      const categoryStats = enrollments?.reduce((acc: any, enrollment: any) => {
        const category = enrollment.courses.category;
        if (!acc[category]) {
          acc[category] = { count: 0, totalProgress: 0, completed: 0 };
        }
        acc[category].count++;
        acc[category].totalProgress += enrollment.progress_percentage;
        if (enrollment.completed_at) acc[category].completed++;
        return acc;
      }, {});

      setProgressData({
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageProgress,
        totalStudyHours,
        averageQuizScore,
        quizAttempts: quizAttempts?.length || 0,
        enrollments,
        categoryStats: Object.entries(categoryStats || {}).map(([category, stats]: any) => ({
          category,
          ...stats,
          averageProgress: Math.round(stats.totalProgress / stats.count)
        }))
      });

    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading progress...</div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">No progress data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Progress</h1>
          <p className="text-gray-600">Track your learning journey and achievements</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{progressData.totalCourses}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {progressData.completedCourses} completed
                  </p>
                </div>
                <BookOpen className="w-10 h-10 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg. Progress</p>
                  <p className="text-3xl font-bold text-gray-900">{progressData.averageProgress}%</p>
                  <p className="text-xs text-gray-500 mt-1">across all courses</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Study Time</p>
                  <p className="text-3xl font-bold text-gray-900">{progressData.totalStudyHours}h</p>
                  <p className="text-xs text-gray-500 mt-1">total learning</p>
                </div>
                <Clock className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Quiz Score</p>
                  <p className="text-3xl font-bold text-gray-900">{progressData.averageQuizScore}%</p>
                  <p className="text-xs text-gray-500 mt-1">{progressData.quizAttempts} attempts</p>
                </div>
                <Award className="w-10 h-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress by Category */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Progress by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressData.categoryStats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No category data available</p>
            ) : (
              <div className="space-y-6">
                {progressData.categoryStats.map((cat: any) => (
                  <div key={cat.category}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{cat.category}</h4>
                        <p className="text-sm text-gray-500">
                          {cat.count} courses • {cat.completed} completed
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-teal-600">
                        {cat.averageProgress}%
                      </span>
                    </div>
                    <Progress value={cat.averageProgress} className="h-3" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Course Progress Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressData.enrollments?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No courses enrolled yet</p>
            ) : (
              <div className="space-y-4">
                {progressData.enrollments
                  ?.sort((a: any, b: any) => b.progress_percentage - a.progress_percentage)
                  .slice(0, 10)
                  .map((enrollment: any) => (
                    <div key={enrollment.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{enrollment.courses.title}</h4>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                              {enrollment.courses.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {enrollment.courses.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {enrollment.progress_percentage}%
                          </p>
                          {enrollment.completed_at && (
                            <span className="text-xs text-green-600 font-medium">Completed</span>
                          )}
                        </div>
                      </div>
                      <Progress value={enrollment.progress_percentage} className="h-2" />
                      <p className="text-xs text-gray-500 mt-2">
                        Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motivational Message */}
        {progressData.inProgressCourses > 0 && (
          <Card className="mt-6 bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Target className="w-12 h-12 text-teal-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Keep Going!</h3>
                  <p className="text-sm text-gray-700">
                    You have {progressData.inProgressCourses} course{progressData.inProgressCourses !== 1 ? 's' : ''} in progress.
                    Stay consistent to reach your learning goals! 🎯
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
