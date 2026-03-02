// Script temporário para visualizar clientes cadastrados
// Execute no console do navegador ou crie uma rota temporária

import { getCustomers } from './services/firebase';

export const listCustomers = async () => {
  const customers = await getCustomers();
  
  console.log('=== CLIENTES CADASTRADOS ===\n');
  
  customers.forEach((customer, index) => {
    console.log(`\n--- Cliente ${index + 1} ---`);
    console.log(`Nome: ${customer.name}`);
    console.log(`Email: ${customer.email}`);
    console.log(`Senha (hash): ${customer.password}`);
    console.log(`Telefone: ${customer.phone || 'Não informado'}`);
    console.log(`CPF/CNPJ: ${customer.cpfCnpj || 'Não informado'}`);
    if (customer.addresses && customer.addresses.length > 0) {
      const addr = customer.addresses[0];
      console.log(`Endereço: ${addr.street}, ${addr.number} - ${addr.city}/${addr.state}`);
    }
  });
  
  return customers;
};

// Para usar: listCustomers();
