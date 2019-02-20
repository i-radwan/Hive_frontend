require("../utils/constants");
let ko = require('knockout');

let controlConsoleViewModel = function (shouter) {
    let self = this;
    self.playing = ko.observable(false);
    self.map = [];

    self.playClicked = function () {
        if (self.playing()) {
            shouter.notifySubscribers(RUNNING_MODE.DESIGN, SHOUT_RUNNING_MODE);
            self.playing(false);
        }
        else {
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

    // Events
    shouter.subscribe(function (map) {
        self.map = map;
    }, self, SHOUT_MAP_TEMP_APPLIED);

    shouter.subscribe(function (map) {
        self.map = map;
    }, self, SHOUT_MAP_SIZE_CHANGED);
};

module.exports = controlConsoleViewModel;