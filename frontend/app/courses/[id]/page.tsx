'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Star, Users, Award, PlayCircle, CheckCircle, MessageSquare, ShoppingCart } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { convertAndFormatPrice } from '@/lib/currency';
import axios from 'axios';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  price: number;
  instructor_name: string;
  instructor_bio: string;
  thumbnail_url: string;
  average_rating: number;
  review_count: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content_type: string;
  duration_minutes: number;
  order_index: number;
  completed?: boolean;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    loadCourseDetails();
    if (user) {
      checkEnrollment();
    }
  }, [courseId, user]);

  const loadCourseDetails = async () => {
    try {
      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Load modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          description,
          order_index,
          lessons (
            id,
            title,
            description,
            content_type,
            duration_minutes,
            order_index
          )
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Sort lessons within each module
      const sortedModules = modulesData.map((module: any) => ({
        ...module,
        lessons: (module.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)
      }));

      setModules(sortedModules);
    } catch (error) {
      console.error('Error loading course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, progress_percentage')
        .eq('user_id', user?.id)
        .eq('course_id', courseId)
        .single();

      if (!error && data) {
        setIsEnrolled(true);
        setEnrollmentId(data.id);
        setProgress(data.progress_percentage || 0);

        // Load lesson progress
        if (data.id) {
          const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('lesson_id, completed')
            .eq('enrollment_id', data.id);

          if (progressData) {
            const completedLessons = new Set(
              progressData.filter((p: any) => p.completed).map((p: any) => p.lesson_id)
            );

            // Mark lessons as completed in modules
            setModules(prev =>
              prev.map(module => ({
                ...module,
                lessons: module.lessons.map(lesson => ({
                  ...lesson,
                  completed: completedLessons.has(lesson.id)
                }))
              }))
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    setEnrolling(true);
    try {
      const response = await axios.post(`${backendUrl}/courses/${courseId}/enroll?user_id=${user.id}`);

      if (response.data.message === 'Already enrolled') {
        setIsEnrolled(true);
        setEnrollmentId(response.data.enrollment_id);
        router.push(`/courses/${courseId}/learn`);
      } else {
        setIsEnrolled(true);
        setEnrollmentId(response.data.enrollment_id);
        router.push(`/courses/${courseId}/learn`);
      }
    } catch (error: any) {
      console.error('Error enrolling:', error);
      alert('Error enrolling in course: ' + (error.response?.data?.detail || error.message));
    } finally {
      setEnrolling(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    setAddingToCart(true);
    try {
      const response = await fetch(`${backendUrl}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          course_id: courseId,
        }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      // Show success and redirect to cart
      alert('Course added to cart!');
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add course to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const totalDuration = modules.reduce(
    (acc, module) =>
      acc + module.lessons.reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
          <Button asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Edubox</span>
          </Link>
          <div className="flex gap-4">
            {user ? (
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Course Hero */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
                  {course.category}
                </span>
                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
                  {course.difficulty}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-white/90 mb-6">{course.description}</p>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{course.average_rating.toFixed(1)}</span>
                  <span className="text-white/80">({course.review_count} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>10,000+ students</span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm mb-8">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m total</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{totalLessons} lessons</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isEnrolled ? (
                  <>
                    <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
                      <Link href={`/courses/${courseId}/learn`}>
                        <PlayCircle className="w-5 h-5 mr-2" />
                        Continue Learning
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur text-white border-white hover:bg-white/20">
                      <Link href={`/courses/${courseId}/forum`}>
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Discussion Forum
                      </Link>
                    </Button>
                    <div className="text-white/90">
                      <span className="text-sm">Your progress: {progress}%</span>
                      <Progress value={progress} className="h-2 w-32 bg-white/20" />
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="bg-white text-teal-600 hover:bg-gray-100"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? 'Enrolling...' : `Enroll Now - ${convertAndFormatPrice(course.price)}`}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-teal-500/20 backdrop-blur text-white border-white hover:bg-teal-500/30"
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </Button>
                    <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur text-white border-white hover:bg-white/20">
                      <Link href={`/courses/${courseId}/forum`}>
                        <MessageSquare className="w-5 h-5 mr-2" />
                        View Forum
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="relative h-80 bg-white/10 backdrop-blur rounded-lg overflow-hidden">
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Curriculum */}
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {modules.map((module, index) => (
                    <AccordionItem key={module.id} value={`module-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Module {module.order_index}: {module.title}
                          </h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {module.lessons.length} lessons •{' '}
                            {module.lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)} min
                          </p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-4">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between py-3 border-b last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                {lesson.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : lesson.content_type === 'video' ? (
                                  <PlayCircle className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <BookOpen className="w-5 h-5 text-gray-400" />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {lessonIndex + 1}. {lesson.title}
                                  </p>
                                  <p className="text-sm text-gray-600">{lesson.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>{lesson.duration_minutes} min</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* What You'll Learn */}
            <Card>
              <CardHeader>
                <CardTitle>What You'll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Master the fundamentals and core concepts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Apply knowledge through practical exercises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Complete real-world projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Earn a certificate of completion</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Card */}
            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {course.instructor_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{course.instructor_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{course.instructor_bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Features */}
            <Card>
              <CardHeader>
                <CardTitle>This course includes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-teal-600" />
                    <span>{Math.floor(totalDuration / 60)} hours on-demand video</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <span>{totalLessons} lessons</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-600" />
                    <span>Certificate of completion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>Lifetime access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
