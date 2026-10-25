import { useState, useEffect } from 'react';

export interface SubscriptionData {
  status?: 'pending' | 'active' | 'expired' | 'cancelled';
  expiresAt?: string | null;
  planId?: string;
}

export interface UserWithPlan {
  planId?: string;
  email?: string;
}

export const usePlanAccess = () => {
  const [user, setUser] = useState<UserWithPlan | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const lastUser = localStorage.getItem('versiory_last_user');
      if (lastUser) {
        const sessionData = localStorage.getItem('versiory_user_' + lastUser);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setUser({ planId: session.planId, email: session.email });
          setSubscription({
            status: session.subscriptionStatus,
            expiresAt: session.subscriptionExpiresAt,
            planId: session.planId
          });
        }
      }
    } catch (e) {
      // ignore
    }
    setLoaded(true);
  }, []);

  const isExpired = (): boolean => {
    if (!subscription?.expiresAt) return false;
    return Date.now() > new Date(subscription.expiresAt).getTime();
  };

  const hasModule = (module: string): boolean => {
    if (!loaded) return true; // ainda carregando, libera tudo
    const planId = user?.planId || subscription?.planId;
    if (!planId) return true; // sem plano, libera tudo (compatibilidade)
    if (subscription?.status !== 'active') return true; // sem assinatura ativa, libera tudo (compatibilidade)
    if (isExpired()) return true; // expirado, libera tudo (compatibilidade)
    return true; // por enquanto libera tudo ate implementar completo
  };

  const needsUpgrade = (): boolean => {
    if (!subscription) return false;
    if (subscription.status !== 'active') return true;
    if (isExpired()) return true;
    return false;
  };

  return { user, subscription, hasModule, isExpired, needsUpgrade, loaded };
};
