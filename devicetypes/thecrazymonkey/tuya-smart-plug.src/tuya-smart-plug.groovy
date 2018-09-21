/**
 * Tuya Smart Plug Device Handler
 *
 * Derived from work of
 *	TP-Link HS Series Device Handler
 *	Copyright 2018 Dave Gutheinz, 
 *	codetheweb,
 *	blawson327
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at:
 *		http://www.apache.org/licenses/LICENSE-2.0
 *		
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 *
 * Supported models and functions:  This device supports smart plugs that use the Tuya Smart Life app
 *
 * Update History
 * 01-04-2018	- Initial release
*/
metadata {
	definition (name: "Tuya Smart Plug", namespace: "thecrazymonkey", author: "Ivan Kunz") {
		capability "Switch"
		capability "Refresh"
		capability "Polling"
		capability "Sensor"
		capability "Actuator"
	}
	tiles(scale: 2) {
		multiAttributeTile(name:"switch", type: "lighting", width: 6, height: 4, canChangeIcon: true){
			tileAttribute ("device.switch", key: "PRIMARY_CONTROL") {
				attributeState "on", label:'${name}', action:"switch.off", icon:"st.switches.switch.on", backgroundColor:"#00a0dc",
				nextState:"waiting"
				attributeState "off", label:'${name}', action:"switch.on", icon:"st.switches.switch.off", backgroundColor:"#ffffff",
				nextState:"waiting"
				attributeState "waiting", label:'${name}', action:"switch.on", icon:"st.switches.switch.off", backgroundColor:"#15EE10",
				nextState:"waiting"
				attributeState "commsError", label:'Comms Error', action:"switch.on", icon:"st.switches.switch.off", backgroundColor:"#e86d13",
				nextState:"waiting"
            }
 			tileAttribute ("deviceError", key: "SECONDARY_CONTROL") {
				attributeState "deviceError", label: '${currentValue}'
			}
		}
		standardTile("refresh", "capability.refresh", width: 2, height: 1,  decoration: "flat") {
			state "default", label:"Refresh", action:"refresh.refresh"
		}
        
		main("switch")
		details(["switch", "refresh"])
	}
	def rates = [:]
	rates << ["1" : "Refresh every minute (Not Recommended)"]
	rates << ["5" : "Refresh every 5 minutes"]
	rates << ["10" : "Refresh every 10 minutes"]
	rates << ["15" : "Refresh every 15 minutes"]
	rates << ["30" : "Refresh every 30 minutes (Recommended)"]

	preferences {
	    input(name: "gatewayIP", type: "text", title: "Gateway IP", required: true, displayDuringSetup: true)
		input(name: "deviceID", type: "text", title: "Device ID", required: true, displayDuringSetup: true)
		input(name: "localKey", type: "text", title: "Local Key", required: true, displayDuringSetup: true)
		input(name: "refreshRate", type: "enum", title: "Refresh Rate", options: rates, description: "Select Refresh Rate", required: false)
	}
}
def installed() {
	update()
}

def updated() {
	runIn(2, update)
}

def update() {
	unschedule()
	switch(refreshRate) {
		case "1":
			runEvery1Minute(refresh)
			log.info "Refresh Scheduled for every minute"
			break
		case "5":
			runEvery5Minutes(refresh)
			log.info "Refresh Scheduled for every 5 minutes"
			break
		case "10":
			runEvery10Minutes(refresh)
			log.info "Refresh Scheduled for every 10 minutes"
			break
		case "15":
			runEvery15Minutes(refresh)
			log.info "Refresh Scheduled for every 15 minutes"
			break
		default:
			runEvery30Minutes(refresh)
			log.info "Refresh Scheduled for every 30 minutes"
	}
	runIn(5, refresh)
}

//	----- BASIC PLUG COMMANDS ------------------------------------
def on() {
	sendCmdtoServer("on")
}

def off() {
	sendCmdtoServer("off")
}

def poll() {
	sendCmdtoServer("status")
}
//	----- REFRESH ------------------------------------------------
def refresh() {
	sendCmdtoServer("status")
}

def commandResponse(response) {
	log.info "Received response : $response.headers['cmd-response']"
   	if (response.headers["cmd-response"] == "OK") {
        def cmd = response.headers["onoff"]
 		log.info "Switch is  : $response.headers["onoff"]"
      	sendEvent(name: "switch", value: cmd)
    } else {
		log.error "$device.name $device.label: Some Error : $response.headers['cmd-response']"
		sendEvent(name: "switch", value: "offline", descriptionText: "ERROR - OffLine - mod onOffResponse")
    }
}

//	----- SEND COMMAND DATA TO THE SERVER -------------------------------------
private sendCmdtoServer(command) {
	def headers = [:] 
	log.info "Sending command : $command"
	headers.put("HOST", "$gatewayIP:8083")	//	SET TO VALUE IN JAVA SCRIPT PKG.
	headers.put("tuyapi-devid", deviceID)
	headers.put("tuyapi-localkey", localKey)
	headers.put("tuyapi-command", command)
	sendHubCommand(new physicalgraph.device.HubAction(
		[headers: headers],
		device.deviceNetworkId,
		[callback: commandResponse]
	))
}