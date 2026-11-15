// AEROFLOW FRONTEND DEMO
// These controls only change the display. They are NOT connected to an ESP32 yet.

const navButtons = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

const pageDetails = {
  overview: ["Dashboard Overview", "Monitor your indoor environment and ventilation system."],
  monitoring: ["Sensor Monitoring", "View detailed environmental readings and trends."],
  controls: ["System Controls", "Manage the ventilation unit and operating mode."],
  devices: ["Device Management", "View the master–slave sensor network."]
};

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    const selectedPage = button.dataset.page;
    navButtons.forEach(item => item.classList.toggle("active", item === button));
    pages.forEach(page => page.classList.toggle("active", page.id === `${selectedPage}-page`));
    pageTitle.textContent = pageDetails[selectedPage][0];
    pageSubtitle.textContent = pageDetails[selectedPage][1];
  });
});

let fanIsOn = false;
let operatingMode = "manual";

const fanElements = {
  status: [document.getElementById("fan-status"), document.getElementById("fan-status-control")],
  title: [document.getElementById("fan-title"), document.getElementById("fan-title-control")],
  symbol: [document.getElementById("fan-symbol"), document.getElementById("fan-symbol-control")]
};

function updateFanDisplay() {
  fanElements.status.forEach(element => {
    if (!element) return;
    element.textContent = fanIsOn ? "RUNNING" : "STOPPED";
    element.classList.toggle("on", fanIsOn);
    element.classList.toggle("off", !fanIsOn);
  });
  fanElements.title.forEach(element => {
    if (element) element.textContent = fanIsOn ? "Fan is ON" : "Fan is OFF";
  });
  fanElements.symbol.forEach(element => {
    if (element) element.classList.toggle("spinning", fanIsOn);
  });
}

function setFan(state) {
  if (operatingMode === "automatic") return;
  fanIsOn = state;
  updateFanDisplay();
}

function setMode(value) {
  operatingMode = value;
  const isManual = value === "manual";
  ["turn-on", "turn-off", "turn-on-control", "turn-off-control"].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.disabled = !isManual;
  });
  const note = document.getElementById("mode-note");
  if (note) note.textContent = isManual
    ? "Preview only — buttons do not control physical equipment."
    : "Automatic mode preview. Actual automatic logic will be handled by the controller.";
  if (!isManual) {
    fanIsOn = false;
    updateFanDisplay();
  }
}

document.getElementById("turn-on").addEventListener("click", () => setFan(true));
document.getElementById("turn-off").addEventListener("click", () => setFan(false));
document.getElementById("turn-on-control").addEventListener("click", () => setFan(true));
document.getElementById("turn-off-control").addEventListener("click", () => setFan(false));

document.getElementById("mode-select").addEventListener("change", event => {
  operatingMode = event.target.value;
  document.getElementById("mode-select-control").value = operatingMode;
  setMode(operatingMode);
});
document.getElementById("mode-select-control").addEventListener("change", event => {
  operatingMode = event.target.value;
  document.getElementById("mode-select").value = operatingMode;
  setMode(operatingMode);
});

const sampleLabels = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM"];
const sampleTemperatures = [27, 28, 28.5, 30, 31, 29.4];

function createTemperatureChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;
  new Chart(canvas, {
    type: "line",
    data: {
      labels: sampleLabels,
      datasets: [{
        label: "Temperature (°C)",
        data: sampleTemperatures,
        borderColor: "#22a88e",
        backgroundColor: "rgba(34, 168, 142, 0.12)",
        fill: true,
        tension: 0.38,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#22a88e"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: false, grid: { color: "#edf1f4" }, ticks: { color: "#8996a2", font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { color: "#8996a2", font: { size: 10 } } }
      }
    }
  });
}

createTemperatureChart("temperatureChart");
createTemperatureChart("monitoringChart");
updateFanDisplay();

document.getElementById("last-updated").textContent =
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
