function getUrl(contentInfo) {
    url = "https://files.catbox.moe/" + getIdFromContentInfo(contentInfo) + "." + getMimeFromContentInfo(contentInfo)
    return url
}

function getThumbnailUrl(contentInfo) {
    url = getUrl(contentInfo)
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

function validateSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
        if (value) {
            return true
        }
    }
    return false
}

function reportImage() {

}