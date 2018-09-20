/*
TuyAPI node.js

Derived from
Dave Gutheinz's TP-LinkHub - Version 1.0

*/

//---- Determine if old Node version, act accordingly -------------
console.log("Node.js Version Detected:   " + process.version)

//---- Program set up and global variables -------------------------
const http = require('http')
const net = require('net')
const fs = require('fs')
const TuyaDevice = require('tuyapi')
const hubPort = 8083
let server = http.createServer(onRequest)

//---- Start the HTTP Server Listening to SmartThings --------------
server.listen(hubPort)
console.log("TuyAPI Hub Console Log")
logResponse("\n\r" + new Date() + "\rTuyAPI Hub Error Log")

//---- Command interface to Smart Things ---------------------------
function onRequest(request, response) {
	let command = request.headers["command"]
	let deviceIP = request.headers["tuyapi-ip"]

	let cmdRcvd = "\n\r" + new Date() + "\r\nIP: " + deviceIP + " sent command " + command
	console.log(" ")
	console.log(cmdRcvd)

	switch (command) {
		//---- (BridgeDH - Poll for Server APP ------------------
		case "pollServer":
			response.setHeader("cmd-response", "ok")
			response.end()
			let respMsg = "Server Poll response sent to SmartThings"
			console.log(respMsg)
			break

		//---- TP-Link Device Command ---------------------------
		case "deviceCommand":
			processDeviceCommand(request, response)
			break

		default:
			response.setHeader("cmd-response", "InvalidHubCmd")
			response.end()
			var respMsg = "#### Invalid Command ####"
			var respMsg = new Date() + "\n\r#### Invalid Command from IP" + deviceIP + " ####\n\r"
			console.log(respMsg)
			logResponse(respMsg)
	}
}

//---- Send deviceCommand and send response to SmartThings ---------
function processDeviceCommand(request, response) {

	let deviceIP = request.headers["tuyapi-ip"]
	let deviceID = request.headers["tuyapi-devid"]
	let localKey = request.headers["tuyapi-localkey"]
	let command = request.headers["tuyapi-command"]
	let dps = request.headers["dps"]
	let action = request.headers["action"]
	let respMsg = "deviceCommand sending to IP: " + deviceIP + " Command: " + command
	console.log(respMsg)

	let tuya = new TuyaDevice({
		id: deviceID,
		ip: deviceIP,
		dps: '4',
		key: localKey
	});
	switch (command) {
		case "off":
			//tuya.resolveIds().then(() => {  
			tuya.get({ 'dps': dps }).then(status => {
				console.log('Status: ' + status);

				tuya.set({ set: false, 'dps': dps }).then(result => {
					console.log('Result of setting status to ' + false + ': ' + result);
					response.setHeader("cmd-response", !status);
					response.setHeader("onoff", "off");
					console.log("Status (" + status + ") sent to SmartThings.");
					response.end();


					return;

				});
				//});
			});
			break

		case "on":
			//tuya.resolveIds().then(() => {  
			tuya.get({ 'dps': dps }).then(status => {
				console.log('Status: ' + status);

				tuya.set({ set: true, 'dps': dps }).then(result => {
					console.log('Result of setting status to ' + true + ': ' + result);
					response.setHeader("cmd-response", !status);
					response.setHeader("onoff", "on");
					console.log("Status (" + status + ") sent to SmartThings.");
					response.end();


					return;

				});
				//});
			});
			break

		case "status":
			//tuya.resolveIds().then(() => {  
			tuya.get({ 'dps': dps }).then(status => {
				console.log('Status: ' + status);


				response.setHeader("cmd-response", status);
				response.setHeader("onoff", "on");
				console.log("Status (" + status + ") sent to SmartThings.");
				response.end();


				return;


				//});
			});
			break

		default:
			tuya.destroy();
			console.log('Unknown request');

	}
}

//----- Utility - Response Logging Function ------------------------
function logResponse(respMsg) {
	if (logFile == "yes") {
		fs.appendFileSync("error.log", "\r" + respMsg)
	}
}
