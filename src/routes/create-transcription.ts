import { FastifyInstance } from "fastify";
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createReadStream } from "fs";
import { openai } from "../lib/openai";

const paramsSchema = z.object({
  videoId: z.string().uuid()
});

const bodySchema = z.object({
  prompt: z.string()
})

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (request, reply) => {
    console.log("create transcription route", request.body);
    const { videoId } = paramsSchema.parse(request.params);

    const { prompt } = bodySchema.parse(request.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId
      }
    });

    const videoPath = video.path;

    const audioReadStream = createReadStream(videoPath);

    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'verbose_json',
      temperature: 0,
      prompt: prompt,
      timestamp_granularities: ['segment']
    }).catch((error) => {
      console.error("openai error", error);
      throw new Error("Failed to generate transcription");
    });
    console.log("openai", response);

    const transcription = response.text;

    await prisma.video.update({
      where: {
        id: videoId
      },
      data: {
        transcription
      }
    });

    return { transcription }
  });
}