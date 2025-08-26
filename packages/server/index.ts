import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import OpenAI from 'openai';
import z from 'zod';

dotenv.config();

const client = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
   res.send('Hello World!');
});

app.get('/api/hello', (req: Request, res: Response) => {
   res.json({ message: 'Hello World!' });
});

const conversations = new Map<string, string>();

const chatSchema = z.object({
   prompt: z
      .string()
      .trim()
      .min(1, 'Prompt is required.')
      .max(1000, 'Prompt is too long (max 1000 characters).'),
   conversationId: z.string().uuid(),
});

app.post('/api/chat', async (req: Request, res: Response) => {
   const parseResult = chatSchema.safeParse(req.body);
   if (!parseResult.success) {
      res.status(400).json(parseResult.error.format());
      return;
   }

   const { prompt, conversationId } = req.body;

   try {
      const response = await client.responses.create({
         model: 'gpt-5-nano!',
         input: prompt,
         reasoning: null,
         previous_response_id: conversations.get(conversationId) || undefined,
      });

      conversations.set(conversationId, response.id);

      res.json({ message: response.output_text });
   } catch (error) {
      res.status(500).json({ error: 'Failed to generate a response.' });
   }
});

app.listen(port, () => {
   console.log(`Server is running on http://localhost:${port}`);
});
