import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export function useAdminAuth() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const checkRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "editor"])
      .limit(1);

    if (error) {
      console.error("Failed to load admin role", error);
      return false;
    }

    return (data?.length ?? 0) > 0;
  }, []);

  useEffect(() => {
    let isActive = true;
    let initialCheckDone = false;

    // Enforce session preference saved at login time.
    // - "window": session is only valid while the tab/window is open. We mark
    //   sessionStorage on login; if it's missing on next boot, the user opened
    //   a fresh window → sign out.
    // - "24h": expire the session after 24 hours from login.
    const enforceSessionPreference = async (): Promise<boolean> => {
      const mode = localStorage.getItem("admin_session_mode");
      if (!mode) return false;

      // "window-or-24h": sign out if the tab/window was closed (sessionStorage
      // marker missing) OR if more than 24 hours have passed since login —
      // whichever comes first.
      if (mode === "window-or-24h") {
        const active = sessionStorage.getItem("admin_session_active");
        const expiresAt = Number(localStorage.getItem("admin_session_expires_at") || 0);
        const expired = expiresAt && Date.now() > expiresAt;
        if (!active || expired) {
          await supabase.auth.signOut();
          localStorage.removeItem("admin_session_mode");
          localStorage.removeItem("admin_session_expires_at");
          sessionStorage.removeItem("admin_session_active");
          return true;
        }
      }
      return false;
    };

    const syncAuthState = async (session: Session | null, isInitial: boolean) => {
      const currentUser = session?.user ?? null;

      if (!isActive) return;

      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Only show loading spinner on the very first check.
      // Subsequent checks (e.g. TOKEN_REFRESHED on tab switch) should NOT
      // set loading=true because that unmounts the admin content and loses form state.
      if (isInitial) {
        setLoading(true);
      }

      const hasRole = await checkRole(currentUser.id);

      if (!isActive) return;

      setIsAdmin(hasRole);
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAuthState(session, !initialCheckDone);
      initialCheckDone = true;
    });

    void (async () => {
      const signedOut = await enforceSessionPreference();
      if (signedOut) {
        if (!isActive) return;
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        initialCheckDone = true;
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      void syncAuthState(session, true);
      initialCheckDone = true;
    })();

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [checkRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("admin_session_mode");
    localStorage.removeItem("admin_session_expires_at");
    sessionStorage.removeItem("admin_session_active");
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
  };

  return { user, loading, isAdmin, signIn, signOut };
}
