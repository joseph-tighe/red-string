(async function main() {
    var Url, title, articleTitle, author, metaAuthor, metaPublisher, metaDate, tabId;
    currentTab = (await chrome.tabs.query({active: true, currentWindow: true}))[0];

    tabId = currentTab.id;
    Url = currentTab.url;
    title = currentTab.title;

    // Listen for messages from the content script
    chrome.scripting.executeScript( { target: { tabId }, func: () => {
        return document.querySelector('h1').innerText;
    }}).then(results => {
        articleTitle = '"'+results[0].result+'"';
    });
    //get data from meta tags
    let results = await chrome.scripting.executeScript( { target: { tabId }, func: () => {
        return document.querySelector('meta[name="author"], meta[property="article:author"], meta[property="og:article:author"], meta[name="byl"]')?.content
    }})
    metaAuthor = results[0].result;
    results = await chrome.scripting.executeScript( { target: { tabId }, func: () => {
        return document.querySelector('meta[name="publisher"], meta[property="article:publisher"], meta[property="og:article:publisher"]')?.content
    }})
    metaPublisher = results[0].result;
    results = await chrome.scripting.executeScript( { target: { tabId }, func: () => {
        return document.querySelector('meta[name="date"], meta[property="article:published_time"], meta[property="og:article:published_time"]')?.content
    }})
    metaDate = results[0].result;
    if (metaAuthor.includes(" ")) {
        author = [metaAuthor.split(" ")[0], metaAuthor.split(" ")[1]].join(", ");
    } else {
        author = metaAuthor;
    }

    const MLA = `${author}. ${articleTitle}${title}, ${metaPublisher}, ${metaDate}, ${Url}`;
    document.getElementById("content").innerText = MLA;
    const InLine = `(${author.split(", ")[0]}, ${metaDate})`;
    document.getElementById("content2").innerText = InLine;
})();

document.getElementById("copy").addEventListener("click", function() {
    navigator.clipboard.writeText(document.getElementById("content").innerText);
});
document.getElementById("viewCites").addEventListener("click", function() {
    chrome.tabs.create({url: "viewCites.html"});
});
document.getElementById("copy2").addEventListener("click", function() {
    navigator.clipboard.writeText(document.getElementById("content2").innerText);
});