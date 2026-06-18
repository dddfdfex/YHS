/* =======================================================
   AURA STUDIO — ADMIN DASHBOARD APP LOGIC
   ======================================================= */

const ADMIN_PIN = "0000";
let isAuthenticated = false;
let selectedFile = null;
let editingCampaignId = null;
let campaignToDelete = null;
let allCampaigns = [];

/* =======================================================
   1. LOGIN / PIN AUTHENTICATION
   ======================================================= */
const pinInputs = document.querySelectorAll("#pinInputs input");
pinInputs.forEach(function (input, idx) {
  input.addEventListener("input", function () {
    input.value = input.value.replace(/[^0-9]/g, "");
    if (input.value && idx < pinInputs.length - 1) {
      pinInputs[idx + 1].focus();
    }
    if (Array.from(pinInputs).every(i => i.value.length === 1)) {
      attemptLogin();
    }
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Backspace" && !input.value && idx > 0) {
      pinInputs[idx - 1].focus();
    }
  });
});

document.getElementById("loginBtn").addEventListener("click", attemptLogin);

async function attemptLogin() {
  const pin = Array.from(pinInputs).map(i => i.value).join("");
  const errorEl = document.getElementById("loginError");

  if (pin.length < 4) {
    errorEl.textContent = "الرجاء إدخال 4 أرقام كاملة";
    errorEl.classList.add("show");
    return;
  }

  if (pin === ADMIN_PIN) {
    isAuthenticated = true;
    logAdminEvent("login_success");
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("dashboard").classList.add("show");
    initDashboard();
  } else {
    errorEl.textContent = "رمز الوصول غير صحيح";
    errorEl.classList.add("show");
    logAdminEvent("login_failed", { attemptedPin: "****" });
    pinInputs.forEach(i => { i.value = ""; i.style.borderColor = "#ff4d6d"; });
    setTimeout(() => pinInputs.forEach(i => i.style.borderColor = ""), 600);
    pinInputs[0].focus();
  }
}

async function logAdminEvent(type, details = {}) {
  try {
    await db.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      type: type,
      details: details,
      visitorId: getOrCreateVisitorId(),
      sessionId: getOrCreateSessionId(),
      userAgent: navigator.userAgent,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      source: "admin_panel"
    });
  } catch (e) {
    console.warn("logAdminEvent error:", e.message);
  }
}

document.getElementById("logoutBtn").addEventListener("click", function () {
  logAdminEvent("logout");
  isAuthenticated = false;
  document.getElementById("dashboard").classList.remove("show");
  document.getElementById("loginScreen").style.display = "flex";
  pinInputs.forEach(i => i.value = "");
  pinInputs[0].focus();
});

/* =======================================================
   2. SIDEBAR NAVIGATION
   ======================================================= */
document.querySelectorAll(".nav-item").forEach(function (item) {
  item.addEventListener("click", function () {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
    document.getElementById("page-" + item.dataset.page).classList.add("active");

    document.getElementById("sidebar").classList.remove("open");

    if (item.dataset.page === "analytics") renderAnalyticsCharts();
    if (item.dataset.page === "requests") loadEditRequests();
    if (item.dataset.page === "logs") loadFullLogs();
  });
});

document.getElementById("mobileToggle").addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("open");
});

/* =======================================================
   3. INIT DASHBOARD
   ======================================================= */
function initDashboard() {
  renderStatCards();
  loadOverviewStats();
  loadRecentActivity();
  loadCampaignsForAdmin();
}

const STAT_CARD_DEFS = [
  { id: "totalCampaigns", icon: "image", label: "إجمالي الحملات" },
  { id: "totalViews", icon: "eye", label: "إجمالي المشاهدات" },
  { id: "totalLikes", icon: "heart", label: "إجمالي الإعجابات" },
  { id: "totalApprovals", icon: "thumbs-up", label: "إجمالي الموافقات" },
  { id: "totalEditRequests", icon: "pencil-line", label: "طلبات التعديل" },
  { id: "activeVisitors", icon: "users", label: "الزوار النشطون" }
];

function renderStatCards() {
  const container = document.getElementById("overviewStats");
  container.innerHTML = STAT_CARD_DEFS.map(function (def, i) {
    return `
      <div class="stat-card" style="animation: fadeUp .6s var(--ease) ${i * 0.08}s forwards;">
        <div class="glow"></div>
        <div class="icon-bg"><i data-lucide="${def.icon}" style="width:18px;height:18px;color:#FFD600;"></i></div>
        <div class="num" id="${def.id}">0</div>
        <div class="label">${def.label}</div>
      </div>
    `;
  }).join("");
  lucide.createIcons();
}

