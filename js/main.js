// ============================================
// ОТПРАВКА ЛИДОВ НА СЕРВЕР (без токена на фронте)
// ============================================
const SEND_ENDPOINT = 'send.php';

async function sendToTelegramHTML(htmlText) {
  const res = await fetch(SEND_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: htmlText, parse_mode: 'HTML', page: location.href })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data && data.error ? data.error : 'send failed');
  }
  return data;
}

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
// ============================================
// ПРОГРЕСС-БАР СКРОЛЛА
// ============================================
window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  document.getElementById('progressBar').style.width = scrolled + '%';
  
  if (winScroll > 50) {
    document.getElementById('header').classList.add('scrolled');
  } else {
    document.getElementById('header').classList.remove('scrolled');
  }
});

// ============================================
// КАЛЬКУЛЯТОР СТОИМОСТИ
// ============================================
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const regionSelect = document.getElementById('regionSelect');
const calcPrice = document.getElementById('calcPrice');
const pricePerTon = document.getElementById('pricePerTon');
const discountBadge = document.getElementById('discountBadge');

function calculatePrice() {
  const volume = parseInt(volumeSlider.value, 10);
  const region = regionSelect.value;

  let pricePerTonValue;
  let discount = 0;

  if (volume >= 60) {
    pricePerTonValue = 115000;
    discount = 39;
  } else if (volume >= 30) {
    pricePerTonValue = 140000;
    discount = 26;
  } else if (volume >= 10) {
    pricePerTonValue = 165000;
    discount = 13;
  } else {
    pricePerTonValue = 190000;
    discount = 0;
  }

  const totalPrice = (volume * pricePerTonValue);

  const tonWord = volume === 1 ? 'тонна' : (volume < 5 ? 'тонны' : 'тонн');
  volumeValue.textContent = `${volume} ${tonWord}`;
  pricePerTon.innerHTML = `Цена за тонну: <strong>${pricePerTonValue.toLocaleString('ru-RU')} ₽</strong>`;
  calcPrice.textContent = totalPrice.toLocaleString('ru-RU') + ' ₽';

  if (discount > 0) {
    discountBadge.innerHTML = `<span class="discount-badge">🎉 Экономия ${discount}% от базовой цены!</span>`;
  } else {
    discountBadge.innerHTML = '';
  }

  if (typeof gtag !== 'undefined') {
    gtag('event', 'calculator_used', {
      'event_category': 'engagement',
      'event_label': `volume_${volume}`,
      'region': region,
      'value': totalPrice
    });
  }
}

volumeSlider.addEventListener('input', calculatePrice);
regionSelect.addEventListener('change', calculatePrice);

function scrollToCalc() {
  document.getElementById('calculator').scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'click', {
      'event_category': 'cta',
      'event_label': 'scroll_to_calculator'
    });
  }
}

calculatePrice();

// ============================================
// МУЛЬТИШАГОВАЯ ФОРМА
// ============================================
let currentStep = 1;

function openMultistepForm() {
  document.getElementById('multistepForm').style.display = 'block';
  document.getElementById('multistepForm').scrollIntoView({ behavior: 'smooth' });
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'form_start', {
      'event_category': 'lead_generation',
      'event_label': 'multistep_form_opened'
    });
  }
}

function nextStep() {
  const currentSection = document.querySelector(`.form-section[data-step="${currentStep}"]`);
  const inputs = currentSection.querySelectorAll('input[required], select[required]');

  let valid = true;
  inputs.forEach(input => {
    if (!input.value) {
      input.style.borderColor = '#ef4444';
      valid = false;
    } else {
      input.style.borderColor = '';
    }
  });

  if (!valid) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }

  if (currentStep < 3) {
    currentStep++;
    updateFormStep();

    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_step_' + currentStep, {
        'event_category': 'lead_generation'
      });
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateFormStep();
  }
}

function updateFormStep() {
  document.querySelectorAll('.form-step').forEach((step, index) => {
    if (index + 1 < currentStep) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (index + 1 === currentStep) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });

  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.remove('active');
  });
  document.querySelector(`.form-section[data-step="${currentStep}"]`).classList.add('active');

  const prevBtn = document.querySelector('.btn-prev');
  const nextBtn = document.querySelector('.btn-next');
  const submitBtn = document.querySelector('.btn-submit');

  prevBtn.style.display = currentStep > 1 ? 'block' : 'none';

  if (currentStep === 3) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'block';
    showFormSummary();
  } else {
    nextBtn.style.display = 'block';
    submitBtn.style.display = 'none';
  }
}

