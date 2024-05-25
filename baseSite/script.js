const imgMimes = ["jpg", "jpeg", "png", "gif", "webp", "jpeg", "bmp", "tiff", "ico"]
const vidMimes = ["mp4", "webm", "m4v", "avi", "mov"]
const audioMimes = ["mp3", "wav", "flac", "ogg", "aac", "midi", "mid"]
const docMimes = ["txt", "pdf", "docx", "xml", "json", "csv", "xlsx", "pptx"]
const archiveMimes = ["zip", "rar", "tar.gz", "7z"]
const scaryMimes = ["exe", "swf", "msi", "sh"]
var currentInfo = ""
var historyBufferMaxSize = 30;
var threadCount = 1
var historyWheel = null

function setup() {
    historyWheel = document.getElementById("historyWheel");
    threadPicker = document.getElementById("threadCountPicker")

    threadCookieVal = readCookie("threadCount")
    if (!isNaN(threadCookieVal) && !!threadCookieVal) {
        threadCount = threadCookieVal
        threadPicker.value = threadCount
    } else {
        threadPicker.value = threadCount
        writeCookie("threadCount", threadCount)
    }
    var historyBufferPicker = document.getElementById("historyBufferPicker");

    historyBufferCookieVal = readCookie("historyBufferMaxSize");
    if (!isNaN(historyBufferCookieVal) && !!historyBufferCookieVal) {
        historyBufferMaxSize = historyBufferCookieVal;
        historyBufferPicker.value = historyBufferMaxSize;
    } else {
        historyBufferPicker.value = historyBufferMaxSize;
        writeCookie("historyBufferMaxSize", historyBufferMaxSize);
    }
    var notifyCheckbox = document.getElementById("notifToggle")
    var playNotifCookieVal = readCookie("playNotif")

    if (playNotifCookieVal) {
        playNotif = true
        notifyCheckbox.checked = true
    } else {
        playNotif = false
        notifyCheckbox.checked = false
    }

    if (getQueryVariable("inframe")) {
        document.documentElement.style.setProperty('--body', "rgb(0, 0, 0, 0");
        document.documentElement.style.setProperty('--background', "rgb(0, 0, 0, 0");
    }
    //setup listeners
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);

    threadPicker.addEventListener("change", readThreadCount)
    historyBufferPicker.addEventListener("change", readHistoryBufferMaxSize);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === "visible") {
            setFavicon(false)
        }
    })
    document.addEventListener("DOMContentLoaded", function () {
        var historyBufferPicker = document.getElementById("historyBufferPicker");

        if (historyBufferPicker) {
            historyBufferPicker.addEventListener("change", function () {
                historyBufferMaxSize = parseInt(this.value, 10);
                console.log("historyBufferMaxSize updated:", historyBufferMaxSize);
                setHistoryWheelToMaxSize()
            });
        }
    });

    imgHolder = document.getElementById("currentImage");
    imgHolder.crossOrigin = "anonymous";

    imgHolder.addEventListener("load", () => {
        setupScaling()
    })

    vidHolder = document.getElementById("currentVideo")
    audioHolder = document.getElementById("currentAudio")
    downloadLink = document.getElementById("currentDownload")

    document.onkeyup = function (e) {
        if (!controlsDisabled) {
            if (e.key == " " ||
                e.code == "Space" ||
                e.keyCode == 32
            ) {
                getNewImage()
            }
        }
    }

    const slider = document.getElementById("historyWheel")
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        e.preventDefault()
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => {
        isDown = false;
    });
    slider.addEventListener('mouseup', () => {
        isDown = false;
    });
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX);
        slider.scrollLeft = scrollLeft - walk;
        console.log(walk);
    });
    setHistoryWheelToMaxSize()
}
//#region fetching images
var pool = []

