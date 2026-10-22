import { callAI, prepareImagesForAI } from "./ai-client.js";

(() => {
  "use strict";

  const STORAGE_KEY = "farewell-pupu-windfield-v1";
  const DB_NAME = "farewell-pupu-media";
  const params = new URLSearchParams(location.search);
  const demoMode = params.get("demo") === "1";
  const qaRoute = params.get("qa");
  const debugMode = params.get("debug") === "1";
  const stage = document.querySelector("#stage");
  const toastNode = document.querySelector("#toast");
  const debugPanel = document.querySelector("#debug-panel");

  const tasks = [
    [
      { title: "分享它留下的食物", short: "将家里还剩下的零食\n送给流浪的小伙伴吧", body: "家里还留着它以前爱吃的零食或宠物食品吗？挑选一些保存完好、没有过期的食物，送给适合食用的流浪猫狗，也可以交给照顾它们的救助志愿者。不用全部送出去，分享一小部分就好。", after: "记录下你送出了什么、遇到了什么，以及当时的心情。" },
      { title: "整理一小份食物", short: "选出保存完好的食物\n交给合适的救助伙伴", body: "从留下的食物里挑一小份仍在保质期内、适合捐赠的内容。联系可靠的救助伙伴，确认接收条件后再送出。", after: "写下这次整理和交接的经过，以及你愿意保留的感受。" },
      { title: "把食物交给需要的它们", short: "确认食物安全之后\n完成一次温柔的分享", body: "检查包装、保质期与适用对象，再把可以安全使用的食物交给附近可信任的救助志愿者。", after: "记录实际送出的物品和过程，不需要写下不愿公开的部分。" }
    ],
    [{ title: "整理一个熟悉的角落", short: "从一处小小空间开始\n留下你想保留的样子", body: "选择一个承载回忆的小角落，只整理眼前的一小部分。可以保留仍想陪伴你的物品，不需要一次完成全部。", after: "记录你做了哪些调整，以及整理后看见了什么。" }],
    [{ title: "挑选一件想珍藏的小物", short: "让一件熟悉的小物\n拥有安稳的位置", body: "挑选一件你愿意继续珍藏的小物，为它找一个安全、容易看见的位置。", after: "记下你选择它的原因，或只拍一张照片。" }],
    [{ title: "留下一段轻轻的散步", short: "去熟悉的路上走一走\n按自己的速度回来", body: "如果今天适合出门，可以沿着熟悉的路走一小段。随时可以折返，不必完成固定距离。", after: "记录途中留意到的一处光影、声音或气味。" }],
    [{ title: "为一张照片写下日期", short: "选一张愿意重看的照片\n写下它发生的时间", body: "从已有照片中选一张你愿意回看的，为它补上日期和一句真实说明。", after: "保留原来的事实，不必替照片添加额外故事。" }],
    [{ title: "照顾今天的自己", short: "完成一件小小的照顾\n让今天慢一点", body: "为自己准备水、食物或一段休息时间，选择现在最容易做到的一件。", after: "记录这件照顾是否让今天有一点不同。" }],
    [{ title: "把七颗种子放在一起", short: "回看已经完成的片段\n决定现在想停在哪里", body: "回看已经留下的种子，只阅读你愿意重新看见的部分。完成之后可以停在这里。", after: "记下今天愿意带走的一句话，也可以保持空白。" }]
  ];

  const storyCategories = [
    { key: "who", label: "TA 是谁", subtitle: "记录 TA 的名字、样子与性格", demoSubtitle: "我家的小太阳，一只温柔的伙伴", icon: "story-who-image2.png", color: "pink", demoCount: 6 },
    { key: "habit", label: "小习惯", subtitle: "收好那些熟悉的小小日常", demoSubtitle: "喜欢在阳台晒太阳，听到开门就跑来", icon: "story-habit-image2.png", color: "yellow", demoCount: 4 },
    { key: "together", label: "我们怎样相处", subtitle: "记录一起度过的平凡时刻", demoSubtitle: "一起散步、一起发呆、一起长大", icon: "story-together-image2.png", color: "blue", demoCount: 8 },
    { key: "media", label: "照片与视频", subtitle: "集中查看已经收好的影像", demoSubtitle: "有 327 张照片、12 段视频", icon: "story-media-image2.png", color: "green", demoCount: 339 },
    { key: "words", label: "最想说的话", subtitle: "想起时再慢慢补充", demoSubtitle: "想起时再补充", icon: "story-words-image2.png", color: "lilac", demoCount: 0 },
  ];

  function defaultChatMessages() {
    return demoMode ? [
      { role: "assistant", text: "想聊聊 TA 吗？也可以静静坐一会。" },
      { role: "user", text: "我很想念豆豆…" },
      { role: "assistant", text: "想念一个人是很自然的。你愿意和我说说，最近让你特别想起 TA 的一件事吗？" },
      { role: "user", text: "那天路过我们常去的公园，看到很多蒲公英…" },
    ] : [{ role: "assistant", text: "想聊聊 TA 吗？也可以静静坐一会。" }];
  }

  function defaultStories() {
    return [
      {
        id: "story-demo-who", category: "who", title: "TA 是谁", date: "2024-04-01", demo: true,
        body: "豆豆是一只爱笑的小狗，性格活泼，也很粘人。它喜欢跟在身边，把每一次回家都变成一件热闹的小事。",
        media: [{ type: "image", src: "assets/E/media/demo-dog-portrait.png", name: "豆豆的照片" }], privateNote: ""
      },
      {
        id: "story-demo-habit", category: "habit", title: "和你一起晒太阳的午后", date: "2024-05-20", demo: true,
        body: "你总是喜欢在午后的阳光下，蜷成一团睡觉。阳光洒在你的毛上，温暖又柔软。每次看见你这样安静的样子，我都觉得好幸福。谢谢你用这些小小的日常，陪我走过了那么多时光。",
        media: [
          { type: "image", src: "assets/E/media/demo-dog-outdoor.png", name: "午后散步" },
          { type: "image", src: "assets/E/media/demo-pets-resting.png", name: "一起休息" },
        ], privateNote: ""
      },
      {
        id: "story-demo-together", category: "together", title: "我们怎样相处", date: "2024-05-20", demo: true,
        body: "在一起的日子里，有很多平凡又温暖的瞬间。你总是安静地陪在我身边，用你独特的方式让我感到安心和快乐。",
        media: [
          { type: "image", src: "assets/E/media/demo-cat-sleeping.png", name: "靠在柔软毯子上" },
          { type: "image", src: "assets/E/media/demo-cat-sunlight.png", name: "窗边的阳光" },
          { type: "image", src: "assets/E/media/demo-cat-wide.png", name: "一起晒太阳" },
        ], privateNote: ""
      },
      {
        id: "story-demo-media", category: "media", title: "珍藏照片", date: "2024-04-01", demo: true,
        body: "这些照片记录了我们共同生活的片段。想念的时候，可以慢慢看，不需要一次看完。",
        media: [
          { type: "image", src: "assets/E/media/demo-dog-portrait.png", name: "豆豆" },
          { type: "image", src: "assets/E/media/demo-dog-outdoor.png", name: "散步" },
          { type: "image", src: "assets/E/media/demo-pets-resting.png", name: "影像" },
        ], privateNote: ""
      },
    ];
  }

  function blankSlot(index) {
    return {
      ordinal: index + 1,
      taskId: `task-slot-${index + 1}`,
      variant: 0,
      status: "not_offered",
      replacementHistory: [],
      generatedTask: null,
      record: {
        recordId: `record-slot-${index + 1}`,
        date: null,
        mood: null,
        moods: [],
        customMood: null,
        customMoods: [],
        originalText: "",
        arrangedRecord: "",
        aiSummary: "",
        aiImageNotes: [],
        aiLayout: "balanced",
        privateNote: "",
        mediaIds: [],
        shareSettings: { hideIdentityDate: true, excludePrivateNote: true },
        editDraft: null,
        updatedAt: null,
        minimalConfirmed: false
      },
      layoutChoice: "reference",
      seedId: null,
      archivedAt: null,
      demo: false
    };
  }

  function initialState() {
    return {
      schemaVersion: 2,
      journeyId: "demo-journey",
      petProfile: null,
      slots: Array.from({ length: 7 }, (_, i) => blankSlot(i)),
      route: "C1",
      selectedSeedOrdinal: null,
      lastArchivedSeedId: null,
      arrivalSeedId: null,
      preferences: { reducedMotion: false },
      stories: defaultStories(),
      referenceStoriesInitialized: true,
      storyCountAdjust: {},
      selectedStoryId: "story-demo-together",
      selectedStoryCategory: "together",
      storyEditDraft: null,
      storyEditSource: "E3",
      shareStoryIds: ["story-demo-together"],
      shareStoryMode: "single",
      storyShareSettings: { hideIdentityDate: true, excludePrivateNote: true },
      chatMessages: defaultChatMessages(),
      chatPersist: false,
      aiDisclosureAccepted: false,
      quietSettings: { sound: null, volume: 55, muted: false, timerMinutes: 30, endsAt: null }
    };
  }

  function loadState() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!value || ![1, 2].includes(value.schemaVersion) || !Array.isArray(value.slots) || value.slots.length !== 7) return initialState();
      value.schemaVersion = 2;
      value.slots.forEach(slot => {
        slot.generatedTask ||= null;
        slot.record ||= {};
        if (!Array.isArray(slot.record.moods)) slot.record.moods = slot.record.mood ? [slot.record.mood] : [];
        if (!Array.isArray(slot.record.customMoods)) slot.record.customMoods = slot.record.customMood ? [slot.record.customMood] : [];
        if (!Array.isArray(slot.record.mediaIds)) slot.record.mediaIds = [];
        slot.record.arrangedRecord ||= slot.record.originalText || "";
        slot.record.aiSummary ||= "";
        if (!Array.isArray(slot.record.aiImageNotes)) slot.record.aiImageNotes = [];
        slot.record.aiLayout ||= "balanced";
        slot.record.privateNote ||= "";
        slot.record.shareSettings ||= { hideIdentityDate: true, excludePrivateNote: true };
        slot.record.shareSettings.hideIdentityDate ??= true;
        slot.record.shareSettings.excludePrivateNote ??= true;
        slot.record.editDraft ||= null;
      });
      value.selectedSeedOrdinal ||= value.slots.find(slot => slot.seedId)?.ordinal || null;
      value.lastArchivedSeedId ||= null;
      value.arrivalSeedId ||= null;
      if (!Array.isArray(value.stories)) value.stories = [];
      value.stories.forEach(story => {
        story.arrangedBody ||= "";
        story.aiSummary ||= "";
        if (!Array.isArray(story.aiImageNotes)) story.aiImageNotes = [];
        story.aiLayout ||= "balanced";
      });
      if (!value.referenceStoriesInitialized) {
        if (!value.stories.length) value.stories = defaultStories();
        value.referenceStoriesInitialized = true;
      }
      value.storyCountAdjust ||= {};
      if (!demoMode) value.storyCountAdjust = {};
      if (!value.stories.some(story => story.id === value.selectedStoryId)) value.selectedStoryId = value.stories[0]?.id || null;
      value.selectedStoryCategory ||= value.stories.find(story => story.id === value.selectedStoryId)?.category || "who";
      value.storyEditDraft ||= null;
      value.storyEditSource ||= "E3";
      if (!Array.isArray(value.shareStoryIds)) value.shareStoryIds = value.selectedStoryId ? [value.selectedStoryId] : [];
      value.shareStoryIds = value.shareStoryIds.filter(id => value.stories.some(story => story.id === id));
      value.shareStoryMode ||= "single";
      value.storyShareSettings ||= { hideIdentityDate: true, excludePrivateNote: true };
      if (!Array.isArray(value.chatMessages)) value.chatMessages = defaultChatMessages();
      value.chatPersist ??= false;
      value.aiDisclosureAccepted ??= false;
      if (!value.chatPersist) value.chatMessages = defaultChatMessages();
      value.quietSettings ||= { sound: null, volume: 55, muted: false, timerMinutes: 30, endsAt: null };
      return value;
    } catch { return initialState(); }
  }

  // This prototype intentionally keeps progress only in the current page runtime.
  // Refreshing or reopening the site starts a new 0/7 journey.
  let state = initialState();
  let submittingArchive = false;
  let autosaveTimer = 0;
  let motionHandler = null;
  let quietAudio = null;
  let quietTimerHandle = 0;
  let chatRequestController = null;
  let chatSending = false;
  let taskDrawPhase = "idle";
  let taskDrawBusy = false;
  let arrangingBusy = false;

  function saveState() {
    // In-memory only by product requirement. Navigation inside this page keeps
    // state; reload never writes progress, records, stories or chat to storage.
  }

  function clearPreviousSessionData() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    if (!("indexedDB" in window)) return Promise.resolve();
    return new Promise(resolve => {
      let settled = false;
      const finish = () => { if (!settled) { settled = true; resolve(); } };
      try {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = finish;
        request.onerror = finish;
        request.onblocked = finish;
      } catch { finish(); }
      setTimeout(finish, 450);
    });
  }

  function completedCount(source = state) { return source.slots.filter(slot => slot.status === "archived").length; }
  function currentSlot(source = state) { return source.slots.find(slot => slot.status !== "archived") || source.slots[6]; }
  function selectedSeedSlot(source = state) {
    const chosen = source.slots.find(slot => slot.ordinal === Number(source.selectedSeedOrdinal) && slot.seedId);
    return chosen || source.slots.find(slot => slot.seedId) || null;
  }
  function taskFor(slot) { return slot?.generatedTask || (tasks[slot.ordinal - 1] || tasks[0])[slot.variant % (tasks[slot.ordinal - 1] || tasks[0]).length]; }
  function selectedMoods(record) { return Array.isArray(record.moods) ? record.moods : record.mood ? [record.mood] : []; }
  function selectedStory(source = state) { return source.stories?.find(story => story.id === source.selectedStoryId) || null; }
  function selectedStoryCategory(source = state) { return storyCategories.find(category => category.key === source.selectedStoryCategory) || storyCategories[0]; }
  function storyCategoryCount(category, source = state) {
    const stored = (source.stories || []).filter(story => story.category === category.key);
    const visibleCount = demoMode ? stored.filter(story => !story.demo).length : stored.length;
    return Math.max(0, (demoMode ? category.demoCount : 0) + Number(source.storyCountAdjust?.[category.key] || 0) + visibleCount);
  }
  function shortDate(value) { return value ? String(value).replace(/-/g, ".") : "未填写日期"; }
  function displayRecord(slot) { return slot?.record || {}; }
  function editableRecord(slot) { return state.route === "D3" && slot?.record?.editDraft ? slot.record.editDraft : slot?.record; }
  function two(value) { return String(value).padStart(2, "0"); }
  function todayISO() { const d = new Date(); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`; }
  function formatDate(value) {
    if (!value) return "选择记录日期";
    const date = new Date(`${value}T12:00:00`);
    const week = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
    return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日（周${week}）`;
  }

  function previewState(route) {
    const draft = initialState();
    const slot = draft.slots[0];
    if (route !== "C1") slot.status = ["C6", "D1", "D2", "D3", "D4"].includes(route) ? "archived" : route === "C5" ? "ready_to_archive" : route === "C4" ? "record_draft" : "offered";
    if (["C4", "C5", "C6", "D1", "D2", "D3", "D4"].includes(route)) {
      slot.record.date = demoMode ? "2024-05-20" : todayISO();
      slot.record.mood = "开心";
      slot.record.moods = ["开心", "平静"];
      slot.record.originalText = demoMode && ["C5", "C6", "D1", "D2", "D3", "D4"].includes(route) ? "今天我终于打开了那个放零食的柜子。\n看到米粒最喜欢的鸡肉冻干时，我还是忍不住哭了。以前每次拿起袋子，它都会跑过来坐好，等我给它一小块。\n我带了一包冻干和一些狗粮，交给了附近照顾流浪狗的志愿者。后来一只黄白色的小狗慢慢走过来，低头吃了起来。\n我站在远处看着它，突然想到米粒以前吃零食的样子。那一瞬间，我还是很想它，但心里好像也没有那么难受了。" : "";
      slot.record.arrangedRecord = slot.record.originalText;
      slot.record.privateNote = "还可以记录一些当时没来得及说出口的话。";
      slot.record.minimalConfirmed = true;
    }
    if (["C6", "D1", "D2", "D3", "D4"].includes(route)) {
      slot.seedId = "seed-task-slot-1";
      slot.archivedAt = new Date().toISOString();
      draft.selectedSeedOrdinal = 1;
    }
    if (route === "E2") {
      draft.selectedStoryId = "story-demo-habit";
      draft.selectedStoryCategory = "habit";
      draft.storyEditDraft = JSON.parse(JSON.stringify(draft.stories.find(story => story.id === "story-demo-habit")));
      draft.storyEditSource = "E3";
    }
    if (route === "E3") {
      draft.selectedStoryId = "story-demo-who";
      draft.selectedStoryCategory = "who";
      draft.shareStoryIds = ["story-demo-who"];
    }
    if (route === "E5") {
      draft.selectedStoryId = "story-demo-together";
      draft.selectedStoryCategory = "together";
    }
    draft.route = route;
    return draft;
  }

  function routeTo(route) {
    cleanupRouteDeparture(route);
    state.route = route;
    saveState();
    history.pushState({ route }, "", `${location.pathname}${location.search}#${route}`);
    render();
  }

  function showToast(message) {
    toastNode.textContent = message;
    toastNode.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toastNode.classList.remove("show"), 2300);
  }

  function progressCard(count) {
    return `<section class="card progress-card" aria-label="告别进度 ${count}/7">
      <div class="progress-head"><strong>告别进度</strong><span class="count">${count}/7</span></div>
      <small class="progress-note">完成7次告别，让蒲公英飞向远方</small>
      <div class="seed-row">${Array.from({ length: 7 }, (_, i) => `<span class="seed-dot ${i < count ? "active" : "inactive"}"></span>`).join("")}</div>
    </section>`;
  }

  function fieldFlower(count) {
    if (count < 1) return "";
    const label = count === 7 ? "蒲公英已经完全变成白色绒球" : `蒲公英已有 ${count}/7 变成白色绒球`;
    return `<div class="dandelion-progress" style="--progress:${count}" role="img" aria-label="${label}"><img src="assets/generated/dandelion-mature-head.png" alt=""></div>`;
  }

  function fallingPetals(reducedMotion, extraClass = "") {
    if (reducedMotion) return "";
    const paths = [[-54,94,-22],[-38,132,35],[-19,101,88],[7,142,145],[25,108,205],[43,139,265],[58,93,315],[-67,154,382],[-9,168,440],[35,172,500]];
    return `<div class="petal-shower ${extraClass}" aria-hidden="true">${paths.map(([x,y,r], index) => `<i class="flower-petal" style="--x:${x}px;--y:${y}px;--r:${r}deg;--delay:${index * .075}s"></i>`).join("")}</div>`;
  }

  function nav(active = "field") {
    const items = [["field","风原"],["seeds","籽语"],["place","栖所"],["isle","私屿"]];
    return `<nav class="bottom-nav" aria-label="主导航">${items.map(([key,label]) => `<button class="nav-item ${key===active?"active":""}" data-nav="${key}" aria-current="${key===active?"page":"false"}"><img src="assets/crops/nav-${key}.png" alt=""><span>${label}</span></button>`).join("")}</nav>`;
  }

  function renderC1(s) {
    const count = completedCount(s);
    const slot = currentSlot(s);
    const pending = slot.status !== "not_offered" && slot.status !== "archived";
    const complete = count === 7;
    const drawing = !pending && !complete && taskDrawPhase !== "idle";
    const action = complete ? "看看成熟的蒲公英" : pending ? "继续这件告别任务" : taskDrawBusy ? "正在生成专属小事…" : taskDrawPhase === "armed" ? "轻点这里也可以抽取" : "开启摇晃抽取";
    return `<section class="page page-c1" data-route="C1">
      <header class="brand"><h1>风原</h1><p>让思念，在风里生长</p></header>
      <img class="layer scene" src="assets/crops/c1-scene.png" alt="蒲团子和黄色蒲公英在花园里">
      ${fieldFlower(count)}
      ${drawing ? fallingPetals(s.preferences.reducedMotion, "is-home") : ""}
      ${!pending && !complete ? `<button class="flower-hotspot" data-action="${taskDrawPhase === "armed" ? "draw-task" : "offer"}" aria-label="${taskDrawPhase === "armed" ? "轻点蒲公英抽取事件" : "开启摇晃抽取"}" ${taskDrawBusy ? "disabled" : ""}></button>` : ""}
      ${progressCard(count)}
      <section class="card empty-card">
        <img src="assets/crops/c1-empty-illustration.png" alt="花草旁的小日历">
        <div class="empty-copy"><strong>${complete ? "七颗种子已经到齐啦" : pending ? "这件小事还在等你" : "暂时没有告别记录哦"}</strong><p>${complete ? "可以慢慢回看，也可以先在风原停一会儿。" : pending ? "按自己的速度回来，记录不会丢失。" : "每一次温柔的告别，\n让思念化作蒲公英，随风飘向远方。"}</p></div>
      </section>
      ${drawing ? `<p class="shake-hint" role="status">${taskDrawBusy ? "花瓣正在落下，蒲蒲在结合栖所故事生成这一件小事" : "现在轻轻摇晃手机；无法摇晃时可以点按下方按钮"}</p>` : ""}
      <button class="primary-button main-action ${taskDrawBusy ? "is-loading" : ""}" data-action="${complete ? "open-g1" : pending ? "resume" : taskDrawPhase === "armed" ? "draw-task" : "offer"}" ${taskDrawBusy ? "disabled" : ""}>${action}</button>
      ${nav("field")}
    </section>`;
  }

  function renderC2(s) {
    const slot = currentSlot(s), task = taskFor(slot), count = completedCount(s);
    return `<section class="page page-c2" data-route="C2">
      <header class="brand"><h1>风原</h1><p>让思念，在风里生长</p></header>
      <img class="layer scene" src="assets/crops/c2-scene.png" alt="花瓣从蒲公英上轻轻飘落">
      ${fieldFlower(count)}${fallingPetals(s.preferences.reducedMotion)}
      <section class="card task-preview">
        <div class="task-label">告别任务${two(slot.ordinal)}</div>
        <img class="preview-art" src="assets/crops/c2-task-illustration.png" alt="小狗把食物分享给朋友">
        <div class="preview-copy"><h2>${escapeHTML(task.title)}</h2><p>${escapeHTML(task.short).replace(/\n/g,"<br>")}</p></div>
        <button class="primary-button view-task" data-action="view-task">查看任务 &gt;</button>
      </section>
      ${progressCard(count)}${nav("field")}
    </section>`;
  }

  function renderC3(s) {
    const slot = currentSlot(s), task = taskFor(slot);
    return `<section class="page page-c3" data-route="C3">
      <button class="back-button" data-action="back-c2" aria-label="返回任务预览"></button><h1 class="screen-title">告别任务</h1>
      <img class="layer scene" src="assets/crops/c3-scene.png" alt="花园里的蒲团子">
      <section class="task-shell"><div class="task-paper">
        <span class="task-number">${two(slot.ordinal)}/07</span><h2 class="task-heading">${escapeHTML(task.title)}</h2>
        <div class="task-scroll"><h3 class="highlight-title">任务内容：</h3><p>${escapeHTML(task.body)}</p><h3 class="highlight-title">完成之后你可以：</h3><p>${escapeHTML(task.after)}</p></div>
        <img class="task-animals" src="assets/crops/c3-animals.png" alt="小狗、小猫和蒲团子一起分享食物">
        <button class="primary-button complete-task" data-action="accept-task">去完成并记录</button>
        <div class="mini-actions"><button class="mini-button" data-action="replace-task"><img class="mini-icon" src="assets/crops/c3-refresh.png" alt="">换一件事</button><button class="mini-button" data-action="defer-task"><img class="mini-icon" src="assets/crops/c3-clock.png" alt="">以后再做</button></div>
      </div></section>
    </section>`;
  }

  function moodButton(name, slot, kind = "preset", record = slot.record) {
    const isAdd = kind === "add", selected = !isAdd && selectedMoods(record).includes(name);
    const asset = {
      "开心": "assets/generated/mood-happy-image2.png",
      "平静": "assets/generated/mood-calm-image2.png",
      "放松": "assets/generated/mood-relaxed-image2.png",
      "低落": "assets/generated/mood-low-image2.png"
    }[name];
    const visual = isAdd
      ? `<span class="mood-face mood-add-visual" aria-hidden="true"></span>`
      : asset
        ? `<span class="mood-face"><img src="${asset}" alt=""></span>`
        : `<span class="mood-face mood-ai-placeholder" aria-hidden="true"></span>`;
    return `<button class="mood-button ${isAdd ? "mood-add" : kind === "custom" ? "mood-custom" : ""} ${selected ? "selected" : ""}" data-mood="${isAdd ? "__add__" : escapeHTML(name)}" data-mood-kind="${kind}" ${isAdd ? "" : `aria-pressed="${selected}"`}>${visual}<span>${isAdd ? "添加" : escapeHTML(name)}</span></button>`;
  }

  function memoryMoodMarkup(record) {
    const selected = new Set(selectedMoods(record));
    const presets = ["开心", "平静", "放松", "低落"];
    const custom = (record.customMoods || []).filter(name => selected.has(name));
    const names = [...presets, ...custom];
    const assets = {
      "开心": "assets/generated/mood-happy-image2.png",
      "平静": "assets/generated/mood-calm-image2.png",
      "放松": "assets/generated/mood-relaxed-image2.png",
      "低落": "assets/generated/mood-low-image2.png"
    };
    return names.map(name => `<span class="memory-mood-item ${selected.has(name) ? "is-selected" : ""}">
      <span class="memory-mood-art ${assets[name] ? "" : "is-ai-placeholder"}">${assets[name] ? `<img src="${assets[name]}" alt="">` : ""}</span>
      <small>${escapeHTML(name)}</small>
    </span>`).join("");
  }

  function renderC4(s) {
    const slot = currentSlot(s), task = taskFor(slot), date = slot.record.date || (demoMode ? "2024-05-20" : todayISO());
    return `<section class="page page-c4" data-route="C4">
      <button class="back-button" data-action="back-c3" aria-label="返回任务详情"></button><h1 class="screen-title">花瓣手账</h1>
      <img class="layer scene" src="assets/crops/c4-scene.png" alt="蒲团子抱着粉色手账">
      <section class="notebook">${Array.from({length:6},(_,i)=>`<img class="ring" src="assets/crops/c4-ring-${i+1}.png" alt="">`).join("")}<div class="notebook-paper">
        <header class="record-head"><h2>告别任务${two(slot.ordinal)}：${escapeHTML(task.title)}</h2><p>走出家门，去感受今天的风和阳光吧～</p></header>
        <div class="date-row"><img src="assets/crops/c4-calendar.png" alt=""><span class="date-label">记录日期</span><output>${formatDate(date)}</output><span class="date-chevron" aria-hidden="true"></span><button class="date-trigger" type="button" data-action="pick-date" aria-label="选择记录日期，当前为${formatDate(date)}"></button><input class="date-input" id="record-date" type="date" value="${date}" aria-label="记录日期"></div>
        <h3 class="field-label">今天的心情是？</h3><div class="moods" role="group" aria-label="心情可多选，左右滑动查看更多">${["开心","平静","放松","低落"].map(name => moodButton(name,slot)).join("")}${(slot.record.customMoods || []).map(name => moodButton(name,slot,"custom")).join("")}${moodButton("添加",slot,"add")}</div>
        <h3 class="field-label">发生了什么？你有什么感受？</h3><textarea class="story-text" aria-label="记录发生的事情和感受" placeholder="写下这一刻的故事吧...">${escapeHTML(slot.record.originalText || "")}</textarea>
        <div class="utility-row"><button class="utility-card" data-action="add-media">添加照片 / 视频<img src="assets/crops/c4-camera-transparent.png" alt=""></button><button class="utility-card mic" data-action="speech">语音转文字<img src="assets/crops/c4-microphone-transparent.png" alt=""></button></div>
        <input id="media-input" hidden type="file" accept="image/*,video/*" multiple>
        <div class="media-preview">${slot.record.mediaIds.map((id,i)=>`<button class="media-chip" data-remove-media="${id}" title="删除媒体 ${i+1}">媒体 ${i+1} ×</button>`).join("")}</div>
        <div class="record-actions"><button class="draft-button" data-action="save-draft" ${arrangingBusy ? "disabled" : ""}>保存草稿</button><button class="arrange-button ${arrangingBusy ? "is-loading" : ""}" data-action="prepare-record" ${arrangingBusy ? "disabled" : ""}>${arrangingBusy ? "AI 正在识别并整理…" : "整理这段记录"}</button></div>
      </div></section>
    </section>`;
  }

  function renderMedia(slot) {
    if (demoMode && qaRoute === "C5") return `<div class="memory-media"><img src="assets/crops/c5-demo-photo-1.png" alt="演示照片：黑色小狗"><img src="assets/crops/c5-demo-photo-2.png" alt="演示照片：灰色小猫"></div>`;
    if (!slot.record.mediaIds.length) return `<div class="memory-media"><div class="media-empty">还没有添加照片<br>文字也可以好好保存这一天</div></div>`;
    return `<div class="memory-media ${slot.record.mediaIds.length===1?"single":""}">${slot.record.mediaIds.slice(0,2).map((id, index) => `<div class="media-empty" data-media-view="${id}">正在读取媒体…${slot.record.aiImageNotes?.[index] ? `<small>${escapeHTML(slot.record.aiImageNotes[index])}</small>` : ""}</div>`).join("")}</div>`;
  }

  function renderC5(s) {
    const slot = currentSlot(s), task = taskFor(slot);
    const copy = slot.record.arrangedRecord || slot.record.originalText || "这段记录保持空白。你已经确认完成这件小事，暂时不想写更多。";
    const moods = selectedMoods(slot.record);
    return `<section class="page page-c5" data-route="C5">
      <button class="back-button" data-action="back-c4" aria-label="返回花瓣手账"></button><h1 class="screen-title">手账浏览</h1>
      <img class="layer scene" src="assets/crops/c5-scene.png" alt="花草旁的蒲团子">
      <section class="memory-shell"><article class="memory-paper ai-layout-${slot.record.aiLayout || "balanced"}">
        ${demoMode && qaRoute === "C5" ? `<span class="demo-label">演示样例</span>` : ""}
        <header class="memory-title-row"><img src="assets/crops/c5-seed-mark.png" alt=""><h2>${escapeHTML(task.title)}</h2></header>
        <p class="memory-date">${formatDate(slot.record.date || todayISO()).replace(/（.*?）/,"")}</p>
        <div class="mood-tags">${demoMode && qaRoute === "C5" ? `<span class="mood-tag">有些难过</span><span class="mood-tag">舍不得</span><span class="mood-tag">一点点心安</span>` : (moods.length ? moods.map(mood => `<span class="mood-tag">${escapeHTML(mood)}</span>`).join("") : `<span class="mood-tag">未选择心情</span>`)}</div>
        ${renderMedia(slot)}
        <div class="memory-copy">${escapeHTML(copy).replace(/\n/g,"<br>")}</div>
        <div class="memory-actions"><button class="layout-button" data-action="layout-sheet">调整排版</button><button class="archive-button" data-action="archive">收入籽语</button></div>
      </article></section>
    </section>`;
  }

  function renderC6(s) {
    const count = completedCount(s);
    return `<section class="page page-c6" data-route="C6"><img class="layer scene" src="assets/crops/c6-scene-clean.png" alt="蒲团子看着种子飞入花门"><h1 class="success-title">归档成功</h1><p class="success-subtitle">这一片花瓣，已经变成一颗种子</p>
      ${!state.preferences.reducedMotion ? `<img class="flying-seed" src="assets/generated/dandelion-seed-single.png" alt="">` : ""}
      ${progressCard(count)}
      <button class="primary-button go-seeds" data-action="open-d1">去籽语看看</button><button class="secondary-button go-home" data-action="home">返回风原</button>
      ${count === 7 ? `<button class="skip-motion" data-action="open-g1">成熟预览</button>` : `<button class="skip-motion" data-action="skip-motion">跳过动效</button>`}
    </section>`;
  }

  function renderD1(s) {
    const count = completedCount(s);
    return `<section class="page page-d1" data-route="D1">
      <header class="seed-home-head"><h1>籽语</h1><p>小小的种子，收着走过的日子</p><span><b>${count}/7</b> 已收好</span></header>
      <img class="seed-garden" src="assets/crops/d1-garden.png" alt="蒲团子守着花园里的种子柜">
      <section class="seed-cabinet" aria-label="七颗种子收纳柜">
        <img class="cabinet-rim-plate" src="assets/crops/d1-cabinet-rim.png" alt="">
        <div class="seed-slots">${s.slots.map(slot => {
          const ready = Boolean(slot.seedId);
          const recent = ready && slot.seedId === s.arrivalSeedId;
          const image = recent ? "assets/generated/seed-arrival-dome.png" : ready ? "assets/crops/d1-seed-active.png" : "assets/crops/d1-seed-empty.png";
          return `<button class="seed-slot ${ready ? "is-ready" : "is-waiting"} ${recent ? "is-arriving" : ""}" ${ready ? `data-open-seed="${slot.ordinal}"` : `data-waiting-seed="${slot.ordinal}"`} aria-label="${ready ? `查看第${slot.ordinal}颗种子：${escapeHTML(taskFor(slot).title)}` : `第${slot.ordinal}颗种子等待中`}">
            <span class="seed-jar"><img src="${image}" alt=""><i>${slot.ordinal}</i></span>
            <strong>${ready ? escapeHTML(taskFor(slot).title) : "等待中"}</strong>
            <small>${ready ? shortDate(slot.record.date || slot.archivedAt) : "等待中"}</small>
          </button>`;
        }).join("")}</div>
      </section>
      <p class="seed-home-hint">点击已收好的种子，查看这段回忆的详情吧</p>
      ${nav("seeds")}
    </section>`;
  }

  function shortDate(value) {
    if (!value) return "已收好";
    const iso = String(value).slice(0, 10);
    const date = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "已收好";
    return `${two(date.getMonth() + 1)}.${two(date.getDate())}`;
  }

  function seedPill(slot) { return `<span class="seed-count-pill"><b>${slot.ordinal}/7</b> 种子</span>`; }

  function demoMediaMarkup(mode = "detail") {
    const item = (src, label, alt, index) => mode === "edit"
      ? `<div class="seed-media-item ${mode}" data-demo-media="${src}" tabindex="0" role="button" aria-label="${label}"><img src="${src}" alt="${alt}"><button class="media-remove" data-demo-remove aria-label="移除演示媒体 ${index}"></button></div>`
      : `<button class="seed-media-item ${mode}" data-demo-media="${src}" aria-label="${label}"><img src="${src}" alt="${alt}"></button>`;
    const first = item("assets/crops/c5-demo-photo-1.png", "查看黑色小狗照片", "黑色小狗在吃被分享的食物", 1);
    const second = item("assets/crops/c5-demo-photo-2.png", "查看灰色小猫照片", "灰色小猫和食物", 2);
    return first + second;
  }

  function seedMediaMarkup(slot, mode = "detail", record = slot.record) {
    if (demoMode && ["D2", "D3", "D4"].includes(qaRoute)) return demoMediaMarkup(mode);
    const ids = record.mediaIds || [];
    if (!ids.length) return mode === "edit" ? "" : `<div class="seed-media-empty">还没有添加照片或视频</div>`;
    return ids.slice(0, mode === "edit" ? 4 : 2).map((id, index) => mode === "edit"
      ? `<div class="seed-media-item edit" data-media-view="${id}" data-media-preview="true" tabindex="0" role="button" aria-label="查看媒体 ${index + 1}"><span>正在读取媒体…</span><button class="media-remove" data-remove-media="${id}" aria-label="移除媒体 ${index + 1}"></button></div>`
      : `<button class="seed-media-item ${mode}" data-media-view="${id}" data-media-preview="true" aria-label="查看媒体 ${index + 1}"><span>正在读取媒体…</span></button>`).join("");
  }

  function renderD2(s) {
    const slot = selectedSeedSlot(s);
    if (!slot) return renderD1(s);
    const record = displayRecord(slot), task = taskFor(slot), moods = selectedMoods(record);
    const copy = record.arrangedRecord || record.originalText || "这段回忆暂时保持空白。";
    return `<section class="page page-d2" data-route="D2">
      <button class="back-button" data-action="back-d1" aria-label="返回籽语"></button><h1 class="screen-title">查看回忆</h1>${seedPill(slot)}
      <img class="memory-header-art" src="assets/crops/d2-memory-header.png" alt="玻璃种子罩、花朵和蒲团子">
      <article class="seed-memory-card">
        <header class="seed-memory-meta"><span class="seed-mark"><img src="assets/crops/d3-seed-mark-reference.png" alt=""></span><div class="seed-memory-title"><h2>${escapeHTML(task.title)}</h2><time>${formatDate(record.date || slot.archivedAt).replace(/（.*?）/, "")}</time></div>
          <div class="memory-moods"><span>当时的心情</span><div class="memory-mood-strip">${memoryMoodMarkup(record)}</div></div>
        </header>
        <div class="seed-memory-media">${seedMediaMarkup(slot, "detail")}</div>
        <div class="seed-memory-copy">${escapeHTML(copy).replace(/\n/g, "<br>")}</div>
      </article>
      <div class="seed-detail-actions"><button data-action="edit-seed">编辑记录</button><button data-action="share-seed">分享这颗种子</button></div>
    </section>`;
  }

  function renderD3(s) {
    const slot = selectedSeedSlot(s);
    if (!slot) return renderD1(s);
    const record = slot.record.editDraft || slot.record, task = taskFor(slot);
    const custom = record.customMoods || [];
    return `<section class="page page-d3" data-route="D3">
      <button class="back-button" data-action="back-d2-edit" aria-label="返回回忆"></button><h1 class="screen-title">编辑种子</h1>${seedPill(slot)}
      <img class="edit-header-art" src="assets/crops/d3-edit-header.png" alt="蒲团子和花园">
      <main class="seed-edit-form">
        <section class="edit-date-card"><img src="assets/crops/c4-calendar.png" alt=""><span>记录日期</span><output>${formatDate(record.date || todayISO())}</output><button class="date-trigger" data-action="pick-seed-date" aria-label="修改种子记录日期"></button><input id="seed-edit-date" type="date" value="${record.date || todayISO()}" aria-label="记录日期"></section>
        <section class="edit-block story-block"><h2>事情经过</h2><textarea class="seed-edit-story" maxlength="1000" aria-label="事情经过">${escapeHTML(record.originalText || "")}</textarea><small><b data-story-count>${(record.originalText || "").length}</b>/1000</small></section>
        <section class="edit-block edit-mood-block"><h2>当时的心情</h2><div class="moods seed-edit-moods" role="group" aria-label="心情可多选，左右滑动查看更多">${["开心","平静","放松","低落"].map(name => moodButton(name,slot,"preset",record)).join("")}${custom.map(name => moodButton(name,slot,"custom",record)).join("")}${moodButton("添加",slot,"add",record)}</div></section>
        <section class="edit-block edit-media-block"><h2>照片 / 视频</h2><div class="edit-media-grid">${seedMediaMarkup(slot,"edit",record)}<button class="add-seed-media" data-action="add-seed-media" aria-label="添加照片或视频"><img src="assets/generated/media-add-image2.png" alt=""></button></div><input id="seed-media-input" hidden type="file" accept="image/*,video/*" multiple></section>
        <section class="edit-block note-block"><h2>补充备注</h2><textarea class="seed-edit-note" maxlength="200" placeholder="还可以记录一些当时的想法…" aria-label="私人补充备注">${escapeHTML(record.privateNote || "")}</textarea><small><b data-note-count>${(record.privateNote || "").length}</b>/200</small></section>
      </main>
      <button class="save-rearrange" data-action="save-seed-edit"><span>保存并重新排版</span></button>
    </section>`;
  }

  function renderD4(s) {
    const slot = selectedSeedSlot(s);
    if (!slot) return renderD1(s);
    const record = slot.record, task = taskFor(slot), settings = record.shareSettings || { hideIdentityDate: true, excludePrivateNote: true };
    const moods = selectedMoods(record), copy = record.arrangedRecord || record.originalText || "这段回忆暂时保持空白。";
    return `<section class="page page-d4" data-route="D4">
      <button class="back-button" data-action="back-d2" aria-label="返回回忆"></button><h1 class="screen-title">分享这颗种子</h1>${seedPill(slot)}
      <div class="share-garden" aria-hidden="true"></div>
      <article class="share-preview-card" aria-label="分享内容预览">
        <h2>${escapeHTML(task.title)}</h2>
        ${settings.hideIdentityDate ? `<p class="share-date is-hidden">日期已隐藏</p>` : `<p class="share-date">${formatDate(record.date || slot.archivedAt).replace(/（.*?）/, "")}</p>`}
        <div class="share-mood-tags">${moods.length ? moods.slice(0,3).map(mood => `<span>${escapeHTML(mood)}</span>`).join("") : `<span>未记录心情</span>`}</div>
        <div class="share-cover">${seedMediaMarkup(slot,"share")}</div>
        <p class="share-copy">${escapeHTML(copy)}</p>
        ${!settings.excludePrivateNote && record.privateNote ? `<p class="share-note"><b>补充：</b>${escapeHTML(record.privateNote)}</p>` : ""}
      </article>
      <section class="share-settings">
        <button class="share-setting" data-share-setting="hideIdentityDate" role="switch" aria-checked="${settings.hideIdentityDate}"><span><b>隐藏姓名 / 日期</b><small>分享时不显示你的姓名和日期信息</small></span><i class="${settings.hideIdentityDate ? "on" : ""}"></i></button>
        <button class="share-setting" data-share-setting="excludePrivateNote" role="switch" aria-checked="${settings.excludePrivateNote}"><span><b>不附带私人备注</b><small>分享时不包含你写的私人备注内容</small></span><i class="${settings.excludePrivateNote ? "on" : ""}"></i></button>
      </section>
      <p class="share-privacy-note">仅在你主动分享后，其他人才会看到</p>
      <button class="share-primary" data-action="share-now">分享</button><button class="share-cancel" data-action="back-d2">取消</button>
    </section>`;
  }

  function storyMediaMarkup(story, mode = "detail") {
    const media = Array.isArray(story?.media) ? story.media : [];
    if (!media.length) return `<div class="e-story-media-empty">还没有添加照片或视频</div>`;
    return media.map((item, index) => {
      const remove = mode === "edit" ? `<button class="e-media-remove" data-remove-story-media="${index}" aria-label="移除第 ${index + 1} 项媒体"></button>` : "";
      const note = mode === "detail" && story.aiImageNotes?.[index] ? `<small class="e-media-ai-note">${escapeHTML(story.aiImageNotes[index])}</small>` : "";
      if (item.src) return `<div class="e-story-media-item"><button class="e-story-media-open" data-demo-media="${item.src}" aria-label="查看${escapeHTML(item.name || "照片")}"><img src="${item.src}" alt="${escapeHTML(item.name || "故事照片")}"></button>${note}${remove}</div>`;
      return `<div class="e-story-media-item" data-media-view="${escapeHTML(item.id)}" data-media-preview="true" tabindex="0" role="button" aria-label="查看${escapeHTML(item.name || "已上传媒体")}"><span>${escapeHTML(item.name || "读取媒体")}</span>${note}${remove}</div>`;
    }).join("");
  }

  function renderE1() {
    return `<section class="page page-e1" data-route="E1">
      <img class="e-full-scene" src="assets/E/generated/e1-home-scene-image2.png" alt="蒲公英精灵生活的温暖小屋">
      <header class="e-home-brand"><h1>栖所</h1><p>不着急，来这里休息一下吧~</p></header>
      <button class="e-home-entry e-home-stories" data-action="open-e2">你和TA的故事 <span aria-hidden="true">›</span></button>
      <button class="e-home-entry e-home-chat" data-action="open-e6">陪我说说话 <span aria-hidden="true">›</span></button>
      <button class="e-home-entry e-home-quiet" data-action="open-e7">陪我呆一会 <span aria-hidden="true">›</span></button>
      ${nav("place")}
    </section>`;
  }

  function renderStoryLibrary(s) {
    return `<section class="page page-e4 page-e-library" data-route="E4">
      <img class="e-full-scene" src="assets/E/generated/e2-story-cabinet-image2.png" alt="装着五类故事的木质收纳柜">
      <button class="back-button" data-action="back-e1" aria-label="返回栖所"></button><h1 class="screen-title">TA的故事</h1>
      <div class="e-story-drawers" aria-label="故事分类">
        ${storyCategories.map(category => `<button class="e-story-drawer is-${category.color}" data-story-category="${category.key}">
          <img src="assets/E/icons/${category.icon}" alt=""><span><strong>${category.label}</strong><small>${demoMode ? category.demoSubtitle : category.subtitle}</small></span><em>${storyCategoryCount(category,s)} ${category.key === "media" ? "项" : "篇"}</em>
        </button>`).join("")}
      </div>
      ${nav("place")}
    </section>`;
  }

  function renderStoryDetail(s) {
    const story = selectedStory(s), category = selectedStoryCategory(s);
    const siblings = (s.stories || []).filter(item => item.category === category.key);
    const switcher = siblings.length > 1 ? `<div class="e-story-switcher" aria-label="切换本分类故事">${siblings.map(item => `<button data-open-story="${item.id}" class="${item.id === story?.id ? "active" : ""}">${escapeHTML(item.title)}</button>`).join("")}<button data-action="new-story" aria-label="新增本分类故事">＋</button></div>` : "";
    if (!story) return `<section class="page page-e5 page-e-detail" data-route="E5"><img class="e-full-scene" src="assets/E/generated/e3-scrapbook-image2.png" alt="空白故事手账"><button class="back-button" data-action="back-story-library" aria-label="返回故事总览"></button><h1 class="screen-title">${category.label}</h1><section class="e-story-empty"><h2>这里还没有故事</h2><p>等你想写的时候，再从一句话开始也可以。</p><button data-action="new-story">新增故事</button></section></section>`;
    return `<section class="page page-e5 page-e-detail ${switcher ? "has-story-switcher" : ""}" data-route="E5">
      <img class="e-full-scene" src="assets/E/generated/e3-scrapbook-image2.png" alt="花园中的故事手账">
      <button class="back-button" data-action="back-story-library" aria-label="返回故事总览"></button><h1 class="screen-title">手账浏览</h1>
      ${switcher}
      <article class="e-story-paper ai-layout-${story.aiLayout || "balanced"}">
        <span class="e-story-kicker">${category.label}</span><h2>${escapeHTML(story.title)}</h2>
        <time>${shortDate(story.date)}</time><p>${escapeHTML(story.arrangedBody || story.body).replace(/\n/g,"<br>")}</p>
        <div class="e-story-detail-media ${story.media?.length > 2 ? "is-three" : ""}">${storyMediaMarkup(story)}</div>
      </article>
      <div class="e-story-actions"><button data-action="edit-story">编辑故事</button><button data-action="share-story">分享</button></div>
    </section>`;
  }

  function renderStoryEdit(s) {
    const fallback = selectedStory(s) || { id: null, category: s.selectedStoryCategory || "who", title: "", body: "", date: todayISO(), media: [], privateNote: "", demo: false };
    const draft = s.storyEditDraft || JSON.parse(JSON.stringify(fallback));
    const category = storyCategories.find(item => item.key === draft.category) || storyCategories[0];
    return `<section class="page page-e2 page-e-editor" data-route="E2">
      <div class="e-edit-sky" aria-hidden="true"></div><button class="back-button" data-action="back-story-edit" aria-label="返回上一页"></button><h1 class="screen-title">${category.key === "habit" ? "TA的小习惯" : category.label}</h1>
      <main class="e-story-form">
        <section class="e-form-card e-title-card"><label for="e-story-title">章节标题</label><input id="e-story-title" maxlength="12" value="${escapeHTML(draft.title)}"><small><b data-e-title-count>${draft.title.length}</b>/12限</small></section>
        <section class="e-form-card e-body-card"><label for="e-story-body">故事内容</label><textarea id="e-story-body" maxlength="300">${escapeHTML(draft.body)}</textarea><button class="e-private-note-trigger" data-action="edit-story-private-note">私人备注${draft.privateNote ? " · 已填写" : ""}</button><small><b data-e-body-count>${draft.body.length}</b>/300限</small></section>
        <section class="e-form-card e-date-card"><img src="assets/crops/c4-calendar.png" alt=""><span>相关日期</span><output>${formatDate(draft.date)}</output><button class="date-trigger" data-action="pick-story-date" aria-label="选择相关日期"></button><input id="e-story-date" type="date" value="${draft.date || todayISO()}"></section>
        <section class="e-form-card e-media-card"><h2>照片与视频</h2><div class="e-edit-media">${storyMediaMarkup(draft,"edit")}<button class="e-story-media-add" data-action="add-story-media" aria-label="添加照片或视频"><img src="assets/generated/media-add-image2.png" alt=""></button></div><input id="e-story-media-input" hidden type="file" accept="image/*,video/*" multiple></section>
        <label class="e-ai-arrange"><input id="e-ai-arrange" type="checkbox" ${draft.useAI === false ? "" : "checked"}><span><b>AI 识别图片并整理</b><small>保存时会将正文和最多 3 张压缩图片发送给 DeepSeek；视频不会发送</small></span></label>
      </main>
      <div class="e-category-dots" aria-label="故事分类">${storyCategories.map(item => `<button data-story-step="${item.key}" class="${item.key === category.key ? "active" : ""}" aria-label="切换到${item.label}"></button>`).join("")}</div>
      <button class="e-save-story ${arrangingBusy ? "is-loading" : ""}" data-action="save-story" ${arrangingBusy ? "disabled" : ""}>${arrangingBusy ? "正在识别并整理…" : "保存"}</button>
      ${draft.id ? `<button class="e-delete-story" data-action="delete-story">删除这篇故事</button>` : ""}
    </section>`;
  }

  function renderStoryShare(s) {
    const selectedIds = s.shareStoryIds || [], selectedStories = (s.stories || []).filter(story => selectedIds.includes(story.id));
    const preview = selectedStories[0] || selectedStory(s) || s.stories?.[0];
    const pickerCategories = [
      { key: "who", label: "TA 是谁", fallback: "assets/E/media/demo-dog-portrait.png" },
      { key: "habit", label: "小习惯", fallback: "assets/E/media/demo-dog-outdoor.png" },
      { key: "media", label: "影像", fallback: "assets/E/media/demo-pets-resting.png" },
      { key: "words", label: "想说的话", fallback: "assets/E/media/demo-cat-sunlight.png" },
    ];
    const previewSummary = preview?.category === "who"
      ? "豆豆，性格活泼，很粘人"
      : String(preview?.body || "请选择想分享的故事").split(/[。！？\n]/)[0].slice(0, 24);
    const pickerMarkup = pickerCategories.map(item => {
      const story = (s.stories || []).find(candidate => candidate.category === item.key);
      const image = story?.media?.[0]?.src || item.fallback;
      const isSelected = story ? selectedIds.includes(story.id) : false;
      return `<button class="${isSelected ? "selected" : ""}${story ? "" : " is-empty"}" data-share-category="${item.key}" aria-label="${item.label}${isSelected ? "，已选择" : ""}"><img src="${escapeHTML(image)}" alt=""><span>${item.label}</span></button>`;
    }).join("");
    return `<section class="page page-e3 page-e-share" data-route="E3">
      <div class="e-share-garden" aria-hidden="true"></div><button class="back-button" data-action="back-story-detail" aria-label="返回故事"></button><h1 class="screen-title">分享这段故事</h1>
      <article class="e-share-story-card"><h2>${escapeHTML(preview?.title || "选择一段故事")}</h2>${!s.storyShareSettings.hideIdentityDate && preview?.date ? `<time>${shortDate(preview.date)}</time>` : ""}${preview?.media?.[0]?.src ? `<img src="${escapeHTML(preview.media[0].src)}" alt="分享预览照片">` : ""}<p>${escapeHTML(previewSummary)}</p>${!s.storyShareSettings.excludePrivateNote && preview?.privateNote ? `<small>私人备注：${escapeHTML(preview.privateNote)}</small>` : ""}</article>
      <div class="e-share-mode" role="group" aria-label="分享模式"><button class="${s.shareStoryMode === "single" ? "active" : ""}" data-share-mode="single">单张故事</button><button class="${s.shareStoryMode === "collection" ? "active" : ""}" data-share-mode="collection">选定合集</button></div>
      <div class="e-share-picker">${pickerMarkup}</div>
      <section class="e-share-privacy">
        <button data-story-share-setting="hideIdentityDate" role="switch" aria-checked="${s.storyShareSettings.hideIdentityDate}"><i class="e-share-setting-icon is-identity" aria-hidden="true"></i><span>隐藏姓名 / 日期<small>分享时不显示你的姓名和日期信息</small></span><i class="switch ${s.storyShareSettings.hideIdentityDate ? "on" : ""}"></i></button>
        <button data-story-share-setting="excludePrivateNote" role="switch" aria-checked="${s.storyShareSettings.excludePrivateNote}"><i class="e-share-setting-icon is-note" aria-hidden="true"></i><span>不附带私人备注<small>分享时不包含你写的私人备注内容</small></span><i class="switch ${s.storyShareSettings.excludePrivateNote ? "on" : ""}"></i></button>
      </section>
      <p class="e-share-note">仅在你主动分享后，其他人才会看到</p><button class="e-share-primary" data-action="share-stories">分享</button><button class="e-share-cancel" data-action="back-story-detail">取消</button>
    </section>`;
  }

  function renderE6(s) {
    return `<section class="page page-e6" data-route="E6">
      <img class="e-full-scene" src="assets/E/generated/e6-chat-scene-image2.png" alt="蒲公英精灵在窗边陪伴主人">
      <button class="back-button" data-action="back-e1" aria-label="返回栖所"></button><h1 class="screen-title">陪我说说话</h1><button class="e-end-session" data-action="end-chat">结束</button>
      <p class="e-chat-disclosure">AI 陪伴助手 · 请勿发送身份、联系方式等敏感信息</p>
      <div class="e-chat-list" aria-live="polite" aria-busy="${chatSending}">${(s.chatMessages || []).map(message => `<div class="e-message is-${message.role}">${message.role === "assistant" ? `<img src="assets/E/media/pupu-avatar-image2.png" alt="蒲公英精灵">` : ""}<p>${escapeHTML(message.text)}</p></div>`).join("")}${chatSending ? `<div class="e-message is-assistant is-loading"><img src="assets/E/media/pupu-avatar-image2.png" alt=""><p><span>正在整理回应</span></p></div>` : ""}</div>
      <div class="e-chat-composer"><input id="e-chat-input" maxlength="500" placeholder="你想说什么……" aria-label="输入想说的话" ${chatSending ? "disabled" : ""}><button data-action="send-chat" aria-label="发送消息" ${chatSending ? "disabled" : ""}></button></div>
      <div class="e-chat-modes"><button class="active" data-chat-mode="text">文字输入</button><button data-chat-mode="voice">语音对话</button></div>
      <label class="e-chat-save"><input type="checkbox" id="e-chat-persist" ${s.chatPersist ? "checked" : ""}> 同意把本次对话保存在此设备</label>
    </section>`;
  }

  function renderE7(s) {
    const quiet = s.quietSettings || initialState().quietSettings;
    const sounds = [["wind","风声"],["rain","雨声"],["bird","鸟鸣"]];
    return `<section class="page page-e7" data-route="E7">
      <img class="e-full-scene" src="assets/E/generated/e7-quiet-scene-image2.png" alt="蒲公英精灵在窗边安静陪伴">
      <button class="back-button" data-action="back-e1" aria-label="返回栖所"></button><h1 class="screen-title">陪我呆一会</h1><button class="e-end-session" data-action="end-quiet">结束</button>
      <section class="e-quiet-panel">
        <div class="e-sound-options">${sounds.map(([key,label]) => `<button data-quiet-sound="${key}" class="${quiet.sound === key && !quiet.muted ? "active" : ""}"><img src="assets/E/icons/sound-${key}-image2.png" alt=""><span>${label}</span></button>`).join("")}</div>
        <label class="e-volume"><span>音量</span><input id="e-volume" type="range" min="0" max="100" value="${quiet.volume}" ${quiet.muted ? "disabled" : ""}></label>
        <div class="e-timers" role="group" aria-label="定时结束">${[15,30,0].map(value => `<button data-quiet-timer="${value}" class="${quiet.timerMinutes === value ? "active" : ""}">${value ? `${value} 分钟` : "不定时"}</button>`).join("")}</div>
        <button class="e-mute ${quiet.muted ? "active" : ""}" data-action="toggle-quiet-mute">${quiet.muted ? "恢复声音" : "静音"}</button>
        <p>${quiet.sound ? "声音只在你主动选择后播放，离开页面会停止。" : "选择一种声音，或只是安静地坐一会。"}</p>
      </section>
    </section>`;
  }

  function renderPlaceholder(route) {
    const name = route === "E" ? "栖所" : "私屿";
    return `<section class="page plain-page subpage" data-route="${route}"><div class="placeholder-card"><h1>${name}</h1><p>该模块尚未在 C「风原」原型中实现。这里保留清晰入口，不编造个人资料、宠物照片或实体进度。</p></div>${nav(route === "E" ? "place" : "isle")}</section>`;
  }

  function renderF() {
    return `<section class="page page-f-host" data-route="F"><iframe class="private-island-frame" src="private-island/index.html#f1" title="私屿" loading="eager"></iframe></section>`;
  }

  function renderG1(s) {
    return `<section class="page page-g1" data-route="G1"><header class="brand"><h1>风原</h1><p>让思念，在风里生长</p></header><img class="layer scene" src="assets/crops/c1-scene.png" alt="蒲团子陪着已经成熟的白色蒲公英">${fieldFlower(7)}<section class="mature-card"><span>07 / 07</span><h2>蒲公英成熟了</h2><p>七次温柔的告别，让整朵蒲公英变成了白色绒球。它会继续留在风原，陪你慢慢回望。</p></section><button class="primary-button mature-home" data-action="home">回到风原</button>${nav("field")}</section>`;
  }

  function render() {
    stopMotion();
    const source = qaRoute ? previewState(qaRoute) : state;
    const route = qaRoute || source.route || "C1";
    const views = { C1: renderC1, C2: renderC2, C3: renderC3, C4: renderC4, C5: renderC5, C6: renderC6, D1: renderD1, D2: renderD2, D3: renderD3, D4: renderD4, E1: renderE1, E2: renderStoryEdit, E3: renderStoryShare, E4: renderStoryLibrary, E5: renderStoryDetail, E6: renderE6, E7: renderE7, F: renderF };
    stage.classList.toggle("reduce-motion", Boolean(source.preferences.reducedMotion));
    stage.innerHTML = views[route] ? views[route](source) : route === "E" ? renderE1(source) : route === "F" ? renderPlaceholder(route) : renderG1(source);
    if (demoMode) stage.insertAdjacentHTML("beforeend", `<span class="mobile-demo-badge">演示样例 · 照片与文字仅作高保真对照</span>`);
    bindEvents(source);
    if (route === "C1" && !qaRoute) installMotion();
    if (["C5", "D2", "D3", "D4", "E2", "E3", "E5"].includes(route) && !(demoMode && qaRoute)) hydrateMediaPreviews(source);
    if (route === "E6") requestAnimationFrame(() => { const list = stage.querySelector(".e-chat-list"); if (list) list.scrollTop = list.scrollHeight; });
    if (route === "D1" && source.arrivalSeedId && !qaRoute) {
      requestAnimationFrame(() => { state.arrivalSeedId = null; saveState(); });
    }
    updateDebug();
  }

  function bindEvents(source) {
    stage.querySelectorAll("[data-action]").forEach(node => node.addEventListener("click", () => handleAction(node.dataset.action, source)));
    stage.querySelectorAll("[data-nav]").forEach(node => node.addEventListener("click", () => handleNav(node.dataset.nav)));
    stage.querySelectorAll("[data-mood]").forEach(node => node.addEventListener("click", () => chooseMood(node.dataset.mood, node.dataset.moodKind)));
    stage.querySelectorAll("[data-remove-media]").forEach(node => node.addEventListener("click", event => { event.stopPropagation(); removeMedia(node.dataset.removeMedia); }));
    stage.querySelectorAll("[data-demo-remove]").forEach(node => node.addEventListener("click", event => { event.stopPropagation(); showToast("演示样例中的照片不可删除"); }));
    stage.querySelectorAll("[data-open-seed]").forEach(node => node.addEventListener("click", () => openSeed(Number(node.dataset.openSeed))));
    stage.querySelectorAll("[data-waiting-seed]").forEach(node => node.addEventListener("click", () => showToast("这颗种子还在等待中，收好对应的回忆后，它就会来到这里")));
    stage.querySelectorAll("[data-share-setting]").forEach(node => node.addEventListener("click", () => toggleShareSetting(node.dataset.shareSetting)));
    stage.querySelectorAll("[data-story-category]").forEach(node => node.addEventListener("click", () => openStoryCategory(node.dataset.storyCategory)));
    stage.querySelectorAll("[data-open-story]").forEach(node => node.addEventListener("click", () => openStory(node.dataset.openStory)));
    stage.querySelectorAll("[data-story-step]").forEach(node => node.addEventListener("click", () => switchStoryCategory(node.dataset.storyStep)));
    stage.querySelectorAll("[data-remove-story-media]").forEach(node => node.addEventListener("click", event => { event.stopPropagation(); removeStoryMedia(Number(node.dataset.removeStoryMedia)); }));
    stage.querySelectorAll("[data-share-mode]").forEach(node => node.addEventListener("click", () => setStoryShareMode(node.dataset.shareMode)));
    stage.querySelectorAll("[data-share-story]").forEach(node => node.addEventListener("click", () => toggleStoryShare(node.dataset.shareStory)));
    stage.querySelectorAll("[data-share-category]").forEach(node => node.addEventListener("click", () => chooseStoryShareCategory(node.dataset.shareCategory)));
    stage.querySelectorAll("[data-story-share-setting]").forEach(node => node.addEventListener("click", () => toggleStoryShareSetting(node.dataset.storyShareSetting)));
    stage.querySelectorAll("[data-quiet-sound]").forEach(node => node.addEventListener("click", () => chooseQuietSound(node.dataset.quietSound)));
    stage.querySelectorAll("[data-quiet-timer]").forEach(node => node.addEventListener("click", () => setQuietTimer(Number(node.dataset.quietTimer))));
    stage.querySelectorAll("[data-chat-mode]").forEach(node => node.addEventListener("click", () => { if (node.dataset.chatMode === "voice") startCompanionSpeech(); }));
    stage.querySelectorAll("[data-demo-media]").forEach(node => {
      node.addEventListener("click", event => { if (!event.target.closest("[data-demo-remove]")) openDemoMedia(node.dataset.demoMedia); });
      if (node.tagName !== "BUTTON") node.addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && !event.target.closest("[data-demo-remove]")) { event.preventDefault(); openDemoMedia(node.dataset.demoMedia); } });
    });
    const date = stage.querySelector("#record-date");
    if (date) date.addEventListener("change", event => { const slot = currentSlot(); slot.record.date = event.target.value; slot.record.updatedAt = new Date().toISOString(); slot.status = "record_draft"; saveState(); render(); });
    const seedDate = stage.querySelector("#seed-edit-date");
    if (seedDate) seedDate.addEventListener("change", event => { const slot = selectedSeedSlot(); if (!slot?.record.editDraft) return; slot.record.editDraft.date = event.target.value; saveState(); render(); });
    const story = stage.querySelector(".story-text");
    if (story) story.addEventListener("input", event => { clearTimeout(autosaveTimer); autosaveTimer = setTimeout(() => { const slot = currentSlot(); slot.record.originalText = event.target.value; slot.record.updatedAt = new Date().toISOString(); slot.status = "record_draft"; saveState(); showToast("草稿已自动保存"); }, 420); });
    const seedStory = stage.querySelector(".seed-edit-story");
    if (seedStory) seedStory.addEventListener("input", event => { const slot = selectedSeedSlot(); if (!slot?.record.editDraft) return; slot.record.editDraft.originalText = event.target.value; stage.querySelector("[data-story-count]").textContent = event.target.value.length; clearTimeout(autosaveTimer); autosaveTimer = setTimeout(saveState, 260); });
    const seedNote = stage.querySelector(".seed-edit-note");
    if (seedNote) seedNote.addEventListener("input", event => { const slot = selectedSeedSlot(); if (!slot?.record.editDraft) return; slot.record.editDraft.privateNote = event.target.value; stage.querySelector("[data-note-count]").textContent = event.target.value.length; clearTimeout(autosaveTimer); autosaveTimer = setTimeout(saveState, 260); });
    const input = stage.querySelector("#media-input");
    if (input) input.addEventListener("change", event => storeMedia([...event.target.files]));
    const seedInput = stage.querySelector("#seed-media-input");
    if (seedInput) seedInput.addEventListener("change", event => storeMedia([...event.target.files], true));
    const storyDate = stage.querySelector("#e-story-date");
    if (storyDate) storyDate.addEventListener("change", event => { if (!state.storyEditDraft) return; state.storyEditDraft.date = event.target.value; state.storyEditDraft.dirty = true; saveState(); render(); });
    const storyTitle = stage.querySelector("#e-story-title");
    if (storyTitle) storyTitle.addEventListener("input", event => { if (!state.storyEditDraft) return; state.storyEditDraft.title = event.target.value; state.storyEditDraft.dirty = true; stage.querySelector("[data-e-title-count]").textContent = event.target.value.length; saveState(); });
    const storyBody = stage.querySelector("#e-story-body");
    if (storyBody) storyBody.addEventListener("input", event => { if (!state.storyEditDraft) return; state.storyEditDraft.body = event.target.value; state.storyEditDraft.dirty = true; stage.querySelector("[data-e-body-count]").textContent = event.target.value.length; saveState(); });
    const aiArrange = stage.querySelector("#e-ai-arrange");
    if (aiArrange) aiArrange.addEventListener("change", event => { if (!state.storyEditDraft) return; state.storyEditDraft.useAI = event.target.checked; state.storyEditDraft.dirty = true; saveState(); });
    const storyMediaInput = stage.querySelector("#e-story-media-input");
    if (storyMediaInput) storyMediaInput.addEventListener("change", event => storeStoryMedia([...event.target.files]));
    const chatInput = stage.querySelector("#e-chat-input");
    if (chatInput) chatInput.addEventListener("keydown", event => { if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); sendChatMessage(); } });
    const chatPersist = stage.querySelector("#e-chat-persist");
    if (chatPersist) chatPersist.addEventListener("change", event => { state.chatPersist = event.target.checked; saveState(); showToast(event.target.checked ? "本次对话会保存在此设备" : "本次对话只在当前页面保留"); });
    const volume = stage.querySelector("#e-volume");
    if (volume) volume.addEventListener("input", event => setQuietVolume(Number(event.target.value)));
  }

  function handleAction(action) {
    const slot = currentSlot();
    if (action === "offer") return offerTask();
    if (action === "draw-task") return drawTaskFromAI();
    if (action === "resume") return routeTo(slot.status === "record_draft" || slot.status === "ready_to_archive" ? "C4" : "C3");
    if (action === "open-g1") return routeTo("G1");
    if (action === "view-task") return routeTo("C3");
    if (action === "back-c2") return routeTo("C2");
    if (action === "back-c3") return routeTo("C3");
    if (action === "back-c4") return routeTo("C4");
    if (action === "back-d1") return routeTo("D1");
    if (action === "back-d2") return routeTo("D2");
    if (action === "back-d2-edit") { showToast("编辑草稿已自动保存"); return routeTo("D2"); }
    if (action === "accept-task") { slot.status = "accepted"; if (!slot.record.date) slot.record.date = todayISO(); saveState(); return routeTo("C4"); }
    if (action === "replace-task") return replaceTask();
    if (action === "defer-task") { slot.status = "deferred"; saveState(); showToast("这件小事会在风原等你"); return routeTo("C1"); }
    if (action === "add-media") return stage.querySelector("#media-input").click();
    if (action === "add-seed-media") return stage.querySelector("#seed-media-input").click();
    if (action === "pick-date") { const input = stage.querySelector("#record-date"); try { if (input.showPicker) input.showPicker(); else input.click(); } catch { input.focus(); } return; }
    if (action === "pick-seed-date") { const input = stage.querySelector("#seed-edit-date"); try { if (input.showPicker) input.showPicker(); else input.click(); } catch { input.focus(); } return; }
    if (action === "speech") return startSpeech();
    if (action === "save-draft") return saveDraft();
    if (action === "prepare-record") return prepareRecord();
    if (action === "layout-sheet") return openLayoutSheet();
    if (action === "archive") return archiveCurrent();
    if (action === "open-d1") { state.arrivalSeedId = state.lastArchivedSeedId; return routeTo("D1"); }
    if (action === "edit-seed") return beginSeedEdit();
    if (action === "share-seed") return routeTo("D4");
    if (action === "save-seed-edit") return saveSeedEdit();
    if (action === "share-now") return shareCurrentSeed();
    if (action === "home") return routeTo("C1");
    if (action === "skip-motion") { state.preferences.reducedMotion = true; saveState(); return render(); }
    if (action === "open-e2") return routeTo("E4");
    if (action === "open-e6") return routeTo("E6");
    if (action === "open-e7") return routeTo("E7");
    if (action === "back-e1") return routeTo("E1");
    if (action === "back-story-library") return routeTo("E4");
    if (action === "back-story-detail") return routeTo("E5");
    if (action === "new-story") return beginStoryEdit(null, state.route === "E4" ? "E4" : "E5");
    if (action === "edit-story") return beginStoryEdit(state.selectedStoryId, "E5");
    if (action === "share-story") { state.shareStoryIds = state.selectedStoryId ? [state.selectedStoryId] : []; state.shareStoryMode = "single"; saveState(); return routeTo("E3"); }
    if (action === "back-story-edit") return leaveStoryEdit();
    if (action === "pick-story-date") { const input = stage.querySelector("#e-story-date"); try { if (input.showPicker) input.showPicker(); else input.click(); } catch { input.focus(); } return; }
    if (action === "add-story-media") return stage.querySelector("#e-story-media-input")?.click();
    if (action === "edit-story-private-note") return editStoryPrivateNote();
    if (action === "save-story") return saveStory();
    if (action === "delete-story") return deleteStory();
    if (action === "share-stories") return shareStories();
    if (action === "send-chat") return sendChatMessage();
    if (action === "end-chat") { if (!confirm("结束这次陪伴，回到栖所吗？")) return; return routeTo("E1"); }
    if (action === "toggle-quiet-mute") return toggleQuietMute();
    if (action === "end-quiet") { showToast("这段安静的时间已经收好"); return routeTo("E1"); }
  }

  function personalStorySummaries(limit = 6) {
    return (state.stories || []).filter(story => !story.demo).slice(-limit).map(story => {
      const body = story.aiSummary || story.arrangedBody || story.body || "";
      return `${story.title || "未命名故事"}：${String(body).slice(0, 320)}`;
    }).filter(Boolean);
  }

  function previousTaskTitles() {
    return state.slots.filter(slot => slot.status === "archived").map(slot => taskFor(slot).title).filter(Boolean);
  }

  async function drawTaskFromAI(isReplacement = false) {
    const slot = currentSlot();
    if (taskDrawBusy || slot.status === "archived") return;
    taskDrawBusy = true;
    taskDrawPhase = "drawing";
    stopMotion();
    render();
    try {
      const payload = await callAI("generate_task", {
        step: slot.ordinal,
        stories: personalStorySummaries(8),
        previousTasks: previousTaskTitles(),
        excludedTitles: (slot.replacementHistory || []).map(item => item.title).filter(Boolean)
      });
      slot.generatedTask = payload.task;
      slot.status = isReplacement ? "replaced" : "offered";
      saveState();
      await new Promise(resolve => setTimeout(resolve, state.preferences.reducedMotion ? 50 : 720));
      showToast(personalStorySummaries(1).length ? "已结合栖所故事生成这一件小事" : "栖所还没有你的故事，先生成了一件通用小事");
      taskDrawPhase = "idle";
      routeTo("C2");
    } catch (error) {
      const variants = tasks[slot.ordinal - 1] || tasks[0];
      slot.variant = (slot.variant + (isReplacement ? 1 : 0)) % variants.length;
      slot.generatedTask = null;
      slot.status = isReplacement ? "replaced" : "offered";
      saveState();
      taskDrawPhase = "idle";
      showToast(error?.code === "SERVICE_NOT_CONFIGURED" ? "AI 尚未配置，已使用内置告别小事" : "AI 暂时没连上，已为你保留一件内置小事");
      routeTo("C2");
    } finally { taskDrawBusy = false; }
  }

  async function offerTask() {
    const slot = currentSlot();
    if (slot.status !== "not_offered") { showToast("还有一件小事等着你"); return routeTo("C2"); }
    if (taskDrawPhase === "armed") return drawTaskFromAI();
    const permission = await requestMotionPermission();
    taskDrawPhase = "armed";
    render();
    showToast(permission === "denied" ? "未获得动作权限，点按按钮也能抽取" : "轻轻摇晃手机，或点按按钮抽取");
  }

  async function replaceTask() {
    const slot = currentSlot();
    if (taskDrawBusy) return;
    slot.replacementHistory.push({ title: taskFor(slot).title, replacedAt: new Date().toISOString() });
    slot.generatedTask = null;
    slot.status = "not_offered";
    saveState();
    taskDrawPhase = "armed";
    await drawTaskFromAI(true);
  }

  function chooseMood(name, kind = "preset") {
    const slot = state.route === "D3" ? selectedSeedSlot() : currentSlot();
    if (!slot) return;
    const record = editableRecord(slot);
    record.moods = selectedMoods(record);
    record.customMoods ||= [];
    if (name === "__add__" || kind === "add") {
      const custom = prompt("写下你的心情（最多 8 个字）", "");
      if (!custom) return;
      const value = custom.trim().slice(0,8);
      if (!value) return;
      if (!record.customMoods.includes(value)) record.customMoods.push(value);
      if (!record.moods.includes(value)) record.moods.push(value);
    } else if (record.moods.includes(name)) {
      record.moods = record.moods.filter(value => value !== name);
    } else {
      record.moods.push(name);
    }
    record.mood = record.moods[0] || null;
    record.customMood = record.customMoods[0] || null;
    if (state.route !== "D3") slot.status = "record_draft";
    record.updatedAt = new Date().toISOString(); saveState(); render();
  }

  function syncStory() {
    const story = stage.querySelector(".story-text");
    if (story) currentSlot().record.originalText = story.value;
  }

  function saveDraft() {
    syncStory(); const slot = currentSlot(); slot.record.date ||= todayISO(); slot.record.updatedAt = new Date().toISOString(); slot.status = "record_draft"; saveState(); showToast("草稿已保存，可以随时回来"); setTimeout(() => routeTo("C1"), 380);
  }

  function acceptAIDisclosure(hasImages) {
    if (state.aiDisclosureAccepted) return true;
    const detail = hasImages ? "正文和最多 3 张压缩图片" : "正文";
    const accepted = confirm(`为了使用 AI 整理，${detail}会通过本站的安全代理发送给 DeepSeek。视频、私人备注和原始文件不会发送。是否继续？`);
    if (accepted) { state.aiDisclosureAccepted = true; saveState(); }
    return accepted;
  }

  async function mediaBlobs(ids) {
    const unique = [...new Set((ids || []).filter(Boolean))];
    if (!unique.length) return [];
    try {
      const db = await openDB();
      const results = [];
      for (const id of unique) {
        const data = await new Promise(resolve => { const request = db.transaction("media").objectStore("media").get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => resolve(null); });
        if (data?.file instanceof Blob) results.push(data.file);
      }
      return results;
    } catch { return []; }
  }

  async function arrangeRecordWithAI(slot, record = slot.record) {
    const blobs = await mediaBlobs(record.mediaIds);
    const imageBlobs = blobs.filter(blob => blob.type.startsWith("image/"));
    if (!acceptAIDisclosure(Boolean(imageBlobs.length))) return false;
    const images = await prepareImagesForAI(imageBlobs);
    const payload = await callAI("arrange_record", {
      text: record.originalText,
      taskTitle: taskFor(slot).title,
      moods: selectedMoods(record),
      images
    });
    record.arrangedRecord = payload.arrangement.arrangedText;
    record.aiSummary = payload.arrangement.summary;
    record.aiImageNotes = payload.arrangement.imageNotes;
    record.aiLayout = payload.arrangement.layout;
    return true;
  }

  async function prepareRecord() {
    if (arrangingBusy) return;
    syncStory(); const slot = currentSlot(); slot.record.date ||= todayISO();
    if (!slot.record.originalText.trim() && !slot.record.mediaIds.length) {
      if (!confirm("我已完成这件小事，暂时不想写更多。要继续整理吗？")) return;
      slot.record.minimalConfirmed = true;
    }
    slot.record.updatedAt = new Date().toISOString();
    slot.record.arrangedRecord = arrangeLocally(slot.record.originalText);
    slot.status = "ready_to_archive";
    saveState();
    arrangingBusy = true;
    render();
    try {
      const usedAI = await arrangeRecordWithAI(slot);
      showToast(usedAI ? "文字和图片已经整理好" : "已使用本机排版，内容没有离开设备");
    } catch (error) {
      showToast(error?.code === "SERVICE_NOT_CONFIGURED" ? "AI 尚未配置，已使用本机排版" : "AI 暂时没连上，记录已用本机排版保存");
    } finally {
      arrangingBusy = false;
      saveState();
      routeTo("C5");
    }
  }

  function openLayoutSheet() {
    if (stage.querySelector(".layout-sheet")) return;
    const sheet = document.createElement("section"); sheet.className = "layout-sheet"; sheet.innerHTML = `<h3>调整照片与文字排版</h3><div class="layout-options"><button class="layout-option" data-layout="reference">参考排版</button><button class="layout-option" data-layout="photo-first">照片优先</button><button class="layout-option" data-layout="text-first">文字优先</button></div><button class="sheet-edit" data-edit>返回编辑原文</button>`;
    stage.append(sheet);
    sheet.querySelectorAll("[data-layout]").forEach(button => button.addEventListener("click", () => { currentSlot().layoutChoice = button.dataset.layout; saveState(); showToast("排版偏好已保存"); sheet.remove(); }));
    sheet.querySelector("[data-edit]").addEventListener("click", () => routeTo("C4"));
  }

  function archiveCurrent() {
    if (submittingArchive) return;
    const slot = currentSlot();
    if (slot.status === "archived" || slot.seedId) return routeTo("C6");
    if (slot.status !== "ready_to_archive" || (!slot.record.originalText.trim() && !slot.record.mediaIds.length && !slot.record.minimalConfirmed)) { showToast("请先完成记录或确认最简记录"); return; }
    if (!confirm("确认把这段记录收入籽语吗？归档后会点亮一颗种子。")) return;
    submittingArchive = true;
    slot.seedId = `seed-${slot.taskId}`; slot.archivedAt = new Date().toISOString(); slot.status = "archived";
    slot.record.arrangedRecord ||= slot.record.originalText;
    state.selectedSeedOrdinal = slot.ordinal;
    state.lastArchivedSeedId = slot.seedId;
    state.route = "C6"; saveState(); submittingArchive = false; render();
  }

  function handleNav(key) {
    if (key === "field") return routeTo("C1");
    if (key === "seeds") return routeTo("D1");
    routeTo(key === "place" ? "E1" : "F");
  }

  function openStoryCategory(categoryKey) {
    state.selectedStoryCategory = categoryKey;
    const story = state.stories.find(item => item.category === categoryKey);
    state.selectedStoryId = story?.id || null;
    saveState(); routeTo("E5");
  }

  function openStory(storyId) {
    const story = state.stories.find(item => item.id === storyId);
    if (!story) return;
    state.selectedStoryId = story.id;
    state.selectedStoryCategory = story.category;
    saveState(); render();
  }

  function beginStoryEdit(storyId, source = "E5") {
    const story = state.stories.find(item => item.id === storyId);
    state.storyEditSource = source;
    state.storyEditDraft = story ? JSON.parse(JSON.stringify(story)) : { id: null, category: state.selectedStoryCategory || "who", title: "", body: "", date: todayISO(), media: [], privateNote: "", demo: false, dirty: false };
    state.storyEditDraft.dirty = false;
    state.storyEditDraft.useAI ??= true;
    state.storyEditDraft.addedMediaIds = [];
    state.storyEditDraft.removedMediaIds = [];
    saveState(); routeTo("E2");
  }

  async function leaveStoryEdit() {
    if (state.storyEditDraft?.dirty) {
      const choice = prompt("这篇故事还没有保存。输入 1 保存后离开，2 放弃修改，3 继续编辑。", "3");
      if (choice === "1") return saveStory();
      if (choice !== "2") return;
    }
    await deleteMediaIds(state.storyEditDraft?.addedMediaIds || []);
    state.storyEditDraft = null;
    saveState(); routeTo(state.storyEditSource === "E4" ? "E4" : "E5");
  }

  function switchStoryCategory(categoryKey) {
    if (!state.storyEditDraft) return;
    if (state.storyEditDraft.dirty && !confirm("切换分类会保留当前内容，但请记得保存。要继续吗？")) return;
    state.storyEditDraft.category = categoryKey;
    state.storyEditDraft.dirty = true;
    state.selectedStoryCategory = categoryKey;
    saveState(); render();
  }

  async function storeStoryMedia(files) {
    if (!state.storyEditDraft || !files.length) return;
    const valid = files.filter(file => /^(image|video)\//.test(file.type) && file.size <= 8 * 1024 * 1024);
    if (valid.length !== files.length) showToast("仅支持 8MB 以内的图片或视频");
    if (!valid.length) return;
    try {
      const db = await openDB(), tx = db.transaction("media", "readwrite"), store = tx.objectStore("media");
      valid.forEach(file => {
        const id = `story-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        store.put({ id, file, name: file.name, type: file.type });
        state.storyEditDraft.media.push({ id, type: file.type.startsWith("video/") ? "video" : "image", name: file.name });
        state.storyEditDraft.addedMediaIds ||= [];
        state.storyEditDraft.addedMediaIds.push(id);
      });
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
      state.storyEditDraft.dirty = true; saveState(); render(); showToast("媒体已保存在此设备");
    } catch { showToast("当前浏览器无法保存这项媒体"); }
  }

  async function removeStoryMedia(index) {
    if (!state.storyEditDraft?.media?.[index] || !confirm("移除这项照片或视频吗？")) return;
    const [removed] = state.storyEditDraft.media.splice(index, 1);
    state.storyEditDraft.dirty = true;
    if (removed?.id) {
      state.storyEditDraft.addedMediaIds ||= [];
      state.storyEditDraft.removedMediaIds ||= [];
      if (state.storyEditDraft.addedMediaIds.includes(removed.id)) {
        state.storyEditDraft.addedMediaIds = state.storyEditDraft.addedMediaIds.filter(id => id !== removed.id);
        await deleteMediaIds([removed.id]);
      } else {
        state.storyEditDraft.removedMediaIds.push(removed.id);
      }
    }
    saveState(); render();
  }

  async function storyImageBlobs(story) {
    const uploaded = await mediaBlobs((story.media || []).filter(item => item.type !== "video").map(item => item.id));
    const bundled = [];
    for (const item of (story.media || []).filter(item => item.src && item.type !== "video").slice(0, 3)) {
      try { const response = await fetch(item.src); if (response.ok) bundled.push(await response.blob()); } catch {}
    }
    return [...uploaded, ...bundled].filter(blob => blob.type.startsWith("image/")).slice(0, 3);
  }

  async function saveStory() {
    if (arrangingBusy) return;
    const draft = state.storyEditDraft;
    if (!draft) return routeTo("E4");
    draft.title = String(draft.title || "").trim();
    draft.body = String(draft.body || "").trim();
    if (!draft.title || !draft.body) { showToast("请填写章节标题和故事内容"); return; }
    const existingIndex = state.stories.findIndex(item => item.id === draft.id);
    const removedMediaIds = [...new Set(draft.removedMediaIds || [])];
    const saved = { ...draft, id: draft.id || `story-${Date.now()}`, dirty: undefined, addedMediaIds: undefined, removedMediaIds: undefined, updatedAt: new Date().toISOString() };
    if (existingIndex >= 0) state.stories[existingIndex] = saved; else state.stories.push(saved);
    state.selectedStoryId = saved.id;
    state.selectedStoryCategory = saved.category;
    saveState();
    const wantsAI = draft.useAI !== false;
    arrangingBusy = wantsAI;
    if (wantsAI) render();
    if (wantsAI) {
      try {
        const blobs = await storyImageBlobs(saved);
        if (acceptAIDisclosure(Boolean(blobs.length))) {
          const images = await prepareImagesForAI(blobs);
          const payload = await callAI("arrange_story", { title: saved.title, text: saved.body, images });
          saved.arrangedBody = payload.arrangement.arrangedText;
          saved.aiSummary = payload.arrangement.summary;
          saved.aiImageNotes = payload.arrangement.imageNotes;
          saved.aiLayout = payload.arrangement.layout;
          showToast("故事已保存，AI 也完成了图文整理");
        } else showToast("故事已保存，并保留本机原文排版");
      } catch (error) {
        showToast(error?.code === "SERVICE_NOT_CONFIGURED" ? "故事已保存；AI 尚未配置" : "故事已保存；AI 暂时不可用，原文没有丢失");
      }
    } else showToast("故事已经温柔收好");
    arrangingBusy = false;
    state.storyEditDraft = null;
    saveState();
    await deleteMediaIds(removedMediaIds);
    routeTo("E5");
  }

  async function deleteStory() {
    const draft = state.storyEditDraft;
    if (!draft?.id || !confirm("确定删除这篇故事吗？删除后无法从原型中恢复。")) return;
    const original = state.stories.find(item => item.id === draft.id);
    const mediaIds = [...(original?.media || []).map(item => item.id), ...(draft.addedMediaIds || [])].filter(Boolean);
    state.stories = state.stories.filter(item => item.id !== draft.id);
    if (demoMode && original?.demo) state.storyCountAdjust[original.category] = Number(state.storyCountAdjust[original.category] || 0) - 1;
    state.storyEditDraft = null; state.selectedStoryId = null;
    await deleteMediaIds(mediaIds);
    saveState(); showToast("故事已删除"); routeTo("E4");
  }

  function editStoryPrivateNote() {
    if (!state.storyEditDraft) return;
    const note = prompt("这段备注只保存在此设备；分享时默认不附带。", state.storyEditDraft.privateNote || "");
    if (note === null) return;
    state.storyEditDraft.privateNote = note.trim().slice(0, 160);
    state.storyEditDraft.dirty = true;
    saveState(); render();
  }

  async function deleteMediaIds(ids) {
    const unique = [...new Set((ids || []).filter(Boolean))];
    if (!unique.length) return;
    try {
      const db = await openDB(), tx = db.transaction("media", "readwrite"), store = tx.objectStore("media");
      unique.forEach(id => store.delete(id));
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    } catch {}
  }

  function setStoryShareMode(mode) {
    state.shareStoryMode = mode === "collection" ? "collection" : "single";
    if (state.shareStoryMode === "single") state.shareStoryIds = [state.shareStoryIds[0] || state.selectedStoryId].filter(Boolean);
    saveState(); render();
  }

  function toggleStoryShare(id) {
    if (state.shareStoryMode === "single") state.shareStoryIds = [id];
    else state.shareStoryIds = state.shareStoryIds.includes(id) ? state.shareStoryIds.filter(value => value !== id) : [...state.shareStoryIds, id];
    saveState(); render();
  }

  function chooseStoryShareCategory(categoryKey) {
    const story = (state.stories || []).find(item => item.category === categoryKey);
    if (story) return toggleStoryShare(story.id);
    showToast(`“${storyCategories.find(item => item.key === categoryKey)?.label || "该分类"}”还没有故事，可先在手账中添加`);
  }

  function toggleStoryShareSetting(key) {
    if (!["hideIdentityDate", "excludePrivateNote"].includes(key)) return;
    state.storyShareSettings[key] = !state.storyShareSettings[key];
    saveState(); render();
  }

  function buildStoryShareText() {
    const stories = state.stories.filter(story => state.shareStoryIds.includes(story.id));
    return stories.map(story => {
      const lines = [story.title];
      if (!state.storyShareSettings.hideIdentityDate && story.date) lines.push(shortDate(story.date));
      lines.push("", story.body);
      if (!state.storyShareSettings.excludePrivateNote && story.privateNote) lines.push("", `私人备注：${story.privateNote}`);
      return lines.join("\n");
    }).join("\n\n");
  }

  async function shareStories() {
    if (!state.shareStoryIds.length) { showToast("请先选择至少一段故事"); return; }
    const text = buildStoryShareText();
    if (navigator.share) {
      try { await navigator.share({ title: "TA的故事", text }); showToast("已交给系统分享"); return; }
      catch (error) { if (error?.name === "AbortError") { showToast("已取消分享"); return; } }
    }
    openShareFallback(text);
  }

  async function sendChatMessage() {
    if (chatSending) return;
    const input = stage.querySelector("#e-chat-input"), value = input?.value.trim();
    if (!value) { showToast("可以先写下一句话再发送"); return; }
    if (value.length > 500) { showToast("一次最多发送 500 个字"); return; }
    const history = state.chatMessages.slice(-8);
    state.chatMessages.push({ role: "user", text: value });
    chatSending = true;
    chatRequestController?.abort();
    const controller = new AbortController();
    chatRequestController = controller;
    saveState();
    render();
    try {
      const payload = await callAI("companion_chat", { message: value, history, storySummaries: personalStorySummaries(6) }, { signal: controller.signal });
      if (typeof payload.reply !== "string" || !payload.reply.trim()) throw new Error("EMPTY_CHAT_REPLY");
      state.chatMessages.push({ role: "assistant", text: payload.reply.trim() });
    } catch (error) {
      if (error?.name !== "AbortError" && state.route === "E6") {
        showToast(error?.code === "RATE_LIMITED" ? "现在回应的人有点多，请稍后再试" : "暂时没连上陪伴助手，请稍后再试");
      }
    } finally {
      if (chatRequestController === controller) chatRequestController = null;
      chatSending = false;
      saveState();
      if (state.route === "E6") render();
    }
  }

  function cleanupRouteDeparture(nextRoute) {
    if (state.route === "C1" && nextRoute !== "C1" && !taskDrawBusy) taskDrawPhase = "idle";
    if (state.route === "E6" && nextRoute !== "E6") {
      chatRequestController?.abort();
      chatRequestController = null;
      chatSending = false;
      if (!state.chatPersist) state.chatMessages = defaultChatMessages();
    }
    if (state.route === "E7" && nextRoute !== "E7") {
      stopQuietAudio({ clearTimer: true });
      state.quietSettings.sound = null;
      state.quietSettings.muted = false;
      state.quietSettings.endsAt = null;
    }
  }

  function startCompanionSpeech() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || !window.isSecureContext) { showToast("当前环境不支持语音识别，仍可继续文字输入"); return; }
    const recognition = new Recognition(); recognition.lang = "zh-CN"; recognition.interimResults = false;
    recognition.onresult = event => { const input = stage.querySelector("#e-chat-input"); if (!input) return; input.value = [...event.results].map(result => result[0].transcript).join(""); input.focus(); showToast("识别结果已写入输入框"); };
    recognition.onerror = () => showToast("没有获得麦克风权限，仍可继续文字输入");
    try { recognition.start(); showToast("请开始说话，内容会先显示为文字"); } catch { showToast("语音识别暂时无法启动"); }
  }

  function stopQuietAudio({ clearTimer = false } = {}) {
    if (clearTimer) {
      clearTimeout(quietTimerHandle);
      quietTimerHandle = null;
    }
    if (!quietAudio) return;
    try { quietAudio.cleanup?.(); quietAudio.ctx?.close(); } catch {}
    quietAudio = null;
  }

  function startQuietAudio(kind) {
    stopQuietAudio();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) { showToast("当前浏览器不支持环境声，仍可使用静态陪伴模式"); return; }
    try {
      const ctx = new AudioContext(), master = ctx.createGain();
      master.gain.value = Math.max(0, Math.min(1, state.quietSettings.volume / 100)) * .16;
      master.connect(ctx.destination);
      let cleanup = () => {};
      if (kind === "bird") {
        let stopped = false;
        const chirp = () => {
          if (stopped) return;
          const osc = ctx.createOscillator(), gain = ctx.createGain();
          osc.type = "sine"; osc.frequency.setValueAtTime(980, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1450, ctx.currentTime + .18);
          gain.gain.setValueAtTime(.001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.22, ctx.currentTime + .04); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .28);
          osc.connect(gain).connect(master); osc.start(); osc.stop(ctx.currentTime + .3);
        };
        chirp(); const interval = setInterval(chirp, 3200); cleanup = () => { stopped = true; clearInterval(interval); };
      } else {
        const seconds = 3, buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate), data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
        source.buffer = buffer; source.loop = true; filter.type = kind === "rain" ? "highpass" : "lowpass"; filter.frequency.value = kind === "rain" ? 1300 : 680;
        source.connect(filter).connect(master); source.start(); cleanup = () => source.stop();
      }
      quietAudio = { ctx, master, cleanup };
    } catch { showToast("环境声暂时无法播放，仍可安静停留"); }
  }

  function chooseQuietSound(kind) {
    state.quietSettings.sound = state.quietSettings.sound === kind ? null : kind;
    state.quietSettings.muted = false;
    saveState(); render();
    if (state.quietSettings.sound) startQuietAudio(state.quietSettings.sound); else stopQuietAudio();
  }

  function setQuietVolume(value) {
    state.quietSettings.volume = value;
    if (quietAudio?.master) quietAudio.master.gain.value = value / 100 * .16;
    saveState();
  }

  function toggleQuietMute() {
    state.quietSettings.muted = !state.quietSettings.muted;
    saveState(); render();
    if (state.quietSettings.muted) stopQuietAudio(); else if (state.quietSettings.sound) startQuietAudio(state.quietSettings.sound);
  }

  function setQuietTimer(minutes) {
    state.quietSettings.timerMinutes = minutes;
    state.quietSettings.endsAt = minutes ? Date.now() + minutes * 60000 : null;
    clearTimeout(quietTimerHandle);
    if (minutes) quietTimerHandle = setTimeout(() => { stopQuietAudio(); state.quietSettings.sound = null; state.quietSettings.endsAt = null; saveState(); render(); showToast("这段安静的时间已经结束"); }, minutes * 60000);
    saveState(); render();
  }

  function escapeHTML(value) { return String(value).replace(/[&<>"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char])); }

  function openSeed(ordinal) {
    const slot = state.slots[ordinal - 1];
    if (!slot?.seedId) return showToast("这颗种子还在等待中");
    state.selectedSeedOrdinal = ordinal;
    saveState();
    routeTo("D2");
  }

  function beginSeedEdit() {
    const slot = selectedSeedSlot();
    if (!slot) return routeTo("D1");
    if (!slot.record.editDraft) {
      slot.record.editDraft = {
        date: slot.record.date || todayISO(),
        mood: slot.record.mood || null,
        moods: [...selectedMoods(slot.record)],
        customMood: slot.record.customMood || null,
        customMoods: [...(slot.record.customMoods || [])],
        originalText: slot.record.originalText || "",
        privateNote: slot.record.privateNote || "",
        mediaIds: [...(slot.record.mediaIds || [])],
        updatedAt: new Date().toISOString()
      };
      saveState();
    }
    routeTo("D3");
  }

  function arrangeLocally(text) {
    return String(text || "").replace(/\r/g, "").split(/\n{2,}/).map(part => part.trim()).filter(Boolean).join("\n\n");
  }

  async function saveSeedEdit() {
    const slot = selectedSeedSlot();
    if (!slot?.record.editDraft) return routeTo("D2");
    const draft = slot.record.editDraft;
    const button = stage.querySelector(".save-rearrange");
    if (button) { button.disabled = true; button.classList.add("is-loading"); button.querySelector("span").textContent = "正在温柔整理…"; }
    const completedBefore = completedCount();
    slot.record.date = draft.date || todayISO();
    slot.record.mood = draft.mood || null;
    slot.record.moods = [...(draft.moods || [])];
    slot.record.customMood = draft.customMood || null;
    slot.record.customMoods = [...(draft.customMoods || [])];
    slot.record.originalText = draft.originalText || "";
    slot.record.privateNote = draft.privateNote || "";
    slot.record.mediaIds = [...(draft.mediaIds || [])];
    slot.record.arrangedRecord = arrangeLocally(draft.originalText);
    slot.record.updatedAt = new Date().toISOString();
    slot.record.editDraft = null;
    saveState();
    try {
      const usedAI = await arrangeRecordWithAI(slot);
      showToast(usedAI ? "记录已保存，AI 也重新整理好了" : "记录已保存，并保留本机排版");
    } catch {
      showToast("记录已保存；AI 暂时不可用，已保留本机排版");
    }
    saveState();
    if (completedCount() !== completedBefore) throw new Error("Editing a seed must not change archived count");
    routeTo("D2");
  }

  function toggleShareSetting(key) {
    const slot = selectedSeedSlot();
    if (!slot || !["hideIdentityDate", "excludePrivateNote"].includes(key)) return;
    slot.record.shareSettings ||= { hideIdentityDate: true, excludePrivateNote: true };
    slot.record.shareSettings[key] = !slot.record.shareSettings[key];
    saveState(); render();
  }

  function buildShareText(slot) {
    const record = slot.record, settings = record.shareSettings;
    const lines = [taskFor(slot).title, ...(settings.hideIdentityDate ? [] : [formatDate(record.date || slot.archivedAt).replace(/（.*?）/, "")]), ...(selectedMoods(record).length ? [`当时的心情：${selectedMoods(record).join("、")}`] : []), "", record.arrangedRecord || record.originalText || "这段回忆暂时保持空白。"];
    if (!settings.excludePrivateNote && record.privateNote) lines.push("", `补充：${record.privateNote}`);
    return lines.join("\n");
  }

  async function shareCurrentSeed() {
    const slot = selectedSeedSlot();
    if (!slot) return;
    const text = buildShareText(slot);
    if (navigator.share) {
      try { await navigator.share({ title: taskFor(slot).title, text }); showToast("已交给系统分享"); return; }
      catch (error) { if (error?.name === "AbortError") return; }
    }
    openShareFallback(text);
  }

  function openShareFallback(text) {
    const modal = document.createElement("section");
    modal.className = "modal-layer share-fallback";
    modal.setAttribute("aria-labelledby", "share-fallback-title");
    modal.innerHTML = `<div class="modal-card"><button class="modal-close" aria-label="关闭分享弹层"></button><h2 id="share-fallback-title">复制分享内容</h2><p>当前浏览器没有打开系统分享面板，你可以复制后自行选择发送位置。</p><textarea readonly>${escapeHTML(text)}</textarea><button class="copy-share">复制内容</button></div>`;
    const close = mountModal(modal);
    modal.querySelector(".copy-share").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(text); showToast("分享内容已复制"); close(); }
      catch { showToast("复制失败，请长按文本手动复制"); }
    });
  }

  function openDemoMedia(src) {
    const modal = document.createElement("section");
    modal.className = "modal-layer media-viewer";
    modal.setAttribute("aria-label", "媒体预览");
    modal.innerHTML = `<button class="modal-close" aria-label="关闭媒体预览"></button><img src="${src}" alt="回忆照片大图">`;
    mountModal(modal);
  }

  function mountModal(modal) {
    const previous = document.activeElement;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.tabIndex = -1;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      modal.remove();
      if (previous && typeof previous.focus === "function") previous.focus();
    };
    modal.addEventListener("click", event => { if (event.target === modal || event.target.closest(".modal-close")) close(); });
    modal.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...modal.querySelectorAll('button:not([disabled]), textarea, [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { event.preventDefault(); modal.focus(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    stage.append(modal);
    requestAnimationFrame(() => (modal.querySelector(".modal-close") || modal).focus());
    return close;
  }

  function openDB() {
    return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore("media", { keyPath: "id" }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  }

  async function storeMedia(files, editingSeed = false) {
    if (!files.length) return;
    try {
      const db = await openDB(), tx = db.transaction("media", "readwrite"), store = tx.objectStore("media"), slot = editingSeed ? selectedSeedSlot() : currentSlot();
      const record = editingSeed ? editableRecord(slot) : slot.record;
      files.forEach(file => { const id = `${slot.record.recordId}-${Date.now()}-${Math.random().toString(16).slice(2)}`; store.put({ id, file, name: file.name, type: file.type }); record.mediaIds.push(id); });
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
      if (!editingSeed) slot.status = "record_draft";
      saveState(); showToast("媒体已保存在此设备"); render();
    } catch { showToast("当前浏览器无法持久保存媒体，请保留手动文字记录"); }
  }

  async function removeMedia(id) {
    try {
      const db = await openDB(), tx = db.transaction("media", "readwrite"); tx.objectStore("media").delete(id);
      const slot = state.route === "D3" ? selectedSeedSlot() : currentSlot(), record = editableRecord(slot);
      record.mediaIds = record.mediaIds.filter(value => value !== id);
      saveState(); render();
    } catch { showToast("暂时无法删除这项媒体"); }
  }

  async function hydrateMediaPreviews(source) {
    const nodes = [...stage.querySelectorAll("[data-media-view]")]; if (!nodes.length) return;
    try {
      const db = await openDB();
      for (const node of nodes) {
        const data = await new Promise(resolve => { const req = db.transaction("media").objectStore("media").get(node.dataset.mediaView); req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(null); });
        if (!data) { const placeholder = node.querySelector("span"); if (placeholder) placeholder.textContent = "媒体暂时不可用"; else node.textContent = "媒体暂时不可用"; continue; }
        const url = URL.createObjectURL(data.file), element = data.type.startsWith("video/") ? document.createElement("video") : document.createElement("img");
        element.src = url; element.alt = data.name || "已上传媒体";
        if (node.dataset.mediaPreview) {
          if (element.tagName === "VIDEO") { element.muted = true; element.preload = "metadata"; }
          node.querySelector("span")?.remove(); node.prepend(element);
          node.addEventListener("click", event => { if (!event.target.closest("[data-remove-media]")) openStoredMedia(data); });
          if (node.tagName !== "BUTTON") node.addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && !event.target.closest("[data-remove-media]")) { event.preventDefault(); openStoredMedia(data); } });
        } else { if (element.tagName === "VIDEO") element.controls = true; node.replaceWith(element); }
      }
    } catch { nodes.forEach(node => { const placeholder = node.querySelector("span"); if (placeholder) placeholder.textContent = "媒体读取失败"; else node.textContent = "媒体读取失败"; }); }
  }

  function openStoredMedia(data) {
    const modal = document.createElement("section"); modal.className = "modal-layer media-viewer";
    const url = URL.createObjectURL(data.file), isVideo = data.type.startsWith("video/");
    modal.setAttribute("aria-label", "媒体预览");
    modal.innerHTML = `<button class="modal-close" aria-label="关闭媒体预览"></button>${isVideo ? `<video src="${url}" controls autoplay playsinline></video>` : `<img src="${url}" alt="${escapeHTML(data.name || "回忆照片大图")}">`}`;
    mountModal(modal);
  }

  function startSpeech() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || !window.isSecureContext) { showToast("当前环境不支持语音转文字，请继续手动输入"); return; }
    const recognition = new Recognition(); recognition.lang = "zh-CN"; recognition.interimResults = false;
    recognition.onresult = event => { const text = [...event.results].map(result => result[0].transcript).join(""); const box = stage.querySelector(".story-text"); box.value = `${box.value}${box.value ? "\n" : ""}${text}`; box.dispatchEvent(new Event("input")); showToast("识别结果已写入记录"); };
    recognition.onerror = () => showToast("没有获得麦克风权限，仍可手动输入");
    try { recognition.start(); showToast("请开始说话，识别结果会写入文本框"); } catch { showToast("语音识别暂时无法启动"); }
  }

  function installMotion() {
    const slot = currentSlot(); if (taskDrawPhase !== "armed" || slot.status !== "not_offered" || !("DeviceMotionEvent" in window)) return;
    let last = 0, lastTrigger = 0;
    motionHandler = event => { const acc = event.accelerationIncludingGravity; if (!acc) return; const magnitude = Math.abs(acc.x || 0)+Math.abs(acc.y || 0)+Math.abs(acc.z || 0); const now = Date.now(); if (magnitude > 28 && now-lastTrigger > 1500 && now-last > 150) { lastTrigger = now; drawTaskFromAI(); } last = now; };
    window.addEventListener("devicemotion", motionHandler, { passive: true });
  }

  function stopMotion() { if (motionHandler) window.removeEventListener("devicemotion", motionHandler); motionHandler = null; }
  async function requestMotionPermission() {
    if (!("DeviceMotionEvent" in window)) return "unavailable";
    if (typeof DeviceMotionEvent.requestPermission !== "function") return "granted";
    try { return await DeviceMotionEvent.requestPermission(); }
    catch { return "denied"; }
  }

  function updateDebug() {
    if (!debugMode) { debugPanel.hidden = true; return; }
    debugPanel.hidden = false;
    debugPanel.innerHTML = `<h2>原型调试</h2><button data-debug="reset">重置数据</button>${[0,1,2,3,4,5,6,7].map(n=>`<button data-debug="count" data-count="${n}">设置 ${n}/7</button>`).join("")}${["C1","C2","C3","C4","C5","C6","D1","D2","D3","D4","E1","E2","E3","E4","E5","E6","E7"].map(r=>`<button data-debug="route" data-route="${r}">进入 ${r}</button>`).join("")}<button data-debug="motion">切换减少动效</button>`;
    debugPanel.querySelectorAll("[data-debug]").forEach(button => button.addEventListener("click", () => { if (button.dataset.debug === "reset") state = initialState(); if (button.dataset.debug === "route") state.route = button.dataset.route; if (button.dataset.debug === "motion") state.preferences.reducedMotion = !state.preferences.reducedMotion; if (button.dataset.debug === "count") { state = initialState(); const count = Number(button.dataset.count); for (let i=0;i<count;i++) { const slot=state.slots[i]; slot.status="archived"; slot.seedId=`seed-${slot.taskId}`; slot.archivedAt=new Date().toISOString(); slot.record.date=todayISO(); slot.record.moods=[i%2 ? "平静" : "开心"]; slot.record.originalText=`第${i+1}颗种子的独立回忆记录。`; slot.record.arrangedRecord=slot.record.originalText; slot.record.minimalConfirmed=true; slot.demo=true; } state.selectedSeedOrdinal=count?1:null; } saveState(); render(); }));
  }

  function fitStage() {
    const scale = Math.min(1, innerWidth / 390, innerHeight / 844);
    stage.style.transform = scale < 1 ? `scale(${scale})` : "";
  }
  addEventListener("resize", fitStage);
  addEventListener("message", event => {
    const frame = stage.querySelector(".private-island-frame");
    if (!frame || event.source !== frame.contentWindow || event.data?.type !== "siyu:navigate") return;
    const route = { field: "C1", seeds: "D1", place: "E1" }[event.data.target];
    if (route) routeTo(route);
  });
  addEventListener("popstate", event => { if (event.state?.route) { cleanupRouteDeparture(event.state.route); state.route = event.state.route; saveState(); render(); } });
  if (demoMode && innerWidth > 390) { const badge = document.createElement("div"); badge.className = "demo-badge"; badge.textContent = "演示样例模式：照片与文字仅用于高保真对照"; document.body.append(badge); }
  fitStage();
  clearPreviousSessionData().finally(render);
})();
