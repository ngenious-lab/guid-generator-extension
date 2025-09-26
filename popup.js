document.addEventListener('DOMContentLoaded', () => {
  const generateButton = document.getElementById('generate');
  const copyButton = document.getElementById('copy');
  const guidDisplay = document.getElementById('guid');

  generateButton.addEventListener('click', () => {
    // Генерация GUID с использованием crypto.randomUUID()
    const guid = crypto.randomUUID();
    guidDisplay.textContent = guid;
    copyButton.disabled = false;
  });

  copyButton.addEventListener('click', () => {
    const guid = guidDisplay.textContent;
    if (guid && guid !== 'Нажмите "Сгенерировать"') {
      navigator.clipboard.writeText(guid)
        .then(() => alert('GUID скопирован в буфер обмена!'))
        .catch(err => {
          console.error('Ошибка копирования: ', err);
          alert('Не удалось скопировать GUID.');
        });
    }
  });
});