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
    var r = await browser.scripting.executeScript({
        target: { tabId },
        func: (s) => document.querySelector(s)?.content || '',
        args: [selectors]
    });
    if (!r) {
        r = await browser.scripting.executeScript({
            target: { tabId },
            func: (s) => document.querySelector(s)?.textContent || '',
            args: [selectors]
        });
    }
    return r[0]?.result || '';
}

async function getAuthor(tabId) {
    queries = `
    meta[name="author"],
    meta[property="article:author"],
    meta[property="og:article:author"], 
    meta[name="byl"],
    h2[itemprop="author"],
    h1[itemprop="author"],
    p.username,
    h2[itemprop="name"],
    h1[itemprop="name"],
    h3[itemprop="author"]
    `;
    const meta = await getMeta(tabId, queries);
    return formatAuthor(meta);
}

function getInTextAuthor(tabId) {

}

function getYear(date) {
    if (!date) return '';
    let parts = date.split('-');
    if (parts.length < 3) parts = date.split(' ');
    if (parts.length < 3) return '';
    return parts[0];
}

async function getArticleTitle(tabId, pageTitle) {
    const h1 = await browser.scripting.executeScript({
        target: { tabId },
        func: () => document.querySelector('h1')?.innerText?.trim() || ''
    });
    const h1Title = (h1[0]?.result || '').replace(/\s+/g, ' ');
    tags = `
    meta[name="title"],
    meta[property="og:title"],
    meta[property="twitter:title"]
    `;
    const potentialTitle = await getMeta(tabId, tags);
    return h1Title || potentialTitle || pageTitle;
}
async function getPublisher(tabId) {
    queries = `
    meta[name="publisher"],
    meta[property="article:publisher"],
    meta[property="og:article:publisher"]
    `;
    const meta = await getMeta(tabId, queries);
    return meta;
}
async function getPublishedDate(tabId) {
    queries = `
    meta[name="date"],
    meta[property="article:published_time"],
    meta[property="og:article:published_time"]
    `;
    const meta = await getMeta(tabId, queries);
    return meta;
}
async function mla() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) throw new Error('No active tab');
    const tab = tabs[0];
    const tabId = tab.id;
    const pageUrl = tab.url;
    const pageTitle = tab.title || '';

    const a = await getAuthor(tabId);
    const articleTitle = await getArticleTitle(tabId, pageTitle);
    
    const publisher = await getPublisher(tabId);
    const date = await getPublishedDate(tabId);
    return `${a ? a + '. ' : ''}"${articleTitle || pageTitle}." ${publisher || ''}${date ? ', ' + date : ''}, ${pageUrl}`;
}

async function chicago() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) throw new Error('No active tab');
    const tab = tabs[0];
    const tabId = tab.id;
    const pageUrl = tab.url;
    const pageTitle = tab.title || '';
    //Firstname Lastname (if available), "Page Title," Website Name, last modified Month Day, Year, URL.

    const accessed = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const a = await getAuthor(tabId);
    const articleTitle = await getArticleTitle(tabId, pageTitle);
    const publisher = await getPublisher(tabId);
    const date = await getPublishedDate(tabId);
    return `${a ? a + ', ' : ''}"${articleTitle || pageTitle}," ${publisher || ''}${date ? ', ' + date : ''}, ${pageUrl}${accessed ? ', accessed ' + accessed : ''}.`;
}

async function ADA() {
    //Author AA. Title of article. Title of Journal. Year; Volume(Issue):Pages.
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) throw new Error('No active tab');
    const tab = tabs[0];
    const tabId = tab.id;
    const pageUrl = tab.url;
    const pageTitle = tab.title || '';

    const a = await getAuthor(tabId);
    const articleTitle = await getArticleTitle(tabId, pageTitle);
    const publisher = await getPublisher(tabId);
    const date = await getPublishedDate(tabId);
    const year = getYear(date);

    return `${a ? a + '. ' : ''}${articleTitle || pageTitle}. ${publisher || ''}${year ? ', ' + year : ''}.`;
}

(async function main() {
    show('loading');

    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) throw new Error('No active tab');
        const tab = tabs[0];
        const pageTitle = tab.title || '';

        const [MLA, chicagoResult, ADAresult, { format }] = await Promise.all([
            mla(),
            chicago(),
            ADA(),
            browser.storage.local.get('format')
        ]);

        const a = await getAuthor(tab.id);
        const dateMeta = await getMeta(tab.id, 'meta[name="date"], meta[property="article:published_time"], meta[property="og:article:published_time"]');
        const lastName = a ? a.split(',')[0] : null;
        const year = getYear(dateMeta) || 'n.d.';
        const InLine = `(${lastName || 'Author'}, ${year})`;
        const fmt = (format || '').toLowerCase();
        if (fmt === 'chicago') {
            document.getElementById('content').textContent = chicagoResult;
        } else if (fmt === 'ada') {
            document.getElementById('content').textContent = ADAresult;
        } else {
            document.getElementById('content').textContent = MLA;
        }
        document.getElementById('citation-format').textContent = fmt === 'chicago' ? '(Chicago)' : fmt === 'ada' ? '(ADA)' : '(MLA 8)';
        document.getElementById('content2').textContent = InLine;

        const { mla: existingMla } = await browser.storage.local.get(['mla']);
        const { ada: existingAda } = await browser.storage.local.get(['ada']);
        const { chicago: existingChicago } = await browser.storage.local.get(['chicago']);
        const { inline: existingInline } = await browser.storage.local.get(['inline']);
        await browser.storage.local.set({
            mla: existingMla ? existingMla + '\n' + MLA : MLA,
            ada: existingAda ? existingAda + '\n' + ADAresult : ADAresult,
            chicago: existingChicago ? existingChicago + '\n' + chicagoResult : chicagoResult,
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
document.getElementsByClassName('settings')[0].addEventListener('click', function () {
    browser.tabs.create({ url: browser.runtime.getURL('settings.html') });
});
document.getElementById('viewCites').addEventListener('click', function () {
    browser.tabs.create({ url: browser.runtime.getURL('viewCites.html') });
});
document.getElementById('reportBroken').addEventListener('click', async function () {
    const ENDPOINT = "https://formspree.io/f/xpqgvzaa";
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        const { format = "" } = await browser.storage.local.get("format");
        const payload = new URLSearchParams({
            url: tab?.url || "",
            title: tab?.title || "",
            author: tab ? await getAuthor(tab.id) : "",
            publisher: tab ? await getPublisher(tab.id) : "",
            publishedDate: tab ? await getPublishedDate(tab.id) : "",
            format: format || "",
            citation: document.getElementById('content')?.textContent || "",
            extensionVersion: chrome.runtime.getManifest().version
        });

        const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: payload
        });

        if (res.ok) {
            showToast("Report submitted. Thank you!");
        } else {
            showToast("Failed to submit report");
        }
    } catch (err) {
        showToast("Failed to submit report");
    }
});
