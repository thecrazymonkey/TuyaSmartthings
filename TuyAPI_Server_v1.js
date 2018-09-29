/*
TuyAPI node.js

Derived from work of:
    Dave Gutheinz's TP-LinkHub - Version 1.0,
	codetheweb, 
	blawson327
*/

//---- Determine if old Node version, act accordingly -------------
console.log("Node.js Version Detected:   " + process.version)

//---- Program set up and global variables -------------------------
const http = require('http')
const TuyaDevice = require('tuyapi')
const hubPort = 8083
const server = http.createServer(onRequest)

//---- Start the HTTP Server Listening to SmartThings --------------
server.listen(hubPort)
console.log("TuyAPI Hub Console Log")

//---- Command interface to Smart Things ---------------------------
function onRequest(request, response) {
	let deviceID = request.headers["tuyapi-devid"]
	let localKey = request.headers["tuyapi-localkey"]
	let command = request.headers["tuyapi-command"]

	console.log(request.headers)
	let tuya = new TuyaDevice({
		id: deviceID,
		key: localKey
	});
	// resolve ip
	tuya.resolveId().then(() => { 
		switch (command) {
			case "on":
			case "off": {
				let setState = (command === "on")
				tuya.set({ set: setState }).then(result => {
					console.log('Result of setting status to ' + setState + ': ' + result);
					response.setHeader("cmd-response", "OK");
					response.setHeader("onoff", setState ? "on" : "off");
					console.log("Status (" + (setState ? "on" : "off") + ") sent to SmartThings.");
					response.end();
					return;
				}).catch(reason => {
					response.setHeader("cmd-response", reason);
					response.end();
					console.log("Error : " + reason)
				});
				break
			}
			case "status":
				tuya.get().then(status => {
					response.setHeader("cmd-response", "OK");
					response.setHeader("onoff", status ? "on" : "off");
					response.end();
					console.log("Status (" + status + ") sent to SmartThings.");
				}).catch(reason => {
					response.setHeader("cmd-response", reason);
					response.end();
					console.log("Error : " + reason)
				});
				break
			default:
				response.setHeader("cmd-response", "InvalidHubCmd")
				response.end()
				console.log("Invalid Command : " + command)
		}
	}).catch(reason => {
		response.setHeader("cmd-response", reason);
		response.end();
		console.log("Error : " + reason)
	});
}
