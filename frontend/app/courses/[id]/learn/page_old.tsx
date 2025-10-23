'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  FileText,
  HelpCircle,
  Bookmark,
  BookmarkCheck,
  Clock,
  BarChart3
} from 'lucide-react';

// Dynamic import for ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string | null;
  duration_minutes: number;
  order_index: number;
  module_title?: string;
  module_order?: number;
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
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    loadCourseData();
  }, [courseId, user]);

  const loadCourseData = async () => {
    try {
      // Load course
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      setCourse(courseData);

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

      // Load all lessons with module info
      const { data: modulesData } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          order_index,
          lessons (
            id,
            title,
            description,
            content_type,
            content_url,
            duration_minutes,
            order_index,
            module_id
          )
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      // Flatten lessons with module info
      const allLessons: Lesson[] = [];
      modulesData?.forEach((module: any) => {
        module.lessons
          .sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)
          .forEach((lesson: Lesson) => {
            allLessons.push({
              ...lesson,
              module_title: module.title,
              module_order: module.order_index
            });
          });
      });

      // Load lesson progress
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('enrollment_id', enrollmentData.id);

      const completedSet = new Set(
        progressData?.filter(p => p.completed).map(p => p.lesson_id) || []
      );

      // Mark completed lessons
      const lessonsWithProgress = allLessons.map(lesson => ({
        ...lesson,
        completed: completedSet.has(lesson.id)
      }));

      setLessons(lessonsWithProgress);

      // Set first incomplete lesson or first lesson
      const firstIncomplete = lessonsWithProgress.find(l => !l.completed);
      setCurrentLesson(firstIncomplete || lessonsWithProgress[0]);

    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!enrollment || marking) return;

    setMarking(true);
    try {
      // Check if progress entry exists
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id, completed')
        .eq('enrollment_id', enrollment.id)
        .eq('lesson_id', lessonId)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('lesson_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new
        await supabase
          .from('lesson_progress')
          .insert([
            {
              enrollment_id: enrollment.id,
              lesson_id: lessonId,
              completed: true,
              completed_at: new Date().toISOString(),
              time_spent_minutes: currentLesson?.duration_minutes || 0
            }
          ]);
      }

      // Update lessons state
      setLessons(prev =>
        prev.map(l =>
          l.id === lessonId ? { ...l, completed: true } : l
        )
      );

      // Calculate and update progress percentage
      const completedCount = lessons.filter(l => l.id === lessonId || l.completed).length;
      const progressPercentage = Math.round((completedCount / lessons.length) * 100);

      await supabase
        .from('enrollments')
        .update({
          progress_percentage: progressPercentage,
          completed_at: progressPercentage === 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollment.id);

      setEnrollment((prev: any) => ({
        ...prev,
        progress_percentage: progressPercentage
      }));

    } catch (error) {
      console.error('Error marking lesson complete:', error);
    } finally {
      setMarking(false);
    }
  };

  const goToNextLesson = () => {
    if (!currentLesson) return;
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1]);
    }
  };

  const goToPreviousLesson = () => {
    if (!currentLesson) return;
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex > 0) {
      setCurrentLesson(lessons[currentIndex - 1]);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="w-4 h-4" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading course...</div>
      </div>
    );
  }

  const currentIndex = currentLesson ? lessons.findIndex(l => l.id === currentLesson.id) : -1;
  const progressPercent = enrollment?.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/courses/${courseId}`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">{course?.title}</h1>
              <p className="text-sm text-gray-500">
                {currentIndex + 1} of {lessons.length} lessons
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">Progress: {progressPercent}%</div>
            <Progress value={progressPercent} className="w-32 h-2" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lesson List */}
        <aside className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Course Content</h2>
            <div className="space-y-1">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLesson(lesson)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentLesson?.id === lesson.id
                      ? 'bg-teal-50 border-l-4 border-teal-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {lesson.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        getContentIcon(lesson.content_type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {index + 1}. {lesson.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lesson.module_title} • {lesson.duration_minutes} min
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {currentLesson ? (
              <div className="space-y-6">
                {/* Lesson Header */}
                <div>
                  <div className="text-sm text-teal-600 font-medium mb-2">
                    Module {currentLesson.module_order}: {currentLesson.module_title}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {currentLesson.title}
                  </h2>
                  <p className="text-gray-600">{currentLesson.description}</p>
                </div>

                {/* Lesson Content */}
                <Card>
                  <CardContent className="p-6">
                    {currentLesson.content_type === 'video' && currentLesson.content_url ? (
                      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">Video Player</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {currentLesson.content_url}
                          </p>
                        </div>
                      </div>
                    ) : currentLesson.content_type === 'text' ? (
                      <div className="prose max-w-none">
                        <h3>Lesson Content</h3>
                        <p>
                          This is a text-based lesson. In a real implementation, this would contain
                          the actual lesson content, including text, images, code examples, and more.
                        </p>
                        <h4>Key Points:</h4>
                        <ul>
                          <li>Understanding the core concepts</li>
                          <li>Practical applications</li>
                          <li>Best practices and tips</li>
                          <li>Common mistakes to avoid</li>
                        </ul>
                      </div>
                    ) : currentLesson.content_type === 'quiz' ? (
                      <div className="text-center py-12">
                        <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Quiz Coming Soon
                        </h3>
                        <p className="text-gray-600">
                          Quiz functionality will be added in Phase 3
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p>Interactive content will be displayed here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lesson Actions */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={goToPreviousLesson}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous Lesson
                  </Button>

                  <div className="flex gap-3">
                    {!currentLesson.completed && (
                      <Button
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        onClick={() => markLessonComplete(currentLesson.id)}
                        disabled={marking}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {marking ? 'Marking...' : 'Mark as Complete'}
                      </Button>
                    )}

                    <Button
                      onClick={goToNextLesson}
                      disabled={currentIndex === lessons.length - 1}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Next Lesson
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Select a lesson to begin</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
