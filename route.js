import express from "express";
import { calculateBalanceChanges } from "./index.js";

const app = express();
app.use(express.json());

app.get('/calculate-balance-change', async (req, res) => {
    const { apiKey } = req.query; // Получаем API KEY
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API ключ не был передан в запросе' });
    }
  
    try {
      const result = await calculateBalanceChanges(apiKey);
      res.json(result);
    } catch (error) {
      console.error('Ошибка при расчетах:', error);
      res.status(500).json({ error: 'Произошла ошибка при вычислении изменений баланса' });
    }
  });

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});