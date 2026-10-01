const SECTION_LABEL = {
  "Logic and Reasoning": "逻辑与推理",
  "Knowledge Management": "知识管理",
  "组会论文汇总": "组会论文汇总",
  "上传论文": "上传论文",
};

const SECTION_FROM = {
  "逻辑与推理": "Logic and Reasoning",
  "知识管理": "Knowledge Management",
  "组会论文汇总": "组会论文汇总",
  "上传论文": "上传论文",
  "Logic and Reasoning": "Logic and Reasoning",
  "Knowledge Management": "Knowledge Management",
};

const state = {
  papers: [],
  surveys: [],
  view: "home",
  keyword: "",
  section: "all",
  yearFrom: "",
  yearTo: "",
  sort: "year-desc",
  surveyKeyword: "",
  surveyYear: "",
  groupKeyword: "",
  groupYearFrom: "",
  groupYearTo: "",
  groupSort: "year-desc",
  mapSel: [],
  mapLimit: 8,
  mapSource: "all",
  favorites: [],
  favKeyword: "",
  basePapers: [],
  catalog: [],
  uploads: [],
  uploadMessage: "",
  editingId: "",
};

const FAV_KEY = "mi-research-favorites";
const UPLOAD_KEY = "mi-research-uploads";

const app = document.querySelector("#app");

function parseHash() {
  const raw = location.hash.replace("#", "") || "home";
  const [name, id] = raw.split("/");
  if (name === "survey" && id) return { view: "survey", id };
  if (["home", "papers", "surveys", "group", "map", "favorites"].includes(name)) return { view: name, id: "" };
  return { view: "home", id: "" };
}

function setActiveNav() {
  const current = state.view === "survey" ? "surveys" : state.view;
  document.querySelectorAll(".nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.view === current);
  });
  const favLink = document.querySelector('.nav a[data-view="favorites"]');
  if (favLink) favLink.textContent = state.favorites.length ? `我的收藏 (${state.favorites.length})` : "我的收藏";
}

function yearsOf(items) {
  return [...new Set(items.map((item) => item.year))].sort((a, b) => b - a);
}

