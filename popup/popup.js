function show(id) {
    document.querySelectorAll('.state').forEach(el => el.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 1800);
}

function formatAuthor(raw) {
    if (!raw) return '';
    const parts = raw.trim().split(/\s+/);
    if (parts.length < 2) return raw.trim();
    const last = parts.pop();
    return `${last}, ${parts.join(' ')}`;
}

async function getMeta(tabId, selectors) {
    const r = await browser.scripting.executeScript({
        target: { tabId },
        func: (s) => document.querySelector(s)?.content || '',
        args: [selectors]
    });
    return r[0]?.result || '';
}
async function getAuthor(tabId) {
    meta = getMeta(tabId, 'meta[name="author"], meta[property="article:author"], meta[property="og:article:author"], meta[name="byl"], h2[itemprop="author"], h1[itemprop="author"], p.username, , h2[itemprop="name"], h1[itemprop="name"], h3[itemprop="author"]');

    return formatAuthor(meta);
}
function getInTextAuthor(tabId) { 

}
(async function main() {
    show('loading');

    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) throw new Error('No active tab');
        const tab = tabs[0];
        const tabId = tab.id;
        const pageUrl = tab.url;
        const pageTitle = tab.title || '';

        if (!pageUrl || pageUrl.startsWith('browser://') || pageUrl.startsWith('about:')) {
            throw new Error('Cannot cite browser pages');
        }

        const h1 = await browser.scripting.executeScript({
            target: { tabId },
            func: () => document.querySelector('h1')?.innerText?.trim() || ''
        });
        const articleTitle = (h1[0]?.result || '').replace(/\s+/g, ' ');

        const author = await getAuthor(tabId);
        const publisher = await getMeta(tabId,
            'meta[name="publisher"], meta[property="article:publisher"], meta[property="og:article:publisher"]'
        );
        const date = await getMeta(tabId,
            'meta[name="date"], meta[property="article:published_time"], meta[property="og:article:published_time"]'
        );

        const authorPart = author ? `${author}. ` : '';
        const titlePart = articleTitle ? `"${articleTitle}." ` : '';
        const pubPart = publisher ? `${publisher}, ` : '';
        const datePart = date ? `${date}, ` : '';

        const MLA = `${authorPart}${titlePart}${pageTitle}, ${pubPart}${datePart}${pageUrl}`;
        const lastName = author ? author.split(',')[0] : author;
        const InLine = `(${lastName || 'Author'}, ${date || 'n.d.'})`;

        document.getElementById('content').textContent = MLA;
        document.getElementById('content2').textContent = InLine;

        const { mla: existingMla } = await browser.storage.local.get(['mla']);
        const { inline: existingInline } = await browser.storage.local.get(['inline']);
        await browser.storage.local.set({
            mla: existingMla ? existingMla + '\n' + MLA : MLA,
            inline: existingInline ? existingInline + '\n' + InLine : InLine
        });

        show('results');
    } catch (err) {
        document.getElementById('error-msg').textContent = err.message;
        show('error');
    }
})();

document.getElementById('copy').addEventListener('click', async function () {
    const text = document.getElementById('content').textContent;
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        this.classList.add('copied');
        this.textContent = 'Copied!';
        setTimeout(() => { this.classList.remove('copied'); this.textContent = 'Copy'; }, 1500);
    } catch {
        showToast('Failed to copy');
    }
});

document.getElementById('copy2').addEventListener('click', async function () {
    const text = document.getElementById('content2').textContent;
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        this.classList.add('copied');
        this.textContent = 'Copied!';
        setTimeout(() => { this.classList.remove('copied'); this.textContent = 'Copy'; }, 1500);
    } catch {
        showToast('Failed to copy');
    }
});

document.getElementById('viewCites').addEventListener('click', function () {
    browser.tabs.create({ url: browser.runtime.getURL('viewCites.html') });
});
