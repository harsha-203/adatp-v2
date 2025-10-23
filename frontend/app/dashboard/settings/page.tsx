'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Building,
  FileText,
  Bell,
  Lock,
  Globe,
  Save,
  CheckCircle,
  Camera,
  IdCard
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    student_id: '',
    institution: '',
    about: '',
    avatar_url: ''
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
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

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          student_id: data.student_id || '',
          institution: data.institution || '',
          about: data.about || '',
          avatar_url: data.avatar_url || ''
        });
        if (data.avatar_url) {
          setPhotoPreview(data.avatar_url);
        }
      } else {
        setProfile({
          full_name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          student_id: '',
          institution: '',
          about: '',
          avatar_url: ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile({
        full_name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        student_id: '',
        institution: '',
        about: '',
        avatar_url: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = profile.avatar_url;

      // Upload profile photo if changed
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
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

      const { error } = await supabase
        .from('users')
        .upsert([
          {
            id: user?.id,
            email: profile.email,
            full_name: profile.full_name,
            student_id: profile.student_id,
            institution: profile.institution,
            about: profile.about,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Error saving profile. Please try again.');
      } else {
        setSaved(true);
        setProfilePhoto(null);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center pb-6 border-b">
              <Label className="mb-3">Profile Photo</Label>
              <div className="relative">
                <Avatar className="w-32 h-32 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <AvatarImage src={photoPreview} />
                  <AvatarFallback className="bg-teal-100 text-2xl">
                    <User className="w-16 h-16 text-teal-600" />
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-3">Click to upload a new photo (Max 5MB)</p>
              {profilePhoto && (
                <p className="text-sm text-teal-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  New photo selected
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="full_name" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="student_id" className="flex items-center gap-2 mb-2">
                  <IdCard className="w-4 h-4" />
                  Student ID
                </Label>
                <Input
                  id="student_id"
                  value={profile.student_id}
                  onChange={(e) => handleChange('student_id', e.target.value)}
                  placeholder="e.g., STU-2024-001"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="institution" className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4" />
                  Institution / Organization
                </Label>
                <Input
                  id="institution"
                  value={profile.institution}
                  onChange={(e) => handleChange('institution', e.target.value)}
                  placeholder="Enter your institution or company"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="about" className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                About / Bio
              </Label>
              <textarea
                id="about"
                value={profile.about}
                onChange={(e) => handleChange('about', e.target.value)}
                placeholder="Tell us about yourself and your learning goals..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 min-h-[100px]"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              {saved && (
                <span className="text-sm text-green-600 font-medium">
                  Profile updated successfully!
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Course Updates</h4>
                  <p className="text-sm text-gray-600">
                    Get notified about new lessons and course updates
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-600"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Quiz Reminders</h4>
                  <p className="text-sm text-gray-600">
                    Receive reminders for pending quizzes
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-600"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Weekly Progress</h4>
                  <p className="text-sm text-gray-600">
                    Weekly summary of your learning progress
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-600"
                  defaultChecked
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Password</h4>
                  <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="language" className="mb-2 block">Language</Label>
                <select
                  id="language"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>

              <div>
                <Label htmlFor="timezone" className="mb-2 block">Timezone</Label>
                <select
                  id="timezone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option>UTC (GMT+0:00)</option>
                  <option>EST (GMT-5:00)</option>
                  <option>PST (GMT-8:00)</option>
                  <option>IST (GMT+5:30)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
