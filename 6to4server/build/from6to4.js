"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var ip_1 = __importDefault(require("ip"));
var http_1 = require("http");
var Serial_1 = require("./modules/Serial");
var pkgHandler_1 = require("./modules/pkgHandler");
var Functions_1 = require("./modules/Functions");
var Models_1 = require("./modules/Models");
var LocalMongoHandler_1 = require("./modules/LocalMongoHandler");
var notify_1 = require("./modules/notify");
var ClientFunctions_1 = require("./modules/ClientFunctions");
//  function that starts the server only if minute % 3 ==0
var serverRunning = false;
function StartServer() {
    if (serverRunning) {
        return; // server is already running
    }
    var currentMinute = new Date().getMinutes();
    if (currentMinute % 3 == 0) {
        //start the server
        httpServer.listen(localPort, function () {
            console.log("[FieldArr@y] listening on http://".concat(ip_1.default.address(), ":").concat(localPort));
            serverRunning = true;
        });
    }
    else {
        console.log('Waiting for the current minute to be divisible by 3...');
        setTimeout(StartServer, 1000 * 10); // check every 10 second
    }
}
// function that checks if the string is a valid JSON
function isJsonString(str) {
    try {
        // Try parsing the string
        JSON.parse(str);
    }
    catch (e) {
        // Parsing failed, so it's not a valid JSON string
        return false;
    }
    // Parsing succeeded, it's a valid JSON string
    return true;
}
var WebSocket = require('ws');
var wss = new WebSocket.Server({ port: 8080 });
var localPort = 3111;
var clientPort = 3000;
var app = (0, express_1.default)();
var httpServer = (0, http_1.createServer)(app);
// Initialize cors middleware for fetch API communication
var corsOptions = {
    origin: "http://".concat(ip_1.default.address(), ":").concat(clientPort),
};
app.use(require('cors')(corsOptions));
// Handle fetch API
app.get('/getAll', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var clientSensors;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, LocalMongoHandler_1.getClientSensors)()];
            case 1:
                clientSensors = _a.sent();
                res.send(clientSensors);
                return [2 /*return*/];
        }
    });
}); });
httpServer.listen(localPort, function () {
    console.log("[FieldArr@y] listening on http://".concat(ip_1.default.address(), ":").concat(localPort));
});
// Server <-> Sensors 
wss.on('connection', function (ws) {
    // WebSocket Routing (Server <-> Client)
    ws.on('message', function (message) { return __awaiter(void 0, void 0, void 0, function () {
        var received;
        return __generator(this, function (_a) {
            if (message.toString() !== 'undefined') {
                try {
                    received = JSON.parse(message);
                    if (received.type === 'setSensor') {
                        (0, ClientFunctions_1.handleSetSensor)(received);
                    }
                    if (received.type === 'startNewExperiment') {
                        (0, ClientFunctions_1.handleStartNewExperiment)(received, ws);
                    }
                    if (received.type === 'endExperiment') {
                        (0, ClientFunctions_1.handleEndExperiment)(received, ws);
                    }
                    if (received.type == 'SwitchSensor') {
                        // data[0],data[1] - the ipv6 of the sensor and the ipv6 of the new sensor
                        // data[2] - the mongodb dict of sensors 
                        (0, ClientFunctions_1.handleSwitchSensorsList)(received, ws);
                    }
                    if (received.type == 'EmailAlert') {
                        console.log("Got command to send email alert");
                        (0, ClientFunctions_1.handleUpdateAlertedMail)(received, ws);
                    }
                    if (received.type == 'UpdateDataArray') {
                        console.log("Got command to update alerted mail");
                        (0, ClientFunctions_1.handleUpdateByCSV)(received, ws);
                    }
                    if (received.type == "experimentSelection") {
                        (0, ClientFunctions_1.handleGetExperimentsInfo)(received, ws);
                    }
                    if (received.type == "InfluxPull") {
                        (0, ClientFunctions_1.handleInfluxPull)(received, ws);
                    }
                    if (received.type == "addCordinates") {
                        console.log(received);
                        (0, ClientFunctions_1.handleAddCordinates)(received, ws);
                    }
                    if (received.type == "removeSensorBoot") {
                        console.log("Got command to remove sensor from boot");
                        (0, ClientFunctions_1.handleRemoveBootSensor)(received, ws);
                    }
                    if (received.type == "AddExperimentInfo") {
                        console.log("Got command to add AddExperimentInfo to sensor");
                        (0, ClientFunctions_1.handleAddExperiment)(received, ws);
                    }
                    if (received.type == "UpdateLabel") {
                        console.log("Got command to update label");
                        (0, ClientFunctions_1.handleUpdateLabel)(received, ws);
                    }
                }
                catch (err) {
                    console.error(err);
                }
            }
            return [2 /*return*/];
        });
    }); });
});
// golbal vatriable to indicate Dead man alerts
var DeadManAlertsSent = false; // Flag to ensure DeadManAlerts runs only once a day
// Function to check if it's time to run DeadManAlerts
function checkTimeForDeadManAlerts() {
    var now = new Date();
    var currentHour = now.getHours();
    if (currentHour === 9 && !DeadManAlertsSent) {
        // Run DeadManAlerts at 9 AM
        (0, notify_1.DeadManAlerts)();
        DeadManAlertsSent = true;
    }
    else if (currentHour !== 9) {
        // Reset the flag after 9 AM has passed
        DeadManAlertsSent = false;
    }
}
// Set an interval to check the time every 15 minutes if it's time to run DeadManAlerts
var minuteInterval = 15; // variable to store the interval in minutes
setInterval(function () {
    checkTimeForDeadManAlerts();
}, minuteInterval * 60 * 1000); // Check every 15 minutes
// Global variable to indicate whether the alerts have been sent in the current period
var alertsSentInCurrentPeriod = false;
var capture = false; // if true, the data from the sensor will be saved in the file
var jsonValid = false; // if true, the data from the sensor is a valid JSON
var jsonBuffer = ''; // the data from the sensor
var packetBuffer = ''; // the data from the sensor
// Listen for data from the sensor/device (Port) independently
Serial_1.Port.on('data', function (raw) {
    // check for the start of a JSON Object
    if (raw.trim().startsWith('{')) {
        capture = true; // start capturing the data
        jsonBuffer = ''; // clear the buffer
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
    }
    catch (err) {
        jsonValid = false;
        var msg = err.message;
    }
    try {
        if (jsonValid) {
            var Packet_1 = (0, Models_1.Package)(packetBuffer); // Packet is a JSON object
            // let Packet = Package(JSON.parse(jsonBuffer)); // Packet is a JSON object
            console.log('New packet from: ' + Packet_1.ADDR + ' at: ' + Packet_1.TIME);
            (0, notify_1.alerter_2)(packetBuffer);
            // call sendAccumulatedAlerts every 5 minutes exactly
            var currentMinute = new Date().getMinutes();
            var currentSecond = new Date().getSeconds();
            var currentHour = new Date().getHours();
            var Flag_now = true;
            // console.log("the current minute is: ",currentMinute, currentMinute % 15, currentMinute%15==0);
            if (currentMinute % 16 == 0 && !alertsSentInCurrentPeriod) {
                (0, notify_1.sendAccumulatedAlerts)();
                alertsSentInCurrentPeriod = true;
            }
            else if (currentMinute % 16 != 0) {
                alertsSentInCurrentPeriod = false;
            }
            if ((0, pkgHandler_1.isNewSP)(Packet_1.ADDR)) {
                (0, pkgHandler_1.addNewSP)(Packet_1);
                // Packet.ADDr - the sensor IPV6, Packet.NUM -  the pucket number
            }
            else if ((0, pkgHandler_1.isNewPackage)(Packet_1.ADDR, Packet_1.NUM)) {
                (0, pkgHandler_1.updateNewPackage)(Packet_1);
            }
            // Send the data to the connected WebSocket client(s)
            wss.clients.forEach(function (ws) {
                (0, ClientFunctions_1.sendLaaToClient)(Packet_1.ADDR, ws);
            });
        }
        else if ((0, Functions_1.isPing)(raw)) { // Ping
            console.log("Ping From:" + (0, Functions_1.getIpv6byPing)(raw));
            // Send the ping to the connected WebSocket client(s)
            wss.clients.forEach(function (ws) {
                (0, ClientFunctions_1.sendPingToClient)((0, Functions_1.getIpv6byPing)(raw), ws);
            });
        }
    }
    catch (err) {
        console.log('Error of: ', err.message);
    }
});