async function loadOverviewStats() {
  try {
    const campaignsSnap = await db.collection(COLLECTIONS.CAMPAIGNS).get();
    let views = 0, likes = 0, approvals = 0, editRequests = 0;
    campaignsSnap.forEach(function (doc) {
      const d = doc.data();
      views += d.views || 0;
      likes += d.likes || 0;
      approvals += d.approvals || 0;
      editRequests += d.editRequests || 0;
    });

    animateStatCard("totalCampaigns", campaignsSnap.size);
    animateStatCard("totalViews", views);
    animateStatCard("totalLikes", likes);
    animateStatCard("totalApprovals", approvals);
    animateStatCard("totalEditRequests", editRequests);

    // active visitors = sessions active in last 5 minutes (approximation via recent session docs)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const sessionsSnap = await db.collection(COLLECTIONS.SESSIONS)
      .where("startTime", ">=", fiveMinAgo)
      .get()
      .catch(() => null);
    animateStatCard("activeVisitors", sessionsSnap ? sessionsSnap.size : 0);

  } catch (e) {
    console.warn("loadOverviewStats error:", e.message);
    showAdminToast("تعذر تحميل بعض الإحصائيات", "warn");
  }
}

function animateStatCard(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const from = parseInt(el.textContent) || 0;
  const duration = 1000;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(from + (value - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = value;
  }
  requestAnimationFrame(step);
}

/* =======================================================
   4. RECENT ACTIVITY (Overview page)
   ======================================================= */
async function loadRecentActivity() {
  const tbody = document.getElementById("recentActivityBody");
  try {
    const snap = await db.collection(COLLECTIONS.ACTIVITY_LOGS)
      .orderBy("timestamp", "desc")
      .limit(8)
      .get();

    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-row">لا توجد نشاطات بعد</td></tr>';
      return;
    }

    tbody.innerHTML = snap.docs.map(function (doc) {
      const d = doc.data();
      return buildLogRow(d, 3);
    }).join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-row">تعذر تحميل السجلات</td></tr>';
    console.warn(e.message);
  }
}

function buildLogRow(d, cols) {
  const badgeClass = getLogBadgeClass(d.type);
  const typeLabel = getLogTypeLabel(d.type);
  const time = d.timestamp ? formatTimestamp(d.timestamp) : "—";
  const details = formatLogDetails(d);

  if (cols === 3) {
    return `<tr>
      <td><span class="log-type-badge ${badgeClass}">${typeLabel}</span></td>
      <td>${details}</td>
      <td>${time}</td>
    </tr>`;
  }
  return `<tr>
    <td><span class="log-type-badge ${badgeClass}">${typeLabel}</span></td>
    <td>${details}</td>
    <td style="font-size:11px; color:var(--gray-600);">${(d.sessionId || "").slice(-8)}</td>
    <td>${time}</td>
  </tr>`;
}

function getLogBadgeClass(type) {
  if (type === "screenshot_attempt" || type === "printscreen_key" || type === "devtools_opened_detected" || type === "devtools_shortcut_attempt") return "screenshot";
  if (type === "login_success" || type === "login_failed" || type === "logout") return "login";
  if (type === "reaction" || type === "edit_request") return "reaction";
  return "default";
}

function getLogTypeLabel(type) {
  const map = {
    session_start: "بدء جلسة",
    campaign_view: "مشاهدة حملة",
    reaction: "تفاعل",
    edit_request: "طلب تعديل",
    right_click_attempt: "محاولة كليك يمين",
    blocked_shortcut: "اختصار محظور",
    devtools_shortcut_attempt: "محاولة أدوات مطورين",
    devtools_opened_detected: "اكتشاف أدوات مطورين",
    screenshot_attempt: "محاولة لقطة شاشة",
    window_blur_extended: "تبديل نافذة",
    login_success: "تسجيل دخول ناجح",
    login_failed: "محاولة دخول فاشلة",
    logout: "تسجيل خروج",
    campaign_added: "إضافة حملة",
    campaign_updated: "تعديل حملة",
    campaign_deleted: "حذف حملة",
    campaign_hidden: "إخفاء حملة",
    campaign_restored: "استعادة حملة"
  };
  return map[type] || type;
}

function formatLogDetails(d) {
  if (d.details && Object.keys(d.details).length) {
    return Object.entries(d.details).map(([k, v]) => `${k}: ${v}`).join(" · ");
  }
  return "—";
}

