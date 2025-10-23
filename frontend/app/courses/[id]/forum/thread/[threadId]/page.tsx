'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Eye, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Post {
  id: string;
  content: string;
  user: {
    full_name: string;
    avatar_url?: string;
  };
  is_best_answer: boolean;
  upvotes_count: number;
  created_at: string;
}

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
  posts: Post[];
}

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    loadThread();
  }, [threadId]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/forums/threads/${threadId}`);
      const data = await res.json();
      setThread(data);
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 'thread' | 'post', id: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      await fetch(`${backendUrl}/forums/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          votable_type: type,
          votable_id: id,
          vote_type: voteType,
        }),
      });
      
      loadThread(); // Reload to get updated counts
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in to reply');
      router.push('/auth/signin');
      return;
    }

    if (!replyContent.trim()) {
      alert('Please enter a reply');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${backendUrl}/forums/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: threadId,
          user_id: user.id,
          content: replyContent.trim(),
        }),
      });

      if (response.ok) {
        setReplyContent('');
        loadThread();
      } else {
        alert('Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkBestAnswer = async (postId: string) => {
    if (!user) return;

    try {
      await fetch(`${backendUrl}/forums/posts/${postId}/best-answer?thread_id=${threadId}`, {
        method: 'PUT',
      });
      loadThread();
    } catch (error) {
      console.error('Error marking best answer:', error);
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
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Thread not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/courses/${courseId}/forum`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Main Thread */}
        <Card className="p-8 mb-6">
          <div className="flex gap-2 mb-4">
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

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{thread.title}</h1>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-teal-600 font-semibold">
                  {thread.user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="font-medium text-gray-900">{thread.user?.full_name || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{thread.views_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{thread.replies_count} replies</span>
            </div>
            <span className="ml-auto">{formatTimeAgo(thread.created_at)}</span>
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{thread.content}</p>
          </div>

          {/* Thread Voting */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('thread', thread.id, 'upvote')}
                className="hover:bg-green-50 hover:text-green-600"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                {thread.upvotes_count}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('thread', thread.id, 'downvote')}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Replies */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {thread.replies_count} {thread.replies_count === 1 ? 'Reply' : 'Replies'}
          </h2>
          
          <div className="space-y-4">
            {thread.posts?.map((post) => (
              <Card key={post.id} className={`p-6 ${post.is_best_answer ? 'border-2 border-green-500' : ''}`}>
                {post.is_best_answer && (
                  <div className="flex items-center gap-2 mb-4 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Best Answer</span>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-600 font-semibold">
                        {post.user?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {post.user?.full_name || 'Anonymous'}
                      </span>
                      <span className="text-sm text-gray-500">{formatTimeAgo(post.created_at)}</span>
                    </div>

                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote('post', post.id, 'upvote')}
                          className="hover:bg-green-50 hover:text-green-600"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {post.upvotes_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote('post', post.id, 'downvote')}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </div>

                      {!thread.has_best_answer && !post.is_best_answer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkBestAnswer(post.id)}
                          className="ml-auto text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Mark as Best Answer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Reply Form */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Post Your Reply</h3>
          <form onSubmit={handleReply}>
            <Label htmlFor="reply" className="text-base mb-2 block">
              Your Answer
            </Label>
            <textarea
              id="reply"
              placeholder="Share your thoughts or solution..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
              required
            />
            <Button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
