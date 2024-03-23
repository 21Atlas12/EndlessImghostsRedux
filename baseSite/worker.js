//REQUIRED CODE
//NOTE: YOUR WORKER MUST DEFINE "async function findValidId()"
var settings = null

self.addEventListener('message', function (msg) {
    settings = parseSettingsString(msg.data)
    findValidId()
});

function parseSettingsString(string) {
    sendLoggingMsg(string)
    return JSON.parse(string)
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
//END OF REQUIRED CODE