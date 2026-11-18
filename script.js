import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// 1) Paste your Firebase web app configuration values below.
// Get them from Firebase Console > Project settings > Your apps > Config.
const firebaseConfig = {
  apiKey: "AIzaSyA3_vVKLks2cuhK_4F3F-gA1is4EGZUTbM",
  authDomain: "aeroflow-smart-system.firebaseapp.com",
  databaseURL: "https://aeroflow-smart-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aeroflow-smart-system",
  storageBucket: "aeroflow-smart-system.firebasestorage.app",
  messagingSenderId: "488959251500",
  appId: "1:488959251500:web:de0421c6cde04418282d89"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "Signing in...";
  loginMessage.className = "form-message";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginMessage.textContent = "";
  } catch (error) {
    loginMessage.textContent = friendlyAuthError(error.code);
    loginMessage.className = "form-message error";
  }
});

document.getElementById("logout-button").addEventListener("click", () => signOut(auth));

function friendlyAuthError(code) {
  const messages = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/invalid-email": "Please enter a valid email address."
  };
  return messages[code] || "Unable to sign in. Check your details and try again.";
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.hidden = true;
    appShell.hidden = false;
    startDatabaseListeners();
  } else {
    appShell.hidden = true;
    loginScreen.hidden = false;
  }
});

let listenersStarted = false;
let temperatureChart;
let monitoringChart;
const historyLabels = [];
const historyValues = [];

function startDatabaseListeners() {
  if (listenersStarted) return;
  listenersStarted = true;

  const connectionRef = ref(database, ".info/connected");
  onValue(connectionRef, (snapshot) => {
    const connected = snapshot.val() === true;
    document.getElementById("connection-label").textContent = connected ? "Database connected" : "Database offline";
    document.getElementById("top-status").textContent = connected ? "DATABASE ONLINE" : "DATABASE OFFLINE";
    document.getElementById("connection-dot").style.background = connected ? "#38c99c" : "#d97777";
  });

  onValue(ref(database, "sensors"), (snapshot) => {
    const sensors = snapshot.val() || {};
    setText(["temperature-value", "temperature-value-2"], formatValue(sensors.temperature));
    setText(["humidity-value", "humidity-value-2"], formatValue(sensors.humidity));
    setText(["air-velocity-value", "air-velocity-value-2"], formatValue(sensors.airVelocity));
    document.getElementById("last-updated").textContent = new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
    if (typeof sensors.temperature === "number") addTemperaturePoint(sensors.temperature);
  });

  onValue(ref(database, "ventilation"), (snapshot) => {
    const ventilation = snapshot.val() || {};
    const command = String(ventilation.command || "OFF").toUpperCase();
    const mode = String(ventilation.mode || "MANUAL").toUpperCase();
    const actualState = String(ventilation.actualState || "UNKNOWN").toUpperCase();
    setFanDisplay(actualState);
    setModeDisplay(mode);
    const isManual = mode === "MANUAL";
    ["turn-on", "turn-off", "turn-on-control", "turn-off-control"].forEach(id => {
      document.getElementById(id).disabled = !isManual;
    });
    const note = isManual
      ? `Latest requested command: ${command}. The physical fan status is reported separately.`
      : "Automatic mode is selected. The controller should manage the fan using its programmed thresholds.";
    setText(["control-message", "control-message-2"], note);
  });

  onValue(ref(database, "devices"), (snapshot) => {
    const devices = snapshot.val() || {};
    const nodes = ["master", "slave1", "slave2"];
    const onlineCount = nodes.filter(key => String(devices[key] || "").toLowerCase() === "online").length;
    setText(["active-nodes-value", "active-nodes-value-2"], String(onlineCount));
    nodes.forEach(key => {
      const value = devices[key] || "unknown";
      const ids = key === "master" ? ["master-status", "master-status-2"]
        : key === "slave1" ? ["slave1-status", "slave1-status-2"]
        : ["slave2-status", "slave2-status-2"];
      ids.forEach(id => {
        const element = document.getElementById(id);
        element.textContent = String(value);
        element.className = "node-state " + (String(value).toLowerCase() === "online" ? "node-online" : "node-offline");
      });
    });
  });

  createCharts();
}

