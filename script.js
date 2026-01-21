let people = JSON.parse(localStorage.getItem("people")) || [];
let places = JSON.parse(localStorage.getItem("places")) || [];
let entries = JSON.parse(localStorage.getItem("entries")) || [];

function saveData() {
  localStorage.setItem("people", JSON.stringify(people));
  localStorage.setItem("places", JSON.stringify(places));
  localStorage.setItem("entries", JSON.stringify(entries));
}

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

function editEntry(index) {
  const entry = entries[index];

  const newDate = prompt("Edit date (YYYY-MM-DD):", entry.date);
  if (!newDate) return;

  const newHours = prompt("Edit hours:", entry.hours);
  if (newHours === null || isNaN(newHours)) return;

  entry.date = newDate;
  entry.hours = parseFloat(newHours);

  const week = getWeekInfo(newDate);
  entry.weekKey = week.key;
  entry.weekLabel = week.label;

  saveData();
  render();
}

function deleteEntry(index) {
  if (!confirm("Are you sure you want to delete this entry?")) return;
  entries.splice(index, 1);
  saveData();
  render();
}

function render() {
  personSelect.innerHTML = people.map(p => `<option>${p}</option>`).join("");
  placeSelect.innerHTML = places.map(p => `<option>${p}</option>`).join("");

  const entriesTable = document.getElementById("entriesTable");
  const weeklyTotals = document.getElementById("weeklyTotals");
  const busiestWeek = document.getElementById("busiestWeek");

  entriesTable.innerHTML = "";
  weeklyTotals.innerHTML = "";

  const weeklyMap = {};
  let maxHours = 0;
  let maxWeek = "—";

  entries.forEach((e, i) => {
    const card = document.createElement("div");
    card.className = "entry-card";
    card.innerHTML = `
      <div class="row"><strong>Date:</strong> <span>${e.date}</span></div>
      <div class="row"><strong>Person:</strong> <span>${e.person}</span></div>
      <div class="row"><strong>Place:</strong> <span>${e.place}</span></div>
      <div class="row"><strong>Hours:</strong> <span>${e.hours}</span></div>
      <div class="actions">
        <button onclick="editEntry(${i})">Edit</button>
        <button onclick="deleteEntry(${i})">Delete</button>
      </div>
    `;
    entriesTable.appendChild(card);

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
    const card = document.createElement("div");
    card.className = "entry-card";
    card.innerHTML = `
      <div class="row"><strong>Week:</strong> <span>${w.label}</span></div>
      <div class="row"><strong>Person:</strong> <span>${w.person}</span></div>
      <div class="row"><strong>Place:</strong> <span>${w.place}</span></div>
      <div class="row"><strong>Total Hours:</strong> <span>${w.hours}</span></div>
    `;
    weeklyTotals.appendChild(card);
  }

  busiestWeek.textContent = `Busiest Week: ${maxWeek} – ${maxHours} hours`;
}

render();
