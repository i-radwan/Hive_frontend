require("../utils/constants");
let ko = require('knockout');
let WebSocketServer = require('ws').Server;

let comm = function () {
    let self = this;

    self.connect = function (ip, port, rcv) {
        self.wss = new WebSocketServer({
            host: ip, port: port
        });

        self.wss.on('connection', function (ws) {
            self.ws = ws;

            ws.on('message', function (message) {
                console.log('received: %s', message);
                rcv(message);
            });
        });
    };

    self.send = function (msg) {
        self.ws.send(msg);
    };
};

module.exports = comm;