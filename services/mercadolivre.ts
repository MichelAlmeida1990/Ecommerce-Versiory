import { MarketplaceConfig } from '../types';

const ML_API_BASE = 'https://api.mercadolibre.com';
const AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';

/**
 * Gera a URL de autorização para o usuário clicar e vincular a conta.
 */
export const getMlAuthUrl = (appId: string, redirectUri: string) => {
  return `${AUTH_URL}?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
};

/**
 * Troca o código temporário recebido no redirect por um Access Token real.
 */
export const exchangeMlCodeForToken = async (code: string, config: NonNullable<MarketplaceConfig['mercadolivre']>) => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.appId,
    client_secret: config.clientSecret,
    code: code,
    redirect_uri: config.redirectUri
  });

  const response = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) throw new Error('Falha ao obter token do Mercado Livre');
  
  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiry: Date.now() + (data.expires_in * 1000)
  };
};

/**
 * Renova o Access Token usando o Refresh Token.
 */
export const refreshMlToken = async (config: NonNullable<MarketplaceConfig['mercadolivre']>) => {
  if (!config.refreshToken) throw new Error('Refresh Token ausente');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.appId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken
  });

  const response = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) throw new Error('Falha ao renovar token do Mercado Livre');

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiry: Date.now() + (data.expires_in * 1000)
  };
};

/**
 * Verifica e garante um token válido, renovando se necessário.
 */
const getValidAccessToken = async (): Promise<string> => {
  const savedConfig = localStorage.getItem('versiory_marketplace_config');
  if (!savedConfig) throw new Error('Configuração de marketplace não encontrada');
  
  const config: MarketplaceConfig = JSON.parse(savedConfig);
  const ml = config.mercadolivre;

  if (!ml || !ml.accessToken) throw new Error('Conta do Mercado Livre não vinculada');

  // Verifica se expira em menos de 5 minutos
  if (ml.expiry && Date.now() > (ml.expiry - 300000)) {
    const tokens = await refreshMlToken(ml);
    const updatedConfig = { ...config, mercadolivre: { ...ml, ...tokens, status: 'connected' as const } };
    localStorage.setItem('versiory_marketplace_config', JSON.stringify(updatedConfig));
    return tokens.accessToken;
  }

  return ml.accessToken;
};

/**
 * Chamada genérica à API do ML.
 */
export const callMlApi = async (endpoint: string, method: string = 'GET', body?: any) => {
  const token = await getValidAccessToken();
  const response = await fetch(`${ML_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) return response.json().then(err => { throw err; });
  return response.json();
};

/**
 * Sincroniza o estoque de um anúncio específico.
 */
export const updateMlStock = async (mlId: string, quantity: number) => {
  return callMlApi(`/items/${mlId}`, 'PUT', { available_quantity: quantity });
};