function showFormSummary() {
  const form = document.getElementById('leadForm');
  const data = new FormData(form);

  let summary = '<h4 style="margin-bottom: 12px;">Ваша заявка:</h4>';
  summary += `<p><strong>Имя:</strong> ${data.get('name')}</p>`;
  summary += `<p><strong>Телефон:</strong> ${data.get('phone')}</p>`;
  summary += `<p><strong>Email:</strong> ${data.get('email') || 'не указан'}</p>`;
  summary += `<p><strong>Компания:</strong> ${data.get('company') || 'не указана'}</p>`;
  summary += `<p><strong>Объём:</strong> ${data.get('volume')} тонн</p>`;
  summary += `<p><strong>Регион:</strong> ${data.get('region')}</p>`;
  summary += `<p><strong>Срок:</strong> ${data.get('deadline') || 'не указан'}</p>`;

  document.getElementById('formSummary').innerHTML = summary;
}

// ============================================
// ОТПРАВКА ФОРМЫ В TELEGRAM
// ============================================
document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = new FormData(form);

  let message = '🎯 <b>НОВАЯ ЗАЯВКА С САЙТА</b>\n\n';
  message += `👤 <b>Имя:</b> ${data.get('name')}\n`;
  message += `📱 <b>Телефон:</b> ${data.get('phone')}\n`;
  message += `📧 <b>Email:</b> ${data.get('email') || 'не указан'}\n`;
  message += `🏢 <b>Компания:</b> ${data.get('company') || 'не указана'}\n\n`;
  message += `📦 <b>Объём:</b> ${data.get('volume')} тонн\n`;
  message += `📍 <b>Регион:</b> ${data.get('region')}\n`;
  message += `⏰ <b>Срок:</b> ${data.get('deadline') || 'не указан'}\n`;
  message += `💬 <b>Комментарий:</b> ${data.get('comment') || 'нет'}\n`;

  try {
    const response = await sendToTelegramHTML(message);

    if (response && response.ok) {
      alert('✅ Заявка успешно отправлена! Мы свяжемся с вами в течение 15 минут.');
      form.reset();
      document.getElementById('multistepForm').style.display = 'none';
      currentStep = 1;
      updateFormStep();

      if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
          'send_to': 'AW-XXXXXXXXX/XXXXXXXXX',
          'value': 1.0,
          'currency': 'RUB'
        });
      }

      if (typeof ym !== 'undefined') {
        ym(0, 'reachGoal', 'lead_submitted');
      }
    } else {
      throw new Error('Ошибка отправки');
    }
  } catch (error) {
    console.error('Ошибка:', error);
    alert('❌ Произошла ошибка. Пожалуйста, позвоните нам: +7 (977) 993-43-20');
  }
});

// ============================================
// ЧАТ-БОТ С ЗАПРОСОМ КОНТАКТОВ СНАЧАЛА
// ============================================
const chatButton = document.getElementById('chatButton');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

let chatState = 'ask_name'; // ИЗМЕНЕНО: начинаем с запроса имени
let chatData = {};

