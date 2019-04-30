require('../utils/constants');
let $ = require('jquery');
let ko = require('knockout');

let settingsPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, comm, logger) {
    let self = this;

    self.ip = ko.observable("");
    self.port = ko.observable("");

    self.handleEsc = function () {
    };

    self.connect = function () {
        // ToDo connect to the server

        if (self.ip().length === 0 || !self.ip().match(REG_IP)) {
            shouter.notifySubscribers({text: "Invalid IP address!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.port().length === 0 || isNaN(self.port())) {
            shouter.notifySubscribers({text: "Invalid port!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        try {
            let d = comm.connect(self.ip(), self.port());

            if (d) {
                shouter.notifySubscribers({text: "Connected to server!", type: MSG_INFO}, SHOUT_MSG);

                return true;
            }
        } catch (e) {}

        shouter.notifySubscribers({text: "Couldn't connect to the server!", type: MSG_ERROR}, SHOUT_MSG);

        return false;
    };
};

module.exports = settingsPanelViewModel;