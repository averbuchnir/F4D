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
            case 0:
                console.log('/getData received from client');
                return [4 /*yield*/, (0, LocalMongoHandler_1.getClientSensors)()];
            case 1:
                clientSensors = _a.sent();
                res.send(clientSensors);
                return [2 /*return*/];
        }
    });
}); });
// Launching the fetch API server 
httpServer.listen(localPort, function () {
    console.log("[FieldArr@y] listening on http://".concat(ip_1.default.address(), ":").concat(localPort));
});
// Server <-> Sensors 
wss.on('connection', function (ws) {
    Serial_1.Port.on('data', function (raw) {
        return __awaiter(this, void 0, void 0, function () {
            var Packet;
            return __generator(this, function (_a) {
                try {
                    if ((0, Functions_1.checkPkg)(raw)) { // If pkg is a mesurement ->
                        Packet = (0, Models_1.Package)(JSON.parse(raw));
                        // console.log('New packet from: '+Packet.ADDR+' at: '+Packet.TIME);
                        (0, ClientFunctions_1.sendLaaToClient)(Packet.ADDR, ws);
                        (0, notify_1.alerter)(JSON.parse(raw));
                        if ((0, pkgHandler_1.isNewSP)(Packet.ADDR)) {
                            (0, pkgHandler_1.addNewSP)(Packet);
                        }
                        else if ((0, pkgHandler_1.isNewPackage)(Packet.ADDR, Packet.NUM)) {
                            (0, pkgHandler_1.updateNewPackage)(Packet);
                        }
                    }
                    else if ((0, Functions_1.isPing)(raw)) { // If pkg is a ping ->
                        console.log("Ping From - " + (0, Functions_1.getIpv6byPing)(raw));
                        (0, ClientFunctions_1.sendPingToClient)((0, Functions_1.getIpv6byPing)(raw), ws);
                    }
                }
                catch (err) {
                    console.log('Error: ', err['message']);
                }
                return [2 /*return*/];
            });
        });
    });
    // WebSocket Routing (Server <-> Client)
    ws.on('message', function (message) { return __awaiter(void 0, void 0, void 0, function () {
        var received;
        return __generator(this, function (_a) {
            if (message.toString() != 'undefined') {
                try {
                    received = JSON.parse(message);
                    if (received.type == 'setSensor') {
                        (0, ClientFunctions_1.handleSetSensor)(received);
                    }
                    if (received.type == 'startNewExperiment') {
                        (0, ClientFunctions_1.handleStartNewExperiment)(received, ws);
                    }
                    if (received.type == 'endExperiment') {
                        (0, ClientFunctions_1.handleEndExperiment)(received, ws);
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
