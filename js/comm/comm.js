require('../utils/constants');

let comm = function (serverMW) {
    let self = this;

    self.connected = false;

    self.connect = function (ip, port, callback, errorCallback, closeCallback) {
        if (self.rcv === undefined) {
            errorCallback();

            throw "Error, no rcv function defined!";
        }

        self.ws = new WebSocket("ws://" + ip + ":" + port);

        self.ws.onopen = function () {
            self.connected = true;

            callback();
        };

        self.ws.onerror = function (error) {
            self.connected = false;

            errorCallback();
        };

        self.ws.onmessage = function (e) {
            let msg = JSON.parse(e.data);

            self.rcv(serverMW.receive(msg));
        };

        self.ws.onclose = function () {
            if (self.connected) {
                self.connected = false;

                closeCallback();
            }
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