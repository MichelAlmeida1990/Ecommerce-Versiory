import { BannerConfig } from '../types';

// REFCOM210: Configuração de banners do e-commerce
const BANNER_CONFIG_KEY = 'versiory_banner_config';
const MAX_BANNERS = 5;

export const BANNER_MAX = MAX_BANNERS;

export const getBannerConfig = (): BannerConfig | null => {
  const stored = localStorage.getItem(BANNER_CONFIG_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const saveBannerConfig = (config: BannerConfig): void => {
  localStorage.setItem(BANNER_CONFIG_KEY, JSON.stringify(config));
};

export const getDefaultBannerConfig = (): BannerConfig => ({
  mode: 'autoplay',
  banners: [],
  updatedAt: new Date().toISOString()
});

// Helper para converter arquivo em data URL (base64)
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