function matchesKeyword(item, keyword) {
  const tokens = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const haystack = [
    item.en, item.zh, item.abs, item.venue, item.object, item.loc, item.steer,
    SECTION_LABEL[item.section] || "", String(item.year),
  ].join(" ").toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function inYearRange(year, from, to) {
  if (from && year < Number(from)) return false;
  if (to && year > Number(to)) return false;
  return true;
}

function filteredPapers() {
  const rows = state.papers.filter((paper) => {
    if (state.section !== "all" && paper.section !== state.section) return false;
    if (!inYearRange(paper.year, state.yearFrom, state.yearTo)) return false;
    return matchesKeyword(paper, state.keyword);
  });
  rows.sort((a, b) => state.sort === "year-asc" ? a.year - b.year : b.year - a.year);
  return rows;
}

function filteredSurveys() {
  return state.surveys.filter((item) => {
    if (state.surveyYear && item.year !== Number(state.surveyYear)) return false;
    return matchesKeyword(item, state.surveyKeyword);
  }).sort((a, b) => b.year - a.year);
}

function entryCard(item, extra) {
  if (state.view === "papers" && state.editingId === item.id) return editCard(item);
  const section = item.section ? `<span class="tag">${SECTION_LABEL[item.section] || item.section}</span>` : "";
  const title = item.section
    ? item.zh
    : `<a href="#survey/${item.id}">${item.zh}</a>`;
  return `
    <article class="entry">
      <div class="entry-top">
        <div>${section}<span class="tag">${item.year}</span><span class="tag">${item.venue}</span></div>
        ${item.section ? entryActions(item) : ""}
      </div>
      <h3>${title}</h3>
      <p class="en">${item.en}</p>
      <p class="abs">${item.abs}</p>
      ${extra || ""}
      <p class="fields">${item.url ? `<a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">原文链接</a>` : "未填写链接"}</p>
    </article>`;
}

function paperFields(paper) {
  return `<p class="fields">研究对象 ${paper.object} · 定位方法 ${paper.loc} · 操控方法 ${paper.steer}</p>`;
}

function renderHome() {
  const logic = state.papers.filter((p) => p.section === "Logic and Reasoning").length;
  const km = state.papers.filter((p) => p.section === "Knowledge Management").length;
  app.innerHTML = `
    <p class="lead">本站收集机制可解释性，以及符号 / 形式化推理方向的论文与综述。论文集、综述集和组会汇总都可以按时间和关键词检索。</p>
    <section class="stats">
      <div class="stat"><b>${logic}</b><span>逻辑与推理</span></div>
      <div class="stat"><b>${km}</b><span>知识管理</span></div>
      <div class="stat"><b>${state.group.length}</b><span>组会论文</span></div>
      <div class="stat"><b>${state.surveys.length}</b><span>综述</span></div>
    </section>
    <section class="upcoming">
      <a class="card" href="#papers"><h3>论文集</h3><p>逻辑与推理、知识管理。可按年份、主题和关键词筛选，也可上传新的论文。</p></a>
      <a class="card" href="#surveys"><h3>综述集</h3><p>来自思源笔记「MI综述阅读」的四篇综述，可按年份和关键词检索。</p></a>
      <a class="card" href="#group"><h3>组会论文汇总</h3><p>来自思源笔记的组会论文表，可按年份和关键词检索。</p></a>
      <a class="card" href="#map"><h3>思路图</h3><p>用角度、场景和定位粒度归纳论文集和组会论文，并标出还没有论文的组合。</p></a>
      <a class="card" href="#favorites"><h3>我的收藏</h3><p>在论文卡片上点「收藏」。收藏保存在这台浏览器里，目前 ${state.favorites.length} 篇。</p></a>
      <div class="card"><h3>后续可补充</h3><p>组会内容记录、PPT 的 PDF 查看，以及基础知识的体系化整理。</p></div>
    </section>`;
}

function renderPapers() {
  const rows = filteredPapers();
  const yearOptions = yearsOf(state.papers).map((year) => `<option value="${year}">${year}</option>`).join("");
  app.innerHTML = `
    <h2>论文集</h2>
    <form class="filters" id="paper-filters">
      <label>关键词
        <input id="keyword" type="search" value="${escapeAttr(state.keyword)}" placeholder="标题、摘要、对象或方法" />
      </label>
      <label>主题
        <select id="section">
          <option value="all">全部</option>
          <option value="Logic and Reasoning">逻辑与推理</option>
          <option value="Knowledge Management">知识管理</option>
          <option value="上传论文">上传论文</option>
        </select>
      </label>
      <label>起始年
        <select id="year-from"><option value="">不限</option>${yearOptions}</select>
      </label>
      <label>结束年
        <select id="year-to"><option value="">不限</option>${yearOptions}</select>
      </label>
      <label>排序
        <select id="sort">
          <option value="year-desc">年份从新到旧</option>
          <option value="year-asc">年份从旧到新</option>
        </select>
      </label>
    </form>
    <p class="meta-line"><span>共 ${rows.length} 篇${uploadCountLabel()}</span></p>
    <div class="list">
      ${rows.length ? rows.map((paper) => entryCard(paper, paperFields(paper))).join("") : `<p class="empty">没有符合条件的论文。</p>`}
    </div>
    ${uploadPanel()}`;
  document.querySelector("#section").value = state.section;
  document.querySelector("#year-from").value = state.yearFrom;
  document.querySelector("#year-to").value = state.yearTo;
  document.querySelector("#sort").value = state.sort;
  bindFilterForm(document.querySelector("#paper-filters"), (event) => {
    const id = event.target.id;
    if (id === "keyword") state.keyword = event.target.value;
    if (id === "section") state.section = event.target.value;
    if (id === "year-from") state.yearFrom = event.target.value;
    if (id === "year-to") state.yearTo = event.target.value;
    if (id === "sort") state.sort = event.target.value;
  }, paintPaperResults);
  bindUploadPanel();
  document.querySelectorAll("[data-edit-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await savePaperEdit(form.dataset.editForm, Object.fromEntries(new FormData(event.target).entries()));
    });
  });
}

function entryActions(item) {
  const edit = state.view === "papers"
    ? `<button type="button" class="edit-btn" data-edit="${escapeAttr(item.id)}">编辑</button>`
    : "";
  const remove = item.local
    ? `<button type="button" class="fav" data-drop-upload="${escapeAttr(item.id)}">移除</button>`
    : "";
  return `<div class="entry-actions">${edit}${remove}${favoriteButton(item.id)}</div>`;
}

function editCard(item) {
  const options = [
    ["上传论文", "上传论文"],
    ["Logic and Reasoning", "逻辑与推理"],
    ["Knowledge Management", "知识管理"],
  ].map(([value, label]) => `<option value="${escapeAttr(value)}"${item.section === value ? " selected" : ""}>${label}</option>`).join("");
  return `
    <article class="entry">
      <form class="upload-form" data-edit-form="${escapeAttr(item.id)}">
        <label>中文标题<input name="zh" value="${escapeAttr(item.zh)}" placeholder="与英文标题至少填一个" /></label>
        <label>英文标题<input name="en" value="${escapeAttr(item.en)}" /></label>
        <label>年份<input name="year" type="number" min="1900" max="2100" required value="${escapeAttr(item.year)}" /></label>
        <label>会议 / 来源<input name="venue" value="${escapeAttr(item.venue)}" /></label>
        <label>主题<select name="section">${options}</select></label>
        <label>链接<input name="url" type="url" value="${escapeAttr(item.url)}" placeholder="https://" /></label>
        <label class="wide">摘要<textarea name="abs" rows="3">${escapeHtml(item.abs)}</textarea></label>
        <label>研究对象<input name="object" value="${escapeAttr(item.object)}" /></label>
        <label>定位方法<input name="loc" value="${escapeAttr(item.loc)}" /></label>
        <label>操控方法<input name="steer" value="${escapeAttr(item.steer)}" /></label>
        <div class="entry-actions wide">
          <button type="submit">保存修改</button>
          <button type="button" class="fav" data-cancel-edit>取消</button>
        </div>
      </form>
    </article>`;
}

function uploadPanel() {
  return `
    <section class="upload-box">
      <h3>上传论文</h3>
      <p>${uploadIntro()}</p>
      <div class="upload-actions">
        <label class="file-btn">选择 JSON 文件
          <input id="upload-file" type="file" accept="application/json,.json" />
        </label>
        <button type="button" id="upload-template">下载模板</button>
      </div>
      <p class="upload-status">${escapeHtml(state.uploadMessage)}</p>
      <form id="upload-form" class="upload-form">
        <label>中文标题<input name="zh" placeholder="与英文标题至少填一个" /></label>
        <label>英文标题<input name="en" placeholder="English title" /></label>
        <label>年份<input name="year" type="number" min="1900" max="2100" required value="2026" /></label>
        <label>会议 / 来源<input name="venue" placeholder="arXiv、ICLR" /></label>
        <label>主题
          <select name="section">
            <option value="上传论文">上传论文</option>
            <option value="Logic and Reasoning">逻辑与推理</option>
            <option value="Knowledge Management">知识管理</option>
          </select>
        </label>
        <label>链接<input name="url" type="url" placeholder="https://" /></label>
        <label class="wide">摘要<textarea name="abs" rows="3"></textarea></label>
        <label>研究对象<input name="object" placeholder="残差流" /></label>
        <label>定位方法<input name="loc" placeholder="探针" /></label>
        <label>操控方法<input name="steer" placeholder="无" /></label>
        <button type="submit">加入论文集</button>
      </form>
    </section>`;
}

function bindUploadPanel() {
  const file = document.querySelector("#upload-file");
  if (!file) return;
  file.addEventListener("change", () => {
    const picked = file.files && file.files[0];
    if (!picked) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result).replace(/^\uFEFF/, ""));
        const list = Array.isArray(parsed) ? parsed : parsed.papers || [parsed];
        if (!Array.isArray(list)) throw new Error("格式不对");
        state.uploadMessage = "";
        const added = await ingestPapers(list);
        if (!state.uploadMessage) {
          state.uploadMessage = added.length
            ? `已加入 ${added.length} 篇。`
            : "文件里没有可加入的新论文。";
        }
      } catch (error) {
        state.uploadMessage = "这个 JSON 无法读取。请用模板里的字段。";
      }
      render();
    };
    reader.readAsText(picked, "utf-8");
  });
  document.querySelector("#upload-template").addEventListener("click", downloadTemplate);
  document.querySelector("#upload-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    if (!String(data.zh).trim() && !String(data.en).trim()) {
      state.uploadMessage = "中文标题和英文标题至少填一个。";
      render();
      return;
    }
    state.uploadMessage = "";
    const added = await ingestPapers([data]);
    if (!state.uploadMessage) {
      state.uploadMessage = added.length ? `已加入「${added[0].zh || added[0].en}」。` : "这篇论文已经在列表里。";
    }
    render();
  });
}

function downloadTemplate() {
  const sample = [{
    "年份": 2026,
    "会议/来源": "arXiv",
    "英文标题": "English title",
    "中文标题": "中文标题",
    "摘要": "摘要",
    "研究对象": "残差流",
    "定位方法": "探针",
    "操控方法": "无",
    "链接": "https://arxiv.org/abs/0000.00000",
    "主题": "上传论文",
  }];
  const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "论文模板.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function uploadIntro() {
  if (cloudReady()) {
    return "选择 JSON 文件，或在下面填写一篇。新论文保存到 Bmob，打开这个网站的人都能看到，也可以检索和收藏。思路图不会自动给它们归类。";
  }
  return "选择 JSON 文件，或在下面填写一篇。Bmob 还没填好时，新论文只保存在这台浏览器。思路图不会自动给它们归类。";
}

function uploadCountLabel() {
  if (!state.uploads.length) return "";
  return cloudReady() ? `，云端上传 ${state.uploads.length} 篇` : `，本地上传 ${state.uploads.length} 篇`;
}

function cloudReady() {
  const config = window.BMOB || {};
  return Boolean(String(config.applicationId || "").trim() && String(config.restApiKey || "").trim());
}

let bmobReady = null;

function ensureBmob() {
  if (window.Bmob) {
    Bmob.initialize(String(window.BMOB.applicationId).trim(), String(window.BMOB.restApiKey).trim());
    return Promise.resolve();
  }
  if (!bmobReady) {
    bmobReady = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "vendor/bmob.min.js";
      script.onload = () => {
        if (!window.Bmob) {
          reject(new Error("Bmob SDK 没有加载成功"));
          return;
        }
        Bmob.initialize(String(window.BMOB.applicationId).trim(), String(window.BMOB.restApiKey).trim());
        resolve();
      };
      script.onerror = () => reject(new Error("Bmob SDK 没有加载成功"));
      document.head.appendChild(script);
    });
  }
  return bmobReady;
}

function cloudErrorMessage(error) {
  if (!error) return "未知错误";
  const text = error.error || error.message || String(error);
  return error.code ? `${text}（${error.code}）` : text;
}

function cloudBody(paper) {
  return {
    zh: paper.zh,
    en: paper.en,
    year: paper.year,
    venue: paper.venue,
    section: paper.section,
    abs: paper.abs,
    object: paper.object,
    loc: paper.loc,
    steer: paper.steer,
    url: paper.url,
  };
}

function fromCloud(row) {
  const sectionName = row.section || "上传论文";
  return {
    id: row.objectId,
    local: true,
    section: SECTION_FROM[sectionName] || sectionName,
    year: Number(row.year),
    venue: row.venue || "未填写",
    en: row.en || row.zh || "",
    zh: row.zh || row.en || "",
    abs: row.abs || "",
    object: row.object || "未填写",
    loc: row.loc || "未填写",
    steer: row.steer || "未填写",
    url: row.url || "",
  };
}

async function loadCloudUploads() {
  await ensureBmob();
  const query = Bmob.Query("Paper");
  query.limit(1000);
  query.order("-createdAt");
  const data = await query.find();
  const rows = Array.isArray(data) ? data : (data.results || []);
  const uploads = [];
  const overrides = new Map();
  rows.forEach((row) => {
    const paper = fromCloud(row);
    if (!paper.zh || !paper.year) return;
    if (row.baseId && state.catalog.some((item) => item.id === row.baseId)) {
      overrides.set(row.baseId, { objectId: row.objectId, fields: paper });
      return;
    }
    uploads.push(paper);
  });
  state.basePapers = state.catalog.map((paper) => {
    const over = overrides.get(paper.id);
    if (!over) return { ...paper };
    return {
      ...paper,
      ...over.fields,
      id: paper.id,
      local: false,
      overrideId: over.objectId,
    };
  });
  return uploads;
}

async function saveCloudPaper(paper) {
  await ensureBmob();
  const query = Bmob.Query("Paper");
  Object.entries(cloudBody(paper)).forEach(([key, value]) => query.set(key, value));
  if (paper.baseId) query.set("baseId", paper.baseId);
  query.set("ACL", { "*": { read: true, write: true } });
  const saved = await query.save();
  return saved.objectId;
}

async function updateCloudPaper(objectId, paper) {
  await ensureBmob();
  const query = Bmob.Query("Paper");
  query.set("id", objectId);
  Object.entries(cloudBody(paper)).forEach(([key, value]) => query.set(key, value));
  if (paper.baseId) query.set("baseId", paper.baseId);
  query.set("ACL", { "*": { read: true, write: true } });
  await query.save();
}

function loadUploads() {
  try {
    const raw = localStorage.getItem(UPLOAD_KEY);
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows.filter((row) => row && row.local && row.id) : [];
  } catch (error) {
    return [];
  }
}

function saveUploads() {
  try {
    localStorage.setItem(UPLOAD_KEY, JSON.stringify(state.uploads));
  } catch (error) {
    state.uploadMessage = "浏览器拒绝保存，刷新后新论文会消失。";
  }
}

function mergePapers() {
  state.papers = [...state.uploads, ...state.basePapers];
}

function fieldOf(raw, names) {
  for (const name of names) {
    if (raw[name] !== undefined && raw[name] !== null && String(raw[name]).trim() !== "") {
      return String(raw[name]).trim();
    }
  }
  return "";
}

function takenIds() {
  return new Set([...state.basePapers, ...state.uploads].map((paper) => paper.id));
}

function isDuplicatePaper(paper) {
  return [...state.basePapers, ...state.uploads].some((item) => {
    if (paper.url && item.url === paper.url) return true;
    return paper.zh && item.zh === paper.zh && paper.en && item.en === paper.en;
  });
}

async function ingestPapers(list) {
  const added = [];
  for (const raw of list) {
    const paper = normalizeUpload(raw);
    if (!paper || isDuplicatePaper(paper)) continue;
    if (cloudReady()) {
      try {
        paper.id = await saveCloudPaper(paper);
      } catch (error) {
        state.uploadMessage = `保存到 Bmob 失败：${cloudErrorMessage(error)}`;
        break;
      }
    }
    state.uploads.unshift(paper);
    added.push(paper);
  }
  if (added.length && !cloudReady()) saveUploads();
  if (added.length) mergePapers();
  return added;
}

function paperFromFields(raw) {
  const zh = fieldOf(raw, ["zh", "中文标题", "标题"]);
  const en = fieldOf(raw, ["en", "英文标题"]);
  if (!zh && !en) return null;
  const year = Number(fieldOf(raw, ["year", "年份", "年"]));
  if (!year || year < 1900 || year > 2100) return null;
  const sectionName = fieldOf(raw, ["section", "主题"]) || "上传论文";
  return {
    section: SECTION_FROM[sectionName] || "上传论文",
    year,
    venue: fieldOf(raw, ["venue", "会议/来源", "会议", "来源"]) || "未填写",
    en: en || zh,
    zh: zh || en,
    abs: fieldOf(raw, ["abs", "摘要"]),
    object: fieldOf(raw, ["object", "研究对象", "研究对象 Object"]) || "未填写",
    loc: fieldOf(raw, ["loc", "定位方法", "定位方法 Localizing Method"]) || "未填写",
    steer: fieldOf(raw, ["steer", "操控方法", "操控方法 Steering Method"]) || "未填写",
    url: fieldOf(raw, ["url", "链接"]),
  };
}

async function savePaperEdit(id, raw) {
  const current = state.papers.find((paper) => paper.id === id);
  const fields = paperFromFields(raw);
  if (!current || !fields) {
    state.uploadMessage = "中文标题和英文标题至少填一个，年份需在 1900 到 2100 之间。";
    render();
    return;
  }
  const cloudPaper = { ...fields, baseId: current.local ? "" : current.id };
  try {
    if (cloudReady() && current.local && !String(current.id).startsWith("up-")) {
      await updateCloudPaper(current.id, fields);
    } else if (cloudReady() && current.overrideId) {
      await updateCloudPaper(current.overrideId, cloudPaper);
    } else if (cloudReady() && !current.local) {
      current.overrideId = await saveCloudPaper(cloudPaper);
    } else if (current.local) {
      const index = state.uploads.findIndex((paper) => paper.id === id);
      if (index >= 0) state.uploads[index] = { ...state.uploads[index], ...fields };
      saveUploads();
    } else {
      state.uploadMessage = "Bmob 还没填好，内置论文的修改无法保存。";
      render();
      return;
    }
  } catch (error) {
    state.uploadMessage = `修改没有保存：${cloudErrorMessage(error)}。较早上传的只读记录需要先在 Bmob 控制台删掉后重新上传。`;
    render();
    return;
  }
  Object.assign(current, fields);
  if (current.local) {
    const index = state.uploads.findIndex((paper) => paper.id === id);
    if (index >= 0) Object.assign(state.uploads[index], fields);
  } else {
    const index = state.basePapers.findIndex((paper) => paper.id === id);
    if (index >= 0) Object.assign(state.basePapers[index], fields, { overrideId: current.overrideId });
  }
  mergePapers();
  state.editingId = "";
  state.uploadMessage = `已保存「${fields.zh}」的修改。`;
  render();
}

function normalizeUpload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const zh = fieldOf(raw, ["zh", "中文标题", "标题"]);
  const en = fieldOf(raw, ["en", "英文标题"]);
  if (!zh && !en) return null;
  const year = Number(fieldOf(raw, ["year", "年份", "年"]));
  if (!year || year < 1900 || year > 2100) return null;
  const sectionName = fieldOf(raw, ["section", "主题"]) || "上传论文";
  const section = SECTION_FROM[sectionName] || "上传论文";
  let id = fieldOf(raw, ["id"]);
  const ids = takenIds();
  if (!id || ids.has(id)) id = `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    local: true,
    section,
    year,
    venue: fieldOf(raw, ["venue", "会议/来源", "会议", "来源"]) || "未填写",
    en: en || zh,
    zh: zh || en,
    abs: fieldOf(raw, ["abs", "摘要"]),
    object: fieldOf(raw, ["object", "研究对象", "研究对象 Object"]) || "未填写",
    loc: fieldOf(raw, ["loc", "定位方法", "定位方法 Localizing Method"]) || "未填写",
    steer: fieldOf(raw, ["steer", "操控方法", "操控方法 Steering Method"]) || "未填写",
    url: fieldOf(raw, ["url", "链接"]),
  };
}

