import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Validate session is still valid
      if (session) {
        validateSessionUser(session);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Validate session when it changes
      if (session && _event !== 'SIGNED_OUT') {
        validateSessionUser(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateSessionUser = async (session: Session) => {
    try {
      // Try to get the current user from Supabase
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      // If user doesn't exist or there's an error, sign out
      if (!currentUser || error) {
        console.log('Session invalid - user was deleted or session expired');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
      }
    } catch (e) {
      console.error('Error validating session:', e);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    user,
    loading,
    signOut,
  };
}