function formatTimestamp(ts) {
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
  } catch (e) {
    return "—";
  }
}

/* =======================================================
   5. CAMPAIGN MANAGER (CRUD)
   ======================================================= */
async function loadCampaignsForAdmin() {
  const grid = document.getElementById("adminCampaignGrid");
  grid.innerHTML = '<div class="skeleton" style="height:260px;"></div><div class="skeleton" style="height:260px;"></div><div class="skeleton" style="height:260px;"></div>';

  try {
    const snap = await db.collection(COLLECTIONS.CAMPAIGNS).orderBy("createdAt", "desc").get();
    allCampaigns = [];
    snap.forEach(doc => allCampaigns.push({ id: doc.id, ...doc.data() }));

    if (allCampaigns.length === 0) {
      grid.innerHTML = '<p style="color:var(--gray-600); padding:30px;">لا توجد حملات بعد. اضغط "إضافة حملة جديدة" للبدء.</p>';
      return;
    }

    grid.innerHTML = allCampaigns.map(buildAdminCampaignCard).join("");
    lucide.createIcons();
    attachCampaignCardEvents();
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--red); padding:30px;">تعذر تحميل الحملات: ' + e.message + '</p>';
  }
}

function buildAdminCampaignCard(c) {
  return `
    <div class="campaign-admin-card ${c.hidden ? 'is-hidden' : ''}" data-id="${c.id}">
      ${c.hidden ? '<div class="hidden-tag">مخفية</div>' : ''}
      <img src="${c.imageUrl}" class="thumb" alt="${escapeAdminHtml(c.title)}">
      <div class="body">
        <h4>${escapeAdminHtml(c.title || 'بدون عنوان')}</h4>
        <div class="meta">
          <span><i data-lucide="eye" style="width:13px;height:13px;"></i> ${c.views || 0}</span>
          <span><i data-lucide="heart" style="width:13px;height:13px;"></i> ${c.likes || 0}</span>
          <span><i data-lucide="thumbs-up" style="width:13px;height:13px;"></i> ${c.approvals || 0}</span>
        </div>
        <div class="card-actions">
          <div class="icon-btn edit-btn" title="تعديل"><i data-lucide="pencil" style="width:15px;height:15px;"></i></div>
          <div class="icon-btn toggle-btn" title="${c.hidden ? 'استعادة' : 'إخفاء'}"><i data-lucide="${c.hidden ? 'eye' : 'eye-off'}" style="width:15px;height:15px;"></i></div>
          <div class="icon-btn danger delete-btn" title="حذف"><i data-lucide="trash-2" style="width:15px;height:15px;"></i></div>
        </div>
      </div>
    </div>
  `;
}

function escapeAdminHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function attachCampaignCardEvents() {
  document.querySelectorAll(".campaign-admin-card").forEach(function (card) {
    const id = card.dataset.id;
    const campaign = allCampaigns.find(c => c.id === id);

    card.querySelector(".edit-btn").addEventListener("click", () => openCampaignModal(campaign));
    card.querySelector(".toggle-btn").addEventListener("click", () => toggleCampaignVisibility(campaign));
    card.querySelector(".delete-btn").addEventListener("click", () => openDeleteModal(campaign));
  });
}

async function toggleCampaignVisibility(campaign) {
  try {
    const newHidden = !campaign.hidden;
    await db.collection(COLLECTIONS.CAMPAIGNS).doc(campaign.id).update({ hidden: newHidden });
    logAdminEvent(newHidden ? "campaign_hidden" : "campaign_restored", { title: campaign.title });
    showAdminToast(newHidden ? "تم إخفاء الحملة" : "تم استعادة الحملة", "success");
    loadCampaignsForAdmin();
  } catch (e) {
    showAdminToast("حدث خطأ: " + e.message, "error");
  }
}

/* ---------- Delete Modal ---------- */
const deleteModal = document.getElementById("deleteModal");
function openDeleteModal(campaign) {
  campaignToDelete = campaign;
  deleteModal.classList.add("show");
}
document.getElementById("cancelDelete").addEventListener("click", () => deleteModal.classList.remove("show"));
document.getElementById("confirmDelete").addEventListener("click", async function () {
  if (!campaignToDelete) return;
  try {
    // حذف الصورة من Storage أولاً إن أمكن
    if (campaignToDelete.storagePath) {
      try {
        await storage.ref(campaignToDelete.storagePath).delete();
      } catch (e) { /* الصورة قد تكون محذوفة مسبقاً */ }
    }
    await db.collection(COLLECTIONS.CAMPAIGNS).doc(campaignToDelete.id).delete();
    logAdminEvent("campaign_deleted", { title: campaignToDelete.title });
    showAdminToast("تم حذف الحملة نهائياً", "success");
    deleteModal.classList.remove("show");
    loadCampaignsForAdmin();
    loadOverviewStats();
  } catch (e) {
    showAdminToast("تعذر الحذف: " + e.message, "error");
  }
});

