// ========================
// DATA
// ========================
let people = JSON.parse(localStorage.getItem("people")) || [];
let places = JSON.parse(localStorage.getItem("places")) || [];
let entries = JSON.parse(localStorage.getItem("entries")) || [];

function saveData() {
  localStorage.setItem("people", JSON.stringify(people));
  localStorage.setItem("places", JSON.stringify(places));
  localStorage.setItem("entries", JSON.stringify(entries));
}

// ========================
// NAVIGATION
// ========================
function switchSection(name, clickedEl) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById("section-" + name).classList.add("active");

  // Sidebar nav
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.section === name);
  });
  // Mobile tabs
  document.querySelectorAll(".mobile-tab").forEach(el => {
    el.classList.toggle("active", el.dataset.section === name);
  });
}

// ========================
// WEEK HELPERS
// ========================
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
}

function getWeekEnd(date) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function getWeekInfo(dateString) {
  const date = new Date(dateString);
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  const week = Math.ceil((diff + start.getDay() * 86400000) / (7 * 86400000));
  const ws = getWeekStart(date);
  const we = getWeekEnd(date);
  return {
    key: `W${week}-${formatDate(ws)}`,
    label: `Week ${week} (${formatDate(ws)} → ${formatDate(we)})`
  };
}

function getCurrentWeekKey() {
  return getWeekInfo(new Date().toISOString().split("T")[0]).key;
}

// ========================
// SETUP
// ========================
function addPerson() {
  const name = document.getElementById("personInput").value.trim();
  if (!name) return;
  if (people.includes(name)) { showToast("Person already exists"); return; }
  people.push(name);
  document.getElementById("personInput").value = "";
  saveData();
  render();
  showToast(`Added person: ${name}`);
}

function addPlace() {
  const name = document.getElementById("placeInput").value.trim();
  if (!name) return;
  if (places.includes(name)) { showToast("Workplace already exists"); return; }
  places.push(name);
  document.getElementById("placeInput").value = "";
  saveData();
  render();
  showToast(`Added workplace: ${name}`);
}

function removePerson(index) {
  people.splice(index, 1);
  saveData();
  render();
}

function removePlace(index) {
  places.splice(index, 1);
  saveData();
  render();
}

function clearAll() {
  if (!confirm("Delete ALL data? This cannot be undone.")) return;
  people = [];
  places = [];
  entries = [];
  saveData();
  render();
  showToast("All data cleared");
}

// ========================
// ENTRIES
// ========================
function addEntry() {
  const person = document.getElementById("personSelect").value;
  const place = document.getElementById("placeSelect").value;
  const date = document.getElementById("dateInput").value;
  const hours = parseFloat(document.getElementById("hoursInput").value);

  if (!person || !place || !date || isNaN(hours) || hours <= 0) {
    showToast("Please fill all fields correctly.");
    return;
  }

  const week = getWeekInfo(date);
  entries.push({ id: Date.now(), person, place, date, hours, weekKey: week.key, weekLabel: week.label });
  saveData();
  render();

  // Keep selections; clear hours
  document.getElementById("personSelect").value = person;
  document.getElementById("placeSelect").value = place;
  document.getElementById("dateInput").value = date;
  document.getElementById("hoursInput").value = "";

  const msg = document.getElementById("logMsg");
  msg.textContent = `✓ Logged ${hours}h for ${person} at ${place}`;
  setTimeout(() => { msg.textContent = ""; }, 3000);

  showToast(`Entry added: ${hours}h`);
}

function editEntry(index) {
  const entry = entries[index];
  const newDate = prompt("Edit date (YYYY-MM-DD):", entry.date);
  if (!newDate) return;
  const newHours = prompt("Edit hours:", entry.hours);
  if (newHours === null || isNaN(parseFloat(newHours))) return;

  entry.date = newDate;
  entry.hours = parseFloat(newHours);
  const week = getWeekInfo(newDate);
  entry.weekKey = week.key;
  entry.weekLabel = week.label;

  saveData();
  render();
  showToast("Entry updated");
}

function deleteEntry(index) {
  if (!confirm("Delete this entry?")) return;
  entries.splice(index, 1);
  saveData();
  render();
  showToast("Entry deleted");
}

// ========================
// RENDER
// ========================
function render() {
  renderSelects();
  renderStats();
  renderDashboard();
  renderEntries();
  renderSetupLists();
}

function renderSelects() {
  const ps = document.getElementById("personSelect");
  const pl = document.getElementById("placeSelect");
  const prevP = ps.value, prevPl = pl.value;
  ps.innerHTML = people.length
    ? people.map(p => `<option value="${p}">${p}</option>`).join("")
    : `<option value="">— Add a person first —</option>`;
  pl.innerHTML = places.length
    ? places.map(p => `<option value="${p}">${p}</option>`).join("")
    : `<option value="">— Add a workplace first —</option>`;
  if (prevP) ps.value = prevP;
  if (prevPl) pl.value = prevPl;
}

