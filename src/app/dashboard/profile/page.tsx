'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, supabase } from '@/lib/supabase';
import { UserOccupation, UserProfileUpdate } from '@/types/user';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import { Camera, Check, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState<UserOccupation>('doctor');
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Initialize form with user data
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setUsername(userProfile.username || '');
      setEmail(userProfile.email || '');
      setOccupation(userProfile.occupation as UserOccupation || 'doctor');
      
      // If avatar URL exists on user object
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    }
  }, [userProfile, user]);
  
  // Get user initials for the avatar
  const getUserInitials = () => {
    if (!name) return 'U';
    
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user?.id}.${fileExt}`;
    
    setUploadingAvatar(true);
    
    try {
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      if (data?.publicUrl) {
        // Update user metadata
        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: data.publicUrl }
        });
        
        if (updateError) throw updateError;
        
        setAvatarUrl(data.publicUrl);
        toast.success('Profile picture updated');
        
        // Refresh user profile to get updated data
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const updates: UserProfileUpdate = {
        name,
        username,
        email,
        occupation
      };
      
      await updateUserProfile(user.id, updates);
      await refreshUserProfile();
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError(null);
    
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // First verify the current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email || user?.email || '',
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      setPwError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setPwLoading(false);
    }
  };
  
  if (!user || !userProfile) {
    return (
      <div className="p-8">
        <div className="w-full flex justify-center">
          <div className="animate-pulse h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="animate-pulse h-8 w-48 mt-4 mx-auto bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="max-w-md mx-auto mt-8">
          <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Header with avatar */}
        <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 h-48">
          <div className="absolute -bottom-16 left-8">
            <div className="relative group">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-700 flex items-center justify-center text-3xl font-bold text-white">
                  {getUserInitials()}
                </div>
              )}
              
              <button 
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Change profile picture"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <div className="animate-spin w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                ) : (
                  <Camera size={20} />
                )}
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
        
        {/* Profile content */}
        <div className="pt-20 px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-6">Profile Information</h1>
              
              <form onSubmit={handleSubmit}>
                {formError && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center">
                      <X size={16} className="mr-2 flex-shrink-0" />
                      <p>{formError}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Occupation</label>
                    <select
                      value={occupation}
                      onChange={e => setOccupation(e.target.value as UserOccupation)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700"
                      required
                    >
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></span>
                        Saving Changes
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Check size={18} className="mr-2" />
                        Save Changes
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-6">Security</h2>
              
              <form onSubmit={handlePasswordChange}>
                {pwError && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center">
                      <X size={16} className="mr-2 flex-shrink-0" />
                      <p>{pwError}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button type="submit" disabled={pwLoading} className="w-full" variant="outline">
                    {pwLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></span>
                        Changing Password
                      </span>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 