async function dropUpload(id) {
  if (cloudReady()) {
    try {
      await ensureBmob();
      await Bmob.Query("Paper").destroy(id);
    } catch (error) {
      state.uploadMessage = `Bmob 没有允许删除：${cloudErrorMessage(error)}。请到控制台删除这条记录。`;
      render();
      return;
    }
  }
  state.uploads = state.uploads.filter((paper) => paper.id !== id);
  state.favorites = state.favorites.filter((item) => item !== id);
  if (!cloudReady()) saveUploads();
  saveFavorites();
  mergePapers();
  state.uploadMessage = cloudReady() ? "已从 Bmob 移除这篇论文。" : "已移除这篇本地论文。";
  render();
}

function renderSurveys() {
  const rows = filteredSurveys();
  const yearOptions = yearsOf(state.surveys).map((year) => `<option value="${year}">${year}</option>`).join("");
  app.innerHTML = `
    <h2>综述集</h2>
    <form class="filters" id="survey-filters">
      <label>关键词
        <input id="survey-keyword" type="search" value="${escapeAttr(state.surveyKeyword)}" placeholder="标题或摘要" />
      </label>
      <label>年份
        <select id="survey-year"><option value="">不限</option>${yearOptions}</select>
      </label>
    </form>
    <p class="meta-line"><span>共 ${rows.length} 篇</span></p>
    <div class="list">
      ${rows.length ? rows.map((item) => entryCard(item)).join("") : `<p class="empty">没有符合条件的综述。</p>`}
    </div>`;
  const yearSelect = document.querySelector("#survey-year");
  if (yearSelect) yearSelect.value = state.surveyYear;
  bindFilterForm(document.querySelector("#survey-filters"), (event) => {
    if (event.target.id === "survey-keyword") state.surveyKeyword = event.target.value;
    if (event.target.id === "survey-year") state.surveyYear = event.target.value;
  }, paintSurveyResults);
}

