'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function NewThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in to create a thread');
      router.push('/auth/signin');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      // Get or create forum
      const forumRes = await fetch(`${backendUrl}/forums/course/${courseId}`);
      const forum = await forumRes.json();

      // Create thread
      const response = await fetch(`${backendUrl}/forums/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forum_id: forum.id,
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (response.ok) {
        const thread = await response.json();
        router.push(`/courses/${courseId}/forum/thread/${thread.id}`);
      } else {
        alert('Failed to create thread');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      alert('Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Thread</h1>
          <p className="text-gray-600 mt-2">Start a new discussion</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-base font-semibold">
                Thread Title *
              </Label>
              <Input
                id="title"
                placeholder="What's your question or topic?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-base font-semibold">
                Description *
              </Label>
              <textarea
                id="content"
                placeholder="Provide more details about your question or discussion topic..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-2 w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 px-8"
              >
                {loading ? 'Creating...' : 'Create Thread'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
