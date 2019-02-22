require("../utils/constants");
let ko = require('knockout');

let controlConsoleViewModel = function (shouter, map) {
    let self = this;
    self.playing = ko.observable(false);

    self.playClicked = function () {
        if (self.playing()) {
            shouter.notifySubscribers(RUNNING_MODE.DESIGN, SHOUT_RUNNING_MODE);
            self.playing(false);
        } else {
            // TODO: Check if all info is good
            shouter.notifySubscribers(RUNNING_MODE.SIMULATE, SHOUT_RUNNING_MODE);
            self.playing(true);
        }
    };

    self.stopClicked = function () {
        shouter.notifySubscribers(RUNNING_MODE.DESIGN, SHOUT_RUNNING_MODE);
        self.playing(false);
    };

    self.deployClicked = function () {
        // TODO: Check if all info is good
        // shouter.notifySubscribers(RUNNING_MODE.DEPLOY, SHOUT_RUNNING_MODE);
    };

    shouter.subscribe(function () {
        // TODO: show error message
    }, self, SHOUT_ERROR);
};

module.exports = controlConsoleViewModel;