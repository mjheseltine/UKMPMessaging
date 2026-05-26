let mpData = [];

const searchInput = document.getElementById("searchInput");
const resultsEl = document.getElementById("results");
const mpNameEl = document.getElementById("mpName");
const mpMetaEl = document.getElementById("mpMeta");
const scoreDotEl = document.getElementById("scoreDot");
const scoreValueEl = document.getElementById("scoreValue");
const partyValueEl = document.getElementById("partyValue");
const constValueEl = document.getElementById("constValue");

async function loadData() {
  try {
    const response = await fetch("data/data.csv");
    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    mpData = parsed.data.map(row => ({
      mpName: row["MP Name"] ? String(row["MP Name"]).trim() : "",
      ideologyScore: Number(row["ideology_score"]),
      party: row["Party"] ? String(row["Party"]).trim() : "",
      constituency: row["Constituency"] ? String(row["Constituency"]).trim() : ""
    })).filter(d => d.mpName && !Number.isNaN(d.ideologyScore));

    showResults([]);
  } catch (err) {
    resultsEl.innerHTML = `<div class="error">Could not load data.csv</div>`;
    console.error(err);
  }
}

function scoreToPosition(score) {
  // expects roughly -1 to 1
  const clamped = Math.max(-1, Math.min(1, score));
  return ((clamped + 1) / 2) * 100;
}

function renderMP(mp) {
  mpNameEl.textContent = mp.mpName;
  mpMetaEl.textContent = `${mp.party || "Unknown party"} • ideology score available`;
  partyValueEl.textContent = mp.party || "—";
  constValueEl.textContent = mp.constituency || "—";
  scoreValueEl.textContent = mp.ideologyScore.toFixed(3);

  const pct = scoreToPosition(mp.ideologyScore);
  scoreDotEl.style.left = `${pct}%`;

  // optional: adjust dot color by direction
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

function showResults(matches) {
  if (!matches.length) {
    resultsEl.innerHTML = `<div class="muted small">Start typing to search MPs.</div>`;
    return;
  }

  resultsEl.innerHTML = matches.slice(0, 10).map(mp => `
    <button class="result-item" data-name="${escapeHtml(mp.mpName)}">
      <strong>${escapeHtml(mp.mpName)}</strong>
      <span>${escapeHtml(mp.party || "")}</span>
    </button>
  `).join("");

  document.querySelectorAll(".result-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-name");
      const mp = mpData.find(x => x.mpName === name);
      if (mp) renderMP(mp);
    });
  });
}

function onSearch() {
  const q = searchInput.value.trim().toLowerCase();

  if (!q) {
    showResults([]);
    return;
  }

  const matches = mpData.filter(mp =>
    mp.mpName.toLowerCase().includes(q)
  );

  showResults(matches);

  if (matches.length === 1) {
    renderMP(matches[0]);
  }
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

loadData();
