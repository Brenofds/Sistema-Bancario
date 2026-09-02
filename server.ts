import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import multer from 'multer';

const app = express();
const PORT = 3000;

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} catch (e) {
  console.warn('Failed to initialize GoogleGenAI', e);
}

// In-memory data store for the prototype
const db = {
  expenses: [
    { id: 1, date: '2026-09-01', amount: 120.50, category: 'Supermercado', description: 'Mercado Mensal', recurring: true },
    { id: 2, date: '2026-09-02', amount: 45.00, category: 'Transporte', description: 'Uber', recurring: false },
    { id: 3, date: '2026-09-05', amount: 200.00, category: 'Lazer', description: 'Restaurante', recurring: false },
    { id: 4, date: '2026-09-10', amount: 80.00, category: 'Internet', description: 'Conta de Internet', recurring: true },
    { id: 5, date: '2026-10-10', amount: 80.00, category: 'Internet', description: 'Conta de Internet (Próxima)', recurring: true },
  ],
  budget: {
    limit: 1500,
    alerts: [
      { id: 1, message: 'Você atingiu 80% do limite de lazer.' }
    ]
  },
  bankSync: false
};

// Endpoints for App Data
app.get('/api/data', (req, res) => {
  res.json(db);
});

app.post('/api/sync-bank', (req, res) => {
  db.bankSync = true;
  res.json({ success: true, message: 'Sincronização bancária ativada com sucesso.' });
});

app.post('/api/expenses', (req, res) => {
  const newExpense = {
    id: Date.now(),
    ...req.body
  };
  db.expenses.push(newExpense);
  res.json(newExpense);
});

// Gemini TTS API
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: `data:audio/wav;base64,${base64Audio}` });
    } else {
      res.status(500).json({ error: 'No audio generated' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Gemini Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { history, message } = req.body;
    
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      config: {
        systemInstruction: 'Você é um assistente financeiro pessoal, especializado em planejar orçamentos, categorizar gastos e dar conselhos financeiros.',
      },
      history: formattedHistory
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Gemini Image Analysis API
app.post('/api/analyze-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }

    const imagePart = {
      inlineData: {
        mimeType: req.file.mimetype,
        data: req.file.buffer.toString('base64'),
      },
    };

    const textPart = {
      text: 'Analise este recibo/fatura. Extraia o valor total, a data e sugira uma categoria (ex: Supermercado, Lazer, Transporte, etc). Responda apenas em JSON com os campos: amount (número), date (YYYY-MM-DD), category (string) e description (string).',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