/* ---------- Upload / Edit Modal ---------- */
const campaignModal = document.getElementById("campaignModal");
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("previewImg");

document.getElementById("openUploadModal").addEventListener("click", () => openCampaignModal(null));
document.getElementById("cancelCampaignModal").addEventListener("click", closeCampaignModal);

function openCampaignModal(campaign) {
  editingCampaignId = campaign ? campaign.id : null;
  selectedFile = null;
  document.getElementById("campaignModalTitle").textContent = campaign ? "تعديل الحملة" : "إضافة حملة جديدة";
  document.getElementById("campaignTitleInput").value = campaign ? campaign.title : "";
  document.getElementById("campaignDescInput").value = campaign ? (campaign.description || "") : "";

  if (campaign && campaign.imageUrl) {
    previewImg.src = campaign.imageUrl;
    previewImg.style.display = "block";
    uploadZone.style.display = "none";
  } else {
    previewImg.style.display = "none";
    uploadZone.style.display = "block";
  }

  document.getElementById("uploadProgressBar").classList.remove("show");
  campaignModal.classList.add("show");
}

function closeCampaignModal() {
  campaignModal.classList.remove("show");
  fileInput.value = "";
  selectedFile = null;
}

uploadZone.addEventListener("click", () => fileInput.click());
uploadZone.addEventListener("dragover", function (e) {
  e.preventDefault();
  uploadZone.classList.add("dragover");
});
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
uploadZone.addEventListener("drop", function (e) {
  e.preventDefault();
  uploadZone.classList.remove("dragover");
  if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", function () {
  if (fileInput.files.length) handleFileSelect(fileInput.files[0]);
});

function handleFileSelect(file) {
  if (!file.type.startsWith("image/")) {
    showAdminToast("الرجاء اختيار ملف صورة صالح", "warn");
    return;
  }
  selectedFile = file; // نحتفظ بالملف الأصلي كما هو - بدون أي ضغط أو تغيير حجم
  const reader = new FileReader();
  reader.onload = function (e) {
    previewImg.src = e.target.result;
    previewImg.style.display = "block";
    uploadZone.style.display = "none";
  };
  reader.readAsDataURL(file);
}

