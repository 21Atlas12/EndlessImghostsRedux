const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//fuck it we ball (no client secret, so its fine)
const clientId = "bf92d77e08518f5"

async function findValidId() {
    var validImg = false;
    var newId = "";
    var idMime = ""

    do {
        var id = generateId()
        sendUpdateMsg(id)
        var url = getUrl(id, "png", true)
        try {
            await testUrl(url).then(
                async function fulfilled() {
                    newId = id;
                    var headers = new Headers();
                    headers.append("Authorization", "Client-ID " + clientId)
                    var apiRequest = new Request(getApiUrl(id), {
                        method: "GET",
                        headers: headers,
                        mode: "cors",
                        cache: "default",
                      });
                    var response = await fetch(apiRequest)
                    if (response.status == 200) {
                        sendLoggingMsg("in api Check")
                        var data = await response.text()
                        var jsonData = JSON.parse(data).data
                        var fullType = jsonData.type
                        idMime = fullType.substring(fullType.indexOf("/") + 1)

                        validImg = true;
                    } else {
                        sendLoggingMsg("in fallback")
                        //fallback if imgur gets narky with my api client id
                        var videoUrl = getUrl(id, "mp4", false)
                        await testUrl(videoUrl).then(
                            function fulfilled() {
                                idMime = "mp4"
                            },

                            function rejected() {
                                idMime = "png"
                            }
                        )                    
                        validImg = true;
                    }
                },

                function rejected() {
                    sendLoggingMsg(id + " is not valid")
                }
            )
        } catch (e) {
            sendErrorMsg(e.message)
            self.close()
        }
    } while (!validImg)

    self.postMessage(newId + ";" + idMime)
    self.close()
}

function generateId() {
    var id = "";
    var idLen = 7
    if (settings.fiveDigit == true) {
        idLen = 5
    }

    for (var i = 0; i < idLen; i++) {
        var charIndex = Math.round(Math.random() * (chars.length - 1));
        id += chars.charAt(charIndex);
    }

    return id
}

function getUrl(id, mime, asThumbnail) {
    var url = "https://i.imgur.com/" + id
    if (asThumbnail) {
        url = url + "s"
    }
    return url + "." + mime
}

function getApiUrl(id) {
    return "https://api.imgur.com/3/image/" + id
}

function testUrl(url) {

    let imgPromise = new Promise(async function imgPromise(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);

        xhr.onreadystatechange = async function () {
            if (xhr.status == "403" || xhr.status == "401" || xhr.status == "429") {
                sendLoggingMsg(xhr.status)
                sendErrorMsg("Imgur is unreachable, you may have been rate limited.  If you are in 5 digit id mode, it is becasue they still have rate limiting rules from when the archive team were downloading everything, try 7 digit mode. Try changing your IP")
                self.close()
                return
            }

            if (xhr.responseURL != "https://i.imgur.com/removed.png" && xhr.status == "200") {
                resolve()
            } else {
                reject()
            }
        };

        xhr.send();
    });

    return imgPromise;
}

function sendUpdateMsg(id) {
    self.postMessage("@" + id)
}

function sendLoggingMsg(msg) {
    self.postMessage("#" + msg)
}

function sendErrorMsg(msg) {
    self.postMessage("!" + msg)
}