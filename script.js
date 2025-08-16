// ====== CONFIG ======
// // <-- put your OpenWeather API key here
const OPENWEATHER_API_KEY="0ea4d013d145883e2503ddfca2529854";
const BASE_WEATHER = "https://api.openweathermap.org/data/2.5/weather";
const BASE_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";
// ====== ELEMENTS ======
const yearEl = document.getElementById("year");
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const unitToggle = document.getElementById("unit-toggle");
const geoBtn = document.getElementById("geo-btn");

const currentCard = document.getElementById("current-card");
const statFeels = document.getElementById("stat-feels");
const statWind = document.getElementById("stat-wind");
const statHumidity = document.getElementById("stat-humidity");
const statSun = document.getElementById("stat-sun");

const forecastGrid = document.getElementById("forecast-grid");
const hourlyScroll = document.getElementById("hourly-scroll");
const errorEl = document.getElementById("error");

yearEl.textContent = new Date().getFullYear();

// ====== STATE ======
let units = localStorage.getItem("units") || "metric"; // metric | imperial
unitToggle.checked = units === "imperial"; // checked = F
syncUnitLabels();

// ====== HELPERS ======
const KELVIN = 273.15;
const fmtTemp = (t) => (units === "metric" ? `${Math.round(t)}°C` : `${Math.round(t)}°F`);
const fmtSpeed = (s) => (units === "metric" ? `${s.toFixed(1)} m/s` : `${(s * 2.237).toFixed(1)} mph`);
const iconUrl = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;
const toLocalTime = (ts, tzOffsetSec) => new Date((ts + tzOffsetSec) * 1000);
const dayName = (date) => date.toLocaleDateString(undefined, { weekday: "short" });
const hourStr = (date) => date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

function showError(msg){
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
  setTimeout(()=> errorEl.classList.add("hidden"), 3000);
}

function saveLastCity(city){
  localStorage.setItem("last_city", city);
}

function getUnitsParam(){
  return units === "metric" ? "metric" : "imperial";
}

// ====== FETCHERS ======
async function fetchWeatherByCity(city){
  const url = `${BASE_WEATHER}?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=${getUnitsParam()}`;
  const r = await fetch(url);
  if(!r.ok) throw new Error("City not found");
  return r.json();
}
async function fetchForecastByCity(city){
  const url = `${BASE_FORECAST}?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=${getUnitsParam()}`;
  const r = await fetch(url);
  if(!r.ok) throw new Error("Forecast not available");
  return r.json();
} ;
function getUnitsParam() {
  return "metric"; // or dynamically "imperial"
}

async function fetchByCoords(lat, lon) {
  const wUrl = `${BASE_WEATHER}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=${getUnitsParam()}`;
  const fUrl = `${BASE_FORECAST}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=${getUnitsParam()}`;

  const [w, f] = await Promise.all([fetch(wUrl), fetch(fUrl)]);
  if (!w.ok || !f.ok) throw new Error("Location fetch failed");

  return [await w.json(), await f.json()];
}

// ====== RENDERERS ======
function renderCurrent(w){
  const { name, sys, main, weather, wind, dt, timezone } = w;
  const icon = weather?.[0]?.icon || "01d";
  const desc = weather?.[0]?.description || "";
  const temp = Math.round(main.temp);
  const min = Math.round(main.temp_min);
  const max = Math.round(main.temp_max);

  currentCard.innerHTML = `
    <div class="current-left">
      <img class="icon" src="${iconUrl(icon)}" alt="${desc}">
      <div>
        <div class="city">${name}, ${sys.country || ""}</div>
        <div class="desc">${desc.replace(/\b\w/g, c => c.toUpperCase())}</div>
      </div>
    </div>
    <div class="current-right">
      <div class="current-temp">${fmtTemp(temp)}</div>
      <div class="kpi">H: ${fmtTemp(max)} &nbsp;•&nbsp; L: ${fmtTemp(min)}</div>
      <div class="kpi">${hourStr(toLocalTime(dt, timezone))}</div>
    </div>
  `;

  statFeels.innerHTML = `
    <div class="label">Feels Like</div>
    <div class="value">${fmtTemp(main.feels_like)}</div>
  `;

  statWind.innerHTML = `
    <div class="label">Wind</div>
    <div class="value">${fmtSpeed(wind.speed)}</div>
  `;

  statHumidity.innerHTML = `
    <div class="label">Humidity</div>
    <div class="value">${main.humidity}%</div>
  `;

  statSun.innerHTML = `
    <div class="label">Sunrise / Sunset</div>
    <div class="value">
      ${hourStr(toLocalTime(sys.sunrise, timezone))} · ${hourStr(toLocalTime(sys.sunset, timezone))}
    </div>
  `;
}

