import express from 'express';
import ip from 'ip';
import { createServer } from 'http';
import { Port } from './modules/Serial';
import { isNewSP, addNewSP, isNewPackage, updateNewPackage} from './modules/pkgHandler';
import { checkPkg, getIpv6byPing, isPing } from './modules/Functions';
import { Package } from './modules/Models';
import { getClientSensors } from './modules/LocalMongoHandler';
import {  batteryAlerter,alerter,alerter_2, sendAccumulatedAlerts,DeadManAlerts} from './modules/notify';
import { handleStartNewExperiment, handleSetSensor, 
sendLaaToClient, sendPingToClient, handleEndExperiment, 
handleSwitchSensorsList ,handleUpdateAlertedMail,handleUpdateByCSV,
  handleGetExperimentsInfo,handleInfluxPull, 
  handleAddCordinates,handleRemoveBootSensor,handleAddExperiment,handleUpdateLabel} from './modules/ClientFunctions';


//  function that starts the server only if minute % 3 ==0

let serverRunning = false;
function StartServer(){
  if (serverRunning) {
    return; // server is already running
  }
  const currentMinute = new Date().getMinutes();
  if (currentMinute % 3 == 0) {
    //start the server
    httpServer.listen(localPort, () => {
      console.log(`[FieldArr@y] listening on http://${ip.address()}:${localPort}`);
      serverRunning = true;
    });
  } else {
    console.log('Waiting for the current minute to be divisible by 3...');
    setTimeout(StartServer, 1000 * 10); // check every 10 second
  }
}

// function that checks if the string is a valid JSON
function isJsonString(str:string) {
  try {
      // Try parsing the string
      JSON.parse(str);
  } catch (e) {
      // Parsing failed, so it's not a valid JSON string
      return false;
  }
  // Parsing succeeded, it's a valid JSON string
  return true;
}


const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const localPort: number = 3111;
const clientPort: number = 3000;
const app = express();
const httpServer = createServer(app);

// Initialize cors middleware for fetch API communication
const corsOptions = {
  origin: `http://${ip.address()}:${clientPort}`,
};
app.use(require('cors')(corsOptions));

// Handle fetch API
app.get('/getAll', async (req, res) => {
  // console.log('/getData received from client');
  const clientSensors = await getClientSensors();
  res.send(clientSensors);
});



httpServer.listen(localPort, () => {
  console.log(`[FieldArr@y] listening on http://${ip.address()}:${localPort}`);
});



// Server <-> Sensors 
wss.on('connection', (ws: any) => {
  // WebSocket Routing (Server <-> Client)
  ws.on('message', async (message: any) => {
    if (message.toString() !== 'undefined') {
      try {
        const received = JSON.parse(message);
        if (received.type === 'setSensor') {
          handleSetSensor(received);
        }
        if (received.type === 'startNewExperiment') {
          handleStartNewExperiment(received, ws);
        }
        if (received.type === 'endExperiment') {
          handleEndExperiment(received, ws);
        }
        if (received.type == 'SwitchSensor'){
        // data[0],data[1] - the ipv6 of the sensor and the ipv6 of the new sensor
        // data[2] - the mongodb dict of sensors 
          handleSwitchSensorsList(received,ws);
        }
        if (received.type == 'EmailAlert'){
          console.log("Got command to send email alert")
          handleUpdateAlertedMail(received,ws);
        }
        if (received.type == 'UpdateDataArray'){
          console.log("Got command to update alerted mail")
          handleUpdateByCSV(received,ws);
        }
        if (received.type == "experimentSelection") {
          handleGetExperimentsInfo(received,ws)
        }
        if (received.type == "InfluxPull") {
        handleInfluxPull(received,ws)
        }
        if (received.type== "addCordinates"){
          console.log(received)
          handleAddCordinates(received,ws);
        }
        if (received.type =="removeSensorBoot") {
          console.log("Got command to remove sensor from boot")
          handleRemoveBootSensor(received,ws);
        }
        if (received.type == "AddExperimentInfo") {
          console.log("Got command to add AddExperimentInfo to sensor")
          handleAddExperiment(received,ws);
        }
        if (received.type == "UpdateLabel") {
          console.log("Got command to update label")
          handleUpdateLabel(received,ws);
        }
      

     
      } catch (err: any) {
        console.error(err);
      }
    }
  });
});

