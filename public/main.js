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
      message.innerHTML = `
        <div class="container">
          <div class="lang-switch">
            <button class="lang-pl" onclick="window.setLang('pl')">🇵🇱 Polski</button>
            <button class="lang-ru" onclick="window.setLang('ru')">🇷🇺 Русский</button>
            <button class="lang-en" onclick="window.setLang('en')">🇬🇧 English</button>
            <button class="lang-uk" onclick="window.setLang('uk')">🇺🇦 Українська</button>
            <button class="lang-ka" onclick="window.setLang('ka')">🇬🇪 ქართული</button>
          </div>
          <h1 id="formTitle"
            data-pl="ANKIETA ANONIMOWA"
            data-ru="АНОНИМНЫЙ ОПРОС"
            data-en="ANONYMOUS SURVEY"
            data-uk="АНОНІМНЕ ОПИТУВАННЯ"
            data-ka="ანონიმური გამოკითხვა">ANKIETA ANONIMOWA</h1>
          <form id="surveyForm">
            <!-- ВОПРОСЫ И ОТВЕТЫ — см. ниже, можешь вставить больше! -->
            <div class="question" data-pl="1. Jak oceniasz styl zarządzania obecnego kierownika magazynu?"
              data-ru="1. Как вы оцениваете стиль управления текущего руководителя склада?"
              data-en="1. How do you rate the management style of the current warehouse manager?"
              data-uk="1. Як ви оцінюєте стиль управління нинішнього керівника складу?"
              data-ka="1. როგორ აფასებთ ამჟამინდელი საწყობის მმართველის მართვის სტილს?"></div>
            <div class="answers">
              <label><input type="radio" name="q1" value="1" required>
                <span data-pl="Szanujący i profesjonalny"
                  data-ru="Уважительный и профессиональный"
                  data-en="Respectful and professional"
                  data-uk="Повага та професіоналізм"
                  data-ka="მცემლობა და პროფესიონალიზმი"></span>
              </label>
              <label><input type="radio" name="q1" value="2">
                <span data-pl="Chłodny i formalny"
                  data-ru="Холодный и формальный"
                  data-en="Cold and formal"
                  data-uk="Холодний і формальний"
                  data-ka="ცივი და ფორმალური"></span>
              </label>
              <label><input type="radio" name="q1" value="3">
                <span data-pl="Autorytarny, powodujący napięcie"
                  data-ru="Авторитарный, вызывающий напряжение"
                  data-en="Authoritarian causing tension"
                  data-uk="Авторитарний, що викликає напруження"
                  data-ka="ავტორიტარული და სტრესის გამომწვევი"></span>
              </label>
              <label><input type="radio" name="q1" value="4">
                <span data-pl="Poniżający i wzbudzający strach"
                  data-ru="Унижающий и создающий страх"
                  data-en="Humiliating and fear-inducing"
                  data-uk="Принижуючий і викликає страх"
                  data-ka="მახინჯი და შიშის მომგვრელი"></span>
              </label>
            </div>
            <!-- ... вставь остальные вопросы по аналогии ... -->

            <button type="submit" class="submit-btn"
              data-pl="Wyślij anonimowo"
              data-ru="Отправить анонимно"
              data-en="Submit anonymously"
              data-uk="Відправити анонімно"
              data-ka="გაგზავნე ანონიმურად">Wyślij anonimowo</button>
          </form>
          <div id="thanksMsg" class="thanks" style="display:none;"
            data-pl="Dziękujemy za udział. Ankieta jest anonimowa i służy ochronie warunków pracy i szacunku wobec pracowników."
            data-ru="Спасибо за участие. Опрос анонимный и служит защите условий труда и уважения к сотрудникам."
            data-en="Thank you for participating. The survey is anonymous and helps protect working conditions and respect for employees."
            data-uk="Дякуємо за участь. Опитування анонімне і допомагає захистити умови праці та повагу до працівників."
            data-ka="გმადლობთ მონაწილეობისთვის. გამოკითხვა ანონიმურია და მიზნად ისახავს სამუშაო პირობებისა და თანამშრომლების პატივის დაცვის დაცვას."></div>
          <div class="disclaimer" id="footerText"
            data-pl="NSZZ „Solidarność” w Autodoc"
            data-ru="НСЗЗ «Солидарность» в Autodoc"
            data-en="NSZZ 'Solidarity' at Autodoc"
            data-uk="НСЗЗ «Солідарність» в Autodoc"
            data-ka="НСЗЗ „სოლიდარობა“ Autodoc-ში">
            NSZZ „Solidarność” w Autodoc
          </div>
        </div>
      `;
      initSurveyForm();
    } else {
      message.innerHTML = "✅ Już wypełniłeś(-aś) tę ankietę. / Вы уже прошли этот опрос.";
    }
    retryButton.style.display = 'inline-block';
    backToIntroButton.style.display = 'inline-block';
    startButton.style.display = 'none';
  } else {
    message.innerHTML = '❌ Ankieta dostępna tylko на terenie magazynu AutoDoc M13. / Опрос доступен только на территории склада AutoDoc М13.';
    retryButton.style.display = 'inline-block';
    backToIntroButton.style.display = 'inline-block';
    startButton.style.display = 'none';
  }
}
function setLang(lang) {
  localStorage.setItem("ankieta_lang", lang);

  document.getElementById("formTitle").textContent = document.getElementById("formTitle").dataset[lang];

  document.querySelectorAll(".question").forEach(el => el.textContent = el.dataset[lang]);
  document.querySelectorAll(".answers label span").forEach(el => {
    el.textContent = el.dataset[lang];
  });

  const btn = document.querySelector("button.submit-btn");
  btn.textContent = btn.dataset[lang];

  const thanks = document.getElementById("thanksMsg");
  thanks.textContent = thanks.dataset[lang];
  thanks.style.display = "none";

  const footer = document.getElementById("footerText");
  footer.textContent = footer.dataset[lang];

  document.querySelectorAll(".lang-switch button").forEach(b => {
    b.classList.toggle("active", b.classList.contains("lang-" + lang));
  });
}
window.setLang = setLang; // чтобы работало из html

