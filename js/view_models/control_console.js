require("../utils/constants");
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, map) {
    let self = this;

    self.playing = ko.observable(false);
    self.msg = ko.observable("");
    self.msgType = ko.observable(MSG_INFO);
    self.timer = null;

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

    shouter.subscribe(function (msg) {
        self.msg(msg.text);
        self.msgType(msg.type);

        // Timer to auto-hide the message
        clearTimeout(self.timer);
        self.timer = setTimeout(() => {self.msg("")}, MSG_TIMEOUT);
    }, self, SHOUT_MSG);

    runningMode.subscribe(function (newRunningMode) {

    });
};

module.exports = controlConsoleViewModel;