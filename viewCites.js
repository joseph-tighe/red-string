function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 1800);
}
function render(citations, format, query = '') {
    const list = document.getElementById('list');
    const empty = document.getElementById('empty-state');
    let pairs;
    const fmt = (format || '').toLowerCase();

    if (fmt === 'chicago') {
        pairs = citations.chicago.map((m, i) => ({ citation: m, inline: citations.inline[i] || '' }));
    } else if (fmt === 'ada') {
        pairs = citations.ada.map((m, i) => ({ citation: m, inline: citations.inline[i] || '' }));
    } else {
        pairs = citations.mla.map((m, i) => ({ citation: m, inline: citations.inline[i] || '' }));
    }

    if (query) {
        const q = query.toLowerCase();
        pairs = pairs.filter(p => p.citation.toLowerCase().includes(q) || p.inline.toLowerCase().includes(q));
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
                        <button class="copy-part" data-idx="${idx}" data-part="citation" title="Copy full">Copy</button>
                    </div>
                    <p class="pair-text">${escapeHtml(pair.citation)}</p>
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
            const fmt = (format || '').toLowerCase();
            const idx = parseInt(this.dataset.idx);
            if (fmt === 'chicago') {
                citations.chicago.splice(idx, 1);
                citations.inline.splice(idx, 1);
            } else if (fmt === 'ada') {
                citations.ada.splice(idx, 1);
                citations.inline.splice(idx, 1);
            } else {
                citations.mla.splice(idx, 1);
                citations.inline.splice(idx, 1);
            }
            await browser.storage.local.set({
                chicago: citations.chicago.join('\n'),
                ada: citations.ada.join('\n'),
                mla: citations.mla.join('\n'),
                inline: citations.inline.join('\n')
            });
            render(citations, format, document.getElementById('search').value);
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
    const { format } = await browser.storage.local.get('format');
    const { mla = '', chicago = '', ada = '', inline = '' } = await browser.storage.local.get(['mla', 'chicago', 'ada', 'inline']);
    const citations = {
        mla: mla ? mla.split('\n').filter(Boolean) : [],
        chicago: chicago ? chicago.split('\n').filter(Boolean) : [],
        ada: ada ? ada.split('\n').filter(Boolean) : [],
        inline: inline ? inline.split('\n').filter(Boolean) : []
    };

    render(citations, format);

    document.getElementById('search').addEventListener('input', function () {
        render(citations, format, this.value);
    });

    document.getElementById('removeAll').addEventListener('click', function () {
        document.getElementById('modal-overlay').classList.remove('hidden');
    });

    document.getElementById('modal-cancel').addEventListener('click', function () {
        document.getElementById('modal-overlay').classList.add('hidden');
    });

    document.getElementById('modal-confirm').addEventListener('click', async function () {
        citations.chicago = [];
        citations.ada = [];
        citations.mla = [];
        citations.inline = [];
        await browser.storage.local.set({ mla: '', inline: '', chicago: '', ada: '' });
        document.getElementById('modal-overlay').classList.add('hidden');
        render(citations, format);
        showToast('All citations deleted');
    });

    document.getElementById('modal-overlay').addEventListener('click', function (e) {
        if (e.target === this) this.classList.add('hidden');
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') init();
    });
})();