function renderStats() {
  const total = entries.reduce((s, e) => s + e.hours, 0);
  const cwk = getCurrentWeekKey();
  const thisWeek = entries.filter(e => e.weekKey === cwk).reduce((s, e) => s + e.hours, 0);

  document.getElementById("statTotal").textContent = total % 1 === 0 ? total : total.toFixed(1);
  document.getElementById("statWeek").textContent = thisWeek % 1 === 0 ? thisWeek : thisWeek.toFixed(1);
  document.getElementById("statPlaces").textContent = places.length;
  document.getElementById("statPeople").textContent = people.length;
}

function renderDashboard() {
  const weeklyMap = buildWeeklyMap();

  // Busiest week
  let maxHours = 0, maxWeekLabel = "No data yet";
  for (const k in weeklyMap) {
    if (weeklyMap[k].hours > maxHours) {
      maxHours = weeklyMap[k].hours;
      maxWeekLabel = `${weeklyMap[k].label}\n${weeklyMap[k].person} @ ${weeklyMap[k].place} · ${maxHours}h`;
    }
  }
  document.getElementById("busiestWeek").textContent = maxWeekLabel;

  // Weekly totals
  const wtEl = document.getElementById("weeklyTotals");
  const noWeekly = document.getElementById("noWeekly");
  const keys = Object.keys(weeklyMap);

  if (keys.length === 0) {
    wtEl.innerHTML = "";
    noWeekly.style.display = "block";
  } else {
    noWeekly.style.display = "none";
    wtEl.innerHTML = keys.map(k => {
      const w = weeklyMap[k];
      return `<div class="summary-row">
        <div>
          <div class="entry-person">${w.person}</div>
          <div class="summary-row-info">${w.place} · ${w.label.split("(")[1]?.replace(")", "") || w.label}</div>
        </div>
        <div class="summary-row-hours">${w.hours % 1 === 0 ? w.hours : w.hours.toFixed(1)}h</div>
      </div>`;
    }).join("");
  }
}

function renderEntries() {
  const filterPerson = (document.getElementById("filterPerson")?.value || "").toLowerCase();
  const filterPlace = (document.getElementById("filterPlace")?.value || "").toLowerCase();

  let filtered = entries.filter(e =>
    e.person.toLowerCase().includes(filterPerson) &&
    e.place.toLowerCase().includes(filterPlace)
  );

  // Sort by date descending
  filtered = filtered.slice().sort((a, b) => a.date.localeCompare(b.date));

  const container = document.getElementById("entriesTable");
  const noEl = document.getElementById("noEntries");

  if (filtered.length === 0) {
    container.innerHTML = "";
    noEl.style.display = "block";
  } else {
    noEl.style.display = "none";
    container.innerHTML = filtered.map(e => {
      const realIndex = entries.indexOf(e);
      return `<div class="entry-row">
        <div class="entry-date">${e.date}</div>
        <div class="entry-person">${e.person}</div>
        <div class="entry-place">${e.place}</div>
        <div class="entry-hours">${e.hours % 1 === 0 ? e.hours : e.hours.toFixed(2)}h</div>
        <div class="entry-actions">
          <button class="btn-icon" onclick="editEntry(${realIndex})" title="Edit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon del" onclick="deleteEntry(${realIndex})" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>`;
    }).join("");
  }
}

function renderSetupLists() {
  const pl = document.getElementById("peopleList");
  const pll = document.getElementById("placesList");

  pl.innerHTML = people.length
    ? people.map((p, i) => `<li class="tag-item">${p}<button class="tag-remove" onclick="removePerson(${i})" title="Remove">×</button></li>`).join("")
    : `<li style="color:var(--text-faint);font-size:0.82rem;padding:4px 0;">No people added yet</li>`;

  pll.innerHTML = places.length
    ? places.map((p, i) => `<li class="tag-item">${p}<button class="tag-remove" onclick="removePlace(${i})" title="Remove">×</button></li>`).join("")
    : `<li style="color:var(--text-faint);font-size:0.82rem;padding:4px 0;">No workplaces added yet</li>`;
}

function buildWeeklyMap() {
  const map = {};
  entries.forEach(e => {
    const key = `${e.weekKey}-${e.person}-${e.place}`;
    if (!map[key]) {
      map[key] = { label: e.weekLabel, person: e.person, place: e.place, hours: 0 };
    }
    map[key].hours += e.hours;
  });
  return map;
}

// ========================
// TOAST
// ========================
let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

// ========================
// INIT
// ========================

// Set today's date as default
document.getElementById("dateInput").value = new Date().toISOString().split("T")[0];

// Keyboard shortcuts for forms
document.getElementById("personInput").addEventListener("keydown", e => { if (e.key === "Enter") addPerson(); });
document.getElementById("placeInput").addEventListener("keydown", e => { if (e.key === "Enter") addPlace(); });

render();