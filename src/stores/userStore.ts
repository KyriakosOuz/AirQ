
import { create } from 'zustand';
import { UserProfile, UserRole } from '@/lib/types';
import { removeToken } from '@/lib/api';

type UserState = {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  setRole: (role: UserRole | null) => void;
  logout: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  role: null,
  isAdmin: false,
  isAuthenticated: false,
  
  setUser: (user) => set(() => ({ 
    user,
    isAuthenticated: !!user
  })),
  
  setToken: (token) => set(() => ({ token })),
  
  setRole: (role) => set(() => ({ 
    role,
    isAdmin: role === 'admin'
  })),
  
  logout: () => {
    removeToken();
    set({
      user: null,
      token: null,
      role: null,
      isAdmin: false,
      isAuthenticated: false
    });
  }
}));
