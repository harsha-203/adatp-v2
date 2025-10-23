'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  FileText,
  Bookmark,
  BookmarkCheck,
  Clock,
  BarChart3,
  Award
} from 'lucide-react';

// Dynamic import for ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  duration_minutes: number;
  order_index: number;
  completed?: boolean;
}

export default function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [playing, setPlaying] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    loadCourseData();
  }, [courseId, user]);

  const loadCourseData = async () => {
    try {
      // Load course with lessons via backend
      const courseResponse = await axios.get(`${backendUrl}/courses/${courseId}/details`);
      setCourse(courseResponse.data.course);
      setLessons(courseResponse.data.lessons);

      // Set first lesson as current
      if (courseResponse.data.lessons.length > 0) {
        setCurrentLesson(courseResponse.data.lessons[0]);
        setCurrentLessonIndex(0);
      }

      // Check enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user?.id)
        .eq('course_id', courseId)
        .single();

      if (enrollmentError || !enrollmentData) {
        router.push(`/courses/${courseId}`);
        return;
      }

      setEnrollment(enrollmentData);

      // Update last accessed
      await supabase
        .from('enrollments')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', enrollmentData.id);

      // Load lesson progress
      await loadLessonProgress(enrollmentData.id);
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLessonProgress = async (enrollmentId: string) => {
    try {
      const response = await axios.get(
        `${backendUrl}/courses/${courseId}/lessons/progress?enrollment_id=${enrollmentId}`
      );
      const progressData = response.data;

      // Mark lessons as completed based on progress
      setLessons(prevLessons =>
        prevLessons.map(lesson => {
          const progress = progressData.find((p: any) => p.lesson_id === lesson.id);
          return {
            ...lesson,
            completed: progress?.completed || false
          };
        })
      );
    } catch (error) {
      console.error('Error loading lesson progress:', error);
    }
  };

  const markLessonComplete = async (lessonId: string, completed: boolean) => {
    if (!enrollment) return;

    setMarking(true);
    try {
      await axios.post(
        `${backendUrl}/courses/${courseId}/lessons/${lessonId}/progress`,
        null,
        {
          params: {
            enrollment_id: enrollment.id,
            completed: completed
          }
        }
      );

      // Update local state
      setLessons(prev =>
        prev.map(l => (l.id === lessonId ? { ...l, completed } : l))
      );

      // Reload enrollment to get updated progress
      const { data: updatedEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', enrollment.id)
        .single();

      setEnrollment(updatedEnrollment);
    } catch (error) {
      console.error('Error marking lesson:', error);
    } finally {
      setMarking(false);
    }
  };

  const toggleBookmark = async () => {
    if (!currentLesson || !user) return;

    try {
      if (isBookmarked) {
        // Remove bookmark - implement when needed
        setIsBookmarked(false);
      } else {
        // Add bookmark
        await axios.post(`${backendUrl}/bookmarks`, {
          user_id: user.id,
          lesson_id: currentLesson.id,
          note: ''
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const goToLesson = (index: number) => {
    if (index >= 0 && index < lessons.length) {
      setCurrentLesson(lessons[index]);
      setCurrentLessonIndex(index);
      setPlaying(false);
    }
  };

  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      goToLesson(currentLessonIndex + 1);
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      goToLesson(currentLessonIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading course...</div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Course not found</div>
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.completed).length;
  const progressPercentage = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Course Header */}
          <div className="mb-6">
            <Link
              href={`/courses/${courseId}`}
              className="text-teal-600 hover:text-teal-700 flex items-center gap-2 mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Course
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {course.duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {lessons.length} lessons
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                {progressPercentage.toFixed(0)}% complete
              </span>
            </div>
          </div>

          {/* Video Player / Content */}
          <Card className="mb-6">
            <CardContent className="p-0">
              {currentLesson.content_type === 'video' && currentLesson.content_url ? (
                <div className="aspect-video bg-black">
                  <ReactPlayer
                    url={currentLesson.content_url}
                    width="100%"
                    height="100%"
                    controls={true}
                    playing={playing}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <PlayCircle className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-semibold">Video content will be available soon</p>
                    <p className="text-sm opacity-80 mt-2">For now, please continue with the lesson materials</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lesson Content Tabs */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleBookmark}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-4 h-4 mr-2" />
                    ) : (
                      <Bookmark className="w-4 h-4 mr-2" />
                    )}
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                  <Button
                    variant={currentLesson.completed ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => markLessonComplete(currentLesson.id, !currentLesson.completed)}
                    disabled={marking}
                    className={currentLesson.completed ? '' : 'bg-green-600 hover:bg-green-700'}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {currentLesson.completed ? 'Completed' : 'Mark Complete'}
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {currentLesson.description || 'No description available for this lesson.'}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <div className="text-gray-600">
                    <p>Take notes while watching the lesson...</p>
                    <textarea
                      className="w-full mt-4 p-4 border rounded-lg"
                      rows={6}
                      placeholder="Your notes here..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="mt-4">
                  <div className="text-gray-600">
                    <p>Additional resources and materials will appear here.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={goToPreviousLesson}
              disabled={currentLessonIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Lesson
            </Button>
            <Button
              onClick={goToNextLesson}
              disabled={currentLessonIndex === lessons.length - 1}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Next Lesson
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Sidebar - Lessons List */}
        <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto max-h-screen">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Course Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{completedLessons} of {lessons.length} lessons</span>
                <span>{progressPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>

          {/* Achievement Notice */}
          {progressPercentage === 100 && (
            <Card className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Congratulations!</p>
                    <p className="text-sm text-gray-600">Course completed 🎉</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Lessons</h3>
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => goToLesson(index)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  currentLesson.id === lesson.id
                    ? 'bg-teal-50 border-teal-500'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {lesson.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${
                      currentLesson.id === lesson.id ? 'text-teal-700' : 'text-gray-900'
                    }`}>
                      {lesson.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.duration_minutes} min
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
