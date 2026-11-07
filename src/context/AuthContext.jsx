import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        let msg = error.message || "Invalid credentials";
        if (msg.toLowerCase().includes("invalid login credentials")) {
          msg = "Invalid login credentials. Please check email/password, or verify the user is 'Confirmed' in Supabase Dashboard.";
        }
        return { success: false, error: msg };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || "Network error logging in" };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (err) {
      console.error("SignOut error:", err);
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    if (!session || !session.user) {
      return { success: false, error: "No active session" };
    }
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword
      });

      if (signInError) {
        return { success: false, error: "Current password is incorrect." };
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return { success: false, error: updateError.message || "Could not update password." };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "An error occurred." };
    }
  };

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: !!session, loading, login, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