function setText(ids, value) {
  ids.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}
function formatValue(value) {
  return value === undefined || value === null ? "--" : String(value);
}
function setFanDisplay(state) {
  const isOn = state === "ON";
  const known = state === "ON" || state === "OFF";
  ["fan-status", "fan-status-control"].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = known ? (isOn ? "RUNNING" : "STOPPED") : "UNKNOWN";
    el.className = "state-pill " + (isOn ? "on" : "off");
  });
  ["fan-title", "fan-title-control"].forEach(id => {
    document.getElementById(id).textContent = known ? `Fan is ${state}` : "Waiting for hardware status";
  });
  ["fan-symbol", "fan-symbol-control"].forEach(id => {
    document.getElementById(id).classList.toggle("spinning", isOn);
  });
  document.getElementById("fan-description").textContent = known
    ? (isOn ? "The reported fan state is ON." : "The reported fan state is OFF.")
    : "No actual fan state has been reported yet.";
}
function setModeDisplay(mode) {
  document.getElementById("mode-select").value = mode;
  document.getElementById("mode-select-control").value = mode;
}

async function sendVentilationCommand(values) {
  try {
    await update(ref(database, "ventilation"), values);
    setText(["control-message", "control-message-2"], "Command saved to Firebase. The ESP32 must receive it to operate the physical fan.");
  } catch (error) {
    setText(["control-message", "control-message-2"], `Could not update Firebase: ${error.message}`);
  }
}
document.getElementById("turn-on").addEventListener("click", () => sendVentilationCommand({command: "ON"}));
document.getElementById("turn-off").addEventListener("click", () => sendVentilationCommand({command: "OFF"}));
document.getElementById("turn-on-control").addEventListener("click", () => sendVentilationCommand({command: "ON"}));
document.getElementById("turn-off-control").addEventListener("click", () => sendVentilationCommand({command: "OFF"}));

function handleModeChange(value) {
  sendVentilationCommand({mode: value});
}
document.getElementById("mode-select").addEventListener("change", event => {
  document.getElementById("mode-select-control").value = event.target.value;
  handleModeChange(event.target.value);
});
document.getElementById("mode-select-control").addEventListener("change", event => {
  document.getElementById("mode-select").value = event.target.value;
  handleModeChange(event.target.value);
});

function createCharts() {
  if (typeof Chart === "undefined") return;
  const config = {
    type: "line",
    data: { labels: historyLabels, datasets: [{
      label: "Temperature (°C)", data: historyValues,
      borderColor: "#0F94D2", backgroundColor: "rgba(15, 148, 210, 0.12)",
      fill: true, tension: 0.38, borderWidth: 2, pointRadius: 3
    }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: false, plugins: {legend: {display: false}},
      scales: {
        y: {grid: {color: "#edf1f4"}, ticks: {color: "#8996a2", font: {size: 10}}},
        x: {grid: {display: false}, ticks: {color: "#8996a2", font: {size: 10}}}
      }
    }
  };
  temperatureChart = new Chart(document.getElementById("temperatureChart"), structuredClone(config));
  monitoringChart = new Chart(document.getElementById("monitoringChart"), structuredClone(config));
}
function addTemperaturePoint(value) {
  const label = new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
  historyLabels.push(label);
  historyValues.push(value);
  if (historyLabels.length > 20) { historyLabels.shift(); historyValues.shift(); }
  [temperatureChart, monitoringChart].forEach(chart => {
    if (chart) chart.update();
  });
}

// Dashboard navigation
const pageDetails = {
  overview: ["Dashboard Overview", "Monitor your indoor environment and ventilation system."],
  monitoring: ["Sensor Monitoring", "View live environmental readings and trends."],
  controls: ["System Controls", "Manage the ventilation unit and operating mode."],
  devices: ["Device Management", "View the master–slave sensor network."]
};
document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => {
    const selected = button.dataset.page;
    document.querySelectorAll(".nav-link").forEach(item => item.classList.toggle("active", item === button));
    document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === `${selected}-page`));
    document.getElementById("page-title").textContent = pageDetails[selected][0];
    document.getElementById("page-subtitle").textContent = pageDetails[selected][1];
  });
});