const chatScenarios = {
  ask_name: {
    message: 'Здравствуйте! 👋 Я помощник BOROX по тринатрийфосфату Na₃PO₄.\n\nДля начала, как к вам обращаться? (Введите ваше имя)',
    input: true,
    next: 'ask_phone'
  },
  ask_phone: {
    message: 'Приятно познакомиться! Оставьте, пожалуйста, ваш телефон для связи:',
    input: true,
    next: 'ask_email'
  },
  ask_email: {
    message: 'Отлично! И последнее — если удобно, укажите email (или можете пропустить):',
    options: [
      { text: '📧 Указать email', next: 'enter_email' },
      { text: '⏭ Пропустить', next: 'show_menu' }
    ]
  },
  enter_email: {
    message: 'Введите ваш email:',
    input: true,
    next: 'show_menu'
  },
  show_menu: {
    message: 'Спасибо! Теперь выберите, чем я могу вам помочь:',
    options: [
      { text: '💰 Узнать цену', next: 'price_inquiry' },
      { text: '📋 Получить КП', next: 'quote_volume' },
      { text: '📑 Документы / ГОСТ', next: 'docs' },
      { text: '🚚 Доставка и сроки', next: 'delivery' },
      { text: '📦 Фасовка / отгрузка', next: 'pack' },
      { text: '❓ Задать вопрос', next: 'free_question' }
    ]
  },

  // Цена
  price_inquiry: {
    message: 'Укажите объём поставки в тоннах (например: 10):',
    input: true,
    next: 'price_region'
  },
  price_region: {
    message: 'Укажите регион доставки:',
    options: [
      { text: 'Москва и МО', next: 'price_result' },
      { text: 'Центральный ФО', next: 'price_result' },
      { text: 'Поволжье', next: 'price_result' },
      { text: 'Урал', next: 'price_result' },
      { text: 'Сибирь', next: 'price_result' },
      { text: 'Дальний Восток', next: 'price_result' }
    ]
  },
  price_result: {
    message: 'Секунду — считаю…',
    action: 'calculate_price'
  },

  // КП (теперь уже есть имя и телефон)
  quote_volume: {
    message: 'Какой объём нужен (тонн)?',
    input: true,
    next: 'quote_region'
  },
  quote_region: {
    message: 'Регион доставки:',
    options: [
      { text: 'Москва и МО', next: 'quote_deadline' },
      { text: 'Центральный ФО', next: 'quote_deadline' },
      { text: 'Поволжье', next: 'quote_deadline' },
      { text: 'Урал', next: 'quote_deadline' },
      { text: 'Сибирь', next: 'quote_deadline' },
      { text: 'Дальний Восток', next: 'quote_deadline' }
    ]
  },
  quote_deadline: {
    message: 'Срок/окно поставки (если есть). Можно написать "как можно быстрее":',
    input: true,
    next: 'quote_success'
  },
  quote_success: {
    message: '✅ Принято. Передаю менеджеру. Он свяжется с вами и пришлёт КП с учётом доставки и условий.',
    action: 'send_quote_request'
  },

  // Документы
  docs: {
    message: 'Какие документы интересуют? Напишите, что именно нужно:',
    input: true,
    next: 'docs_success'
  },
  docs_success: {
    message: '✅ Принято. Передаю запрос менеджеру — отправим пакет документов.',
    action: 'send_docs_request'
  },

  // Доставка
  delivery: {
    message: 'Напишите город/регион + объём + желаемую дату — уточню у менеджера:',
    input: true,
    next: 'delivery_success'
  },
  delivery_success: {
    message: '✅ Принято. Передаю запрос на логистику менеджеру.',
    action: 'send_delivery_request'
  },

  // Фасовка
  pack: {
    message: 'Напишите, какая фасовка нужна (мешки / биг-бэг / другое) и объём:',
    input: true,
    next: 'pack_success'
  },
  pack_success: {
    message: '✅ Принято. Передаю менеджеру.',
    action: 'send_pack_request'
  },

  // Вопросы
  free_question: {
    message: 'Напишите ваш вопрос:',
    input: true,
    next: 'question_send'
  },
  question_send: {
    message: '✅ Спасибо! Передаю вопрос менеджеру.',
    action: 'send_question_request'
  }
};

function openChat() {
  chatWindow.classList.add('open');
  const badge = chatButton.querySelector('.chat-badge');
  if (badge) badge.style.display = 'none';

  if (chatMessages.children.length === 0) {
    addBotMessage(chatScenarios.ask_name.message);
  }

  if (typeof gtag !== 'undefined') {
    gtag('event', 'chat_opened', { 'event_category': 'engagement' });
  }
}

function closeChat() {
  chatWindow.classList.remove('open');
}

function addBotMessage(text, options = null) {
  const messageEl = document.createElement('div');
  messageEl.className = 'chat-message bot';
  messageEl.textContent = text;
  chatMessages.appendChild(messageEl);

  if (options) {
    const optionsEl = document.createElement('div');
    optionsEl.className = 'chat-options';

    options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'chat-option-btn';
      btn.textContent = option.text;
      btn.onclick = () => handleChatOption(option);
      optionsEl.appendChild(btn);
    });

    chatMessages.appendChild(optionsEl);
  }

  scrollChatToBottom();
}

function addUserMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.className = 'chat-message user';
  messageEl.textContent = text;
  chatMessages.appendChild(messageEl);
  scrollChatToBottom();
}

function showTyping() {
  const typingEl = document.createElement('div');
  typingEl.className = 'typing-indicator';
  typingEl.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  typingEl.id = 'typingIndicator';
  chatMessages.appendChild(typingEl);
  scrollChatToBottom();
}

function hideTyping() {
  const typingEl = document.getElementById('typingIndicator');
  if (typingEl) typingEl.remove();
}

function scrollChatToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatOption(option) {
  addUserMessage(option.text);

  if (chatState === 'price_region') chatData.region = option.text;
  if (chatState === 'quote_region') chatData.region = option.text;

  processNextStep(option.next);
}

function processNextStep(step) {
  showTyping();

  setTimeout(() => {
    hideTyping();

    const scenario = chatScenarios[step];

    if (scenario.action) {
      executeAction(scenario.action, step);
    } else {
      addBotMessage(scenario.message, scenario.options);
      chatState = step;
    }
  }, 1000);
}

function executeAction(action, step) {
  if (action === 'calculate_price') {
    const volume = parseInt(chatData.volume, 10) || 10;
    const pricePerTonLocal =
      volume >= 60 ? 115000 :
      volume >= 30 ? 140000 :
      volume >= 10 ? 165000 : 190000;

    const message =
      `💰 Расчёт цены (без доставки)\n\n` +
      `📦 Объём: ${volume} т\n` +
      `💵 Цена: ${pricePerTonLocal.toLocaleString('ru-RU')} ₽/т\n\n` +
      `Чтобы получить точное КП (с учётом доставки), я передам запрос менеджеру.`;

    addBotMessage(message, [
      { text: '📋 Получить КП', next: 'quote_volume' },
      { text: '🔄 Рассчитать другой объём', next: 'price_inquiry' },
      { text: '⬅️ В меню', next: 'show_menu' }
    ]);
    chatState = step;
    return;
  }

  if (action === 'send_quote_request') {
    sendToTelegram(chatData, 'send_quote_request');
    addBotMessage('✅ Заявка на КП отправлена менеджеру. Мы свяжемся с вами в ближайшее время.', [
      { text: '⬅️ В меню', next: 'show_menu' }
    ]);
    chatState = 'show_menu';
    return;
  }

  if (action === 'send_docs_request') {
    sendToTelegram(chatData, 'send_docs_request');
    addBotMessage('✅ Запрос документов отправлен. Менеджер уточнит детали и вышлет пакет.', [
      { text: '📋 Получить КП', next: 'quote_volume' },
      { text: '⬅️ В меню', next: 'show_menu' }
    ]);
    chatState = 'show_menu';
    return;
  }

  if (action === 'send_delivery_request') {
    sendToTelegram(chatData, 'send_delivery_request');
    addBotMessage('✅ Запрос по доставке отправлен. Менеджер вернётся с точным сроком и условиями.', [
      { text: '📋 Получить КП', next: 'quote_volume' },
      { text: '⬅️ В меню', next: 'show_menu' }
    ]);
    chatState = 'show_menu';
    return;
  }

  if (action === 'send_pack_request') {
    sendToTelegram(chatData, 'send_pack_request');
    addBotMessage('✅ Запрос по фасовке/отгрузке отправлен. Менеджер подтвердит варианты и подготовит КП.', [
      { text: '📋 Получить КП', next: 'quote_volume' },
      { text: '⬅️ В меню', next: 'show_menu' }
    ]);
    chatState = 'show_menu';
    return;
  }

  if (action === 'send_question_request') {
    sendToTelegram(chatData, 'send_question_request');
    addBotMessage('✅ Вопрос передан менеджеру. Свяжемся с вами в ближайшее время.', [
      { text: '📋 Получить КП', next: 'quote_volume' },
      { text: '⬅️ В меню', next: 'show_menu' }
    ]);
    chatState = 'show_menu';
    return;
  }
}

