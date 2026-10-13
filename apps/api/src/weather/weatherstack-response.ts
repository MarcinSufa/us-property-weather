import { z } from 'zod';

function coordinateSchema(bound: number) {
  return z
    .string()
    .regex(/^-?\d+(?:\.\d+)?$/)
    .transform(Number)
    .pipe(z.number().finite().min(-bound).max(bound));
}

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
    lat: coordinateSchema(90),
    lon: coordinateSchema(180),
  }),
  current: z.record(z.string(), z.unknown()),
});

export type WeatherstackSuccessResponse = z.infer<typeof WeatherstackSuccessResponseSchema>;
