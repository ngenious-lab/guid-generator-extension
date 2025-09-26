document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const countInput = document.getElementById('count');
  const base64Checkbox = document.getElementById('base64');
  const generateButton = document.getElementById('generate');
  const copyButton = document.getElementById('copy');
  const generatedDisplay = document.getElementById('generated');
  const historyList = document.getElementById('history-list');

  let currentType = 'guid';
  let history = [];
  let lastGenerated = []; // Для хранения сгенерированных кодов

  // Функция для загрузки истории из storage
  function loadHistory() {
    browser.storage.local.get('history').then((result) => {
      history = result.history || [];
      updateHistoryDisplay();
    });
  }

  // Функция для сохранения истории в storage
  function saveHistory(type, isBase64, ids) {
    const entries = ids.map(id => `${type.toUpperCase()}${isBase64 ? ' (Base64)' : ''}: ${id}`);
    history.unshift(...entries); // Добавляем каждую запись отдельно
    if (history.length > 10) history = history.slice(0, 10); // Ограничиваем 10 записями
    browser.storage.local.set({ history });
    updateHistoryDisplay();
  }

  // Обновление отображения истории
  function updateHistoryDisplay() {
    historyList.innerHTML = '';
    history.forEach((entry) => {
      const p = document.createElement('p');
      p.textContent = entry;
      historyList.appendChild(p);
    });
  }

  // Переключение табов
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentType = tab.dataset.type;
    });
  });

  // Генерация GUID (UUID v4)
  function generateGuid() {
    return crypto.randomUUID();
  }

  // Генерация ULID (простая реализация на основе спецификации)
  function generateUlid() {
    const encoding = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const encodingLength = encoding.length;

    function encodeTime(time, len) {
      let res = '';
      while (len--) {
        res = encoding[time % encodingLength] + res;
        time = Math.floor(time / encodingLength);
      }
      return res;
    }

    function encodeRandom(len) {
      let res = '';
      for (let i = 0; i < len; i++) {
        res = encoding[Math.floor(Math.random() * encodingLength)] + res;
      }
      return res;
    }

    return encodeTime(Date.now(), 10) + encodeRandom(16);
  }

  // Генерация KSUID (простая реализация на основе спецификации, с BigInt для Base62)
  function generateKsuid() {
    const KSUID_EPOCH = 1400000000; // 2014-05-17
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const base = BigInt(62);

    function toBase62(buf) {
      let value = BigInt(0);
      for (let byte of buf) {
        value = (value << BigInt(8)) + BigInt(byte);
      }
      let res = '';
      while (value > 0n) {
        res = alphabet[Number(value % base)] + res;
        value /= base;
      }
      return res.padStart(27, '0');
    }

    const time = Math.floor(Date.now() / 1000 - KSUID_EPOCH);
    const timeBuf = new Uint8Array(4);
    new DataView(timeBuf.buffer).setUint32(0, time);

    const payload = new Uint8Array(16);
    crypto.getRandomValues(payload);

    const buf = new Uint8Array(20);
    buf.set(timeBuf, 0);
    buf.set(payload, 4);

    return toBase62(buf);
  }

  // Основная функция генерации
  generateButton.addEventListener('click', () => {
    const count = Math.min(Math.max(parseInt(countInput.value) || 1, 1), 10); // Ограничение 1–10
    lastGenerated = [];

    for (let i = 0; i < count; i++) {
      let id;
      if (currentType === 'guid') {
        id = generateGuid();
      } else if (currentType === 'ulid') {
        id = generateUlid();
      } else if (currentType === 'ksuid') {
        id = generateKsuid();
      }

      if (base64Checkbox.checked) {
        id = btoa(id);
      }

      lastGenerated.push(id);
    }

    // Безопасное отображение с использованием DOM
    generatedDisplay.innerHTML = ''; // Очищаем содержимое
    if (lastGenerated.length === 0) {
      generatedDisplay.textContent = 'Нажмите "Сгенерировать"';
    } else {
      lastGenerated.forEach((id, index) => {
        const p = document.createElement('p');
        p.textContent = id;
        generatedDisplay.appendChild(p);
        //if (index < lastGenerated.length - 1) {
        //  generatedDisplay.appendChild(document.createElement('br'));
        //}
      });
    }
    copyButton.disabled = lastGenerated.length === 0;

    // Сохранение в историю
    saveHistory(currentType, base64Checkbox.checked, lastGenerated);
  });

  // Копирование
  copyButton.addEventListener('click', () => {
    const text = lastGenerated.join('\n'); // Используем \n для буфера обмена
    if (text && lastGenerated.length > 0) {
      navigator.clipboard.writeText(text)
        .then(() => alert('Скопировано в буфер обмена!'))
        .catch(err => {
          console.error('Ошибка копирования: ', err);
          alert('Не удалось скопировать.');
        });
    }
  });

  // Загрузка истории при открытии
  loadHistory();
});