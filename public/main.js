// Координаты склада и радиус
const warehouseLat = 53.43503224828556;
const warehouseLon = 14.55258543983807;
const allowedRadius = 160;

// DOM элементы
const intro = document.getElementById('intro');
const geoStage = document.getElementById('geoStage');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const message = document.getElementById('message');
const backToIntroButton = document.getElementById('backToIntroButton');

// --- Функции для переходов между блоками ---
function backToIntro() {
  document.getElementById('infoTabs').style.display = 'none';
  intro.classList.add('active');
  geoStage.classList.remove('active');
}

function goToInfoTabs() {
  intro.classList.remove('active');
  document.getElementById('infoTabs').style.display = 'block';
}

function showTab(tabId) {
  const tabs = ['plTab', 'ruTab', 'uaTab', 'geTab'];
  tabs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === tabId) ? 'block' : 'none';
  });
}

function goToGeoStageFromTabs() {
  document.getElementById('infoTabs').style.display = 'none';
  geoStage.classList.add('active');
}

// --- Геолокация ---
let watchId = null;
let geoTimeout = null;
let bestPos = null;
let bestAccuracy = 9999;

function runGeolocationCheck() {
  message.textContent = '⏳ Sprawdzanie współrzędnych... / Проверка координат...';
  startButton.style.display = 'none';
  retryButton.style.display = 'none';

  bestPos = null;
  bestAccuracy = 9999;

  watchId = navigator.geolocation.watchPosition(
    function(position) {
      const acc = position.coords.accuracy || 9999;
      if (acc < bestAccuracy) {
        bestAccuracy = acc;
        bestPos = position;
      }
      if (acc < 70) {
        stopGeoWatch();
        success(bestPos);
      }
    },
    error,
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    }
  );

  geoTimeout = setTimeout(function() {
    stopGeoWatch();
    if (bestPos) {
      success(bestPos);
    } else {
      error({message: "Brak dokładnych współrzędnych / Нет точных координат"});
    }
  }, 15000);
}

function stopGeoWatch() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (geoTimeout !== null) {
    clearTimeout(geoTimeout);
    geoTimeout = null;
  }
}

function success(position) {
  const userLat = position.coords.latitude;
  const userLon = position.coords.longitude;
  const distance = getDistanceFromLatLonInMeters(userLat, userLon, warehouseLat, warehouseLon);

  if (distance <= allowedRadius) {
    if (!localStorage.getItem("ankieta_wypelniona")) {
      localStorage.setItem("ankieta_wypelniona", "true");
      message.innerHTML =
        `✅ Lokalizacja potwierdzona. Wypełnij formularz poniżej:<br>
        ✅ Местоположение подтверждено. Заполните форму ниже:
        <iframe src="https://docs.google.com/forms/d/e/1FAIpQLScWAcx35bMtBpca_IA4Lv-O1sMm-O_bUANHeRi4JFK3k3PltA/viewform?usp=dialog" style="width:100%; height:1200px; border:none; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          Ładowanie formularza… Загрузка формы…
        </iframe>
        `;
    } else {
      message.innerHTML = "✅ Już wypełniłeś(-aś) tę ankietę. / Вы уже прошли этот опрос.";
    }
    retryButton.style.display = 'inline-block';
    backToIntroButton.style.display = 'inline-block';
    startButton.style.display = 'none';
  } else {
    message.innerHTML = '❌ Ankieta dostępna tylko na terenie magazynu AutoDoc M13. / Опрос доступен только на территории склада AutoDoc М13.';
    retryButton.style.display = 'inline-block';
    backToIntroButton.style.display = 'inline-block';
    startButton.style.display = 'none';
  }
}

function error(err) {
  console.warn(`Błąd geolokalizacji: ${err.message}`);
  message.textContent = '⚠️ Nie udało się uzyskać współrzędnych. Zezwól na dostęp do lokalizacji i spróbuj ponownie. / Не удалось получить координаты. Разрешите доступ к геолокации и попробуйте снова.';
  retryButton.style.display = 'inline-block';
  backToIntroButton.style.display = 'inline-block';
  startButton.style.display = 'none';
}

function resetToInitialState() {
  message.textContent = 'Kliknij poniższy przycisk, aby rozpocząć. / Нажмите кнопку ниже для начала.';
  startButton.style.display = 'inline-block';
  retryButton.style.display = 'none';
  backToIntroButton.style.display = 'none';
}

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// --- Навешиваем обработчики после загрузки страницы ---
document.addEventListener('DOMContentLoaded', function() {
  // Если уже заполнено — скрыть всё, кроме сообщения
  if (localStorage.getItem("ankieta_wypelniona") === "true") {
    var allStages = document.querySelectorAll('.stage, #geoStage, #intro');
    allStages.forEach(function(div) { div.style.display = 'none'; });
    var main = document.createElement('div');
    main.style.fontSize = '1.5em';
    main.style.marginTop = '3em';
    main.innerHTML = "✅ Już wypełniłeś(-aś) tę ankietę. / Вы уже прошли этот опрос.";
    document.body.appendChild(main);
    return; // Остановить инициализацию, если уже заполнено
  }

  // Кнопка "Продолжить"
  document.getElementById('continueButton').addEventListener('click', goToInfoTabs);

  // Кнопки языков
  document.getElementById('btn-plTab').addEventListener('click', () => showTab('plTab'));
  document.getElementById('btn-ruTab').addEventListener('click', () => showTab('ruTab'));
  document.getElementById('btn-uaTab').addEventListener('click', () => showTab('uaTab'));
  document.getElementById('btn-geTab').addEventListener('click', () => showTab('geTab'));

  // Кнопки "назад" во всех табах
  document.querySelectorAll('.backToIntroBtn').forEach(btn =>
    btn.addEventListener('click', backToIntro)
  );
  // Кнопки "начать" во всех табах
  document.querySelectorAll('.toGeoStageBtn').forEach(btn =>
    btn.addEventListener('click', goToGeoStageFromTabs)
  );

  // Гео-кнопки
  startButton.addEventListener('click', runGeolocationCheck);
  retryButton.addEventListener('click', function() {
    backToIntroButton.style.display = 'none';
    resetToInitialState();
  });
  backToIntroButton.addEventListener('click', function() {
    geoStage.classList.remove('active');
    intro.classList.add('active');
    startButton.style.display = 'inline-block';
    retryButton.style.display = 'none';
    backToIntroButton.style.display = 'none';
    message.textContent = 'Kliknij poniższy przycisk, aby rozpocząć. / Нажмите кнопку ниже для начала.';
  });
});





