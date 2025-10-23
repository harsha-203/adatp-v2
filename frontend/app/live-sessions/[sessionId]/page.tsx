'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, Users, Play, ArrowLeft, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface LiveSession {
  id: string;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  meeting_url: string;
  attendees_count: number;
  max_participants: number;
  recording_url?: string;
  courses?: {
    title: string;
  };
  users?: {
    full_name: string;
  };
  attendees?: Array<{
    users: {
      full_name: string;
      avatar_url?: string;
    };
  }>;
}

export default function LiveSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/live-sessions/${sessionId}`);
      const data = await response.json();
      setSession(data);
      
      // Check if user is registered
      if (user && data.attendees) {
        const registered = data.attendees.some((a: any) => a.user_id === user.id);
        setIsRegistered(registered);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    try {
      await fetch(`${backendUrl}/live-sessions/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: user.id,
        }),
      });

      setIsRegistered(true);
      loadSession();
    } catch (error) {
      console.error('Error registering:', error);
      alert('Failed to register for session');
    }
  };

  const handleJoin = () => {
    if (session?.meeting_url) {
      window.open(session.meeting_url, '_blank');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <Button onClick={() => router.push('/live-sessions')}>
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const isLive = session.status === 'live';
  const hasEnded = session.status === 'ended';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/live-sessions')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Main Card */}
        <Card className="p-8">
          {/* Status Badge */}
          <div className="mb-4">
            {isLive && (
              <Badge className="bg-red-100 text-red-800 animate-pulse">
                🔴 Live Now
              </Badge>
            )}
            {session.status === 'scheduled' && (
              <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
            )}
            {hasEnded && (
              <Badge className="bg-gray-100 text-gray-800">Ended</Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{session.title}</h1>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-6 mb-6 text-sm text-gray-600">
            {session.courses && (
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span className="font-medium">{session.courses.title}</span>
              </div>
            )}
            {session.users && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Instructor: {session.users.full_name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="prose max-w-none mb-8">
            <p className="text-gray-700 whitespace-pre-wrap">{session.description}</p>
          </div>

          {/* Schedule Details */}
          <div className="grid md:grid-cols-2 gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">Start Time</span>
              </div>
              <p className="text-gray-900 ml-7">{formatDateTime(session.scheduled_start)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">Duration</span>
              </div>
              <p className="text-gray-900 ml-7">
                {Math.round(
                  (new Date(session.scheduled_end).getTime() - 
                   new Date(session.scheduled_start).getTime()) / 60000
                )} minutes
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">Attendees</span>
              </div>
              <p className="text-gray-900 ml-7">
                {session.attendees_count} / {session.max_participants}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {isLive && (
              <Button 
                className="bg-red-600 hover:bg-red-700 text-lg px-8 py-6"
                onClick={handleJoin}
              >
                <Play className="w-5 h-5 mr-2" />
                Join Live Session
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}

            {session.status === 'scheduled' && !isRegistered && (
              <Button 
                className="bg-purple-600 hover:bg-purple-700 px-8"
                onClick={handleRegister}
              >
                Register for Session
              </Button>
            )}

            {session.status === 'scheduled' && isRegistered && (
              <div className="flex items-center gap-4">
                <Badge className="bg-green-100 text-green-800 px-4 py-2">
                  ✓ Registered
                </Badge>
                <p className="text-sm text-gray-600">
                  You'll receive a reminder before the session starts
                </p>
              </div>
            )}

            {hasEnded && session.recording_url && (
              <Button 
                variant="outline"
                onClick={() => window.open(session.recording_url, '_blank')}
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Recording
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>

        {/* Registered Attendees */}
        {session.attendees && session.attendees.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-bold mb-4">
              Registered Attendees ({session.attendees.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {session.attendees.map((attendee, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">
                      {attendee.users.full_name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{attendee.users.full_name}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
