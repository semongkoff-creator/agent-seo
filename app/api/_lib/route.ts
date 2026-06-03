import { fail } from './response';

type Handler = () => Promise<Response> | Response;

export function createRoute(handler: Handler) {
  return async () => {
    try {
      return await handler();
    } catch (error) {
      return fail(error);
    }
  };
}