async function sendToTelegram(data, type) {
  const ts = new Date().toLocaleString('ru-RU');
  const page = (typeof window !== 'undefined' && window.location) ? window.location.href : '';

  const name = data.name || '';
  const phone = data.phone || '';
  const email = data.email || '';
  const volume = data.volume || '';
  const region = data.region || '';
  const deadline = data.deadline || '';
  const question = data.question || '';

  let header = '';
  if (type === 'send_quote_request') header = '📋 <b>ЗАПРОС КП (ЧАТ)</b>';
  else if (type === 'send_docs_request') header = '📑 <b>ЗАПРОС ДОКУМЕНТОВ (ЧАТ)</b>';
  else if (type === 'send_delivery_request') header = '🚚 <b>ВОПРОС ПО ДОСТАВКЕ (ЧАТ)</b>';
  else if (type === 'send_pack_request') header = '📦 <b>ВОПРОС ПО ФАСОВКЕ (ЧАТ)</b>';
  else if (type === 'send_question_request') header = '❓ <b>ВОПРОС К МЕНЕДЖЕРУ (ЧАТ)</b>';
  else header = '📩 <b>СООБЩЕНИЕ (ЧАТ)</b>';

  let message = `${header}\n\n`;
  message += `🕒 <b>Время:</b> ${ts}\n`;
  if (page) message += `🌐 <b>Страница:</b> ${page}\n`;
  message += '\n';

  if (name) message += `👤 <b>Имя:</b> ${name}\n`;
  if (phone) message += `📱 <b>Телефон:</b> ${phone}\n`;
  if (email) message += `📧 <b>Email:</b> ${email}\n`;

  if (volume) message += `📦 <b>Объём:</b> ${volume}\n`;
  if (region) message += `📍 <b>Регион:</b> ${region}\n`;
  if (deadline) message += `⏰ <b>Срок:</b> ${deadline}\n`;

  if (question) message += `\n💬 <b>Вопрос:</b>\n${question}\n`;

  if (data.text && !question) {
    message += `\n📝 <b>Запрос:</b>\n${data.text}\n`;
  }

  try {
    await sendToTelegramHTML(message);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'chat_lead', {
        'event_category': 'lead_generation',
        'event_label': type
      });
    }
  } catch (error) {
    console.error('Ошибка отправки:', error);
  }
}

if (chatButton) chatButton.addEventListener('click', openChat);
if (chatClose) chatClose.addEventListener('click', closeChat);

if (chatSend) {
  const parseVolume = (s) => {
    const n = parseInt(String(s).replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const isValidEmail = (s) => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(String(s || ''));

  const normalizePhone = (s) => String(s || '').replace(/[^\d+]/g, '');
  const isValidPhone = (s) => {
    const digits = normalizePhone(s).replace(/\D/g, '');
    return digits.length >= 10;
  };

  chatSend.addEventListener('click', () => {
    const text = (chatInput.value || '').trim();
    if (!text) return;

    addUserMessage(text);
    chatInput.value = '';

    // Запрос имени
    if (chatState === 'ask_name') {
      chatData.name = text;
      processNextStep('ask_phone');
      return;
    }

    // Запрос телефона
    if (chatState === 'ask_phone') {
      if (!isValidPhone(text)) {
        addBotMessage('Похоже, номер введён не полностью. Напишите телефон (10+ цифр).');
        return;
      }
      chatData.phone = normalizePhone(text);
      processNextStep('ask_email');
      return;
    }

    // Ввод email
    if (chatState === 'enter_email') {
      if (!isValidEmail(text)) {
        addBotMessage('Похоже, email введён с ошибкой. Напишите корректный email.');
        return;
      }
      chatData.email = text;
      processNextStep('show_menu');
      return;
    }

    // Цена
    if (chatState === 'price_inquiry') {
      const v = parseVolume(text);
      if (!v) {
        addBotMessage('Не понял объём. Напишите число в тоннах (например: 10).');
        return;
      }
      chatData.volume = v;
      processNextStep('price_region');
      return;
    }

    // КП
    if (chatState === 'quote_volume') {
      const v = parseVolume(text);
      if (!v) {
        addBotMessage('Напишите объём числом в тоннах (например: 25).');
        return;
      }
      chatData.volume = v;
      processNextStep('quote_region');
      return;
    }

    if (chatState === 'quote_deadline') {
      chatData.deadline = text;
      processNextStep('quote_success');
      return;
    }

    // Документы/доставка/фасовка
    if (chatState === 'docs') {
      chatData.text = text;
      processNextStep('docs_success');
      return;
    }

    if (chatState === 'delivery') {
      chatData.text = text;
      processNextStep('delivery_success');
      return;
    }

    if (chatState === 'pack') {
      chatData.text = text;
      processNextStep('pack_success');
      return;
    }

    // Вопросы
    if (chatState === 'free_question') {
      chatData.question = text;
      processNextStep('question_send');
      return;
    }

    // Fallback
    addBotMessage('Извините, не понял. Пожалуйста, воспользуйтесь кнопками меню или начните заново.');
  });
}

if (chatInput) {
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      chatSend.click();
    }
  });
}

