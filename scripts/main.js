let mpData = [];
let activeSession = "All";

const searchInput = document.getElementById("searchInput");
const resultsEl = document.getElementById("results");
const mpNameEl = document.getElementById("mpName");
const mpMetaEl = document.getElementById("mpMeta");
const scoreDotEl = document.getElementById("scoreDot");
const scoreValueEl = document.getElementById("scoreValue");
const partyValueEl = document.getElementById("partyValue");
const constValueEl = document.getElementById("constValue");
const sessionValueEl = document.getElementById("sessionValue");

function normaliseSession(value) {
  const v = String(value || "").trim();
  if (v === "2017-2019" || v === "2017–2019") return "2017-2019";
  if (v === "2019-2024" || v === "2019–2024") return "2019-2024";
  return v;
}

async function loadData() {
  try {
    const response = await fetch("data/data.csv");
    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    mpData = parsed.data.map(row => {
      const mpName = row["MP Name"] ?? row["Member"] ?? "";
      const score = row["ideology_score"] ?? row["ideo_avg"] ?? row["ideo_adj"] ?? null;
      const party = row["Party"] ?? "";
      const constituency = row["Constituency"] ?? row["Region"] ?? "";
      const session = row["parliament_group"] ?? row["Parliament Group"] ?? row["parliament_session"] ?? "";

      return {
        mpName: String(mpName).trim(),
        ideologyScore: Number(score),
        party: String(party).trim(),
        constituency: String(constituency).trim(),
        session: normaliseSession(session)
      };
    }).filter(d => d.mpName && !Number.isNaN(d.ideologyScore));

    showResults([]);
  } catch (err) {
    resultsEl.innerHTML = `<div class="error">Could not load data.csv</div>`;
    console.error(err);
  }
}

function scoreToPosition(score) {
  const clamped = Math.max(-1, Math.min(1, score));
  return ((clamped + 1) / 2) * 100;
}

function renderMP(mp) {
  mpNameEl.textContent = mp.mpName;
  mpMetaEl.textContent = `${mp.party || "Unknown party"} • ${mp.session || "Unknown session"}`;
  partyValueEl.textContent = mp.party || "—";
  constValueEl.textContent = mp.constituency || "—";
  sessionValueEl.textContent = mp.session || "—";
  scoreValueEl.textContent = Number(mp.ideologyScore).toFixed(3);

  const pct = scoreToPosition(mp.ideologyScore);
  scoreDotEl.style.left = `${pct}%`;

  if (mp.ideologyScore < 0) {
    scoreDotEl.classList.add("left");
    scoreDotEl.classList.remove("right");
  } else if (mp.ideologyScore > 0) {
    scoreDotEl.classList.add("right");
    scoreDotEl.classList.remove("left");
  } else {
    scoreDotEl.classList.remove("left", "right");
  }
}

function filterData() {
  const q = searchInput.value.trim().toLowerCase();

  let filtered = mpData;
  if (activeSession !== "All") {
    filtered = filtered.filter(mp => mp.session === activeSession);
  }

  if (q) {
    filtered = filtered.filter(mp => mp.mpName.toLowerCase().includes(q));
  }

  return filtered;
}

function showResults(matches) {
  if (!matches.length) {
    resultsEl.innerHTML = `<div class="muted small">Start typing to search MPs.</div>`;
    return;
  }

  resultsEl.innerHTML = matches.slice(0, 10).map(mp => `
    <button class="result-item" data-name="${escapeHtml(mp.mpName)}">
      <strong>${escapeHtml(mp.mpName)}</strong>
      <span>${escapeHtml(mp.party || "")} · ${escapeHtml(mp.session || "")}</span>
    </button>
  `).join("");

  document.querySelectorAll(".result-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-name");
      const mp = filterData().find(x => x.mpName === name);
      if (mp) renderMP(mp);
    });
  });
}

function onSearch() {
  const matches = filterData();
  showResults(matches);

  if (matches.length === 1) {
    renderMP(matches[0]);
  }
}

function setActiveTab(session) {
  activeSession = session;

  document.querySelectorAll(".tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.session === session);
  });

  onSearch();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

searchInput.addEventListener("input", onSearch);

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.session));
});

loadData();