function renderSurveyDetail(id) {
  const item = state.surveys.find((survey) => survey.id === id);
  const note = (window.NOTES || {})[id];
  if (!item || !note) {
    app.innerHTML = `<p class="back"><a href="#surveys">返回综述集</a></p><p class="empty">没有找到这篇综述笔记。</p>`;
    return;
  }
  app.innerHTML = `
    <p class="back"><a href="#surveys">返回综述集</a></p>
    <p class="fields">${item.year} · ${item.venue} · <a href="${item.url}" target="_blank" rel="noreferrer">原文链接</a></p>
    <article class="note">${note}</article>`;
}

function filteredGroup() {
  const rows = state.group.filter((paper) => {
    if (!inYearRange(paper.year, state.groupYearFrom, state.groupYearTo)) return false;
    return matchesKeyword(paper, state.groupKeyword);
  });
  rows.sort((a, b) => state.groupSort === "year-asc" ? a.year - b.year : b.year - a.year);
  return rows;
}

function renderGroup() {
  const rows = filteredGroup();
  const yearOptions = yearsOf(state.group).map((year) => `<option value="${year}">${year}</option>`).join("");
  app.innerHTML = `
    <h2>组会论文汇总</h2>
    <form class="filters" id="group-filters">
      <label>关键词
        <input id="group-keyword" type="search" value="${escapeAttr(state.groupKeyword)}" placeholder="标题、摘要、对象或方法" />
      </label>
      <label>起始年
        <select id="group-year-from"><option value="">不限</option>${yearOptions}</select>
      </label>
      <label>结束年
        <select id="group-year-to"><option value="">不限</option>${yearOptions}</select>
      </label>
      <label>排序
        <select id="group-sort">
          <option value="year-desc">年份从新到旧</option>
          <option value="year-asc">年份从旧到新</option>
        </select>
      </label>
    </form>
    <p class="meta-line"><span>共 ${rows.length} 篇</span></p>
    <div class="list">
      ${rows.length ? rows.map((paper) => entryCard(paper, paperFields(paper))).join("") : `<p class="empty">没有符合条件的论文。</p>`}
    </div>`;
  document.querySelector("#group-year-from").value = state.groupYearFrom;
  document.querySelector("#group-year-to").value = state.groupYearTo;
  document.querySelector("#group-sort").value = state.groupSort;
  bindFilterForm(document.querySelector("#group-filters"), (event) => {
    const id = event.target.id;
    if (id === "group-keyword") state.groupKeyword = event.target.value;
    if (id === "group-year-from") state.groupYearFrom = event.target.value;
    if (id === "group-year-to") state.groupYearTo = event.target.value;
    if (id === "group-sort") state.groupSort = event.target.value;
  }, paintGroupResults);
}

