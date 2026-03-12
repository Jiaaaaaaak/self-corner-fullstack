import { create } from "zustand";

interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
}

interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoggedIn: false,
    setUser: (user) => set({ user, isLoggedIn: !!user }),
    logout: () => set({ user: null, isLoggedIn: false }),
}));