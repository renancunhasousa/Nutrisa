import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../shared/services/supabase.js';
import { cleanAuthTokensFromUrl, extractAuthErrorFromHash, getGoogleOAuthOptions } from './oauth.js';
import { AuthStateContext } from './useAuth.js';
import { hasModulePermission } from './permissions.js';
import { getCurrentMembership, joinOrganizationWithInviteCode, updateMyClinicProfile, uploadUserAvatar, createClinicOrganization } from './services/teamService.js';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [currentMember, setCurrentMember] = useState(null);
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
        setCurrentMember(null);
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

      try {
        // 1. Verifica se há criação pendente de nova clínica (sign up)
        const pendingNewClinic = localStorage.getItem('nutrisa_pending_new_clinic');
        if (pendingNewClinic) {
          try {
            const parsed = JSON.parse(pendingNewClinic);
            const newOrgId = await createClinicOrganization(parsed);
            localStorage.removeItem('nutrisa_pending_new_clinic');
            if (cancelled) return;
            setOrganizationId(newOrgId);
            setCurrentMember(await getCurrentMembership());
            setLoading(false);
            return;
          } catch (createErr) {
            localStorage.removeItem('nutrisa_pending_new_clinic');
            console.warn('Erro ao criar clínica pendente:', createErr);
          }
        }

        // 2. Verifica se há convite pendente com código
        const pendingCode = localStorage.getItem('nutrisa_pending_invite_code');
        if (pendingCode) {
          try {
            const matchedOrg = await joinOrganizationWithInviteCode(pendingCode);
            localStorage.removeItem('nutrisa_pending_invite_code');
            if (cancelled) return;
            setOrganizationId(matchedOrg);
            setCurrentMember(await getCurrentMembership());
            setLoading(false);
            return;
          } catch (inviteError) {
            localStorage.removeItem('nutrisa_pending_invite_code');
            setError(inviteError.message);
          }
        }
      } catch {
        // ignora se localStorage não estiver disponível
      }

      // 3. Carrega a organização do usuário via bootstrap/membership existente
      const { data, error: bootstrapError } = await supabase.rpc('bootstrap_organization', {
        p_name: 'NutrIsa',
      });
      if (cancelled) return;
      if (bootstrapError) {
        setError(bootstrapError.message);
        setOrganizationId(null);
      } else if (data) {
        setOrganizationId(data);
        setCurrentMember(await getCurrentMembership());
      } else {
        // Usuário novo autenticado mas ainda sem clínica associada
        const metaClinicName = session?.user?.user_metadata?.clinic_name;
        const metaFullName = session?.user?.user_metadata?.full_name;
        const metaCrn = session?.user?.user_metadata?.crn || '';
        if (metaClinicName) {
          try {
            const newOrgId = await createClinicOrganization({
              clinicName: metaClinicName,
              professionalName: metaFullName,
              crn: metaCrn,
            });
            if (cancelled) return;
            setOrganizationId(newOrgId);
            setCurrentMember(await getCurrentMembership());
            setLoading(false);
            return;
          } catch (createErr) {
            console.warn('Erro ao criar clínica a partir dos metadados:', createErr);
          }
        }

        const member = await getCurrentMembership();
        if (member?.organization_id) {
          setOrganizationId(member.organization_id);
          setCurrentMember(member);
        } else {
          setOrganizationId(null);
          setCurrentMember(null);
        }
      }
      setLoading(false);
    };

    loadOrganization().catch((loadError) => {
      if (cancelled) return;
      setError(loadError?.message || 'Não foi possível carregar as permissões da clínica.');
      setOrganizationId(null);
      setCurrentMember(null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId, session]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    organizationId,
    currentMember,
    isOwner: Boolean(currentMember?.isOwner),
    canAccessModule: (moduleId) => hasModulePermission(currentMember, moduleId),
    loading,
    error,
    configured: isSupabaseConfigured,
    updateProfile: async ({ displayName, avatarUrl }) => {
      const updated = await updateMyClinicProfile({ displayName, avatarUrl });
      if (updated) {
        setCurrentMember(updated);
      }
      return updated;
    },
    uploadAvatar: async (file) => {
      if (!userId) throw new Error('Usuário não autenticado.');
      return await uploadUserAvatar(userId, file);
    },
    signIn: async (email, password) => {
      setError('');
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    },
    signUp: async (email, password, { fullName, clinicName, crn }) => {
      setError('');
      try {
        localStorage.setItem('nutrisa_pending_new_clinic', JSON.stringify({
          clinicName,
          professionalName: fullName,
          crn,
        }));
      } catch {
        // ignora se localStorage indisponível
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            clinic_name: clinicName,
            crn,
          },
        },
      });
      if (signUpError) {
        try { localStorage.removeItem('nutrisa_pending_new_clinic'); } catch {}
        throw signUpError;
      }
      return data;
    },
    createClinic: async ({ clinicName, professionalName, crn }) => {
      setError('');
      const newOrgId = await createClinicOrganization({ clinicName, professionalName, crn });
      setOrganizationId(newOrgId);
      setCurrentMember(await getCurrentMembership());
      return newOrgId;
    },
    signInWithGoogle: async (newClinicPayload = null) => {
      setError('');
      if (newClinicPayload) {
        try {
          localStorage.setItem('nutrisa_pending_new_clinic', JSON.stringify(newClinicPayload));
        } catch {}
      }
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
    joinWithInviteCode: async (inviteCode) => {
      const orgId = await joinOrganizationWithInviteCode(inviteCode);
      setOrganizationId(orgId);
      setCurrentMember(await getCurrentMembership());
      return orgId;
    },
    signOut: () => supabase?.auth.signOut(),
  }), [session, organizationId, currentMember, loading, error, userId]);

  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}

