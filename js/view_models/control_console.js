require('../utils/constants');
let $ = require('jquery');
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, state, gfxEventHandler, comm) {
    let self = this;

    self.settingsVisible = ko.observable(false);
    self.playing = ko.observable(false);
    self.msg = ko.observable("");
    self.msgType = ko.observable(MSG_INFO);
    self.timer = null;

    self.ip = ko.observable("");
    self.port = ko.observable("");

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

    self.toggleSettings = function () {
        if (self.settingsVisible()) {
            $("#settings-icon").removeClass("rotated");
            $("#settings").slideUp({
                duration: 250,
                progress: function (a, p) {
                    if (p > 0.5) {
                        $(".map-row").removeClass("back");
                        $(".settings").removeClass("front");
                    }
                }
            });
        } else {
            $("#settings-icon").addClass("rotated");
            $("#settings").slideDown({
                duration: 250,
                progress: function (a, p) {
                    if (p > 0.5) {
                        $(".map-row").addClass("back");
                        $(".settings").addClass("front");
                    }
                }
            });
        }

        self.settingsVisible(!self.settingsVisible());
    };

    self.connect = function () {
        // ToDo connect to the server

        if (self.ip().length === 0 || !self.ip().match(REG_IP)) {
            shouter.notifySubscribers({text: "Invalid IP address!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.port().length === 0 || isNaN(self.port())) {
            shouter.notifySubscribers({text: "Invalid Port!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        try {
            let d = comm.connect(self.ip(), self.port());

            if (d) {
                shouter.notifySubscribers({text: "Connected to Server!", type: MSG_INFO}, SHOUT_MSG);

                return true;
            }
        } catch (e) {}

        shouter.notifySubscribers({text: "Couldn't Connect to the Server!", type: MSG_ERROR}, SHOUT_MSG);

        return false;
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