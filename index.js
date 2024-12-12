import axios from 'axios';

const API_KEY = '';
const BASE_URL = 'https://api.etherscan.io/api';

async function fetchEtherscanBlocks() {
  const results = {};

  try {
    //Текущий номер блока
    const response = await axios.get(`${BASE_URL}?module=proxy&action=eth_blockNumber&apiKey=${API_KEY}`);
    const hexBlockNumber = response.data.result;
    let decimalBlockNumber = parseInt(hexBlockNumber, 16);

    //Проходимся 100 раз
    for (let i = 0; i < 100; i++) {
      const currentHexTag = `0x${decimalBlockNumber.toString(16)}`;
      
      const blockResponse = await axios.get(`${BASE_URL}?module=proxy&action=eth_getBlockByNumber&tag=${currentHexTag}&boolean=true&apiKey=${API_KEY}`);
      results[currentHexTag] = blockResponse.data;

      // Уменьшаем значение блока на единицу
      decimalBlockNumber--;

      //Добавляем задержку на каждый пятый запрос
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
async function calculateBalanceChanges() {
    const results = await fetchEtherscanBlocks(); // Получаем данные о блоках
    const balanceChanges = {};
  
    //Обрабатываем все транзакции
    for (const blockHash in results) {
      const block = results[blockHash];
      const transactions = block.result.transactions || [];
  
      transactions.forEach(tx => {
        // Проверяем наличие поля to в транзакции
        if (tx.to) {
          const toAddress = tx.to.toLowerCase();
          const valueInDecimal = parseInt(tx.value, 16);
  
          // Если такого адреса еще нет в балансе, создаем его
          if (!balanceChanges[toAddress]) {
            balanceChanges[toAddress] = 0;
          }
          balanceChanges[toAddress] += valueInDecimal;
        }
      });
    }
  
    //Находим адрес с максимальным изменением баланса
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

// Запуск функции и вывод результата
calculateBalanceChanges().then(result => {
  console.log('Адрес с наибольшим изменением баланса:', result.address);
  console.log('Изменение баланса (в десятичной системе):', result.value);
});