// golbal vatriable to indicate Dead man alerts
let DeadManAlertsSent = false; // Flag to ensure DeadManAlerts runs only once a day
// Function to check if it's time to run DeadManAlerts
function checkTimeForDeadManAlerts() {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour === 9 && !DeadManAlertsSent) {
      // Run DeadManAlerts at 9 AM
      DeadManAlerts();
      DeadManAlertsSent = true;
  } else if (currentHour !== 9) {
      // Reset the flag after 9 AM has passed
      DeadManAlertsSent = false;
  }
}
// Set an interval to check the time every 15 minutes if it's time to run DeadManAlerts
let minuteInterval = 15; // variable to store the interval in minutes
setInterval(() => {
  checkTimeForDeadManAlerts();
}, minuteInterval * 60 * 1000); // Check every 15 minutes




// Global variable to indicate whether the alerts have been sent in the current period
let alertsSentInCurrentPeriod = false;


let capture = false; // if true, the data from the sensor will be saved in the file
let jsonValid = false // if true, the data from the sensor is a valid JSON
let jsonBuffer  = '';  // the data from the sensor
let packetBuffer = ''; // the data from the sensor
// Listen for data from the sensor/device (Port) independently

Port.on('data', (raw: string) => {
  // check for the start of a JSON Object
  if (raw.trim().startsWith('{')) {
    capture = true; // start capturing the data
    jsonBuffer = '' // clear the buffer
    // console.log('Start capturing data, and/or emptying the buffer');
  }
  if (capture) {
    jsonBuffer += raw; // append the data to the buffer
  }
  if (capture && raw.includes('}')) { // assuiming '}' is the end of the JSON object
    capture = false; // stop capturing the data
    // console.log('Stop capturing data');
  }
  // try to parse the JSON object
    try {
      packetBuffer = JSON.parse(jsonBuffer);
      jsonBuffer = ''; // Reset buff
      jsonValid = true;

    } catch (err: any) {
      jsonValid = false;
      let msg = err.message;  
    }
    

  try {
    if (jsonValid) {
      let Packet = Package(packetBuffer); // Packet is a JSON object
      // let Packet = Package(JSON.parse(jsonBuffer)); // Packet is a JSON object
      console.log('New packet from: '+Packet.ADDR+' at: '+Packet.TIME);
      alerter_2(packetBuffer);
      // call sendAccumulatedAlerts every 5 minutes exactly
      const currentMinute = new Date().getMinutes();
      const currentSecond  = new Date().getSeconds();
      const currentHour = new Date().getHours();
      const Flag_now = true;
      // console.log("the current minute is: ",currentMinute, currentMinute % 15, currentMinute%15==0);
      if (currentMinute % 16 == 0 && !alertsSentInCurrentPeriod) {
        sendAccumulatedAlerts();
        alertsSentInCurrentPeriod = true;
      }
      else if (currentMinute % 16 != 0) {
        alertsSentInCurrentPeriod = false;
      }
      
      if (isNewSP(Packet.ADDR)) {
        addNewSP(Packet);
        // Packet.ADDr - the sensor IPV6, Packet.NUM -  the pucket number
      } else if (isNewPackage(Packet.ADDR, Packet.NUM)) {
        updateNewPackage(Packet);
      } 
   
      // Send the data to the connected WebSocket client(s)
      wss.clients.forEach((ws: any) => {
        sendLaaToClient(Packet.ADDR, ws);
      });
    } else if (isPing(raw)) { // Ping
      console.log("Ping From:" + getIpv6byPing(raw));
      // Send the ping to the connected WebSocket client(s)
      wss.clients.forEach((ws: any) => {
        sendPingToClient(getIpv6byPing(raw), ws);
      });
    }
  } catch (err: any) {
    console.log('Error of: ', err.message);
  }

});
