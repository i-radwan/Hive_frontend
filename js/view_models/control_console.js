require('../utils/constants');
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer) {
    let self = this;

    self.playing = ko.observable(false);
    self.msg = ko.observable("");
    self.msgType = ko.observable(MSG_INFO);
    self.timer = null;

    self.preSimState = null;

    self.play = function () {
        if (self.playing()) {
            runningMode(RUNNING_MODE.PAUSE);
            self.playing(false);
        } else {
            if (!prepare())
                return false;

            sendState();

            runningMode(RUNNING_MODE.SIMULATE);
            self.playing(true);
        }
    };

    self.stop = function () {
        runningMode(RUNNING_MODE.DESIGN);
        self.playing(false);

        state.load(self.preSimState);
        shouter.notifySubscribers({}, SHOUT_STATE_UPDATED);
    };

    self.deploy = function () {
        if (!prepare())
            return false;

        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j];

                if (c.robot !== undefined && !c.robot.ip.match(REG_IP)) {
                    shouter.notifySubscribers({
                        text: "Robot at (" + (i + 1) + ", " + (j + 1) + ") doesn't have an IP!",
                        type: MSG_ERROR
                    }, SHOUT_MSG);

                    return false;
                }
            }
        }

        sendState();

        runningMode(RUNNING_MODE.DEPLOY);
        self.playing(true);
    };

    self.handleEsc = function () {
    };

    shouter.subscribe(function (msg) {
        self.msg(msg.text);
        self.msgType(msg.type);

        // Timer to auto-hide the message
        clearTimeout(self.timer);
        self.timer = setTimeout(() => {
            self.msg("")
        }, MSG_TIMEOUT);
    }, self, SHOUT_MSG);

    runningMode.subscribe(function (newRunningMode) {
    });

    let prepare = function () {
        // Fill the stock before simulation
        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j].facility;

                if (c !== undefined && c.type === MAP_CELL.RACK) {
                    for (let i = 0; i < c.items.length; ++i) {
                        let it = c.items[i];

                        if (state.stock[it.id] === undefined) {
                            state.stock[it.id] = it.quantity;
                        } else {
                            state.stock[it.id] += it.quantity;
                        }
                    }
                }
            }
        }

        self.preSimState = Object.assign({}, state);

        return true;
    };

    let sendState = function () {
        // console.log(JSON.stringify(state, null, 2));

        // TODO
        // sendToServer({
        //     type: SERVER_EVENT_TYPE.INIT,
        //     data: JSON.stringify(state, null, 2)
        // });
    };
};

module.exports = controlConsoleViewModel;