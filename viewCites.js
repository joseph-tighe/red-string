function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 1800);
}

function render(citations, query = '') {
    const list = document.getElementById('list');
    const empty = document.getElementById('empty-state');

    let pairs = citations.mla.map((m, i) => ({ mla: m, inline: citations.inline[i] || '' }));

    if (query) {
        const q = query.toLowerCase();
        pairs = pairs.filter(p => p.mla.toLowerCase().includes(q) || p.inline.toLowerCase().includes(q));
    }

    if (pairs.length === 0) {
        empty.classList.remove('hidden');
        list.innerHTML = '';
        return;
    }
    empty.classList.add('hidden');

    list.innerHTML = pairs.map((pair, idx) => `
        <div class="citation-card" data-idx="${idx}">
            <div class="citation-card-header">
                <span class="citation-number">Citation ${idx + 1}</span>
                <div class="citation-card-actions">
                    <button class="icon-btn delete-pair" data-idx="${idx}" title="Delete">✕</button>
                </div>
            </div>
            <div class="citation-card-body">
                <div class="pair-entry">
                    <div class="pair-label">
                        <span>Full Citation</span>
                        <button class="copy-part" data-idx="${idx}" data-part="mla" title="Copy full">Copy</button>
                    </div>
                    <p class="pair-text">${escapeHtml(pair.mla)}</p>
                </div>
                <div class="pair-divider"></div>
                <div class="pair-entry">
                    <div class="pair-label">
                        <span>In-Text Citation</span>
                        <button class="copy-part" data-idx="${idx}" data-part="inline" title="Copy in-text">Copy</button>
                    </div>
                    <p class="pair-text">${escapeHtml(pair.inline)}</p>
                </div>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.copy-part').forEach(btn => {
        btn.addEventListener('click', async function () {
            const idx = parseInt(this.dataset.idx);
            const text = citations[this.dataset.part][idx];
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                this.textContent = 'Copied!';
                this.classList.add('copy-done');
                setTimeout(() => { this.textContent = 'Copy'; this.classList.remove('copy-done'); }, 1000);
            } catch { showToast('Failed to copy'); }
        });
    });

    list.querySelectorAll('.delete-pair').forEach(btn => {
        btn.addEventListener('click', async function () {
            const idx = parseInt(this.dataset.idx);
            citations.mla.splice(idx, 1);
            citations.inline.splice(idx, 1);
            await browser.storage.local.set({
                mla: citations.mla.join('\n'),
                inline: citations.inline.join('\n')
            });
            render(citations, document.getElementById('search').value);
            showToast('Citation deleted');
        });
    });
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

(async function init() {
    const { mla = '', inline = '' } = await browser.storage.local.get(['mla', 'inline']);
    const citations = {
        mla: mla ? mla.split('\n').filter(Boolean) : [],
        inline: inline ? inline.split('\n').filter(Boolean) : []
    };

    render(citations);

    document.getElementById('search').addEventListener('input', function () {
        render(citations, this.value);
    });

    document.getElementById('removeAll').addEventListener('click', function () {
        document.getElementById('modal-overlay').classList.remove('hidden');
    });

    document.getElementById('modal-cancel').addEventListener('click', function () {
        document.getElementById('modal-overlay').classList.add('hidden');
    });

    document.getElementById('modal-confirm').addEventListener('click', async function () {
        citations.mla = [];
        citations.inline = [];
        await browser.storage.local.set({ mla: '', inline: '' });
        document.getElementById('modal-overlay').classList.add('hidden');
        render(citations);
        showToast('All citations deleted');
    });

    document.getElementById('modal-overlay').addEventListener('click', function (e) {
        if (e.target === this) this.classList.add('hidden');
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') init();
    });
})();