// ============================================
// EMAIL МАРКЕТИНГ
// ============================================
function showEmailPopup() {
  document.getElementById('emailOverlay').classList.add('show');
  document.getElementById('emailPopup').classList.add('show');

  if (typeof gtag !== 'undefined') {
    gtag('event', 'email_popup_shown', { 'event_category': 'email_marketing' });
  }
}

function hideEmailPopup() {
  document.getElementById('emailOverlay').classList.remove('show');
  document.getElementById('emailPopup').classList.remove('show');
}

document.getElementById('emailClose').addEventListener('click', hideEmailPopup);
document.getElementById('emailOverlay').addEventListener('click', hideEmailPopup);

let emailPopupShown = false;

setTimeout(() => {
  if (!emailPopupShown && !localStorage.getItem('emailSubscribed')) {
    showEmailPopup();
    emailPopupShown = true;
  }
}, 30000);

document.addEventListener('mouseleave', (e) => {
  if (e.clientY < 0 && !emailPopupShown && !localStorage.getItem('emailSubscribed')) {
    showEmailPopup();
    emailPopupShown = true;
  }
});

document.getElementById('emailForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = new FormData(form);

  const message = `📧 <b>ПОДПИСКА НА РАССЫЛКУ</b>\n\n📧 <b>Email:</b> ${data.get('email')}\n👤 <b>Имя:</b> ${data.get('name') || 'не указано'}`;

  try {
    await sendToTelegramHTML(message);

    localStorage.setItem('emailSubscribed', 'true');
    alert('✅ Спасибо! Прайс-лист отправлен на ваш email. Проверьте папку "Входящие".');
    hideEmailPopup();

    if (typeof gtag !== 'undefined') {
      gtag('event', 'email_subscribed', { 'event_category': 'email_marketing' });
    }
  } catch (error) {
    console.error('Ошибка:', error);
    alert('❌ Произошла ошибка. Попробуйте ещё раз.');
  }
});

// ============================================
// АНИМАЦИЯ СЧЁТЧИКОВ
// ============================================
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');

  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'), 10);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        counter.textContent = target;
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(current);
      }
    }, 16);
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      observer.disconnect();
    }
  });
});

const social = document.querySelector('.social-proof');
if (social) observer.observe(social);

// ============================================
// УВЕДОМЛЕНИЯ (FOMO)
// ============================================
const notifications = [
  { name: 'ООО "НефтеХимСервис"', action: 'заказал 25 тонн', time: '5 минут назад' },
  { name: 'АО "Уралнефтепереработка"', action: 'запросил КП', time: '12 минут назад' },
  { name: 'ООО "ПромХимРесурс"', action: 'заказал 15 тонн', time: '18 минут назад' },
  { name: 'ПАО "Газпром нефть"', action: 'получил прайс-лист', time: '23 минуты назад' }
];

function showNotification() {
  const notification = notifications[Math.floor(Math.random() * notifications.length)];

  const notifEl = document.createElement('div');
  notifEl.className = 'notification';
  notifEl.innerHTML = `
    <div class="notification-icon">✓</div>
    <div class="notification-content">
      <h4>${notification.name}</h4>
      <p>${notification.action} • ${notification.time}</p>
    </div>
  `;

  document.getElementById('notifications').appendChild(notifEl);

  setTimeout(() => {
    notifEl.style.animation = 'slideInLeft 0.3s ease reverse';
    setTimeout(() => notifEl.remove(), 300);
  }, 5000);
}

setInterval(showNotification, 20000);
setTimeout(showNotification, 5000);

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ТЕМЫ
// ============================================
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  localStorage.setItem('theme', theme);

  const btn = document.getElementById('themeToggle');
  btn.textContent = theme === 'light' ? '🌙 Тёмная тема' : '☀️ Светлая тема';

  if (typeof gtag !== 'undefined') {
    gtag('event', 'theme_toggle', {
      'event_category': 'engagement',
      'event_label': theme
    });
  }
});

