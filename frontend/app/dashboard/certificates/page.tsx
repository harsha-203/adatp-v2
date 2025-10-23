'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Award,
  Download,
  Share2,
  Calendar,
  CheckCircle,
  FileText
} from 'lucide-react';

interface Certificate {
  id: string;
  course_id: string;
  completed_at: string;
  certificate_issued: boolean;
  course: {
    title: string;
    category: string;
    instructor_name: string;
    thumbnail_url: string;
  };
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCertificates();
    }
  }, [user]);

  const loadCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          completed_at,
          certificate_issued,
          courses (
            title,
            category,
            instructor_name,
            thumbnail_url
          )
        `)
        .eq('user_id', user?.id)
        .eq('certificate_issued', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const formattedCertificates = data.map((cert: any) => ({
        ...cert,
        course: cert.courses
      }));

      setCertificates(formattedCertificates);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';
      const response = await fetch(`${backendUrl}/certificates/${certificateId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const handleShare = (certificate: Certificate) => {
    // TODO: Implement LinkedIn sharing
    const text = `I'm proud to share that I've completed ${certificate.course.title} on Edubox LMS!`;
    if (navigator.share) {
      navigator.share({
        title: 'Course Certificate',
        text: text,
        url: window.location.href
      });
    } else {
      alert('Share on LinkedIn: ' + text);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading certificates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
          <p className="text-gray-600">Your earned certificates and achievements</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Certificates</p>
                  <p className="text-3xl font-bold text-gray-900">{certificates.length}</p>
                </div>
                <Award className="w-10 h-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed Courses</p>
                  <p className="text-3xl font-bold text-green-600">{certificates.length}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Latest Certificate</p>
                  <p className="text-sm font-medium text-gray-900">
                    {certificates.length > 0
                      ? new Date(certificates[0].completed_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificates List */}
        {certificates.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No Certificates Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Complete a course to earn your first certificate
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <a href="/dashboard/my-courses">View My Courses</a>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Certificate Preview */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-8 text-white relative">
                  <div className="absolute top-4 right-4">
                    <Award className="w-12 h-12 text-teal-200 opacity-20" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium text-teal-100">
                        Certificate of Completion
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 line-clamp-2">
                      {certificate.course.title}
                    </h3>
                    <p className="text-teal-100 text-sm mb-4">
                      Instructor: {certificate.course.instructor_name}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(certificate.completed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Actions */}
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-medium">
                      {certificate.course.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      Certificate ID: {certificate.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDownload(certificate.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleShare(certificate)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                    onClick={() => {
                      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';
                      window.open(`${backendUrl}/certificates/${certificate.id}/download`, '_blank');
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Certificate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        {certificates.length > 0 && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Award className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Share Your Achievements
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Show the world what you've learned! Add your certificates to your LinkedIn profile,
                    include them in your resume, or share them on social media.
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      All certificates are digitally verified
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Certificates include unique verification codes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Download as PDF for easy sharing
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