function paintResults(metaHtml, listHtml) {
  const meta = document.querySelector("#app .meta-line");
  const list = document.querySelector("#app .list");
  if (meta) meta.innerHTML = metaHtml;
  if (list) list.innerHTML = listHtml;
}

function paintPaperResults() {
  const rows = filteredPapers();
  paintResults(
    `<span>共 ${rows.length} 篇${uploadCountLabel()}</span>`,
    rows.length ? rows.map((paper) => entryCard(paper, paperFields(paper))).join("") : `<p class="empty">没有符合条件的论文。</p>`
  );
  document.querySelectorAll("[data-edit-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await savePaperEdit(form.dataset.editForm, Object.fromEntries(new FormData(event.target).entries()));
    });
  });
}

function paintSurveyResults() {
  const rows = filteredSurveys();
  paintResults(
    `<span>共 ${rows.length} 篇</span>`,
    rows.length ? rows.map((item) => entryCard(item)).join("") : `<p class="empty">没有符合条件的综述。</p>`
  );
}

function paintGroupResults() {
  const rows = filteredGroup();
  paintResults(
    `<span>共 ${rows.length} 篇</span>`,
    rows.length ? rows.map((paper) => entryCard(paper, paperFields(paper))).join("") : `<p class="empty">没有符合条件的论文。</p>`
  );
}

