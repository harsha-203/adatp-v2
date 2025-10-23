'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  TrendingUp,
  PlayCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  course_id: string;
  progress_percentage: number;
  enrolled_at: string;
  last_accessed: string;
  completed_at: string | null;
  course: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    duration: string;
    thumbnail_url: string;
    instructor_name: string;
  };
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      loadEnrolledCourses();
    }
  }, [user]);

  const loadEnrolledCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          progress_percentage,
          enrolled_at,
          last_accessed,
          completed_at,
          courses (
            id,
            title,
            description,
            category,
            difficulty,
            duration,
            thumbnail_url,
            instructor_name
          )
        `)
        .eq('user_id', user?.id)
        .order('last_accessed', { ascending: false });

      if (error) throw error;

      // Flatten the nested course data
      const formattedCourses = data.map((enrollment: any) => ({
        ...enrollment,
        course: enrollment.courses
      }));

      setCourses(formattedCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(enrollment => {
    if (filter === 'in-progress') {
      return enrollment.progress_percentage > 0 && enrollment.progress_percentage < 100;
    }
    if (filter === 'completed') {
      return enrollment.progress_percentage === 100;
    }
    return true;
  });

  const stats = {
    total: courses.length,
    inProgress: courses.filter(e => e.progress_percentage > 0 && e.progress_percentage < 100).length,
    completed: courses.filter(e => e.progress_percentage === 100).length,
    notStarted: courses.filter(e => e.progress_percentage === 0).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading your courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">Manage and continue your learning journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <BookOpen className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Not Started</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.notStarted}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            All Courses ({stats.total})
          </Button>
          <Button
            variant={filter === 'in-progress' ? 'default' : 'outline'}
            onClick={() => setFilter('in-progress')}
            className={filter === 'in-progress' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            In Progress ({stats.inProgress})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            className={filter === 'completed' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            Completed ({stats.completed})
          </Button>
        </div>

        {/* Course List */}
        {filteredCourses.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No courses yet' : `No ${filter} courses`}
              </h3>
              <p className="text-gray-600 mb-6">
                Start your learning journey by exploring our course catalog
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((enrollment) => (
              <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {enrollment.course.thumbnail_url ? (
                    <img
                      src={enrollment.course.thumbnail_url}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600">
                      <BookOpen className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  {enrollment.completed_at && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded">
                      {enrollment.course.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {enrollment.course.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {enrollment.course.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {enrollment.course.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">
                        {enrollment.progress_percentage}%
                      </span>
                    </div>
                    <Progress value={enrollment.progress_percentage} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{enrollment.course.duration}</span>
                    </div>
                  </div>

                  <Button 
                    asChild 
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    <Link href={`/courses/${enrollment.course_id}/learn`}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {enrollment.progress_percentage === 0 ? 'Start Course' : 'Continue Learning'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
