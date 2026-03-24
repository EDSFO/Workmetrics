'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/auth-context';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: string;
  maxUsers: number;
  maxProjects: number;
  features: Record<string, boolean>;
}

interface CurrentPlan extends Plan {}

interface Limits {
  users: { current: number; max: number; remaining: number };
  projects: { current: number; max: number; remaining: number };
}

export default function BillingSettingsPage() {
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [planRes, limitsRes, plansRes] = await Promise.all([
        api.get('/tenants/plan'),
        api.get('/tenants/limits'),
        api.get('/tenants/plans'),
      ]);

      setCurrentPlan(planRes.data.plan);
      setLimits(limitsRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true);
    try {
      const response = await api.post('/billing/checkout', { planId });
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else if (response.data.error) {
        alert(response.data.error);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao processar upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await api.get('/billing/portal');
      if (response.data.portalUrl) {
        window.location.href = response.data.portalUrl;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao acessar portal');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatPrice = (price: string | number) => {
    const num = Number(price);
    return num === 0 ? 'Grátis' : `R$ ${num}/mês`;
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Ilimitado' : limit;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Planos e Cobrança</h1>

      {/* Current Plan */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Plano Atual</h2>
        {currentPlan && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{currentPlan.name}</p>
              <p className="text-gray-600">{formatPrice(currentPlan.monthlyPrice)}</p>
            </div>
            <button
              onClick={handleManageSubscription}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Gerenciar Assinatura
            </button>
          </div>
        )}
      </div>

      {/* Usage */}
      {limits && (
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Uso Atual</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Usuários</span>
                <span className="font-medium">
                  {limits.users.current} / {formatLimit(limits.users.max)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: limits.users.max === -1
                      ? '30%'
                      : `${Math.min(100, (limits.users.current / limits.users.max) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Projetos</span>
                <span className="font-medium">
                  {limits.projects.current} / {formatLimit(limits.projects.max)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: limits.projects.max === -1
                      ? '30%'
                      : `${Math.min(100, (limits.projects.current / limits.projects.max) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Planos Disponíveis</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isUpgrade = Number(plan.monthlyPrice) > Number(currentPlan?.monthlyPrice || 0);

            return (
              <div
                key={plan.id}
                className={`border rounded-lg p-4 ${isCurrentPlan ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-2xl font-bold my-2">{formatPrice(plan.monthlyPrice)}</p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>{formatLimit(plan.maxUsers)} usuários</li>
                  <li>{formatLimit(plan.maxProjects)} projetos</li>
                </ul>
                {isCurrentPlan ? (
                  <button disabled className="w-full py-2 bg-gray-300 rounded-lg cursor-not-allowed">
                    Plano Atual
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isUpgrading || !isUpgrade}
                    className={`w-full py-2 rounded-lg ${
                      isUpgrade
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isUpgrading ? 'Processando...' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}