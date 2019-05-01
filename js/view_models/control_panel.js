require('../utils/constants');
let $ = require('jquery');
let ko = require('knockout');

let controlConsoleViewModel = function (runningMode, shouter, state, gfxEventHandler, comm, logger) {
    let self = this;

    self.playing = ko.observable(false);
    self.msg = ko.observable("");
    self.msgType = ko.observable(MSG_INFO);
    self.timer = null;

    self.preSimState = null;

    self.play = function () {
        if (!comm.connected) {
            shouter.notifySubscribers({text: "Connect to a server first!", type: MSG_ERROR}, SHOUT_MSG);

            return;
        }

        if (self.playing()) {
            comm.send({
                type: MSG_TO_SERVER.PAUSE,
                data: {
                    mode: runningMode() === RUNNING_MODE.SIMULATE ? CONFIG_MODE.SIMULATE : CONFIG_MODE.DEPLOY
                }
            });

            logger({
                level: LOG_LEVEL_INFO,
                object: LOG_OBJECT_SIMULATION,
                msg: "Simulation Paused"
            });

            gfxEventHandler({
                type: EVENT_TO_GFX.SIMULATION_PAUSE
            });

            runningMode(RUNNING_MODE.PAUSE);
            self.playing(false);
        } else {
            sendStateToServer(CONFIG_MODE.SIMULATE);

            shouter.notifySubscribers(true, SHOUT_LOADING);
        }
    };

    self.stop = function () {
        if (!comm.connected) {
            shouter.notifySubscribers({text: "Connect to a server first!", type: MSG_ERROR}, SHOUT_MSG);

            return;
        }

        comm.send({
            type: MSG_TO_SERVER.STOP
        });

        logger({
            level: LOG_LEVEL_INFO,
            object: LOG_OBJECT_SIMULATION,
            msg: "Simulation Stopped"
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.SIMULATION_STOP
        });

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

        sendStateToServer(CONFIG_MODE.DEPLOY);
    };

    self.handleEsc = function () {
    };

    self.handleAckConfig = function (msg) {
        let data = msg.data;

        if (data.status === ACK_CONFIG_STATUS.OK) {
            prepare();

            if (data.mode === CONFIG_MODE.SIMULATE) {
                runningMode(RUNNING_MODE.SIMULATE);
            } else if (data.mode === CONFIG_MODE.DEPLOY) {
                runningMode(RUNNING_MODE.DEPLOY);
            }

            self.playing(true);

            logger({
                level: LOG_LEVEL_INFO,
                object: LOG_OBJECT_SIMULATION,
                msg: "Simulation Started"
            });

            gfxEventHandler({
                type: EVENT_TO_GFX.SIMULATION_START
            });

            shouter.notifySubscribers(false, SHOUT_LOADING);
        } else if (data.status === ACK_CONFIG_STATUS.ERROR) {
            shouter.notifySubscribers({text: data.msg, type: MSG_ERROR}, SHOUT_MSG);

            shouter.notifySubscribers(false, SHOUT_LOADING);
        }
    };

    self.handleAckResume = function (msg) {
        let data = msg.data;

        if (data.status === ACK_RESUME_STATUS.OK) {
            if (data.mode === CONFIG_MODE.SIMULATE) {
                runningMode(RUNNING_MODE.SIMULATE);
            } else if (data.mode === CONFIG_MODE.DEPLOY) {
                runningMode(RUNNING_MODE.DEPLOY);
            }

            self.playing(true);

            logger({
                level: LOG_LEVEL_INFO,
                object: LOG_OBJECT_SIMULATION,
                msg: "Simulation Resumed"
            });

            gfxEventHandler({
                type: EVENT_TO_GFX.SIMULATION_RESUME
            });

            shouter.notifySubscribers(false, SHOUT_LOADING);
        } else if (data.status === ACK_RESUME_STATUS.ERROR) {
            shouter.notifySubscribers({text: data.msg, type: MSG_ERROR}, SHOUT_MSG);

            shouter.notifySubscribers(false, SHOUT_LOADING);
        }
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
    };

    let sendStateToServer = function (mode) {
        if (!comm.connected) {
            shouter.notifySubscribers({text: "Connect to a server first!", type: MSG_ERROR}, SHOUT_MSG);

            return;
        }

        if (runningMode() === RUNNING_MODE.DESIGN) {
            comm.send({
                type: MSG_TO_SERVER.CONFIG,
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