async function getNewImage() {
    disableControls(true)
    try {
        var settings = tryGetSettings()
    } catch {
        window.alert("Invalid settings, please make at least one selection")
        disableControls(false)
        return
    }
    var label = document.getElementById("copyPrompt")
    label.innerHTML = "searching..."

    let idLabel = document.getElementById("idLabel")
    for (let i = 0; i < (threadCount); i++) {
        var newWorker = new Worker("worker.js")
        newWorker.addEventListener("message", function (msg) {
            var data = msg.data

            switch (true) {
                case data.startsWith("@"):
                    idLabel.innerHTML = "ID: " + data.replace("@", "")
                    break;
                case data.startsWith("!"):
                    msg = data.replace("!", "")
                    window.alert(msg);
                    pool.forEach((worker) => {
                        worker.terminate()
                    })
                    throw new error(msg)
                    break;
                case data.startsWith("#"):
                    msg = data.replace("#", "")
                    console.log(msg)
                    break;
                default:
                    pool.forEach((worker) => {
                        worker.terminate()
                    })

                    var contentInfo = deserializeContentInfo(data)
                    pushContent(contentInfo)

                    if (playNotif) {
                        notify()
                    }
                    if (auto) {
                        getNewImage()
                    } else {
                        disableControls(false)
                        label.innerHTML = "click to copy"
                    }
            }
        })
        pool.push(newWorker)
    }
    pool.forEach((worker) => {
        worker.postMessage(JSON.stringify(settings))
    })
}

function stopSearch() {
    pool.forEach((worker) => {
        worker.terminate()
    })
    if (currentInfo == "") {
        document.getElementById("idLabel").textContent = "NO IMAGE"
    } else {
        loadHistory((serializeContentInfo(currentInfo)))
    }

    disableControls(false)
}
//#endregion

//#region manage current image
const scalingTypes = {
    fit: "fit",
    stretch: "stretch",
    nearestNeighbour: "nearestNeighbour"
}
var currentScaling = scalingTypes.fit

function pushContent(contentInfo) {
    currentInfo = contentInfo

    var pushedMime = getMimeFromContentInfo(contentInfo)
    idLabel.innerHTML = getNameFromContentInfo(contentInfo)

    switch (true) {
        case imgMimes.includes(pushedMime):
            audioHolder.style.display = "none"
            downloadLink.style.display = "none"
            vidHolder.style.display = "none"
            vidHolder.pause()
            imgHolder.setAttribute("src", getUrl(contentInfo))
            imgHolder.style.display = ""
            break;

        case vidMimes.includes(pushedMime):
            imgHolder.style.display = "none"
            audioHolder.style.display = "none"
            downloadLink.style.display = "none"
            vidHolder.setAttribute("src", getUrl(contentInfo))
            vidHolder.style.display = ""
            break;

        case audioMimes.includes(pushedMime):
            downloadLink.style.display = "none"
            imgHolder.style.display = "none"
            vidHolder.style.display = "none"
            vidHolder.pause()
            audioHolder.setAttribute("src", getUrl(contentInfo))
            audioHolder.style.display = ""
            break;

        default:
            audioHolder.style.display = "none"
            imgHolder.style.display = "none"
            vidHolder.style.display = "none"
            vidHolder.pause()
            downloadLink.setAttribute("href", getUrl(contentInfo))
            downloadLink.style.display = ""
            break;
    }

    pushHistory(currentInfo)
}

function setupScaling() {
    imgHolder.removeAttribute("style")
    imgHolder.style.width = "100%"

    switch (currentScaling) {
        case scalingTypes.fit:
            imgHolder.style.maxWidth = imgHolder.naturalWidth + "px"
            break;

        case scalingTypes.stretch:
            imgHolder.style.imageRendering = "auto"
            break;

        case scalingTypes.nearestNeighbour:
            imgHolder.style.imageRendering = "pixelated"
            break;

        default:
    }
}
//#endregion

//#region manage history
function pushHistory(contentInfo) {
    var lastHistoryImg
    var lastHistoryOrder = -1
    var serializedInfo = serializeContentInfo(contentInfo)
    var imgList = document.getElementsByClassName("historyImage")
    for (let i = 0; i < imgList.length; i++) {
        var currentOrder = parseInt(imgList[i].style.order);
        imgList[i].style.order = currentOrder + 1;
        if (currentOrder > lastHistoryOrder) {
            lastHistoryImg = imgList[i];
            lastHistoryOrder = currentOrder;
        }
        if (imgList[i].id == serializedInfo) {
            imgList[i].style.order = 0;
            return;
        }
    }
    //deleete enemy with highest order
    lastHistoryImg.remove()
    //make a  new guy
    var img = document.createElement("img");
    img.className = "historyImage";
    img.style.order = 0;
    img.style.backgroundColor = getColourFromInfo(contentInfo)
    img.setAttribute("draggable", "false")
    img.setAttribute("src", getThumbnailUrl(contentInfo));
    img.setAttribute("onclick", "loadHistory(\"" + serializedInfo + "\")");
    img.id = serializedInfo
    historyWheel.appendChild(img);
}

