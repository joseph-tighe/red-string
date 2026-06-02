chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
     const Url = tabs[0].url;
});
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
     const title = tabs[0].title;
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
const metaAuthor = document.querySelector('meta[name="author"], meta[property="article:author"], meta[property="og:article:author"], meta[name="byl"]')?.content;
const metaPublisher = document.querySelector('meta[name="publisher"], meta[property="article:publisher"], meta[property="og:article:publisher"]')?.content;
const metaDate = document.querySelector('meta[name="date"], meta[property="article:published_time"], meta[property="og:article:published_time"]')?.content;

if (metaAuthor.includes(" ")) {
    var author = [metaAuthor.split(" ")[0], metaAuthor.split(" ")[1]].join(", ");
} else {
    var author = metaAuthor;
}

const MLA = `${author}. ${articleTitle}${title}, ${metaPublisher}, ${metaDate}, ${Url}`;

document.getElementById("content").innerHTML = MLA;