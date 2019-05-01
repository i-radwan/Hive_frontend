require('../utils/constants');

let comm = function (serverMW) {
    let self = this;

    self.connected = false;

    self.connect = function (ip, port, callback) {
        if (self.rcv === undefined) {
            throw "Error, no rcv function defined!";
        }

        self.ws = new WebSocket("ws://" + ip + ":" + port);

        self.ws.onopen = function () {
            self.connected = true;

            callback();
        };

        self.ws.onerror = function (error) {
        };

        self.ws.onmessage = function (e) {
            let msg = JSON.parse(e.data);

            console.log('received:', msg);

            self.rcv(serverMW.receive(msg));
        };
    };

    self.send = function (msg) {
        if (self.ws === undefined) {
            throw "Error, socket is not open!";
        }

        self.ws.send(JSON.stringify(serverMW.send(msg)));
    };
};

module.exports = comm;