function loadHistory(sereialisedContentInfo) {
    var deserializedInfo = (deserializeContentInfo(sereialisedContentInfo));
    pushContent(deserializedInfo);
}

function setHistoryWheelToMaxSize() {
    var imgList = document.getElementsByClassName("historyImage")
    var initalLength = parseInt(imgList.length)
    if (initalLength < historyBufferMaxSize) {
        //enlarging
        var amountToAdd = historyBufferMaxSize - initalLength
        for (let i = 0; i < amountToAdd; i++) {
            var img = document.createElement("img");
            img.className = "historyImage";
            img.setAttribute("draggable", "false")
            img.style.order = 999;
            historyWheel.appendChild(img);
        }
    } else if (initalLength == historyBufferMaxSize) {
        // do nothing
    } else {
        //shrinking
        var amountToSubtract = initalLength - historyBufferMaxSize
        var imgArray = Array.from(imgList)
        imgArray.sort(function (a, b) {
            return parseInt(a.style.order) - parseInt(b.style.order)
        })
        for (let i = 0; i < amountToSubtract; i++) {
            imgArray[initalLength - 1 - i].remove()
        }
    }
}
//#endregion

//#region manage common settings
var controlsDisabled = false
var playNotif = false
var auto = false
var threadCount = 1

function disableControls(disable) {
    if (disable) {
        controlsDisabled = true
        var button = document.getElementById("newImgButton")
        button.setAttribute("onclick", "stopSearch()");
        button.textContent = "stop search"
    } else {
        controlsDisabled = false
        var button = document.getElementById("newImgButton")
        button.setAttribute("onclick", "getNewImage()");
        button.textContent = "new image"
    }
}

function setThreadCount(num) {
    if (num % 1 == 0) {
        threadCount = num
        writeCookie("threadCount", threadCount)
    }
}
function setHistoryBufferMaxSize(num) {
    if (num % 1 == 0) {
        historyBufferMaxSize = num
        writeCookie("historyBufferMaxSize", historyBufferMaxSize)
    }
}

function toggleNotif() {
    playNotif = document.getElementById("notifToggle").checked
    writeCookie("playNotif", playNotif)
}
function toggleAuto() {
    auto = document.getElementById("autoToggle").checked
}

function showHistory(visible) {
    var divider = document.getElementById("historyExpander")
    var historyHolder = document.getElementById("historyWheel")
    var expandIcon = document.getElementById("expandIcon")
    if (visible) {
        historyHolder.style.display = "flex"
        expandIcon.style.transform = "rotate(180deg)"
        divider.setAttribute("onclick", "showHistory(false)")
    } else {
        historyHolder.style.display = "none"
        expandIcon.style.transform = "rotate(0deg)"
        divider.setAttribute("onclick", "showHistory(true)")
    }
}

function selectScaling() {
    switch (true) {
        case document.getElementById("fitRadio").checked:
            currentScaling = scalingTypes.fit
            break;
        case document.getElementById("stretchRadio").checked:
            currentScaling = scalingTypes.stretch
            break;
        case document.getElementById("NnRadio").checked:
            currentScaling = scalingTypes.nearestNeighbour
            break;
        default:
            currentScaling = scalingTypes.fit
    }

    setupScaling()
}
//#endregion

//#region UI functions
function setFavicon(isAlert) {
    var link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }

    if (isAlert) {
        link.href = '../commonRes/alertFavicon.ico';
    } else {
        link.href = '../commonRes/favicon.ico'
    }
}

function notify() {
    var notifSound = ((Math.floor(Math.random() * 11)) == 1 ? "../commonRes/scorn.mp3" : "../commonRes/notif.wav")
    var audio = new Audio(notifSound);
    audio.play();

    if (document.visibilityState !== "visible") {
        setFavicon(true)
    }
}

function readThreadCount() {
    var threadPicker = document.getElementById("threadCountPicker")
    threadPicker.value = threadPicker.value.replace(/\D+/g, '');
    if (threadPicker.value > 32) {
        threadPicker.value = 32
    };
    if (threadPicker.value < 1) {
        threadPicker.value = 1
    }
    if (!threadPicker.value) {
        threadPicker.value = 1
    }

    setThreadCount(threadPicker.value)
}