function paintFavoriteResults() {
  const rows = favoritePapers();
  paintResults(
    `<span>共 ${rows.length} 篇</span>`,
    rows.length ? rows.map((paper) => entryCard(paper, paperFields(paper))).join("") : `<p class="empty">${state.favorites.length ? "没有符合条件的收藏。" : "还没有收藏。在论文集、组会汇总或思路图里点「收藏」。"}</p>`
  );
}

function bindFilterForm(form, apply, paintList) {
  if (!form) return;
  form.addEventListener("input", (event) => {
    apply(event);
    const field = event.target;
    const typing = field && field.tagName === "INPUT";
    if (typing && paintList) {
      paintList();
      return;
    }
    render();
  });
}

function mapNodes() {
  return (window.MAP && window.MAP.nodes) || [];
}

function mapNode(id) {
  return mapNodes().find((node) => node.id === id);
}

function paperIndex() {
  const index = new Map();
  [...state.papers, ...state.group].forEach((paper) => index.set(paper.id, paper));
  return index;
}

function selectedByRole(role) {
  return state.mapSel.map(mapNode).find((node) => node && node.role === role) || null;
}

function papersForNodes(nodes) {
  const needed = nodes.filter((node) => node && node.role !== "hub");
  if (!needed.length) return [];
  const index = paperIndex();
  const idLists = needed.map((node) => new Set(node.papers || []));
  const [first, ...rest] = idLists;
  const ids = [...first].filter((id) => rest.every((set) => set.has(id)));
  return ids
    .map((id) => index.get(id))
    .filter((paper) => paper && mapSourceOk(paper))
    .sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
}

function mapSourceOk(paper) {
  if (state.mapSource === "group") return paper.section === "组会论文汇总";
  if (state.mapSource === "papers") return paper.section !== "组会论文汇总";
  return true;
}

function bubbleCountText(node) {
  const rows = papersForNodes([node]);
  const group = rows.filter((paper) => paper.section === "组会论文汇总").length;
  if (state.mapSource === "all" && group) return `${rows.length} 篇<br>组会 ${group}`;
  return `${rows.length} 篇`;
}

function mapCountLine(rows) {
  if (!rows.length) return "这个组合还没有论文";
  const group = rows.filter((paper) => paper.section === "组会论文汇总").length;
  if (state.mapSource === "all" && group) return `共 ${rows.length} 篇，其中组会 ${group} 篇`;
  return `共 ${rows.length} 篇`;
}

function toggleMapNode(id) {
  const node = mapNode(id);
  if (!node) return;
  if (node.role === "hub") {
    state.mapSel = [id];
  } else if (state.mapSel.includes(id)) {
    state.mapSel = state.mapSel.filter((item) => item !== id);
  } else {
    state.mapSel = state.mapSel.filter((item) => {
      const current = mapNode(item);
      return current && current.role !== node.role;
    });
    state.mapSel.push(id);
  }
  state.mapLimit = 8;
  paintMap();
}

function selectMapPair(leftId, rightId) {
  const mid = selectedByRole("mid");
  state.mapSel = [leftId, rightId];
  if (mid) state.mapSel.push(mid.id);
  state.mapLimit = 8;
  paintMap();
}

function mapEdges() {
  const nodes = mapNodes();
  const ang = nodes.find((node) => node.id === "ang");
  const scn = nodes.find((node) => node.id === "scn");
  const edges = [];
  nodes.forEach((node) => {
    if (node.role === "left" || node.role === "mid") edges.push([node, ang]);
    if (node.role === "right" || node.role === "mid") edges.push([node, scn]);
  });
  return edges.filter((pair) => pair[0] && pair[1]);
}

function ideaCopy(picked, rows) {
  const useful = picked.filter((node) => node.role !== "hub");
  if (!useful.length) return picked[0] ? picked[0].summary : "";
  const left = useful.find((node) => node.role === "left");
  const right = useful.find((node) => node.role === "right");
  const mid = useful.find((node) => node.role === "mid");
  const prompts = (window.MAP && window.MAP.prompts) || {};
  if (left && right) {
    const named = [left, mid, right].filter(Boolean).map((node) => node.lines.join("")).join(" × ");
    const extra = prompts[`${left.id}|${right.id}`];
    const gap = rows.length
      ? "已有论文可以当对照：保留定位方式，只改场景或只改粒度，看结论还站不站得住。"
      : "这一格还没有论文。先固定中间的定位粒度，只把场景换掉，看原来的做法在哪一步断掉。";
    return `${named}：${rows.length} 篇。${extra || gap}`;
  }
  if (useful.length === 1) {
    const only = useful[0];
    const nudge = only.role === "right"
      ? "再点左边的角度，或点中间的定位粒度，看同一批场景论文会收成哪一簇。"
      : "再点另一侧的气泡，看这个做法落到哪些场景，以及哪些格子还是空的。";
    return `${only.summary}${nudge}`;
  }
  const nudge = !right
    ? "再点右侧一个场景，看这两枚叠在一起还剩哪些论文。"
    : "再点左侧一个角度，看换成这种看法以后还剩哪些论文。";
  return `${useful.map((node) => node.summary).join("")}${nudge}`;
}

