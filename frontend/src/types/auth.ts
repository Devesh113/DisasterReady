export type UserRole = 'CITIZEN' | 'AUTHORITY' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSuccessData {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role?: 'CITIZEN';
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}
