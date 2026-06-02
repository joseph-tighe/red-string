function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 1800);
}

function render(citations, filter = 'all', query = '') {
    const list = document.getElementById('list');
    const empty = document.getElementById('empty-state');

    let items = [];
    citations.mla.forEach((c, i) => items.push({ type: 'mla', text: c, index: i }));
    citations.inline.forEach((c, i) => items.push({ type: 'inline', text: c, index: i }));

    if (filter !== 'all') items = items.filter(i => i.type === filter);
    if (query) {
        const q = query.toLowerCase();
        items = items.filter(i => i.text.toLowerCase().includes(q));
    }

    if (items.length === 0) {
        empty.classList.remove('hidden');
        list.innerHTML = '';
        return;
    }
    empty.classList.add('hidden');

    list.innerHTML = items.map((item, idx) => {
        const typeLabel = item.type === 'mla' ? 'Full Citation' : 'In-Text Citation';
        const typeClass = item.type === 'mla' ? 'mla' : 'inline';
        const dataIdx = `${item.type}-${item.index}`;
        return `
            <div class="citation-card" data-idx="${dataIdx}">
                <div class="citation-card-header">
                    <span class="citation-type-badge">${typeLabel}</span>
                    <div class="citation-card-actions">
                        <button class="icon-btn copy-card" data-idx="${dataIdx}" title="Copy">📋</button>
                        <button class="icon-btn delete-card" data-idx="${dataIdx}" title="Delete">✕</button>
                    </div>
                </div>
                <div class="citation-card-body">${escapeHtml(item.text)}</div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.copy-card').forEach(btn => {
        btn.addEventListener('click', async function () {
            const [type, idx] = this.dataset.idx.split('-');
            const text = citations[type][parseInt(idx)];
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                this.textContent = '✓';
                this.classList.add('copy-done');
                setTimeout(() => { this.textContent = '📋'; this.classList.remove('copy-done'); }, 1000);
            } catch { showToast('Failed to copy'); }
        });
    });

    list.querySelectorAll('.delete-card').forEach(btn => {
        btn.addEventListener('click', async function () {
            const [type, idx] = this.dataset.idx.split('-');
            const index = parseInt(idx);
            citations[type].splice(index, 1);
            await chrome.storage.local.set({
                mla: citations.mla.join('\n'),
                inline: citations.inline.join('\n')
            });
            render(citations, document.querySelector('.filter-btn.active').dataset.filter, document.getElementById('search').value);
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
    const { mla = '', inline = '' } = await chrome.storage.local.get(['mla', 'inline']);
    const citations = {
        mla: mla ? mla.split('\n').filter(Boolean) : [],
        inline: inline ? inline.split('\n').filter(Boolean) : []
    };

    render(citations);

    document.getElementById('search').addEventListener('input', function () {
        const filter = document.querySelector('.filter-btn.active').dataset.filter;
        render(citations, filter, this.value);
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            render(citations, this.dataset.filter, document.getElementById('search').value);
        });
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
        await chrome.storage.local.set({ mla: '', inline: '' });
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
