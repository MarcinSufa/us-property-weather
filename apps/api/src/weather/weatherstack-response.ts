export interface WeatherstackSuccessResponse {
  location: { lat: string; lon: string };
  current: Record<string, unknown>;
}

export interface WeatherstackErrorResponse {
  success: false;
  error: { code: number; type: string };
}

export type WeatherstackResponse = WeatherstackSuccessResponse | WeatherstackErrorResponse;

export function parseWeatherstackResponse(_body: unknown): WeatherstackResponse {
  throw new Error('not implemented');
}
