function getUrl(contentInfo) {
    url = getDomainFromContentInfo(contentInfo) + getIdFromContentInfo(contentInfo) + "." + getMimeFromContentInfo(contentInfo)
    return url
}

function getThumbnailUrl(contentInfo) {
    var contentMime = getMimeFromContentInfo(contentInfo)
    if (imgMimes.includes(contentMime)) {
        return getUrl(contentInfo)
    }
    switch (true) {
        
        case vidMimes.includes(contentMime):
            return "../commonRes/video.svg"
        
        case audioMimes.includes(contentMime):
            return "../commonRes/music.svg"

        case docMimes.includes(contentMime):
            return "../commonRes/document.svg"

        case archiveMimes.includes(contentMime):
            return "../commonRes/zip.svg"

        case scaryMimes.includes(contentMime):
            return "../commonRes/virus.svg"

        default: 
            return "../commonRes/idk.svg"
    }
}

function getMimeFromContentInfo(contentInfo) {
    if (contentInfo[1] == undefined) {
        throw new Error("Mime is undefined")
    } else {
        return contentInfo[1]
    }
}

function getIdFromContentInfo(contentInfo) {
    if (contentInfo[0] == undefined) {
        throw new Error("Id is undefined")
    } else {
        return contentInfo[0]
    }
}

function getDomainFromContentInfo(contentInfo) {
    if (contentInfo[2] == undefined) {
        throw new Error("Domain is undefined")
    } else {
        return contentInfo[2]
    }
}

function getNameFromContentInfo(contentInfo) {
    return getIdFromContentInfo(contentInfo) + "." + getMimeFromContentInfo(contentInfo)
}

//info goes ID;Mime;Domain
function serializeContentInfo(contentInfo) {
    return getIdFromContentInfo(contentInfo) + ";" + getMimeFromContentInfo(contentInfo) + ";" + getDomainFromContentInfo(contentInfo)
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