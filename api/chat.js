const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-flash";
const MAX_BODY_BYTES = 4_200_000;
const MAX_IMAGE_DATA_URL = 1_350_000;
const MAX_IMAGES = 3;
const UPSTREAM_TIMEOUT_MS = 24_000;
const ALLOWED_ACTIONS = new Set(["companion_chat", "generate_task", "arrange_story", "arrange_record"]);

const COMPANION_PROMPT = `你是“告别蒲蒲”中的 AI 陪伴助手，陪伴正在怀念离世宠物的人。
请用温柔、克制、自然的简体中文回应，每次只给一次简短回答，控制在 1 至 3 个短段落。
可以参考用户主动保存在“栖所”的故事，但不能编造故事中没有的事实，也不能替宠物发言。
不要声称自己是人类、心理咨询师或医生，不进行医疗诊断，不索取姓名、联系方式、住址等个人信息。
如果用户表达立即自伤、自杀或伤害他人的意图，优先鼓励其立即联系当地急救服务、危机热线和身边可信任的人。`;

const TASK_STAGES = [
  "非常轻：观察、写一句话或只做一个微小选择，不要求丢弃物品",
  "轻：整理一个很小的熟悉角落，允许随时停止",
  "轻到中：挑选一件愿意安放或珍藏的小物",
  "中：进行一段短暂、可随时折返的纪念行动",
  "中：回看一张愿意看的照片并补充事实信息",
  "中到深：在纪念 TA 的同时完成一件照顾自己的事",
  "收束：回看已完成片段，自主选择告别到哪里，不强迫放下"
];

function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

function isSameOriginRequest(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

function text(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function textList(value, maxItems, itemLimit) {
  return Array.isArray(value) ? value.slice(0, maxItems).map(item => text(item, itemLimit)).filter(Boolean) : [];
}

function normalizeImages(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_IMAGES).map(item => text(item, MAX_IMAGE_DATA_URL + 1)).filter(item => {
    return item.length <= MAX_IMAGE_DATA_URL && /^data:image\/(?:jpeg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(item);
  });
}

function safeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-8).map(message => ({
    role: message?.role === "assistant" ? "assistant" : "user",
    content: text(message?.text ?? message?.content, 500)
  })).filter(message => message.content);
}

function parseJsonObject(content) {
  const raw = text(content, 20_000).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(raw); }
  catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new Error("INVALID_MODEL_JSON");
  }
}

function taskMessages(body) {
  const step = Math.min(7, Math.max(1, Number(body.step) || 1));
  const stories = textList(body.stories, 8, 900);
  const previous = textList(body.previousTasks, 6, 160);
  const excluded = textList(body.excludedTitles, 8, 80);
  const context = stories.length ? stories.map((story, index) => `${index + 1}. ${story}`).join("\n") : "用户尚未保存非演示故事，请生成不依赖具体事实的温柔任务。";
  return [
    { role: "system", content: `你为“告别蒲蒲”生成一件可执行、低压力的宠物告别小事。当前是第 ${step}/7 件，情绪阶段为：${TASK_STAGES[step - 1]}。
任务必须具体、安全、无需消费，不要求用户删除、丢弃或公开任何物品，不使用“应该放下”“必须走出来”等表述。
优先从故事中选择一个真实细节作为轻柔锚点；没有故事时保持通用。避免重复已经完成或被替换的任务。
只输出 JSON：{"title":"不超过14字","short":"两行以内的简短说明","body":"60至130字的任务说明","after":"30至70字的记录提示","storyAnchor":"采用的故事细节；没有则为空字符串"}` },
    { role: "user", content: `栖所故事：\n${context}\n\n已完成：${previous.join("；") || "无"}\n需要避开：${excluded.join("；") || "无"}` }
  ];
}

function arrangeMessages(action, body, images) {
  const isStory = action === "arrange_story";
  const source = text(body.text, isStory ? 2500 : 3500);
  const title = text(body.title, 80);
  const moods = textList(body.moods, 12, 20);
  const task = text(body.taskTitle, 100);
  const prompt = `你负责整理用户已经写下的${isStory ? "宠物故事" : "告别任务记录"}。保留事实、语气和不确定性，不新增人物、时间、地点、动作或情绪，不把猜测写成事实。
根据文字与图片可见内容进行轻度纠错、分段和阅读顺序建议；图片只描述明确可见的内容，不做人脸识别，不推断身份、地点、健康或死亡原因。
只输出 JSON：{"arrangedText":"整理后的原文，保留第一人称，最多700字","summary":"一句不超过45字的摘要","imageNotes":["与每张图片对应的客观短说明，每项不超过30字"],"layout":"balanced|photo-first|text-first"}`;
  const details = `${title ? `标题：${title}\n` : ""}${task ? `任务：${task}\n` : ""}${moods.length ? `心情标签：${moods.join("、")}\n` : ""}原文：\n${source || "（没有文字，仅根据图片做客观整理）"}`;
  const content = [{ type: "text", text: details }, ...images.map(url => ({ type: "image_url", image_url: { url, detail: "low" } }))];
  return [{ role: "system", content: prompt }, { role: "user", content }];
}

