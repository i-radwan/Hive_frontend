require('../utils/constants');
let WebSocketServer = require('ws').Server;

let comm = function (serverMW) {
    let self = this;

    self.connected = false;

    self.connect = function (ip, port, rcv) {
        if (rcv !== undefined)
            self.rcv = rcv;
        else if (self.rcv === undefined) {
            throw "Error, no rcv function defined!";
        }

        let d = false;

        self.wss = new WebSocketServer({
            host: ip, port: port
        });

        self.wss.on('connection', function (ws) {
            self.ws = ws;
            self.connected = true;

            ws.on('message', function (message) {
                console.log('received: %s', message);
                self.rcv(serverMW.receive(message));
            });

            d = true;
        });

        return d;
    };

    self.send = function (msg) {
        if (self.ws === undefined) {
            throw "Error, socket is not open!";
        }

        self.ws.send(serverMW.send(msg));
    };
};

module.exports = comm;