require('../utils/constants');
let $ = require('jquery');
let ko = require('knockout');

let settingsPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, comm, logger) {
    let self = this;

    self.ip = ko.observable(SERVER_IP);
    self.port = ko.observable(SERVER_PORT);

    self.handleEsc = function () {
    };

    self.connect = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "Connection is allowed only in design mode!",
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return;
        }

        if (self.ip().length === 0 || !self.ip().match(REG_IP)) {
            shouter.notifySubscribers({
                text: "Invalid IP address!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.port().length === 0 || isNaN(self.port())) {
            shouter.notifySubscribers({
                text: "Invalid port!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        try {
            shouter.notifySubscribers(true, SHOUT.LOADING);

            let callback = function () {
                shouter.notifySubscribers({
                    text: "Connected to server!",
                    type: MSG_TYPE.INFO,
                    volatile: true
                }, SHOUT.MSG);
            };

            let errorCallback = function () {  // Reconnect
                setTimeout(function () {
                    comm.connect(self.ip(), self.port(), callback, errorCallback, closeCallback);
                }, RECONNECT_INTERVAL);
            };

            let closeCallback = function () {
                shouter.notifySubscribers({
                    text: "Server disconnected!",
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                runningMode(RUNNING_MODE.DESIGN);

                comm.connect(self.ip(), self.port(), callback, errorCallback, closeCallback);
            };

            comm.connect(self.ip(), self.port(), callback, errorCallback, closeCallback);
        } catch (e) {
        }

        shouter.notifySubscribers(false, SHOUT.LOADING);

        shouter.notifySubscribers({
            text: "Couldn't connect to the server!",
            type: MSG_TYPE.ERROR
        }, SHOUT.MSG);

        return false;
    };

    self.connect();
};

module.exports = settingsPanelViewModel;