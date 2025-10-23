'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Sparkles, Code, Palette, TrendingUp, DollarSign, Camera, Globe, Briefcase, BookOpen, Upload, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const topics = [
  { name: 'Web Development', icon: Code, color: 'bg-blue-100 text-blue-600' },
  { name: 'Mobile Development', icon: Code, color: 'bg-purple-100 text-purple-600' },
  { name: 'Data Science', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  { name: 'Machine Learning', icon: Sparkles, color: 'bg-pink-100 text-pink-600' },
  { name: 'Design', icon: Palette, color: 'bg-orange-100 text-orange-600' },
  { name: 'Marketing', icon: Globe, color: 'bg-red-100 text-red-600' },
  { name: 'Business', icon: Briefcase, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Finance', icon: DollarSign, color: 'bg-teal-100 text-teal-600' },
  { name: 'Language Learning', icon: BookOpen, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Photography', icon: Camera, color: 'bg-gray-100 text-gray-600' },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [institution, setInstitution] = useState('');
  const [about, setAbout] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let avatarUrl = '';

      // Upload profile photo if selected
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, profilePhoto);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(filePath);
          avatarUrl = urlData.publicUrl;
        }
      }

      await supabase
        .from('users')
        .update({
          full_name: fullName,
          student_id: studentId,
          institution: institution,
          about: about,
          interests: selectedTopics,
          avatar_url: avatarUrl || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full">
        <CardContent className="p-8">
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Edubox! 🎓</h1>
                <p className="text-gray-600">Let's set up your profile to personalize your learning journey</p>
              </div>

              <div className="space-y-6">
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center">
                  <Label className="mb-2">Profile Photo (Optional)</Label>
                  <div className="relative">
                    <Avatar className="w-24 h-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <AvatarImage src={photoPreview} />
                      <AvatarFallback className="bg-teal-100">
                        <User className="w-12 h-12 text-teal-600" />
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">Max file size: 5MB (JPG, PNG, WebP)</p>
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="studentId">Student ID (Optional)</Label>
                  <Input
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g., STU-2024-001"
                  />
                </div>

                <div>
                  <Label htmlFor="institution">Institution / Organization</Label>
                  <Input
                    id="institution"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g., University of California"
                  />
                </div>

                <div>
                  <Label htmlFor="about">About You</Label>
                  <textarea
                    id="about"
                    className="w-full border rounded-md p-2 min-h-[100px]"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Tell us a bit about yourself and your learning goals..."
                  />
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!fullName}
                  className="w-full bg-teal-600 hover:bg-teal-700 mt-6"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Interests</h1>
                <p className="text-gray-600">Select topics you'd like to learn about (select at least 3)</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {topics.map((topic) => {
                  const Icon = topic.icon;
                  const isSelected = selectedTopics.includes(topic.name);
                  return (
                    <button
                      key={topic.name}
                      onClick={() => toggleTopic(topic.name)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      <div className={`${topic.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-teal-600 mx-auto mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedTopics.length < 3 || loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
