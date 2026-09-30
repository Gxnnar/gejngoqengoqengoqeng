const urlInput = document.getElementById('url');
const submitBtn = document.getElementById('submit');
const videoIframe = document.getElementById('video');
const videoHolder = document.getElementById('video-holder');

// A list of different public CORS proxies to loop through if your network blocks one
const proxyList = [
    (url) => `https://codetabs.com{encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io{encodeURIComponent(url)}`,
    (url) => `https://allorigins.win{encodeURIComponent(url)}`
];

async function fetchWithFallback(targetUrl) {
    // Try each proxy in order until one succeeds
    for (let i = 0; i < proxyList.length; i++) {
        try {
            const proxiedUrl = proxyList[i](targetUrl);
            const response = await fetch(proxiedUrl);
            if (response.ok) {
                // Return the raw page contents
                return await response.text();
            }
        } catch (e) {
            console.log(`Proxy ${i} failed or was blocked, trying next...`);
        }
    }
    throw new Error("All proxies were blocked by your network firewall.");
}

submitBtn.addEventListener('click', async () => {
    let inputUrl = urlInput.value.trim();
    if (!inputUrl) return;

    // 1. Resolve Google Tracking Links
    if (inputUrl.includes('://google.com')) {
        urlInput.value = "Unmasking Google Link...";
        try {
            const pageContent = await fetchWithFallback(inputUrl);
            
            // Search the page HTML for the hidden YouTube target link inside Google's warning page
            const ytRegex = /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}|https?:\/\/youtu\.be\/[a-zA-Z0-9_-]{11})/i;
            const match = pageContent.match(ytRegex);
            
            if (match && match[0]) {
                inputUrl = match[0];
            } else {
                alert("Failed to read the YouTube link from the Google redirect page.");
                urlInput.value = "";
                return;
            }
        } catch (err) {
            alert(err.message || "Error bypassing firewall.");
            urlInput.value = "";
            return;
        }
    }

    // 2. Extract standard YouTube video ID
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = inputUrl.match(regExp);

    if (match && match.length === 11) {
        videoId = match;
    } else {
        if (inputUrl.length === 11) {
            videoId = inputUrl;
        } else {
            alert('Invalid YouTube URL or Video ID');
            urlInput.value = "";
            return;
        }
    }

    // 3. Mount the YouTube clean embed player interface
    videoIframe.src = `https://youtube-nocookie.com{videoId}?wmode=transparent&iv_load_policy=3&autoplay=1&html5=1&showinfo=0&rel=0&modestbranding=1`;
    videoHolder.style.display = 'block';
    urlInput.value = ""; 
});