function renderMap() {
  const edges = mapEdges();
  const bubbles = mapNodes().map((node) => {
    const count = node.role === "hub" ? "" : `<small data-count="${node.id}"></small>`;
    return `<button type="button" class="map-bubble ${node.role === "hub" ? "hub" : ""}" data-node="${node.id}" style="left:${node.x}%;top:${node.y}%" aria-pressed="false">${node.lines.join("<br>")}${count}</button>`;
  }).join("");
  const lines = edges.map(([a, b]) => `<line data-a="${a.id}" data-b="${b.id}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`).join("");
  app.innerHTML = `
    <h2>思路图</h2>
    <p class="map-lead">图的骨架按草图来：左边是角度，右边是场景，中间是两边都会用到的定位粒度。论文集和组会汇总的 16 篇都算在里面；气泡上的第二行是其中来自组会的篇数。点一枚看归纳；左右各点一枚，用形态分析看这个组合有没有人做过。</p>
    <div class="map-source" role="group" aria-label="论文来源">
      <button type="button" data-source="all">全部</button>
      <button type="button" data-source="group">只看组会</button>
      <button type="button" data-source="papers">只看论文集</button>
    </div>
    <div class="map-board-wrap">
      <div class="map-board">
        <svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>
        ${bubbles}
      </div>
    </div>
    <section class="map-models">
      <article class="card"><h3>形态分析</h3><p>左右各点一个气泡，或直接点下方格子。有论文，就拿来当对照；格子是空的，就把左边的做法搬到右边，只改一个因素。</p></article>
      <article class="card"><h3>替换</h3><p>点中中间某一粒度后，再点相邻粒度。问同一场景换成这个组件，原来的结论还指不指向同一个地方。</p></article>
      <article class="card"><h3>类比与反向</h3><p>点中一个场景后打开旁边的场景，做法先不动。再问反向：若去掉操控、只保留定位，还剩什么观察。</p></article>
    </section>
    <div id="map-detail"></div>`;
  app.querySelectorAll("[data-node]").forEach((button) => {
    button.addEventListener("click", () => toggleMapNode(button.dataset.node));
  });
  app.querySelectorAll("[data-source]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mapSource = button.dataset.source;
      state.mapLimit = 8;
      paintMap();
    });
  });
  paintMap();
}

