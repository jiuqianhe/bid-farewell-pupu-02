import assert from "node:assert/strict";
import chat from "../api/chat.js";

const originalFetch = globalThis.fetch;
const originalKey = process.env.DEEPSEEK_API_KEY;

function request(body, options = {}) {
  return new Request(options.url || "https://example.vercel.app/api/chat", {
    method: options.method || "POST",
    headers: { "Content-Type": "application/json", ...(options.origin ? { Origin: options.origin } : {}) },
    body: options.method === "GET" ? undefined : JSON.stringify(body)
  });
}

async function call(body) { return chat.fetch(request(body)); }

try {
  delete process.env.DEEPSEEK_API_KEY;
  let response = await call({ action: "companion_chat", message: "你好" });
  assert.equal(response.status, 503);

  process.env.DEEPSEEK_API_KEY = "test-server-only-key";
  response = await chat.fetch(request(null, { method: "GET" }));
  assert.equal(response.status, 405);
  response = await chat.fetch(request({ action: "companion_chat", message: "你好" }, { origin: "https://other.example" }));
  assert.equal(response.status, 403);
  response = await call({ action: "unknown" });
  assert.equal(response.status, 400);

  const upstreamRequests = [];
  const replies = [
    "我在这里听你说。",
    JSON.stringify({ title: "听一听熟悉的铃声", short: "只听十秒也可以", body: "找一个你愿意听见的熟悉声音，只停留十秒。任何时候都可以结束，不需要逼自己回忆更多。", after: "写下一句此刻真实的感受，也可以只记下日期。", storyAnchor: "铃声" }),
    JSON.stringify({ arrangedText: "豆豆喜欢在午后晒太阳。\n\n那段时光很安静。", summary: "记下豆豆晒太阳的午后", imageNotes: ["阳光下的宠物"], layout: "photo-first" }),
    JSON.stringify({ arrangedText: "今天，我整理了那个熟悉的角落。", summary: "整理熟悉角落", imageNotes: [], layout: "text-first" })
  ];
  globalThis.fetch = async (url, init) => {
    upstreamRequests.push({ url, init, body: JSON.parse(init.body) });
    return Response.json({ choices: [{ message: { content: replies.shift() } }] });
  };

  response = await call({ action: "companion_chat", message: "我今天很想它", history: [{ role: "assistant", text: "我在。" }], storySummaries: ["豆豆喜欢晒太阳"] });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: "我在这里听你说。" });
  assert.equal(upstreamRequests[0].url, "https://api.deepseek.com/chat/completions");
  assert.equal(upstreamRequests[0].init.headers.Authorization, "Bearer test-server-only-key");
  assert.equal(upstreamRequests[0].body.model, "deepseek-flash");
  assert.ok(!upstreamRequests[0].body.response_format);
  assert.match(upstreamRequests[0].body.messages[0].content, /豆豆喜欢晒太阳/);

  response = await call({ action: "generate_task", step: 2, stories: ["豆豆听见铃声就会跑过来"], previousTasks: ["写一句话"] });
  assert.equal(response.status, 200);
  const taskResult = await response.json();
  assert.equal(taskResult.task.title, "听一听熟悉的铃声");
  assert.deepEqual(upstreamRequests[1].body.response_format, { type: "json_object" });
  assert.match(upstreamRequests[1].body.messages[0].content, /第 2\/7 件/);

  const tinyImage = "data:image/png;base64,iVBORw0KGgo=";
  response = await call({ action: "arrange_story", title: "午后", text: "豆豆喜欢晒太阳", images: [tinyImage] });
  assert.equal(response.status, 200);
  const storyResult = await response.json();
  assert.equal(storyResult.arrangement.layout, "photo-first");
  const imageBlock = upstreamRequests[2].body.messages[1].content.find(item => item.type === "image_url");
  assert.equal(imageBlock.image_url.url, tinyImage);
  assert.equal(imageBlock.image_url.detail, "low");

  response = await call({ action: "arrange_record", taskTitle: "整理角落", text: "今天整理了。", moods: ["平静"] });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).arrangement.layout, "text-first");

  globalThis.fetch = async () => new Response("rate limited", { status: 429 });
  response = await call({ action: "companion_chat", message: "再试一次" });
  assert.equal(response.status, 429);
  assert.equal((await response.json()).code, "RATE_LIMITED");

  console.log("PASS /api/chat validation, four AI actions, vision payload, security headers and upstream errors");
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
  else process.env.DEEPSEEK_API_KEY = originalKey;
}
