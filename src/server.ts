import { fastify } from 'fastify';
import { getAllPromptsRoute } from './routes/get-all-prompts';
import { uploadVideosRoute } from './routes/upload-videos';
import { createTranscriptionRoute } from './routes/create-transcription';
import { fastifyCors } from '@fastify/cors';
import { generateAICompletionRoute } from './routes/generate-ai-completion';

const app = fastify();
app.register(fastifyCors, {
  origin: '*',
});

app.register(getAllPromptsRoute);
app.register(uploadVideosRoute);
app.register(createTranscriptionRoute);
app.register(generateAICompletionRoute);

app.listen({
  port: 3333,
}).then(() => {
  console.log('Server is running on port 3333');
});