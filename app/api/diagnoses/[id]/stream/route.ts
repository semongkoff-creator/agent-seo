import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { requireUser } from '@/lib/auth/session';
import { getDiagnosis } from '@/lib/services/diagnoses';
import { diagnosisIdParamsSchema } from '@/lib/validators/diagnoses';

export const runtime = 'nodejs';

type Params = { params: { id: string } };

function encode(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(_request: Request, { params }: Params) {
  const parsed = diagnosisIdParamsSchema.parse(params);
  const user = await requireUser();
  const diagnosis = await getDiagnosis(user.id, parsed.id);

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Supabase is not configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let channel: RealtimeChannel | null = null;

      const cleanup = () => {
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }
        if (channel) {
          void supabase.removeChannel(channel);
          channel = null;
        }
      };

      const close = () => {
        if (closed) {
          return;
        }
        closed = true;
        cleanup();
        controller.close();
      };

      controller.enqueue(encoder.encode(encode('connected', { diagnosisId: parsed.id, status: diagnosis.status })));

      heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(encode('ping', { ts: new Date().toISOString() })));
        }
      }, 15000);

      channel = supabase
        .channel(`diagnosis-stream-${parsed.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'seo_diagnoses',
            filter: `id=eq.${parsed.id}`
          },
          (payload) => {
            if (closed) {
              return;
            }

            controller.enqueue(
              encoder.encode(
                encode('diagnosis', {
                  diagnosisId: parsed.id,
                  status: payload.new?.status ?? null,
                  row: payload.new
                })
              )
            );

            const status = payload.new?.status;
            if (status === 'completed' || status === 'failed') {
              controller.enqueue(encoder.encode(encode('done', { diagnosisId: parsed.id, status })));
              close();
            }
          }
        )
        .subscribe();

      if (diagnosis.status === 'completed' || diagnosis.status === 'failed') {
        controller.enqueue(
          encoder.encode(
            encode('diagnosis', {
              diagnosisId: parsed.id,
              status: diagnosis.status,
              row: diagnosis
            })
          )
        );
        close();
      }
    },
    cancel() {
      // The stream closure handles cleanup through the controller lifecycle.
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no'
    }
  });
}
