const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
const idLen = 6
const imgMimes = ["jpg", "png"]
const vidMimes = ["mp4", "webm"]
const extImgMimes = ["gif", "webp", "jpeg", "bmp", "tiff", "ico"]
const extVidMimes = ["m4v", "avi", "mov"]
const audioMimes = ["mp3", "wav"]
const extAudioMimes = ["flac", "ogg", "aac", "midi", "mid"]
const docMimes = ["txt", "pdf"]
const extDocMimes = ["xml", "json", "csv", "xlsx", "pptx"]
const archiveMimes = ["zip", "rar", "tar.gz", "7z"]
const scaryMimes = ["swf", "msi", "sh"]

async function findValidId() {
    var validImg = false;
    var newId = "";
    var idMime = ""

    var mimeList = createMimeList()
    //error out here if no mimes

    do {
        var id = generateId()
        for (let i = 0; i < mimeList.length; i++) {
            mime = mimeList[i]
            var url = getUrl(id, mime)

            try {

                sendUpdateMsg(id+"."+mime)
                await testUrl(url).then(
                    function fulfilled() {
                        newId = id;       
                        idMime = mime        
                        validImg = true;
                    },
    
                    function rejected() {
                        sendLoggingMsg(id+"."+ mime + " is not valid")
                    }
                )
            } catch (e) {
                sendErrorMsg(e.message)
                self.close()
            }
        };
    } while (!validImg)

    self.postMessage(newId + ";" + idMime)
    self.close()
}

function generateId() {
    var id = "";

    for (var i = 0; i < idLen; i++) {
        var charIndex = Math.round(Math.random() * (chars.length - 1));
        id += chars.charAt(charIndex);
    } 

    return id
}

function createMimeList() {
    var list = []
    if (settings.Images == true) {
        list = list.concat(imgMimes)                
    }
    if (settings.ImagesExt == true) {
        list = list.concat(extImgMimes)            
    }
    if (settings.Videos == true) {
        list = list.concat(vidMimes)            
    }
    if (settings.VideosExt == true) {
        list = list.concat(extVidMimes)            
    }
    if (settings.Audio == true) {
        list = list.concat(audioMimes)            
    }
    if (settings.AudioExt == true) {
        list = list.concat(extAudioMimes)            
    }
    if (settings.Documents == true) {
        list = list.concat(docMimes)            
    }
    if (settings.DocumentsExt == true) {
        list = list.concat(extDocMimes)            
    }
    if (settings.Archives == true) {
        list = list.concat(archiveMimes)            
    }
    if (settings.Scary == true) {
        list = list.concat(scaryMimes)            
    }
    return list
}

function getUrl(id, mime) {
    var url = "https://files.catbox.moe/" + id
    return url + "." + mime
}

function testUrl(url) {

    let imgPromise = new Promise(async function imgPromise(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);

        xhr.onreadystatechange = async function () {
            if (xhr.status == "403" || xhr.status == "401" || xhr.status == "429") {
                sendErrorMsg("Catbox is unreachable, you may have been rate limited. Try changing your IP")
                self.close()
                return
            }

            if (xhr.status == "200" || xhr.status == "206") {
                resolve()
            } else {
                reject()
            }
        };

        xhr.send();
    });

    return imgPromise;
}