function initSurveyForm() {
  let curLang = localStorage.getItem("ankieta_lang") || "pl";
  setLang(curLang);

  if(localStorage.getItem("ankieta_wypelniona") === "true") {
    document.getElementById("surveyForm").style.display = "none";
    document.getElementById("thanksMsg").style.display = "block";
    return;
  }

  document.getElementById("surveyForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const data = {};
    for(let i=1; i<=7; i++) {
      const inputs = this.querySelectorAll(`input[name="q${i}"]:checked`);
      if (inputs.length === 0) {
        alert({
          pl: "Proszę odpowiedzieć na wszystkie pytania",
          ru: "Пожалуйста, ответьте на все вопросы",
          en: "Please answer all questions",
          uk: "Будь ласка, відповідайте на всі питання",
          ka: "გთხოვთ უპასუხოთ ყველა კითხვას"
        }[curLang] || "Please answer all questions");
        return;
      }
      data[`q${i}`] = inputs[0].value;
    }

    try {
      const resp = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if(resp.ok) {
        localStorage.setItem("ankieta_wypelniona", "true");
        this.style.display = "none";
        const thanks = document.getElementById("thanksMsg");
        thanks.style.display = "block";
      } else {
        alert({
          pl: "Błąd wysyłania",
          ru: "Ошибка отправки",
          en: "Send error",
          uk: "Помилка відправки",
          ka: "გაგზავნის შეცდომა"
        }[curLang] || "Send error");
      }
    } catch(e) {
      alert({
        pl: "Błąd połączenia",
        ru: "Ошибка соединения",
        en: "Connection error",
        uk: "Помилка з'єднання",
        ka: "კავშირის შეცდომა"
      }[curLang] || "Connection error");
    }
  });
}