function renderForecast(fore){
  // Forecast is 3-hourly for 5 days (40 entries)
  // Build daily summary (noon or closest) & hourly row for today
  const tz = fore.city.timezone;
  const byDay = {};

  fore.list.forEach(item=>{
    const date = toLocalTime(item.dt, tz);
    const dayKey = date.toISOString().slice(0,10);
    if(!byDay[dayKey]) byDay[dayKey] = [];
    byDay[dayKey].push(item);
  });

  // Daily cards (next 5 unique days)
  const days = Object.keys(byDay).slice(0,5);
  forecastGrid.innerHTML = '';
  days.forEach(d=>{
    const slots = byDay[d];
    // choose midday-ish slot (12:00) or middle
    const target = slots.find(s => new Date((s.dt + tz) * 1000).getUTCHours() === 12) || slots[Math.floor(slots.length/2)];
    const dt = toLocalTime(target.dt, tz);
    const tmin = Math.min(...slots.map(s=>s.main.temp_min));
    const tmax = Math.max(...slots.map(s=>s.main.temp_max));
    const ic = target.weather?.[0]?.icon || "01d";
    forecastGrid.insertAdjacentHTML('beforeend', `
      <div class="fore-card card">
        <div class="day">${dayName(dt)}</div>
        <img src="${iconUrl(ic)}" alt="">
        <div class="range">${fmtTemp(tmax)} / ${fmtTemp(tmin)}</div>
      </div>
    `);
  });

  // Hourly for today (next ~12 hours)
  const todayKey = Object.keys(byDay)[0];
  hourlyScroll.innerHTML = '';
  (byDay[todayKey] || []).slice(0,8).forEach(item=>{
    const when = toLocalTime(item.dt, tz);
    const ic = item.weather?.[0]?.icon || "01d";
    hourlyScroll.insertAdjacentHTML('beforeend', `
      <div class="hour-card">
        <div>${hourStr(when)}</div>
        <img src="${iconUrl(ic)}" alt="">
        <div><strong>${fmtTemp(item.main.temp)}</strong></div>
      </div>
    `);
  });
}

// ====== CONTROLLER ======
async function loadCity(city){
  try{
    errorEl.classList.add("hidden");
    const [w, f] = await Promise.all([fetchWeatherByCity(city), fetchForecastByCity(city)]);
    renderCurrent(w);
    renderForecast(f);
    saveLastCity(w.name);
  }catch(e){
    showError(e.message || "Unable to fetch weather");
  }
}

async function loadCoords(lat, lon){
  try{
    errorEl.classList.add("hidden");
    const [w, f] = await fetchByCoords(lat, lon);
    renderCurrent(w);
    renderForecast(f);
    saveLastCity(w.name);
  }catch(e){
    showError(e.message || "Location not available");
  }
}

// ====== EVENTS ======
form.addEventListener("submit", (e)=>{
  e.preventDefault();
  const city = (input.value || "").trim();
  if(!city) return;
  loadCity(city);
});

unitToggle.addEventListener("change", ()=>{
  units = unitToggle.checked ? "imperial" : "metric";
  localStorage.setItem("units", units);
  syncUnitLabels();
  // Re-load last city with new units
  const last = localStorage.getItem("last_city") || "Mumbai";
  loadCity(last);
});

geoBtn.addEventListener("click", ()=>{
  if(!navigator.geolocation){
    showError("Geolocation not supported in this browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos)=> loadCoords(pos.coords.latitude, pos.coords.longitude),
    ()=> showError("Location permission denied.")
  );
});

// ====== INIT ======
function syncUnitLabels(){
  document.getElementById("unit-c").style.opacity = units === "metric" ? "1" : ".5";
  document.getElementById("unit-f").style.opacity = units === "imperial" ? "1" : ".5";
}

(function start(){
  const last = localStorage.getItem("last_city") || "Mumbai";
  loadCity(last);
})();
