function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 1800);
}

const radios = document.querySelectorAll('input[name="format"]');

browser.storage.local.get('format').then(({ format }) => {
    if (format) {
        const match = Array.from(radios).find(r => r.value === format);
        if (match) match.checked = true;
    } else {
        radios[0].checked = true;
    }
});

radios.forEach(el => {
    el.addEventListener('change', function () {
        if (this.checked) {
            browser.storage.local.set({ format: this.value });
            showToast('Format saved');
        }
    });
});
