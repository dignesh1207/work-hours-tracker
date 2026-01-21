// ---------- STORAGE ----------
let people = JSON.parse(localStorage.getItem("people")) || [];
let places = JSON.parse(localStorage.getItem("places")) || [];
let entries = JSON.parse(localStorage.getItem("entries")) || [];

function saveData() {
  localStorage.setItem("people", JSON.stringify(people));
  localStorage.setItem("places", JSON.stringify(places));
  localStorage.setItem("entries", JSON.stringify(entries));
}

// ---------- DATE HELPERS ----------
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
  const week = Math.ceil(
    (diff + start.getDay() * 86400000) / (7 * 86400000)
  );

  const ws = getWeekStart(date);
  const we = getWeekEnd(date);

  return {
    key: `W${week}-${formatDate(ws)}`,
    label: `Week ${week} (${formatDate(ws)} → ${formatDate(we)})`
  };
}

// ---------- ADD ----------
function addPerson() {
  const name = personInput.value.trim();
  if (!name) return;
  people.push(name);
  personInput.value = "";
  saveData();
  render();
}

function addPlace() {
  const name = placeInput.value.trim();
  if (!name) return;
  places.push(name);
  placeInput.value = "";
  saveData();
  render();
}

function addEntry() {
  const person = personSelect.value;
  const place = placeSelect.value;
  const date = dateInput.value;
  const hours = parseFloat(hoursInput.value);

  if (!person || !place || !date || !hours) return;

  const week = getWeekInfo(date);

  entries.push({
    person,
    place,
    date,
    hours,
    weekKey: week.key,
    weekLabel: week.label
  });

  saveData();
  render();
}

// ---------- EDIT ----------
function editEntry(index) {
  const entry = entries[index];

  const newDate = prompt("Edit date (YYYY-MM-DD):", entry.date);
  if (!newDate) return;

  const newHours = prompt("Edit hours:", entry.hours);
  if (newHours === null || isNaN(newHours)) return;

  entry.date = newDate;
  entry.hours = parseFloat(newHours);

  // Recalculate week info
  const week = getWeekInfo(newDate);
  entry.weekKey = week.key;
  entry.weekLabel = week.label;

  saveData();
  render();
}

// ---------- DELETE ----------
function deleteEntry(index) {
  if (!confirm("Are you sure you want to delete this entry?")) return;
  entries.splice(index, 1);
  saveData();
  render();
}

// ---------- RENDER ----------
function render() {
  personSelect.innerHTML = people.map(p => `<option>${p}</option>`).join("");
  placeSelect.innerHTML = places.map(p => `<option>${p}</option>`).join("");

  entriesTable.innerHTML = "";
  weeklyTotals.innerHTML = "";

  const weeklyMap = {};
  let maxHours = 0;
  let maxWeek = "—";

  entries.forEach((e, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${e.date}</td>
      <td>${e.person}</td>
      <td>${e.place}</td>
      <td>${e.hours}</td>
      <td><button onclick="editEntry(${i})">Edit</button></td>
      <td><button onclick="deleteEntry(${i})">Delete</button></td>
    `;
    entriesTable.appendChild(row);

    // Weekly aggregation with workplace included
    const key = `${e.weekKey}-${e.person}-${e.place}`;

    if (!weeklyMap[key]) {
      weeklyMap[key] = {
        label: e.weekLabel,
        person: e.person,
        place: e.place,
        hours: 0
      };
    }

    weeklyMap[key].hours += e.hours;

    if (weeklyMap[key].hours > maxHours) {
      maxHours = weeklyMap[key].hours;
      maxWeek = `${weeklyMap[key].label} (${e.person})`;
    }
  });

  for (const k in weeklyMap) {
    const w = weeklyMap[k];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${w.label}</td>
      <td>${w.person}</td>
      <td>${w.hours}</td>
      <td>${w.place}</td>
    `;
    weeklyTotals.appendChild(tr);
  }

  busiestWeek.textContent = `Busiest Week: ${maxWeek} – ${maxHours} hours`;
}

render();
