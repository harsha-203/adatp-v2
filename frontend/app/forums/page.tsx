'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Users, Clock, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ForumData {
  course_id: string;
  course_title: string;
  thread_count: number;
  latest_activity: string;
  category: string;
}

export default function ForumsPage() {
  const { user } = useAuth();
  const [forums, setForums] = useState<ForumData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (user) {
      loadForums();
    }
  }, [user]);

  const loadForums = async () => {
    try {
      // Get all courses the user is enrolled in
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          course:courses (
            id,
            title,
            category
          )
        `)
        .eq('user_id', user?.id);

      if (enrollError) throw enrollError;

      // Get thread counts for each course
      const forumsData: ForumData[] = [];
      
      for (const enrollment of enrollments || []) {
        const courseId = enrollment.course_id;
        const course = enrollment.course as any;

        // Get thread count
        const { count: threadCount } = await supabase
          .from('forum_threads')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', courseId);

        // Get latest activity
        const { data: latestThread } = await supabase
          .from('forum_threads')
          .select('created_at')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        forumsData.push({
          course_id: courseId,
          course_title: course?.title || 'Unknown Course',
          thread_count: threadCount || 0,
          latest_activity: latestThread?.created_at || new Date().toISOString(),
          category: course?.category || 'General',
        });
      }

      setForums(forumsData);
    } catch (error) {
      console.error('Error loading forums:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredForums = forums.filter((forum) => {
    const matchesSearch = forum.course_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || forum.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(forums.map(f => f.category))];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discussion Forums</h1>
        <p className="text-gray-600">Join conversations and connect with fellow learners</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search forums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Forums Grid */}
      {filteredForums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredForums.map((forum) => (
            <Card key={forum.course_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{forum.course_title}</CardTitle>
                    <CardDescription>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        {forum.category}
                      </span>
                    </CardDescription>
                  </div>
                  <MessageSquare className="w-6 h-6 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      <span>{forum.thread_count} discussions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(forum.latest_activity).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                    <Link href={`/courses/${forum.course_id}/forum`}>
                      View Forum
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Forums Available</h3>
            <p className="text-gray-600 mb-6">
              {forums.length === 0
                ? 'Enroll in courses to access their discussion forums'
                : 'No forums match your search criteria'}
            </p>
            {forums.length === 0 && (
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/courses">Browse Courses</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Section */}
      {forums.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Forums</p>
                  <p className="text-2xl font-bold text-gray-900">{forums.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Discussions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {forums.reduce((sum, f) => sum + f.thread_count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Forums</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {forums.filter(f => f.thread_count > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
