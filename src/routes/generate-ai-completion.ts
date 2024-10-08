import { FastifyInstance } from "fastify";
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { openai } from "../lib/openai";
import { streamToResponse } from 'ai';

const bodySchema = z.object({
  videoId: z.string().uuid(),
  prompt: z.string(),
  temperature: z.number().min(0).max(1).default(0.5),
})

export async function generateAICompletionRoute(app: FastifyInstance) {
  app.post('/ai/complete', async (request, reply) => {
    const { videoId, temperature, prompt } = bodySchema.parse(request.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId
      }
    });

    if (!video.transcription) {
      return reply.status(400).send({ error: 'Video transcription is not available' });
    }

    const promptMessage = prompt.replace('{transcription}', video.transcription);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature,
      messages: [{
        role: 'user', content: promptMessage
      }],
      stream: true
    });

    const stream = response.toReadableStream();

    streamToResponse(stream, reply.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
      }
    });

  });
}