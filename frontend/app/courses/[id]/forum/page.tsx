'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, ThumbsUp, Eye, Search, Plus, TrendingUp, Clock, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Thread {
  id: string;
  title: string;
  content: string;
  user: {
    full_name: string;
    avatar_url?: string;
  };
  views_count: number;
  replies_count: number;
  upvotes_count: number;
  is_pinned: boolean;
  has_best_answer: boolean;
  created_at: string;
}

export default function CourseForumPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [forum, setForum] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    loadForum();
  }, [courseId, sortBy]);

  const loadForum = async () => {
    try {
      setLoading(true);
      
      // Get or create forum
      const forumRes = await fetch(`${backendUrl}/forums/course/${courseId}`);
      const forumData = await forumRes.json();
      setForum(forumData);

      // Get threads
      const threadsRes = await fetch(`${backendUrl}/forums/${forumData.id}/threads?sort_by=${sortBy}`);
      const threadsData = await threadsRes.json();
      setThreads(threadsData);
    } catch (error) {
      console.error('Error loading forum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !forum) return;
    
    try {
      const res = await fetch(`${backendUrl}/forums/${forum.id}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setThreads(data);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Discussion Forum</h1>
              <p className="text-gray-600">{forum?.description}</p>
            </div>
            <Button 
              onClick={() => router.push(`/courses/${courseId}/forum/new`)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Thread
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{forum?.threads_count || 0} Threads</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>{forum?.posts_count || 0} Posts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Search and Sort */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Tabs value={sortBy} onValueChange={setSortBy}>
            <TabsList>
              <TabsTrigger value="recent">
                <Clock className="w-4 h-4 mr-2" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="popular">
                <TrendingUp className="w-4 h-4 mr-2" />
                Popular
              </TabsTrigger>
              <TabsTrigger value="most_replied">
                <MessageSquare className="w-4 h-4 mr-2" />
                Most Replies
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Threads List */}
        <div className="space-y-4">
          {threads.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">No discussions yet</h3>
              <p className="text-gray-600 mb-4">Be the first to start a discussion!</p>
              <Button 
                onClick={() => router.push(`/courses/${courseId}/forum/new`)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Thread
              </Button>
            </Card>
          ) : (
            threads.map((thread) => (
              <Card 
                key={thread.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/courses/${courseId}/forum/thread/${thread.id}`)}
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-600 font-semibold text-lg">
                        {thread.user?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {thread.is_pinned && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Pinned
                            </Badge>
                          )}
                          {thread.has_best_answer && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Solved
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {thread.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {thread.content}
                        </p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-6 text-sm text-gray-500 mt-3">
                      <span className="font-medium text-gray-700">
                        {thread.user?.full_name || 'Anonymous'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{thread.views_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{thread.replies_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{thread.upvotes_count}</span>
                      </div>
                      <span className="ml-auto">{formatTimeAgo(thread.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
