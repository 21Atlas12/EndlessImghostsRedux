function getUrl(contentInfo) {
    url = "https://i.imgur.com/" + getIdFromContentInfo(contentInfo) + "." + getMimeFromContentInfo(contentInfo)
    return url
}

function getThumbnailUrl(contentInfo) {
    url = "https://i.imgur.com/" + getIdFromContentInfo(contentInfo) + "s.jpg"
    return url
}

function getMimeFromContentInfo(contentInfo) {
    return contentInfo[1]
}

function getIdFromContentInfo(contentInfo) {
    return contentInfo[0]
}

function serializeContentInfo(contentInfo) {
    return getIdFromContentInfo(contentInfo) + ";" + getMimeFromContentInfo(contentInfo)
}

function deserializeContentInfo(contentInfoString) {
    return contentInfoString.split(";")
}

function reportImage() {    
    var response = confirm("Are you sure you want to report this image? If you press \"OK\" the current images URL will be copied to your clipboard, and you will be redirected to imgurs removal request page.")

    if (response) {
        if (copyCurrentUrl()) {
            window.open("https://imgur.com/removalrequest", '_blank')
        } else {
            alert("Failed to copy current URL");
        }

    }
}

function validateSettings(settings) {
    return true
}