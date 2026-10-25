import React from 'react';
import { usePlanAccess } from '../hooks/usePlanAccess';

interface PlanGuardProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PlanGuard: React.FC<PlanGuardProps> = ({ module, children, fallback }) => {
  const planAccess = usePlanAccess();

  if (!planAccess.hasModule(module)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Recurso não disponível no seu plano</h3>
        <p className="text-gray-600 mb-4">
          Este recurso está disponível apenas em planos superiores.
        </p>
        <button
          onClick={() => window.alert('Em breve: tela de upgrade de plano')}
          className="bg-versiory-coral text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition"
        >
          Fazer Upgrade
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default PlanGuard;
