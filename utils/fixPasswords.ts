// Script para adicionar senha padrão aos clientes sem senha
// Execute no console: fixCustomersPassword()

import { getCustomers, saveCustomer } from '../services/firebase';
import { hashPassword } from '../utils/crypto';

export const fixCustomersPassword = async () => {
  const customers = await getCustomers();
  const DEFAULT_PASSWORD = '123456'; // Senha padrão
  
  let fixed = 0;
  
  for (const customer of customers) {
    if (!customer.password || customer.password === 'undefined') {
      console.log(`Adicionando senha para: ${customer.email}`);
      customer.password = await hashPassword(DEFAULT_PASSWORD);
      await saveCustomer(customer);
      fixed++;
    }
  }
  
  console.log(`\n✅ ${fixed} clientes atualizados com senha padrão: ${DEFAULT_PASSWORD}`);
  console.log('Agora todos podem fazer login com a senha: 123456');
  
  return fixed;
};

// Para usar no console:
// import('../utils/fixPasswords').then(m => m.fixCustomersPassword());
