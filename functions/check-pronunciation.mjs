const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const cleanTarget = (value) =>
  String(value || "")
    .replace(/[<>{}\[\]\\]/g, "")
    .trim()
    .slice(0, 60);

function parseToolArgs(message) {
  const call = message?.tool_calls?.find(
    (x) => x?.function?.name === "report_pronunciation"
  );
  if (!call?.function?.arguments) return null;
  try {
    return JSON.parse(call.function.arguments);
  } catch {
    return null;
  }
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: "missing_api_key" }, 503);

  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const target = cleanTarget(form.get("target"));

    if (!target) return json({ error: "missing_target" }, 400);
    if (!(audio instanceof Blob) || !audio.size)
      return json({ error: "missing_audio" }, 400);
    if (audio.size > 1_500_000)
      return json({ error: "audio_too_large" }, 413);

    const bytes = Buffer.from(await audio.arrayBuffer());
    const base64 = bytes.toString("base64");

    const prompt = `أنت مقيم نطق للأطفال الذين يتعلمون العربية كلغة ثانية.
الهدف المطلوب نطقه هو: "${target}".
استمع إلى التسجيل نفسه ولا تعتمد على التخمين من النص فقط.
كن متسامحًا مع صوت الطفل واللكنة وضوضاء الصف البسيطة، لكن ميّز بدقة بين:
- الفتحة والضمة والكسرة
- الحركة القصيرة والمد الطويل
- اسم الحرف وصوته
لا تعاقب اختلاف اللهجة إذا كان الصوت المقصود واضحًا.
النجاح يعني أن الطفل نطق الهدف المقصود بصورة مفهومة.
استخدم أداة report_pronunciation فقط.`;

    const body = {
      model: "gpt-audio-1.5",
      store: false,
      temperature: 0.1,
      max_completion_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "قيّم النطق التعليمي فقط. لا تستنتج هوية الطفل أو عمره أو أي معلومات شخصية من الصوت.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "input_audio",
              input_audio: { data: base64, format: "wav" },
            },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_pronunciation",
            description: "Return the Arabic pronunciation assessment.",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                passed: { type: "boolean" },
                score: { type: "integer", minimum: 0, maximum: 100 },
                heard: {
                  type: "string",
                  description:
                    "What was heard, written briefly in Arabic when possible.",
                },
                feedback: {
                  type: "string",
                  description:
                    "Very short encouraging Arabic feedback for a primary-school child.",
                },
              },
              required: ["passed", "score", "heard", "feedback"],
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "report_pronunciation" },
      },
      parallel_tool_calls: false,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        "OpenAI pronunciation error:",
        response.status,
        data?.error?.type || data?.error?.code || "unknown"
      );
      if (response.status === 429)
        return json({ error: "rate_limited" }, 429);
      return json({ error: "openai_error" }, 502);
    }

    const result = parseToolArgs(data?.choices?.[0]?.message);
    if (!result) return json({ error: "invalid_ai_response" }, 502);

    const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)));
    const passed = Boolean(result.passed) && score >= 70;

    return json({
      passed,
      score,
      heard: String(result.heard || "").slice(0, 80),
      feedback: String(
        result.feedback ||
          (passed ? "ممتاز! نطقك واضح." : "قريب جدًا، استمع ثم جرّب مرة ثانية.")
      ).slice(0, 120),
    });
  } catch (error) {
    console.error("Pronunciation function failed:", error?.message || error);
    return json({ error: "server_error" }, 500);
  }
};

export const config = {
  path: "/api/pronunciation",
  method: "POST",
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
