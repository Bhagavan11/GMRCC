import { create } from "zustand";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5000/api/auth";

export const useAuthStore = create((set) => ({
    user: null,
    isCheckingAuth: false,
    isAuthenticated: false,

    authCheck: async () => {
        set({ isCheckingAuth: true });
        try {
            const res = await fetch(`${API_BASE_URL}/auth-check`,{
  method: "GET",
  credentials: "include", // 👈 This is crucial
});
            console.log("Auth check response:", res);
            if (res.ok) {
                const data = await res.json();
                set({ user: data.user, isAuthenticated: true });
            } else {
                set({ user: null, isAuthenticated: false });
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    login: async (email, password) => {
        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                set({ user: data.user, isAuthenticated: true });
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error("Failed to connect to server.");
            return false;
        }
    },

    signup: async (username, email, password) => {
        try {
            const res = await fetch(`${API_BASE_URL}/signup`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error("Failed to connect to server.");
            return false;
        }
    },

    logout: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/logout`, { method: "POST" });
            const data = await res.json();
            if (res.ok && data.success) {
                set({ user: null, isAuthenticated: false });
                toast.success(data.message);
            } else {
                toast.error("Logout failed.");
            }
        } catch (error) {
            toast.error("Failed to connect to server.");
        }
    },
}));
