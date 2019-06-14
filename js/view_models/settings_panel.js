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

            comm.connect(self.ip(), self.port(), function () {
                shouter.notifySubscribers({
                    text: "Connected to server!",
                    type: MSG_TYPE.INFO,
                    volatile: true
                }, SHOUT.MSG);
            });

        } catch (e) {
        }

        shouter.notifySubscribers(false, SHOUT.LOADING);

        shouter.notifySubscribers({
            text: "Couldn't connect to the server!",
            type: MSG_TYPE.ERROR
        }, SHOUT.MSG);

        return false;
    };
};

module.exports = settingsPanelViewModel;