function readHistoryBufferMaxSize() {
    var historyBufferPicker = document.getElementById("historyBufferPicker");
    historyBufferPicker.value = historyBufferPicker.value.replace(/\D+/g, '');

    if (historyBufferPicker.value > 999) {
        historyBufferPicker.value = 999;
    }

    if (historyBufferPicker.value < 1) {
        historyBufferPicker.value = 1;
    }

    if (!historyBufferPicker.value) {
        historyBufferPicker.value = 1;
    }

    setHistoryBufferMaxSize(historyBufferPicker.value)
}

function copyCurrentUrl() {
    if (controlsDisabled) {
        return false
    }

    var label = document.getElementById("copyPrompt")
    var success = true

    try {
        var urlToCopy = getUrl(currentInfo)
        navigator.clipboard.writeText(urlToCopy)
        label.style.color = "greenyellow"
        label.innerHTML = "copied!"
    } catch (error) {
        label.style.color = "tomato"
        label.innerHTML = "error!"
        success = false
    }

    setTimeout(function () {
        label.removeAttribute("style")
        label.innerHTML = "click to copy"
    }, 300);

    return success
}

function getColourFromInfo(contentInfo) {
    var seedString = serializeContentInfo(contentInfo)
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
        seed = (seed << 5) - seed + seedString.charCodeAt(i);
        seed |= 0; // Convert to 32-bit integer
    }

    let lcg = new EightBitLCG(seed);

    // Initialze an empty array to store color components
    var components = []

    // Extract the substings from the ID and covert them to decimal numbers
    components.push(lcg.next())
    components.push(lcg.next())
    components.push(lcg.next())

    // Define a scale to map the component values from a rage of 0-255 to a range of 90-255
    var scale = (255 - 90) / (255 - 0)
    // Initialize a varable to store the final hex color value
    var hex= "#"

    // Loop through each component, adjut its value based on the scale, and convert it to hexadecinal
    for (var i = 0; i < components.length; i++) {
        var adjusted = Math.ceil(90 + (components[i] * scale))
        hex += adjusted.toString(16) // Convert the adjusted value to hexadecinal and apend it to the hex string
    }

    // Return the final hex color value
    return hex
}

function EightBitLCG(seed) {
    this.seed = seed;
    this.modulus = 2**31;
    this.a = 1103515245;
    this.c = 12345;
    this.next = function() {
        this.seed = (this.a * this.seed + this.c) % this.modulus;
        return (this.seed >>> 7) & 0xFF;
    };
}
//#endregion

//#region cookies
function writeCookie(key, val) {
    document.cookie = key + "=" + val
}

function readCookie(key) {
    var nameEQ = key + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
//#endregion

//#region helpers
function arraysIdentical(a, b) {
    var i = a.length;
    if (i != b.length) return false;
    while (i--) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return pair[1]; }
    }
    return (false);
}
//#endregion

//#region gesture functions
var xDown = null;
var yDown = null;

function getTouches(evt) {
    return evt.touches
}

function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;

    setMobileMode(true)
};

function handleTouchMove(evt) {
    if (!controlsDisabled) {
        if (!xDown || !yDown) {
            return;
        }

        if (yDown < document.getElementById("header").clientHeight) {
            return;
        }

        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;

        var xDiff = xDown - xUp;
        var yDiff = yDown - yUp;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {/*most significant*/
            if (xDiff > 0) {
                /* right swipe */
                getNewImage()
            } else {
                /* left swipe */
            }
        } else {
            if (yDiff > 0) {
                /* down swipe */
            } else {
                /* up swipe */
            }
        }
        /* reset values */
        xDown = null;
        yDown = null;
    }
};

function setMobileMode(enabled) {
    var section = document.getElementById("section")

    var children = section.querySelectorAll("*")
    children.forEach((child) => {
        if (enabled) {
            child.classList.add("mobile")
        } else {
            child.classList.remove("mobile")
        }
    })

}
//#endregion

//site specfic code
//must include the following functions in siteFunctions.js:
//function getUrl(contentInfo)
//function getThumbnailUrl(contentInfo)
//function getMimeFromContentInfo(contentInfo)
//function getIdFromContentInfo(contentInfo)
//function serializeContentInfo(contentInfo)
//function deserializeContentInfo(contentInfoString)
//function function reportImage()
//function tryGetSettings() 