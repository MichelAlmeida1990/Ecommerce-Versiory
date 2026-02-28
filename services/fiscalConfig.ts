import { FiscalConfig } from '../types';

const FISCAL_CONFIG_KEY = 'versiory_fiscal_config';

export const getFiscalConfig = (): FiscalConfig | null => {
  const stored = localStorage.getItem(FISCAL_CONFIG_KEY);
  if (!stored) return null;
  return JSON.parse(stored);
};

export const saveFiscalConfig = (config: FiscalConfig): void => {
  localStorage.setItem(FISCAL_CONFIG_KEY, JSON.stringify(config));
};

export const getDefaultFiscalConfig = (): FiscalConfig => ({
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: 'Versiory Store',
  inscricaoEstadual: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  codigoIbgeMunicipio: '',
  ambiente: 'homologacao',
  serie: '1',
  numeroAtual: 1
});

export const incrementNFeNumber = (): number => {
  const config = getFiscalConfig();
  if (!config) return 1;
  config.numeroAtual += 1;
  saveFiscalConfig(config);
  return config.numeroAtual;
};
