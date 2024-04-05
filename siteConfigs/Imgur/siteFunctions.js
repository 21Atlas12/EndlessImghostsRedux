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

function validateSettings(settings) {
    return true
}

function reportImage() {

}