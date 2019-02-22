require("../utils/constants");
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, map) {
    let self = this;

    self.playing = ko.observable(false);

    self.playClicked = function () {
        if (self.playing()) {
            runningMode(RUNNING_MODE.DESIGN);
            self.playing(false);
        } else {
            // TODO: Check if all info is good
            runningMode(RUNNING_MODE.SIMULATE);
            self.playing(true);
        }
    };

    self.stopClicked = function () {
        runningMode(RUNNING_MODE.DESIGN);
        self.playing(false);
    };

    self.deployClicked = function () {
        // TODO: Check if all info is good
        // runningMode(RUNNING_MODE.DEPLOY);
    };

    shouter.subscribe(function () {
        // TODO: show error message
    }, self, SHOUT_ERROR);

    runningMode.subscribe(function (newRunningMode) {

    });
};

module.exports = controlConsoleViewModel;