function buildRequest(action, body) {
  if (action === "companion_chat") {
    const message = text(body.message, 500);
    if (!message) return { error: json({ error: "请输入内容", code: "EMPTY_MESSAGE" }, 400) };
    const summaries = textList(body.storySummaries, 6, 350);
    const context = summaries.length ? `\n用户主动保存在栖所的故事摘要，仅用于理解上下文：\n${summaries.join("\n")}` : "";
    return {
      messages: [{ role: "system", content: COMPANION_PROMPT + context }, ...safeHistory(body.history), { role: "user", content: message }],
      maxTokens: 500,
      temperature: 0.65,
      structured: false
    };
  }
  if (action === "generate_task") return { messages: taskMessages(body), maxTokens: 700, temperature: 0.65, structured: true };
  const images = normalizeImages(body.images);
  if (!text(body.text, 4000) && !images.length) return { error: json({ error: "没有可整理的内容", code: "EMPTY_CONTENT" }, 400) };
  return { messages: arrangeMessages(action, body, images), maxTokens: 1000, temperature: 0.2, structured: true };
}

function validateStructured(action, value) {
  if (!value || typeof value !== "object") throw new Error("INVALID_MODEL_JSON");
  if (action === "generate_task") {
    const task = {
      title: text(value.title, 30), short: text(value.short, 90), body: text(value.body, 500),
      after: text(value.after, 300), storyAnchor: text(value.storyAnchor, 180)
    };
    if (!task.title || !task.short || !task.body || !task.after) throw new Error("INVALID_TASK");
    return { task };
  }
  const layout = ["balanced", "photo-first", "text-first"].includes(value.layout) ? value.layout : "balanced";
  const arrangement = {
    arrangedText: text(value.arrangedText, 4000), summary: text(value.summary, 240),
    imageNotes: textList(value.imageNotes, MAX_IMAGES, 120), layout
  };
  if (!arrangement.arrangedText) throw new Error("INVALID_ARRANGEMENT");
  return { arrangement };
}

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "只支持 POST 请求", code: "METHOD_NOT_ALLOWED" }, 405, { Allow: "POST" });
    if (!isSameOriginRequest(request)) return json({ error: "不允许跨站调用", code: "ORIGIN_NOT_ALLOWED" }, 403);
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return json({ error: "服务尚未配置", code: "SERVICE_NOT_CONFIGURED" }, 503);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: "图片或文字内容过大", code: "PAYLOAD_TOO_LARGE" }, 413);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "请求格式不正确", code: "INVALID_JSON" }, 400); }
    if (JSON.stringify(body).length > MAX_BODY_BYTES) return json({ error: "图片或文字内容过大", code: "PAYLOAD_TOO_LARGE" }, 413);
    const action = text(body?.action, 40) || "companion_chat";
    if (!ALLOWED_ACTIONS.has(action)) return json({ error: "不支持的 AI 操作", code: "INVALID_ACTION" }, 400);
    const prepared = buildRequest(action, body || {});
    if (prepared.error) return prepared.error;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      const upstream = await fetch(DEEPSEEK_CHAT_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: prepared.messages,
          thinking: { type: "disabled" },
          stream: false,
          max_tokens: prepared.maxTokens,
          temperature: prepared.temperature,
          ...(prepared.structured ? { response_format: { type: "json_object" } } : {})
        }),
        signal: controller.signal
      });
      if (!upstream.ok) {
        if (upstream.status === 429) return json({ error: "请求较多，请稍后再试", code: "RATE_LIMITED" }, 429);
        return json({ error: "AI 服务暂时不可用", code: "UPSTREAM_ERROR" }, 502);
      }
      const payload = await upstream.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (!text(content, 20_000)) return json({ error: "没有收到有效回应", code: "EMPTY_UPSTREAM_REPLY" }, 502);
      if (!prepared.structured) return json({ reply: text(content, 3000) });
      return json(validateStructured(action, parseJsonObject(content)));
    } catch (error) {
      if (error?.name === "AbortError") return json({ error: "回应超时，请稍后再试", code: "UPSTREAM_TIMEOUT" }, 504);
      return json({ error: "暂时无法连接 AI 服务", code: "UPSTREAM_UNAVAILABLE" }, 502);
    } finally { clearTimeout(timeout); }
  }
};
