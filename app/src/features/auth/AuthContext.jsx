import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../shared/services/supabase.js';
import { cleanAuthTokensFromUrl, extractAuthErrorFromHash, getGoogleOAuthOptions } from './oauth.js';
import { AuthStateContext } from './useAuth.js';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState('');
  const userId = session?.user?.id;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    if (typeof window !== 'undefined') {
      const hashError = extractAuthErrorFromHash(window.location.hash);
      if (hashError) setError(decodeURIComponent(hashError));
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session ?? null);
      if (data.session) cleanAuthTokensFromUrl();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setOrganizationId(null);
      } else {
        cleanAuthTokensFromUrl();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return undefined;
    let cancelled = false;

    const loadOrganization = async () => {
      setLoading(true);
      setError('');
      const { data, error: bootstrapError } = await supabase.rpc('bootstrap_organization', {
        p_name: 'NutrIsa',
      });
      if (cancelled) return;
      if (bootstrapError) {
        setError(bootstrapError.message);
        setOrganizationId(null);
      } else {
        setOrganizationId(data);
      }
      setLoading(false);
    };

    loadOrganization();
    return () => { cancelled = true; };
  }, [userId]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    organizationId,
    loading,
    error,
    configured: isSupabaseConfigured,
    signIn: async (email, password) => {
      setError('');
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    },
    signInWithGoogle: async () => {
      setError('');
      const { error: signInError } = await supabase.auth.signInWithOAuth(getGoogleOAuthOptions());
      if (signInError) throw signInError;
    },
    sendMagicLink: async (email) => {
      setError('');
      const { error: linkError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
      });
      if (linkError) throw linkError;
    },
    signOut: () => supabase?.auth.signOut(),
  }), [session, organizationId, loading, error]);

  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}
