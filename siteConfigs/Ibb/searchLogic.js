const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
const idLen = 7
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

    do {
        var id = generateId()
        for (let i = 0; i < mimeList.length; i++) {
            mime = mimeList[i]
            var url = getUrl(id, mime)

            try {

                sendUpdateMsg(id + "." + mime)
                await testUrl(url).then(
                    async function fulfilled() {
                        var headers = new Headers();
                        headers.append("Authorization", "Client-ID " + clientId)
                        var request = new Request(url, {
                            method: "GET",
                            headers: headers,
                            mode: "cors",
                            cache: "default",
                        });
                        var response = await fetch(request)
                    },

                    function rejected() {
                        sendLoggingMsg(id + "." + mime + " is not valid")
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

function getUrl(id, mime) {
    var url = "ibb.co/" + id
    return url + "." + mime
}

function testUrl(url) {

    let imgPromise = new Promise(async function imgPromise(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);

        xhr.onreadystatechange = async function () {
            if (xhr.status == "403" || xhr.status == "401" || xhr.status == "429") {
                sendErrorMsg("Ibb is unreachable, you may have been rate limited. Try changing your IP")
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