function paintMap() {
  const picked = state.mapSel.map(mapNode).filter(Boolean);
  document.querySelectorAll(".map-bubble").forEach((button) => {
    const on = state.mapSel.includes(button.dataset.node);
    button.classList.toggle("is-on", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
  });
  document.querySelectorAll("[data-count]").forEach((el) => {
    const node = mapNode(el.dataset.count);
    if (node) el.innerHTML = bubbleCountText(node);
  });
  document.querySelectorAll("[data-source]").forEach((button) => {
    button.classList.toggle("is-on", button.dataset.source === state.mapSource);
  });
  document.querySelectorAll(".map-lines line").forEach((line) => {
    const hot = state.mapSel.includes(line.dataset.a) || state.mapSel.includes(line.dataset.b);
    line.classList.toggle("is-hot", hot);
  });
  const detail = document.querySelector("#map-detail");
  if (!detail) return;
  detail.innerHTML = picked.length ? mapSelectionHtml(picked) : mapOverviewHtml();
  detail.querySelectorAll("[data-pair]").forEach((button) => {
    button.addEventListener("click", () => selectMapPair(button.dataset.left, button.dataset.right));
  });
  const more = detail.querySelector("#map-more");
  if (more) {
    more.addEventListener("click", () => {
      state.mapLimit = 100;
      paintMap();
    });
  }
  const clear = detail.querySelector("#map-clear");
  if (clear) {
    clear.addEventListener("click", () => {
      state.mapSel = [];
      state.mapLimit = 8;
      paintMap();
    });
  }
}

function mapOverviewHtml() {
  const left = mapNodes().filter((node) => node.role === "left");
  const right = mapNodes().filter((node) => node.role === "right");
  const blanks = [];
  left.forEach((angle) => {
    right.forEach((scene) => {
      const count = papersForNodes([angle, scene]).length;
      if (count === 0) blanks.push({ angle, scene });
    });
  });
  const chips = blanks.slice(0, 8).map(({ angle, scene }) => {
    const label = `${angle.lines.join("")} × ${scene.lines.join("")}`;
    return `<button type="button" class="blank-chip is-empty" data-pair="1" data-left="${angle.id}" data-right="${scene.id}">${escapeHtml(label)}</button>`;
  }).join("");
  return `
    <h2>还没有论文的组合</h2>
    <p class="meta-line"><span>下面是角度 × 场景里计数为 0 的格子。点一枚，按形态分析把它当成一个问题，而不是当成否定。</span></p>
    <div class="blank-row">${chips}</div>
    ${matrixHtml(null, null)}`;
}

function mapSelectionHtml(picked) {
  const filtering = picked.filter((node) => node.role !== "hub");
  const rows = papersForNodes(filtering);
  const order = { left: 0, mid: 1, right: 2, hub: 3 };
  const titled = (filtering.length ? filtering : picked).slice().sort((a, b) => order[a.role] - order[b.role]);
  const title = titled.map((node) => node.lines.join("")).join(" × ");
  const shown = rows.slice(0, state.mapLimit);
  const more = rows.length > shown.length
    ? `<button type="button" id="map-more">展开其余 ${rows.length - shown.length} 篇</button>`
    : "";
  const list = shown.map((paper) => `
    <li class="map-paper">
      <div class="entry-top">
        <div><span class="tag">${paper.year}</span><span class="tag">${escapeHtml(SECTION_LABEL[paper.section] || paper.section)}</span></div>
        ${favoriteButton(paper.id)}
      </div>
      <a href="${escapeAttr(paper.url)}" target="_blank" rel="noreferrer">${escapeHtml(paper.zh)}</a>
      <p class="en">${escapeHtml(paper.en)}</p>
    </li>`).join("");
  const left = selectedByRole("left");
  const right = selectedByRole("right");
  return `
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(ideaCopy(picked, rows))}</p>
    <div class="map-actions"><span class="meta-line">${filtering.length ? mapCountLine(rows) : ""}</span><button type="button" id="map-clear">清除选择</button>${more}</div>
    ${list ? `<ul class="map-papers">${list}</ul>` : ""}
    ${matrixHtml(left, right)}`;
}

function matrixHtml(left, right) {
  const angles = mapNodes().filter((node) => node.role === "left");
  const scenes = mapNodes().filter((node) => node.role === "right");
  const head = scenes.map((scene) => `<th>${scene.lines.join("<br>")}</th>`).join("");
  const body = angles.map((angle) => {
    const cells = scenes.map((scene) => {
      const count = papersForNodes([angle, scene]).length;
      const on = left && right && left.id === angle.id && right.id === scene.id;
      const heat = count === 0 ? "heat-0" : count >= 4 ? "heat-hot" : "heat";
      return `<td class="${heat}"><button type="button" data-pair="1" data-left="${angle.id}" data-right="${scene.id}" aria-pressed="${on ? "true" : "false"}">${count}</button></td>`;
    }).join("");
    return `<tr><th>${angle.lines.join("")}</th>${cells}</tr>`;
  }).join("");
  return `
    <h2>角度 × 场景</h2>
    <p class="meta-line"><span>数字是同时带上这两个标签的论文数。虚线格是空白。中间的定位粒度不进这张表，点气泡单独看。</span></p>
    <div class="matrix-wrap">
      <table class="map-matrix">
        <thead><tr><th></th>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch (error) {
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(state.favorites));
  } catch (error) {
    /* 无痕模式或本地文件页可能拒绝写入 */
  }
}

function favoriteButton(id) {
  const on = state.favorites.includes(id);
  return `<button type="button" class="fav${on ? " is-on" : ""}" data-fav="${escapeAttr(id)}" aria-pressed="${on ? "true" : "false"}">${on ? "已收藏" : "收藏"}</button>`;
}

function toggleFavorite(id) {
  const index = state.favorites.indexOf(id);
  if (index >= 0) state.favorites.splice(index, 1);
  else state.favorites.unshift(id);
  saveFavorites();
  render();
}

function favoritePapers() {
  const index = new Map([...state.papers, ...state.group].map((paper) => [paper.id, paper]));
  return state.favorites
    .map((id) => index.get(id))
    .filter((paper) => paper && matchesKeyword(paper, state.favKeyword));
}

function renderFavorites() {
  const rows = favoritePapers();
  app.innerHTML = `
    <h2>我的收藏</h2>
    <p class="lead">收藏保存在这台浏览器里。换一台电脑，或清除这个页面的站点数据后，需要重新收藏。</p>
    <form class="filters fav-filters" id="fav-filters">
      <label>关键词
        <input id="fav-keyword" type="search" value="${escapeAttr(state.favKeyword)}" placeholder="标题、摘要、对象或方法" />
      </label>
    </form>
    <p class="meta-line"><span>共 ${rows.length} 篇</span></p>
    <div class="list">
      ${rows.length ? rows.map((paper) => entryCard(paper, paperFields(paper))).join("") : `<p class="empty">${state.favorites.length ? "没有符合条件的收藏。" : "还没有收藏。在论文集、组会汇总或思路图里点「收藏」。"}</p>`}
    </div>`;
  bindFilterForm(document.querySelector("#fav-filters"), (event) => {
    if (event.target.id !== "fav-keyword") return;
    state.favKeyword = event.target.value;
  }, paintFavoriteResults);
}

function render() {
  const route = parseHash();
  state.view = route.view;
  document.body.classList.toggle("view-map", state.view === "map");
  setActiveNav();
  if (state.view === "papers") renderPapers();
  else if (state.view === "surveys") renderSurveys();
  else if (state.view === "survey") renderSurveyDetail(route.id);
  else if (state.view === "group") renderGroup();
  else if (state.view === "map") renderMap();
  else if (state.view === "favorites") renderFavorites();
  else renderHome();
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function start() {
  const library = window.LIBRARY;
  if (!library) {
    app.innerHTML = `<p class="empty">页面数据没有加载成功。</p>`;
    return;
  }
  state.catalog = library.papers.map((paper) => ({ ...paper }));
  state.basePapers = state.catalog.map((paper) => ({ ...paper }));
  state.uploads = cloudReady() ? [] : loadUploads();
  mergePapers();
  state.surveys = library.surveys;
  state.group = library.group || [];
  state.favorites = loadFavorites();
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fav]");
    if (button && app.contains(button)) toggleFavorite(button.dataset.fav);
    const remove = event.target.closest("[data-drop-upload]");
    if (remove && app.contains(remove)) dropUpload(remove.dataset.dropUpload);
    const edit = event.target.closest("[data-edit]");
    if (edit && app.contains(edit)) {
      state.editingId = edit.dataset.edit;
      render();
    }
    const cancel = event.target.closest("[data-cancel-edit]");
    if (cancel && app.contains(cancel)) {
      state.editingId = "";
      render();
    }
  });
  const backTop = document.querySelector("#back-top");
  backTop.addEventListener("click", () => {
    backTop.classList.add("is-bounce");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  backTop.addEventListener("animationend", () => backTop.classList.remove("is-bounce"));
  window.addEventListener("hashchange", render);
  render();
  if (!cloudReady()) return;
  try {
    state.uploads = await loadCloudUploads();
    mergePapers();
  } catch (error) {
    state.uploadMessage = `暂时读不到 Bmob：${cloudErrorMessage(error)}`;
  }
  render();
}

start();
