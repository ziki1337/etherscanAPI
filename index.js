import axios from 'axios';

const BASE_URL = 'https://api.etherscan.io/api';

async function fetchEtherscanBlocks(apiKey) {
  const results = {};

  try {
    //Текущий номер блока
    const response = await axios.get(`${BASE_URL}?module=proxy&action=eth_blockNumber&apiKey=${apiKey}`);
    const hexBlockNumber = response.data.result;
    let decimalBlockNumber = parseInt(hexBlockNumber, 16);

    //Проходимся 100 раз
    for (let i = 0; i < 100; i++) {
      const currentHexTag = `0x${decimalBlockNumber.toString(16)}`;
      
      const blockResponse = await axios.get(`${BASE_URL}?module=proxy&action=eth_getBlockByNumber&tag=${currentHexTag}&boolean=true&apiKey=${apiKey}`);
      results[currentHexTag] = blockResponse.data;

      decimalBlockNumber--;

      if ((i + 1) % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Задержка 2 секунды, т.к. апишка в бесплатной версии дает делать только 5 запросов в секунду
      }
    }
  } catch (error) {
    console.error(error)
  }

  return results;
}

// Функция для вычисления изменения баланса
export async function calculateBalanceChanges(apiKey) {
    const results = await fetchEtherscanBlocks(apiKey); // Получаем данные о блоках
    const balanceChanges = {};
  
    // Обрабатываем все транзакции
    for (const blockHash in results) {
      const block = results[blockHash];
      const transactions = block.result.transactions || [];
  
      transactions.forEach(tx => {
  
        if (tx.to && tx.from && tx.value !== '0x0') {
          const fromAddress = tx.from.toLowerCase();
          const toAddress = tx.to.toLowerCase();
          const valueInDecimal = parseInt(tx.value, 16);
  
          console.log(`Транзакция от ${fromAddress} к ${toAddress} на сумму ${valueInDecimal} единиц`);
  
          if (!balanceChanges[fromAddress]) {
            balanceChanges[fromAddress] = 0;
          }
          balanceChanges[fromAddress] -= valueInDecimal;
  
          // Учитываем входящий баланс для получателя
          if (!balanceChanges[toAddress]) {
            balanceChanges[toAddress] = 0;
          }
          balanceChanges[toAddress] += valueInDecimal; // увеличение баланса, так как это получение
        }
      });
    }
  
    // Находим адрес с максимальным изменением баланса
    let maxChange = 0;
    let maxAddress = '';
  
    for (const address in balanceChanges) {
      const change = Math.abs(balanceChanges[address]);
      if (change > maxChange) {
        maxChange = change;
        maxAddress = address;
      }
    }
  
    return { address: maxAddress, value: maxChange };
}

// calculateBalanceChanges().then(result => {
//   console.log('Адрес с наибольшим изменением баланса:', result.address);
//   console.log('Изменение баланса:', result.value);
// });