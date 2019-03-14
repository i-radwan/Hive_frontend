require("../utils/constants");
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, state, gfxEventHandler, commSender) {
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
            runningMode(RUNNING_MODE.SIMULATE);
            self.playing(true);

            commSender({
                type: SERVER_EVENT_TYPE.MAP,
                state: JSON.stringify(state, null, 2)
            });
        }
    };

    self.stopClicked = function () {
        runningMode(RUNNING_MODE.DESIGN);
        self.playing(false);
    };

    self.deployClicked = function () {
        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j];

                if (c.type === MAP_CELL.ROBOT && !c.ip.match(REG_IP)) {
                    shouter.notifySubscribers({text: "Robot IP is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

                    return false;
                }
            }
        }

        runningMode(RUNNING_MODE.DEPLOY);
        self.playing(true);
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

    self.handleEsc = function() {

    };
};

module.exports = controlConsoleViewModel;