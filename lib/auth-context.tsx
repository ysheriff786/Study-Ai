'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, ExplanationStyle } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
  }) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  demoLogin: (role: UserRole) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<{
    fullName: string;
    avatarUrl: string;
    preferredExplanationStyle: ExplanationStyle;
    onboardingCompleted: boolean;
  }>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load current user from session cookie
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initSession() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (ignore) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load session:', err);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    initSession();
    return () => {
      ignore = true;
    };
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Incorrect email or password.';
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      setUser(data.user);
      return { success: true, redirectTo: data.redirect_to };
    } catch {
      const errMsg = 'We could not connect to StudyForge. Check your connection and try again.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
  }) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: data.fullName,
          email: data.email,
          password: data.password,
          confirm_password: data.confirmPassword,
          role: data.role,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        const errMsg = resData.error || 'Registration failed. Please check your details.';
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      setUser(resData.user);
      return { success: true, redirectTo: resData.redirect_to };
    } catch {
      const errMsg = 'We could not connect to StudyForge. Check your connection and try again.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const demoLogin = async (role: UserRole) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Failed to sign in to demo account.';
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      setUser(data.user);
      return { success: true, redirectTo: data.redirect_to };
    } catch {
      const errMsg = 'We could not connect to StudyForge. Check your connection and try again.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (updates: Partial<{
    fullName: string;
    avatarUrl: string;
    preferredExplanationStyle: ExplanationStyle;
    onboardingCompleted: boolean;
  }>) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          preferred_explanation_style: updates.preferredExplanationStyle,
          onboarding_completed: updates.onboardingCompleted,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update profile.' };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: data.currentPassword,
          new_password: data.newPassword,
          confirm_password: data.confirmPassword,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to update password.' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
        changePassword,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
