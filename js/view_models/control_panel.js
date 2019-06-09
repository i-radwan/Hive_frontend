require('../utils/constants');
let $ = require('jquery');
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, state, gfxEventHandler, comm, logger) {
    let self = this;

    self.playing = ko.observable(false);
    self.coordinates = ko.observable("");
    self.msg = ko.observable("");
    self.msgType = ko.observable(MSG_TYPE.INFO);
    self.timer = null;

    self.preSimState = null;
    self.lastStartMode = null;

    self.play = function () {
        if (!comm.connected) {
            shouter.notifySubscribers({text: "Connect to a server first!", type: MSG_TYPE.ERROR}, SHOUT.MSG);

            return;
        }

        if (self.playing()) {
            comm.send({
                type: MSG_TO_SERVER.PAUSE
            });

            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.TEXT,
                msg: "Simulation Paused"
            });

            gfxEventHandler({
                type: EVENT_TO_GFX.SIMULATION_PAUSE
            });

            runningMode(RUNNING_MODE.PAUSE);
            self.playing(false);
        } else {
            self.lastStartMode = self.lastStartMode ? self.lastStartMode : START_MODE.SIMULATE;

            sendStateToServer(self.lastStartMode);

            shouter.notifySubscribers(true, SHOUT.LOADING);
        }
    };

    self.stop = function () {
        if (!comm.connected) {
            shouter.notifySubscribers({text: "Connect to a server first!", type: MSG_TYPE.ERROR}, SHOUT.MSG);

            return;
        }

        comm.send({
            type: MSG_TO_SERVER.STOP
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.TEXT,
            msg: "Simulation Stopped"
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.SIMULATION_STOP
        });

        runningMode(RUNNING_MODE.DESIGN);
        self.playing(false);
        self.lastStartMode = null;

        state.load(self.preSimState);
        shouter.notifySubscribers({}, SHOUT.STATE_UPDATED);
    };

    self.deploy = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN)
            return;

        self.preSimState = Object.assign({}, state);

        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j];

                if (c.robot !== undefined && !c.robot.ip.match(REG_IP)) {
                    shouter.notifySubscribers({
                        text: "Robot at (" + (i + 1) + ", " + (j + 1) + ") doesn't have an IP!",
                        type: MSG_TYPE.ERROR
                    }, SHOUT.MSG);

                    return false;
                }
            }
        }

        self.lastStartMode = START_MODE.DEPLOY;

        sendStateToServer(self.lastStartMode);
    };

    self.handleEsc = function () {
    };

    self.handleAckStart = function (msg) {
        let data = msg.data;

        if (data.status === ACK_START_STATUS.OK) {
            self.preSimState = Object.assign({}, state);

            runningMode(self.lastStartMode === START_MODE.SIMULATE ? RUNNING_MODE.SIMULATE : RUNNING_MODE.DEPLOY);
            console.log(runningMode());

            self.playing(true);

            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.TEXT,
                msg: "Simulation Started"
            });

            gfxEventHandler({
                type: EVENT_TO_GFX.SIMULATION_START
            });

            shouter.notifySubscribers(false, SHOUT.LOADING);
        } else if (data.status === ACK_START_STATUS.ERROR) {
            shouter.notifySubscribers({text: data.msg, type: MSG_TYPE.ERROR}, SHOUT.MSG);

            shouter.notifySubscribers(false, SHOUT.LOADING);
        }
    };

    self.handleAckResume = function (msg) {
        let data = msg.data;

        if (data.status === ACK_RESUME_STATUS.OK) {
            runningMode(self.lastStartMode === START_MODE.SIMULATE ? RUNNING_MODE.SIMULATE : RUNNING_MODE.DEPLOY);

            console.log(runningMode());
            self.playing(true);

            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.TEXT,
                msg: "Simulation Resumed"
            });

            gfxEventHandler({
                type: EVENT_TO_GFX.SIMULATION_RESUME
            });

            shouter.notifySubscribers(false, SHOUT.LOADING);
        } else if (data.status === ACK_RESUME_STATUS.ERROR) {
            shouter.notifySubscribers({text: data.msg, type: MSG_TYPE.ERROR}, SHOUT.MSG);

            shouter.notifySubscribers(false, SHOUT.LOADING);
        }
    };

    self.handleCellHover = function(row, col) {
        self.coordinates("(" + row + ", " + col + ")");
    };

    shouter.subscribe(function (msg) {
        self.msg(msg.text);
        self.msgType(msg.type);

        // Timer to auto-hide the message
        clearTimeout(self.timer);
        self.timer = setTimeout(() => {
            self.msg("")
        }, MSG_TIMEOUT);
    }, self, SHOUT.MSG);

    let sendStateToServer = function (mode) {
        if (!comm.connected) {
            shouter.notifySubscribers({text: "Connect to a server first!", type: MSG_TYPE.ERROR}, SHOUT.MSG);

            return;
        }

        if (runningMode() === RUNNING_MODE.DESIGN) {
            comm.send({
                type: MSG_TO_SERVER.START,
                data: {
                    mode: mode,
                    state: JSON.stringify(state, null, 2)
                }
            });
        } else if (runningMode() === RUNNING_MODE.PAUSE) {
            comm.send({
                type: MSG_TO_SERVER.RESUME
            });
        }
    };
};

module.exports = controlConsoleViewModel;