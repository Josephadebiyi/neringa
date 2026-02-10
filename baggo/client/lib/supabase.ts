// Supabase is not used - using MongoDB backend instead
// This file is kept for compatibility but exports nothing functional

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => {},
  },
  from: () => ({
    insert: async () => ({ error: null }),
  }),
};
