async function createCites() {
    document.getElementById("mla").innerHTML = "<ul><li>"+(await chrome.storage.local.get(["mla"])).mla.replace("undefined", "").replace(/\n/g, "</li><li>")+"</li></ul>";
    document.getElementById("inline").innerHTML = "<ul><li>"+(await chrome.storage.local.get(["inline"])).inline.replace("undefined", "").replace(/\n/g, "</li><li>")+"</li></ul>";
    while (document.getElementById("mla").innerHTML.includes("<li></li>")) {
        document.getElementById("mla").innerHTML = document.getElementById("mla").innerHTML.replace("<li></li>", "");
    }
    while (document.getElementById("inline").innerHTML.includes("<li></li>")) {
        document.getElementById("inline").innerHTML = document.getElementById("inline").innerHTML.replace("<li></li>", "");
    }
}
createCites();
document.getElementById("remove").addEventListener("click", function() {
    chrome.storage.local.set({ "mla": "" });
    chrome.storage.local.set({ "inline": "" });
    createCites();
});
document.addEventListener("visibilitychange", function() {
    if (document.visibilityState == "visible") {
        createCites();
    }
});