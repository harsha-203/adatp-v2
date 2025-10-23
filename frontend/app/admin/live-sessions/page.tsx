'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Video, Plus, Calendar, Edit, Trash2, Play, StopCircle, XCircle, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Course {
  id: string;
  title: string;
}

interface LiveSession {
  id: string;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  meeting_url?: string;
  attendees_count?: number;
  courses?: {
    title: string;
  };
}

export default function AdminLiveSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    scheduled_start: '',
    duration_minutes: 60,
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    loadSessions();
    loadCourses();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/live-sessions`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch(`${backendUrl}/admin/courses/management`);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const response = await fetch(`${backendUrl}/live-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          instructor_id: user.id,
        }),
      });

      if (response.ok) {
        alert('Live session created successfully!');
        setShowForm(false);
        setFormData({
          course_id: '',
          title: '',
          description: '',
          scheduled_start: '',
          duration_minutes: 60,
        });
        loadSessions();
      } else {
        alert('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${backendUrl}/live-sessions/${sessionId}/start`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Session started!');
        loadSessions();
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${backendUrl}/live-sessions/${sessionId}/end`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Session ended!');
        loadSessions();
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;

    try {
      const response = await fetch(`${backendUrl}/live-sessions/${sessionId}/cancel`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Session cancelled!');
        loadSessions();
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled' },
      live: { color: 'bg-red-100 text-red-800', text: '🔴 Live' },
      ended: { color: 'bg-gray-100 text-gray-800', text: 'Ended' },
      cancelled: { color: 'bg-gray-100 text-gray-600', text: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Sessions Management</h1>
            <p className="text-gray-600">Create and manage live video sessions for your courses</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Session
          </Button>
        </div>

        {/* Create Session Form */}
        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Create New Live Session</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Course Selection */}
                <div>
                  <Label htmlFor="course">Course *</Label>
                  <select
                    id="course"
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1"
                    required
                  >
                    <option value="">Select a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="240"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Session Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Introduction to React Hooks"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what will be covered in this session..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1 min-h-[100px]"
                  required
                />
              </div>

              {/* Scheduled Start */}
              <div>
                <Label htmlFor="scheduled_start">Scheduled Start Time *</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Create Session
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      course_id: '',
                      title: '',
                      description: '',
                      scheduled_start: '',
                      duration_minutes: 60,
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Sessions List */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No sessions yet</h3>
            <p className="text-gray-600 mb-4">Create your first live session to get started</p>
            <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(session.status)}
                      {session.courses && (
                        <Badge variant="outline">{session.courses.title}</Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {session.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {session.description}
                    </p>

                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(session.scheduled_start)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        <span>{session.duration_minutes} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{session.attendees_count || 0} registered</span>
                      </div>
                    </div>

                    {session.meeting_url && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Meeting URL:</p>
                        <a
                          href={session.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {session.meeting_url}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-6">
                    {session.status === 'scheduled' && (
                      <>
                        <Button
                          onClick={() => handleStartSession(session.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                        <Button
                          onClick={() => handleCancelSession(session.id)}
                          variant="outline"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {session.status === 'live' && (
                      <Button
                        onClick={() => handleEndSession(session.id)}
                        className="bg-red-600 hover:bg-red-700"
                        size="sm"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        End Session
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
