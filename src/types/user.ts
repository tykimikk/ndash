export type UserOccupation = 'doctor' | 'nurse' | 'admin';

export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  username: string;
  email: string;
  occupation: UserOccupation;
}

export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type UserProfileUpdate = Partial<UserProfileInsert>; 