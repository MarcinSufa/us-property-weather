import { z } from 'zod';

const coordinateSchema = z.string().trim().min(1).transform(Number).pipe(z.number().finite());

export const WeatherstackFailureResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    type: z.string(),
  }),
});

export type WeatherstackFailureResponse = z.infer<typeof WeatherstackFailureResponseSchema>;

export const WeatherstackSuccessResponseSchema = z.object({
  location: z.object({
    lat: coordinateSchema,
    lon: coordinateSchema,
  }),
  current: z.record(z.string(), z.unknown()),
});

export type WeatherstackSuccessResponse = z.infer<typeof WeatherstackSuccessResponseSchema>;