if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light-theme');
  document.getElementById('themeToggle').textContent = '🌙 Тёмная тема';
}

// ============================================
// ОТСЛЕЖИВАНИЕ ВРЕМЕНИ НА САЙТЕ
// ============================================
let timeOnSite = 0;
setInterval(() => {
  timeOnSite += 10;
  if (timeOnSite % 60 === 0 && typeof gtag !== 'undefined') {
    gtag('event', 'time_on_site', {
      'event_category': 'engagement',
      'value': timeOnSite
    });
  }
}, 10000);

// ============================================
// ОТСЛЕЖИВАНИЕ КЛИКОВ ПО ТЕЛЕФОНУ
// ============================================
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'phone_click', {
        'event_category': 'lead_generation',
        'event_label': link.href
      });
    }

    if (typeof ym !== 'undefined') {
      ym(0, 'reachGoal', 'phone_click');
    }
  });
});

// ============================================
// A/B ТЕСТИРОВАНИЕ
// ============================================
const abVariant = Math.random() < 0.5 ? 'a' : 'b';
document.body.classList.add(`ab-variant-${abVariant}`);

if (abVariant === 'b') {
  document.getElementById('heroTitle').innerHTML = `
    Тринатрийфосфат Na₃PO₄<br>
    <span style="color: var(--primary);">от 115 000₽/тн</span> при заказе от 60т
  `;
}

if (typeof gtag !== 'undefined') {
  gtag('event', 'ab_test_variant', {
    'event_category': 'ab_testing',
    'event_label': `variant_${abVariant}`
  });
}

// ============================================
// FOOTER: год + модальные окна
// ============================================
(function initFooterAndModals() {
  const yearEl = document.getElementById('yearNow');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const overlay = document.getElementById('modalOverlay');
  const modals = ['policyModal', 'termsModal', 'requisitesModal'].map(id => document.getElementById(id)).filter(Boolean);

  function lockScroll(lock) {
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function closeAll() {
    if (overlay) overlay.classList.remove('show');
    modals.forEach(m => m.classList.remove('show'));
    lockScroll(false);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal || !overlay) return;
    overlay.classList.add('show');
    modal.classList.add('show');
    lockScroll(true);

    const closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) closeBtn.focus();
  }

  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal-open')));
  });

  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', closeAll);
  });

  if (overlay) overlay.addEventListener('click', closeAll);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
})();

// ============================================
// НИЖНЯЯ ФОРМА-ЗАЯВКА -> TELEGRAM
// ============================================
(function initBottomLeadForm(){
  const f = document.getElementById('bottomLeadForm');
  if (!f) return;

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(f);

    const msg =
      '🧾 <b>ЗАЯВКА (НИЖНЯЯ ФОРМА)</b>\n\n' +
      `👤 <b>Имя:</b> ${data.get('name')}\n` +
      `📱 <b>Телефон:</b> ${data.get('phone')}\n` +
      `📧 <b>Email:</b> ${data.get('email') || 'не указан'}\n` +
      `🏢 <b>Компания:</b> ${data.get('company') || 'не указана'}\n` +
      `📦 <b>Объём:</b> ${data.get('volume') || 'не указан'} т\n` +
      `📍 <b>Регион:</b> ${data.get('region') || 'не указан'}\n` +
      `💬 <b>Комментарий:</b> ${data.get('comment')}\n` +
      `🌐 <b>Страница:</b> ${location.href}\n`;

    try {
      const r = await sendToTelegramHTML(msg);

      if (r && r.ok) {
        alert('✅ Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
        f.reset();
        if (typeof gtag !== 'undefined') {
          gtag('event', 'lead_bottom_form', { 'event_category': 'lead_generation' });
        }
        if (typeof ym !== 'undefined') {
          try { ym(0, 'reachGoal', 'lead_bottom_form'); } catch(e) {}
        }
      } else {
        throw new Error('Telegram send failed');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Не удалось отправить заявку. Пожалуйста, позвоните: +7 (977) 993-43-20');
    }
  });
})();

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
console.log('🚀 BOROX Website загружен');
console.log('📊 A/B тест: вариант', abVariant.toUpperCase());
console.log('🤖 Чат-бот: сначала запрашивает контакты, потом меню');