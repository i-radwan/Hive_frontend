require('../utils/constants');
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, state, gfxEventHandler, commSender) {
    let self = this;

    self.playing = ko.observable(false);
    self.msg = ko.observable("");
    self.msgType = ko.observable(MSG_INFO);
    self.timer = null;

    self.play = function () {
        if (self.playing()) {
            runningMode(RUNNING_MODE.DESIGN);
            self.playing(false);
        } else {
            sendState();

            runningMode(RUNNING_MODE.SIMULATE);
            self.playing(true);
        }
    };

    self.stop = function () {
        runningMode(RUNNING_MODE.DESIGN);
        self.playing(false);
    };

    self.deploy = function () {
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

    let sendState = function () {
        let stateCopy = Object.assign({}, state);

        let racks = [];
        let robots = [];
        let gates = [];
        let stations = [];
        let obstacles = [];

        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j];

                if (c.robot !== undefined) {
                    robots.push(c.robot);
                } else if (c.facility !== undefined) {
                    switch (c.facility.type) {
                        case MAP_CELL.GATE:
                            gates.push(c.facility);
                            break;
                        case MAP_CELL.RACK:
                            racks.push(c.facility);
                            break;
                        case MAP_CELL.STATION:
                            stations.push(c.facility);
                            break;
                        case MAP_CELL.OBSTACLE:
                            obstacles.push(c.facility);
                            break;
                    }
                }
            }
        }

        stateCopy.robots = robots;
        stateCopy.gates = gates;
        stateCopy.racks = racks;
        stateCopy.stations = stations;
        stateCopy.obstacles = obstacles;

        console.log(JSON.stringify(stateCopy, null, 2));

        commSender({
            type: SERVER_EVENT_TYPE.INIT,
            data: JSON.stringify(stateCopy, null, 2)
        });
    };
};

module.exports = controlConsoleViewModel;