document.getElementById("saveCampaignBtn").addEventListener("click", async function () {
  const title = document.getElementById("campaignTitleInput").value.trim();
  const description = document.getElementById("campaignDescInput").value.trim();

  if (!title) {
    showAdminToast("الرجاء إدخال عنوان للحملة", "warn");
    return;
  }
  if (!selectedFile && !editingCampaignId) {
    showAdminToast("الرجاء رفع صورة للحملة", "warn");
    return;
  }

  const saveBtn = document.getElementById("saveCampaignBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "جاري الحفظ...";

  try {
    let imageUrl = null;
    let storagePath = null;

    if (selectedFile) {
      const result = await uploadOriginalImage(selectedFile);
      imageUrl = result.url;
      storagePath = result.path;
    }

    if (editingCampaignId) {
      const updateData = { title, description };
      if (imageUrl) {
        updateData.imageUrl = imageUrl;
        updateData.storagePath = storagePath;
      }
      await db.collection(COLLECTIONS.CAMPAIGNS).doc(editingCampaignId).update(updateData);
      logAdminEvent("campaign_updated", { title });
      showAdminToast("تم تحديث الحملة بنجاح", "success");
    } else {
      await db.collection(COLLECTIONS.CAMPAIGNS).add({
        title, description,
        imageUrl, storagePath,
        hidden: false,
        views: 0, likes: 0, approvals: 0, editRequests: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      logAdminEvent("campaign_added", { title });
      showAdminToast("تمت إضافة الحملة بنجاح", "success");
    }

    closeCampaignModal();
    loadCampaignsForAdmin();
    loadOverviewStats();

  } catch (e) {
    showAdminToast("حدث خطأ: " + e.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "حفظ الحملة";
  }
});

/* ---------- Upload original-quality image to Firebase Storage ----------
   ملاحظة: لا يتم أي تغيير حجم أو ضغط أو تحسين للصورة هنا.
   يتم رفع الملف الأصلي (selectedFile) كما هو بايتاً بايت.       */
function uploadOriginalImage(file) {
  return new Promise(function (resolve, reject) {
    const progressBar = document.getElementById("uploadProgressBar");
    const progressFill = document.getElementById("uploadProgressFill");
    progressBar.classList.add("show");
    progressFill.style.width = "0%";

    const fileName = Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = "campaigns/" + fileName;
    const ref = storage.ref(path);

    // رفع الملف الخام بدون أي معالجة (نفس البيانات الثنائية الأصلية)
    const uploadTask = ref.put(file, { contentType: file.type });

    uploadTask.on("state_changed",
      function (snapshot) {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressFill.style.width = pct + "%";
      },
      function (error) {
        progressBar.classList.remove("show");
        reject(error);
      },
      async function () {
        try {
          const url = await uploadTask.snapshot.ref.getDownloadURL();
          progressBar.classList.remove("show");
          resolve({ url, path });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/* =======================================================
   6. ANALYTICS CHARTS (Recharts via React.createElement)
   ======================================================= */
let chartsRendered = false;

async function renderAnalyticsCharts() {
  if (!window.Recharts) {
    showAdminToast("تعذر تحميل مكتبة الرسوم البيانية", "warn");
    return;
  }

  try {
    const [viewsData, reactionsData, visitorsData] = await Promise.all([
      buildDailyViewsData(),
      buildReactionsDistribution(),
      buildVisitorsActivityData()
    ]);

    renderViewsChart(viewsData);
    renderReactionsChart(reactionsData);
    renderVisitorsChart(visitorsData);
  } catch (e) {
    console.warn("renderAnalyticsCharts error:", e.message);
  }
}

async function buildDailyViewsData() {
  const days = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({ date: d, label: d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" }), views: 0 });
  }

  try {
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);
    const snap = await db.collection(COLLECTIONS.ANALYTICS_VIEWS)
      .where("timestamp", ">=", fourteenDaysAgo)
      .get();

    snap.forEach(function (doc) {
      const d = doc.data();
      if (!d.timestamp) return;
      const date = d.timestamp.toDate();
      const dayEntry = days.find(day =>
        day.date.toDateString() === date.toDateString()
      );
      if (dayEntry) dayEntry.views++;
    });
  } catch (e) {
    console.warn("buildDailyViewsData error:", e.message);
  }

  return days.map(d => ({ name: d.label, مشاهدات: d.views }));
}

async function buildReactionsDistribution() {
  try {
    const snap = await db.collection(COLLECTIONS.CAMPAIGNS).get();
    let likes = 0, approvals = 0, editRequests = 0;
    snap.forEach(function (doc) {
      const d = doc.data();
      likes += d.likes || 0;
      approvals += d.approvals || 0;
      editRequests += d.editRequests || 0;
    });
    return [
      { name: "إعجابات", value: likes, fill: "#FFD600" },
      { name: "موافقات", value: approvals, fill: "#3ddc97" },
      { name: "طلبات تعديل", value: editRequests, fill: "#ff4d6d" }
    ];
  } catch (e) {
    return [{ name: "لا توجد بيانات", value: 1, fill: "#444" }];
  }
}

async function buildVisitorsActivityData() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({ date: d, label: d.toLocaleDateString("ar-EG", { weekday: "short" }), visitors: 0 });
  }

  try {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const snap = await db.collection(COLLECTIONS.SESSIONS)
      .where("startTime", ">=", sevenDaysAgo)
      .get();

    snap.forEach(function (doc) {
      const d = doc.data();
      if (!d.startTime) return;
      const date = d.startTime.toDate();
      const dayEntry = days.find(day => day.date.toDateString() === date.toDateString());
      if (dayEntry) dayEntry.visitors++;
    });
  } catch (e) {
    console.warn("buildVisitorsActivityData error:", e.message);
  }

  return days.map(d => ({ name: d.label, زوار: d.visitors }));
}

function renderViewsChart(data) {
  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } = Recharts;
  const root = ReactDOM.createRoot(document.getElementById("viewsChartContainer"));
  root.render(
    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
      React.createElement(AreaChart, { data: data, margin: { top: 10, right: 10, left: -20, bottom: 0 } },
        React.createElement("defs", null,
          React.createElement("linearGradient", { id: "goldGrad", x1: 0, y1: 0, x2: 0, y2: 1 },
            React.createElement("stop", { offset: "5%", stopColor: "#FFD600", stopOpacity: 0.4 }),
            React.createElement("stop", { offset: "95%", stopColor: "#FFD600", stopOpacity: 0 })
          )
        ),
        React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.06)" }),
        React.createElement(XAxis, { dataKey: "name", stroke: "#9a9a9a", fontSize: 12 }),
        React.createElement(YAxis, { stroke: "#9a9a9a", fontSize: 12 }),
        React.createElement(Tooltip, { contentStyle: { background: "#16161a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "Zain" } }),
        React.createElement(Area, { type: "monotone", dataKey: "مشاهدات", stroke: "#FFD600", fill: "url(#goldGrad)", strokeWidth: 2.5 })
      )
    )
  );
}

function renderReactionsChart(data) {
  const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } = Recharts;
  const root = ReactDOM.createRoot(document.getElementById("reactionsChartContainer"));
  root.render(
    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
      React.createElement(PieChart, null,
        React.createElement(Pie, {
          data: data, dataKey: "value", nameKey: "name",
          cx: "50%", cy: "50%", outerRadius: 90, innerRadius: 50,
          paddingAngle: 3
        }, data.map((entry, i) => React.createElement(Cell, { key: i, fill: entry.fill }))),
        React.createElement(Tooltip, { contentStyle: { background: "#16161a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "Zain" } }),
        React.createElement(Legend, { wrapperStyle: { fontFamily: "Zain", fontSize: 13 } })
      )
    )
  );
}

function renderVisitorsChart(data) {
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } = Recharts;
  const root = ReactDOM.createRoot(document.getElementById("visitorsChartContainer"));
  root.render(
    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
      React.createElement(BarChart, { data: data, margin: { top: 10, right: 10, left: -20, bottom: 0 } },
        React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.06)" }),
        React.createElement(XAxis, { dataKey: "name", stroke: "#9a9a9a", fontSize: 12 }),
        React.createElement(YAxis, { stroke: "#9a9a9a", fontSize: 12 }),
        React.createElement(Tooltip, { contentStyle: { background: "#16161a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "Zain" } }),
        React.createElement(Bar, { dataKey: "زوار", fill: "#FFD600", radius: [8, 8, 0, 0] })
      )
    )
  );
}

/* =======================================================
   7. EDIT REQUESTS PAGE
   ======================================================= */
async function loadEditRequests() {
  const tbody = document.getElementById("editRequestsBody");
  try {
    const snap = await db.collection(COLLECTIONS.EDIT_REQUESTS).orderBy("timestamp", "desc").limit(50).get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">لا توجد طلبات تعديل بعد</td></tr>';
      return;
    }
    tbody.innerHTML = snap.docs.map(function (doc) {
      const d = doc.data();
      const campaign = allCampaigns.find(c => c.id === d.campaignId);
      const statusBadge = d.status === "pending"
        ? '<span class="log-type-badge screenshot">قيد الانتظار</span>'
        : '<span class="log-type-badge login">تم المعالجة</span>';
      return `<tr>
        <td>${campaign ? escapeAdminHtml(campaign.title) : "حملة محذوفة"}</td>
        <td>${escapeAdminHtml(d.note)}</td>
        <td>${statusBadge}</td>
        <td>${d.timestamp ? formatTimestamp(d.timestamp) : "—"}</td>
      </tr>`;
    }).join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">تعذر تحميل الطلبات</td></tr>';
  }
}

/* =======================================================
   8. FULL ACTIVITY LOGS PAGE
   ======================================================= */
async function loadFullLogs() {
  const tbody = document.getElementById("fullLogsBody");
  try {
    const snap = await db.collection(COLLECTIONS.ACTIVITY_LOGS).orderBy("timestamp", "desc").limit(80).get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">لا توجد سجلات بعد</td></tr>';
      return;
    }
    tbody.innerHTML = snap.docs.map(d => buildLogRow(d.data(), 4)).join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">تعذر تحميل السجلات</td></tr>';
  }
}

/* =======================================================
   9. TOAST HELPER
   ======================================================= */
function showAdminToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = "toast show " + type;
  clearTimeout(window._adminToastTimer);
  window._adminToastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

/* =======================================================
   10. FOCUS FIRST PIN INPUT ON LOAD
   ======================================================= */
window.addEventListener("DOMContentLoaded", function () {
  if (pinInputs[0]) pinInputs[0].focus();
});