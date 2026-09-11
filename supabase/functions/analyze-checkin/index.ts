// Fase D: clasifica el check-in de ánimo más reciente con Gemini y arma el
// tip que va a leer LA PAREJA de quien hizo el check-in (no quien lo hizo).
// Invocada fire-and-forget desde src/app/check-in.tsx justo después de
// guardar el check-in — si esto falla, el check-in ya se guardó igual.
//
// Nota de privacidad ya conversada y aceptada con la usuaria: esto manda la
// nota del check-in (potencialmente íntima) a la API de Gemini para
// clasificarla. La API key vive solo acá (secret de la función), nunca en
// el cliente.
//
// Catálogo de tips duplicado a mano de src/content/tips.ts (los `key`
// deben coincidir — Edge Functions se deployan como carpeta aislada, no
// pueden importar directo de src/). Mantener sincronizados.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const TIP_CATALOG = [
  { key: 'preguntar-antes-de-resolver', summary: 'Preguntar si necesita que la escuchen o que la ayuden a resolver algo — útil cuando hay estrés o un problema puntual.' },
  { key: 'avisar-cuando-volves', summary: 'Avisar cuándo se vuelve — útil cuando hay ausencia, viajes, o quedarse hasta tarde.' },
  { key: 'girar-hacia-lo-minimo', summary: 'Responder a comentarios chicos al pasar como pedidos de atención — útil cuando el ánimo es neutro/normal pero hay señales sutiles.' },
  { key: 'volver-rapido', summary: 'Volver rápido después de una discusión o mal momento, aunque sea torpe — útil cuando hubo tensión o un bajón reciente.' },
] as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { coupleId, checkinAuthorId } = await req.json();
    if (!coupleId || !checkinAuthorId) {
      return json({ error: 'Faltan coupleId/checkinAuthorId.' }, 400);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';

    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY no configurada — no se genera tip.');
      return json({ skipped: true, reason: 'no_api_key' }, 200);
    }

    // Cliente scoped al caller (respeta RLS): confirma que quien invoca es
    // efectivamente miembro de coupleId antes de tocar nada.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: couple, error: coupleError } = await callerClient
      .from('couples')
      .select('id, member_one, member_two')
      .eq('id', coupleId)
      .maybeSingle();

    if (coupleError || !couple) {
      return json({ error: 'No autorizado.' }, 401);
    }

    const partnerId = couple.member_one === checkinAuthorId ? couple.member_two : couple.member_one;
    if (!partnerId) {
      return json({ skipped: true, reason: 'no_partner' }, 200);
    }

    // A partir de acá, cliente service role: la escritura en daily_tips es
    // para partnerId, no para el caller, así que necesita bypassear RLS.
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: recentCheckins, error: checkinsError } = await serviceClient
      .from('mood_checkins')
      .select('mood, note, created_at')
      .eq('user_id', checkinAuthorId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (checkinsError || !recentCheckins?.length) {
      return json({ skipped: true, reason: 'no_checkins' }, 200);
    }

    const geminiResult = await classifyWithGemini({ apiKey: geminiApiKey, model: geminiModel, checkins: recentCheckins });
    if (!geminiResult) {
      return json({ skipped: true, reason: 'gemini_failed' }, 200);
    }

    const { error: upsertError } = await serviceClient.from('daily_tips').upsert(
      {
        couple_id: coupleId,
        for_user_id: partnerId,
        based_on_user_id: checkinAuthorId,
        tip_key: geminiResult.tipKey,
        kicker_text: geminiResult.kickerText,
      },
      { onConflict: 'for_user_id,tip_date' }
    );

    if (upsertError) {
      console.error('No se pudo guardar el tip:', upsertError.message);
      return json({ error: upsertError.message }, 500);
    }

    return json({ ok: true, tipKey: geminiResult.tipKey }, 200);
  } catch (err) {
    console.error('analyze-checkin falló:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type MoodCheckinRow = { mood: number; note: string | null; created_at: string };

async function classifyWithGemini(params: {
  apiKey: string;
  model: string;
  checkins: MoodCheckinRow[];
}): Promise<{ tipKey: string; kickerText: string } | null> {
  const { apiKey, model, checkins } = params;

  const history = checkins
    .map((c, i) => `${i === 0 ? 'Hoy' : `hace ${i} check-in(s)`} · ánimo ${c.mood}/6${c.note ? ` · nota: "${c.note}"` : ''}`)
    .join('\n');

  const catalogText = TIP_CATALOG.map((t) => `- ${t.key}: ${t.summary}`).join('\n');

  const prompt = `Sos un asistente que ayuda a una persona a apoyar mejor a su pareja. Te paso el historial reciente de check-ins de ánimo de la pareja (más reciente primero) y un catálogo de consejos disponibles. Elegí el consejo más relevante para el check-in de hoy y escribí una frase corta ("kicker", máximo 12 palabras, en español, sin inventar hechos que no estén en los datos) que resuma lo que está pasando, en el estilo "Raúl viene cansado hace 3 días".

Historial:
${history}

Catálogo de consejos:
${catalogText}

Devolvé SOLO el JSON pedido.`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          tip_key: { type: 'STRING', enum: TIP_CATALOG.map((t) => t.key) },
          kicker_text: { type: 'STRING' },
        },
        required: ['tip_key', 'kicker_text'],
      },
    },
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    if (!res.ok) {
      console.error('Gemini respondió con error:', res.status, await res.text());
      return null;
    }
    const payload = await res.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!TIP_CATALOG.some((t) => t.key === parsed.tip_key)) return null;
    return { tipKey: parsed.tip_key, kickerText: String(parsed.kicker_text ?? '').slice(0, 140) };
  } catch (err) {
    console.error('Error llamando a Gemini:', err);
    return null;
  }
}
