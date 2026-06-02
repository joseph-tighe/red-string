var Url, title, articleTitle, author;
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      Url = tabs[0].url;
});
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      title = tabs[0].title;
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message) {
        articleTitle = '"'+document.querySelector('h1').innerText+'" ';
    } else {
        articleTitle = "";
    }
    });
//get data from meta tags
const metaAuthor = await chrome.scripting.executeScript( { target: { tabId }, func: () => {
    return document.querySelector('meta[name="author"], meta[property="article:author"], meta[property="og:article:author"], meta[name="byl"]')?.content
}})[0].result;
const metaPublisher = await chrome.scripting.executeScript( { target: { tabId }, func: () => {
    return document.querySelector('meta[name="publisher"], meta[property="article:publisher"], meta[property="og:article:publisher"]')?.content
}})[0].result;
const metaDate = await chrome.scripting.executeScript( { target: { tabId }, func: () => {
    return document.querySelector('meta[name="date"], meta[property="article:published_time"], meta[property="og:article:published_time"]')?.content
}})[0].result;
if (metaAuthor.includes(" ")) {
    author = [metaAuthor.split(" ")[0], metaAuthor.split(" ")[1]].join(", ");
} else {
    author = metaAuthor;
}

const MLA = `${author}. ${articleTitle}${title}, ${metaPublisher}, ${metaDate}, ${Url}`;

document.getElementById("content").innerHTML = MLA;


