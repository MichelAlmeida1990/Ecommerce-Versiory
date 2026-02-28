import React, { useState, useEffect } from 'react';
import { FiscalConfig } from '../types';
import { getFiscalConfig, saveFiscalConfig, getDefaultFiscalConfig } from '../services/fiscalConfig';
import { validateCPFOrCNPJ } from '../utils/validators';

interface FiscalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FiscalConfigModal: React.FC<FiscalConfigModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<FiscalConfig>(getDefaultFiscalConfig());
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const stored = getFiscalConfig();
    if (stored) setConfig(stored);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (config.cnpj) {
      const validation = validateCPFOrCNPJ(config.cnpj);
      if (!validation.valid || validation.type !== 'CNPJ') {
        newErrors.push('CNPJ inválido');
      }
    }

    if (!config.razaoSocial.trim()) newErrors.push('Razão Social obrigatória');
    if (!config.cnpj.trim()) newErrors.push('CNPJ obrigatório');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    saveFiscalConfig(config);
    alert('Configurações fiscais salvas com sucesso!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-black text-gray-900">Configurações Fiscais</h3>
          <p className="text-sm text-gray-600 mt-1">Configure os dados da empresa para emissão de NF-e</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-100 border border-red-300 rounded-xl p-4">
              <p className="font-bold text-red-800 mb-2">Erros encontrados:</p>
              <ul className="list-disc list-inside text-sm text-red-700">
                {errors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-black text-gray-700 mb-2">CNPJ *</label>
              <input
                type="text"
                value={config.cnpj}
                onChange={e => setConfig({...config, cnpj: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-black text-gray-700 mb-2">Razão Social *</label>
              <input
                type="text"
                value={config.razaoSocial}
                onChange={e => setConfig({...config, razaoSocial: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-black text-gray-700 mb-2">Nome Fantasia</label>
              <input
                type="text"
                value={config.nomeFantasia}
                onChange={e => setConfig({...config, nomeFantasia: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Inscrição Estadual</label>
              <input
                type="text"
                value={config.inscricaoEstadual}
                onChange={e => setConfig({...config, inscricaoEstadual: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Código IBGE Município</label>
              <input
                type="text"
                value={config.codigoIbgeMunicipio}
                onChange={e => setConfig({...config, codigoIbgeMunicipio: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-black text-gray-700 mb-2">Endereço</label>
              <input
                type="text"
                value={config.endereco}
                onChange={e => setConfig({...config, endereco: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Cidade</label>
              <input
                type="text"
                value={config.cidade}
                onChange={e => setConfig({...config, cidade: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Estado</label>
              <input
                type="text"
                value={config.estado}
                onChange={e => setConfig({...config, estado: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">CEP</label>
              <input
                type="text"
                value={config.cep}
                onChange={e => setConfig({...config, cep: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Ambiente</label>
              <select
                value={config.ambiente}
                onChange={e => setConfig({...config, ambiente: e.target.value as 'homologacao' | 'producao'})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              >
                <option value="homologacao">Homologação</option>
                <option value="producao">Produção</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Série NF-e</label>
              <input
                type="text"
                value={config.serie}
                onChange={e => setConfig({...config, serie: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Número Atual</label>
              <input
                type="number"
                value={config.numeroAtual}
                onChange={e => setConfig({...config, numeroAtual: parseInt(e.target.value) || 1})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-3 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-3 rounded-xl transition-all"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FiscalConfigModal;
