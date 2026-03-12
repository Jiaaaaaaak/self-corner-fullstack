import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id?: string;
    name?: string;
    email?: string;
    [key: string]: any;
}

interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
    sessionUuid: string | null;
    setUser: (user: User | null) => void;
    clearUser: () => void;
    setSessionUuid: (uuid: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoggedIn: false,
            sessionUuid: null,

            setUser: (user) => set({ user, isLoggedIn: !!user }),
            clearUser: () => set({ user: null, isLoggedIn: false }),
            setSessionUuid: (sessionUuid) => set({ sessionUuid }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
