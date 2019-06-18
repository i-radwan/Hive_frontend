require('../utils/constants');
require('../utils/strings');
let ko = require('knockout');

/**
 * Robot view model.
 *
 * @param runningMode
 * @param shouter
 * @param state
 * @param gfxEventHandler
 * @param sendToServer
 * @param logger
 */
let robotPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.id = ko.observable(1);
    self.color = ko.observable("#FF0000");
    self.loadCap = ko.observable(100);
    self.ip = ko.observable("");
    self.port = ko.observable("");
    self.deactivated = ko.observable(false);

    self.editing = ko.observable(false);
    self.activeRobotRow = -1;
    self.activeRobotCol = -1;

    self.showable = ko.observable(false); // In simulation mode, when robot is clicked
    self.active = ko.computed(function () {
        return self.showable() || runningMode() === RUNNING_MODE.DESIGN;
    });

    self.add = function (row, col) {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        let isRobotFree = state.map.isRobotFree(row, col);

        if (self.editing()) {
            if (isRobotFree) {
                shouter.notifySubscribers({}, SHOUT.ESC);
            }

            return;
        }

        if (isRobotFree) {
            if (!check()) {
                return;
            }

            let id = parseInt(self.id());

            state.map.addObject(row, col, {
                type: MAP_CELL.ROBOT,
                id: id,
                color: self.color(),
                direction: ROBOT_DIR.RIGHT,
                load_cap: parseInt(self.loadCap()),
                ip: self.ip(),
                port: self.port(),
                deactivated: false
            });

            let nextID = Math.max(state.nextIDs.robot, id + 1);

            self.id(nextID);
            state.nextIDs.robot = nextID;

            shouter.notifySubscribers({
                text: STR[1000](["Robot"]),
                type: MSG_TYPE.INFO,
                volatile: true
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: id,
                    row: row,
                    col: col,
                    load_cap: parseInt(self.loadCap()),
                    color: self.color(),
                    ip: self.ip(),
                    port: self.port()
                }
            });
        } else {
            shouter.notifySubscribers({
                text: STR[2000]([row + 1, col + 1]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);
        }
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (srcRow === dstRow && srcCol === dstCol)
            return;

        let rob = state.map.getRobot(srcRow, srcCol);

        if (state.map.isFree(dstRow, dstCol)) {
            state.map.moveObject(srcRow, srcCol, dstRow, dstCol, rob);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: rob.id,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: dstRow,
                    dst_col: dstCol
                }
            });
        } else {
            shouter.notifySubscribers({
                text: STR[2000]([dstRow + 1, dstCol + 1]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.ROBOT,
                    id: rob.id,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: srcRow,
                    dst_col: srcCol
                }
            });
        }
    };

    self.delete = function (row, col) {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        let rob = state.map.getRobot(row, col);

        state.map.deleteObject(row, col, rob);

        unselect();
        clear();

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DELETE,
            data: {
                type: MAP_CELL.ROBOT,
                id: rob.id,
                row: row,
                col: col
            }
        });

        return true;
    };

    self.fill = function (row, col) {
        let rob = state.map.getRobot(row, col);

        if (rob === undefined)
            return;

        self.activeRobotRow = row;
        self.activeRobotCol = col;
        self.showable(true);

        self.id(rob.id);
        self.color(rob.color);
        self.loadCap(rob.load_cap);
        self.ip(rob.ip);
        self.port(rob.port);
        self.deactivated(rob.deactivated);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.ROBOT,
                id: rob.id,
                row: row,
                col: col
            }
        });
    };

    self.edit = function (row, col) {
        self.editing(true);

        self.fill(row, col);
    };

    self.update = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        if (!check())
            return false;

        let rob = state.map.getRobot(self.activeRobotRow, self.activeRobotCol);

        let id = rob.id;

        state.map.updateObject(self.activeRobotRow, self.activeRobotCol, {
            type: MAP_CELL.ROBOT,
            id: id,
            color: self.color(),
            load_cap: parseInt(self.loadCap()),
            ip: self.ip(),
            port: self.port(),
            direction: ROBOT_DIR.RIGHT,
            deactivated: false
        });

        shouter.notifySubscribers({
            text: STR[1001](["Robot"]),
            type: MSG_TYPE.INFO,
            volatile: true
        }, SHOUT.MSG);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_COLORIZE,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                row: self.activeRobotRow,
                col: self.activeRobotCol,
                color: self.color()
            }
        });
    };

    self.move = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_MOVE,
            data: {
                id: id,
                row: r,
                col: c
            }
        });
    };

    self.rotateRight = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getRobot(r, c);

        rob.direction = (rob.direction - 1 + ROBOT_DIR_CNT) % ROBOT_DIR_CNT;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_ROTATE_RIGHT,
            data: {
                id: id,
                row: r,
                col: c
            }
        });
    };

    self.rotateLeft = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getRobot(r, c);

        rob.moving = true;
        rob.direction = (rob.direction + 1) % ROBOT_DIR_CNT;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_ROTATE_LEFT,
            data: {
                id: id,
                row: r,
                col: c
            }
        });
    };

    self.retreat = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getRobot(r, c);

        rob.moving = true;
        rob.direction = (rob.direction + 2) % ROBOT_DIR_CNT;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_RETREAT,
            data: {
                id: id,
                row: r,
                col: c
            }
        });
    };

    self.bind = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let fac = state.map.getBindableFacility(r, c);
        let rob = state.map.getRobot(r, c);

        if (fac === undefined) {
            throw "Error: there should be facility here!";
        }

        fac.bound = true;
        fac.bound_to_id = id;

        rob.bound = true;
        rob.bound_to = fac.id;
        rob.bound_to_type = fac.type;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_BIND,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                object_type: fac.type,
                object_id: fac.id,
                row: r,
                col: c
            }
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_COLORIZE,
            data: {
                type: fac.type,
                id: fac.id,
                row: r,
                col: c,
                color: rob.color
            }
        });

        if (fac.type === MAP_CELL.GATE) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: STR[3007]([rob.id, fac.id])
            });
        } else if (fac.type === MAP_CELL.STATION) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: STR[3009]([rob.id, fac.id])
            });
        }
    };

    self.unbind = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let fac = state.map.getBoundFacility(r, c);
        let rob = state.map.getRobot(r, c);

        if (fac === undefined) {
            throw "Error: there should be facility here!";
        }

        fac.bound = false;
        fac.bound_to_id = undefined;

        rob.bound = false;
        rob.bound_to = undefined;
        rob.bound_to_type = undefined;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_UNBIND,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                object_type: fac.type,
                object_id: fac.id,
                row: r,
                col: c
            }
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DECOLORIZE,
            data: {
                type: fac.type,
                id: fac.id,
                row: r,
                col: c
            }
        });

        if (fac.type === MAP_CELL.GATE) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: STR[3008]([rob.id, fac.id])
            });
        } else if (fac.type === MAP_CELL.STATION) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: STR[3010]([rob.id, fac.id])
            });
        }
    };

    self.load = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let fac = state.map.getSpecificFacility(r, c, MAP_CELL.RACK);
        let rob = state.map.getRobot(r, c);

        if (fac === undefined) {
            throw "Error: there should be facility here!";
        }

        fac.loaded = true;
        fac.robot_id = id;

        rob.loaded = true;
        rob.loaded_rack_id = fac.id;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_LOAD,
            data: {
                type: MAP_CELL.ROBOT,
                id: rob.id,
                object_type: fac.type,
                object_id: fac.id,
                row: r,
                col: c
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[3011]([rob.id, fac.id])
        });
    };

    self.offload = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let r = pos[0];
        let c = pos[1];

        let fac = state.map.getSpecificFacility(r, c, MAP_CELL.RACK);
        let rob = state.map.getRobot(r, c);

        if (fac === undefined) {
            throw "Error: there should be facility here!";
        }

        fac.loaded = false;
        fac.robot_id = undefined;

        rob.loaded = false;
        rob.loaded_rack_id = undefined;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_OFFLOAD,
            data: {
                type: MAP_CELL.ROBOT,
                id: rob.id,
                object_type: fac.type,
                object_id: fac.id,
                row: r,
                col: c
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[3012]([rob.id, fac.id])
        });
    };

    self.assignTask = function (robotID, rackID) {
        let robPos = state.map.getObjectPos(robotID, MAP_CELL.ROBOT);

        let robR = robPos[0];
        let robC = robPos[1];

        let rob = state.map.getRobot(robR, robC);

        let rackPos = state.map.getObjectPos(rackID, MAP_CELL.RACK);

        let rackR = rackPos[0];
        let rackC = rackPos[1];

        let fac = state.map.getSpecificFacility(rackR, rackC, MAP_CELL.RACK);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_COLORIZE,
            data: {
                type: MAP_CELL.RACK,
                id: rackID,
                row: rackR,
                col: rackC,
                color: fac.color
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[3013]([robotID, rackID])
        });
    };

    /**
     * Listens for robot activate/deactivate button click.
     * Called from the main view model.
     */
    self.toggleActivation = function () {
        if (!self.deactivated()) { // Deactivate the robot
            sendToServer({
                type: MSG_TO_SERVER.CONTROL,
                data: {
                    id: parseInt(self.id()),
                    type: CONTROL_MSG.DEACTIVATE
                }
            });

            self.deactivateRobot(parseInt(self.id()));
        } else {
            sendToServer({
                type: MSG_TO_SERVER.CONTROL,
                data: {
                    id: parseInt(self.id()),
                    type: CONTROL_MSG.DEACTIVATE
                }
            });

            self.activateRobot(parseInt(self.id()));
        }

        self.deactivated(!self.deactivated());
    };

    self.deactivateRobot = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let row = pos[0];
        let col = pos[1];

        let rob = state.map.getRobot(row, col);

        rob.deactivated = true;

        if (rob.moving) {
            aggregateBlocking(row, col);
        }

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_FAILURE, // ToDo: STOP or FAILURE (depends on ACK)
            data: {
                type: MAP_CELL.ROBOT,
                id: parseInt(self.id()),
                row: row,
                col: col
            }
        });

        logger({
            level: LOG_LEVEL.ERROR,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[4000]([rob.id])
        });
    };

    self.activateRobot = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);

        let row = pos[0];
        let col = pos[1];

        let rob = state.map.getRobot(row, col);

        rob.deactivated = false;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_FIXED,
            data: {
                type: MAP_CELL.ROBOT,
                id: parseInt(self.id()),
                row: row,
                col: col
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: STR[3014]([rob.id])
        });
    };

    self.doneMoving = function (id) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);
        let r = pos[0];
        let c = pos[1];

        let rob = state.map.getRobot(r, c);

        let nr = r + ROW_DELTA[rob.direction];
        let nc = c + COL_DELTA[rob.direction];

        rob.moving = false;

        state.map.moveObject(r, c, nr, nc, rob);

        if (rob.loaded) {
            let fac = state.map.getSpecificFacility(r, c, MAP_CELL.RACK);

            state.map.moveObject(r, c, nr, nc, fac);
        }
    };

    self.updateBattery = function (id, battery) {
        let pos = state.map.getObjectPos(id, MAP_CELL.ROBOT);
        let r = pos[0];
        let c = pos[1];

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_UPDATE,
            data: {
                type: MAP_CELL.ROBOT,
                id: id,
                row: r,
                col: c,
                battery: battery
            }
        });
    };

    self.handleEsc = function () {
        unselect();
        clear();
    };

    let aggregateBlocking = function (row, col) {
        let movingRobots = state.map.getMovingRobots();

        for (let i = 0; i < movingRobots.length; ++i) {
            let rob = movingRobots[0];

            let pos = state.map.getObjectPos(rob.id, MAP_CELL.ROBOT);

            let r = pos[0];
            let c = pos[1];

            let nr = r + ROW_DELTA[rob.direction];
            let nc = c + COL_DELTA[rob.direction];

            if (nr === row && nc === col) { // Moving toward blocked cell
                // rob.moving = false;  // ToDo: consider this optimization, it will cause an error
                                        // ToDo: as you will not know whether this robot was moving or not before
                                        // ToDo: stopping it, so what is the value of `moving` after activating the
                                        // ToDo: robot? it's lost if we override it here.
                                        // ToDo: this optimization prevents the next recursion call from
                                        // ToDo: considering this robot (it's been considered).

                gfxEventHandler({
                    type: EVENT_TO_GFX.OBJECT_FAILURE,
                    data: {
                        type: MAP_CELL.ROBOT,
                        id: parseInt(rob.id),
                        row: r,
                        col: c
                    }
                });

                logger({
                    level: LOG_LEVEL.ERROR,
                    object: LOG_TYPE.ROBOT,
                    color: rob.color,
                    msg: STR[4001]([rob.id])
                });

                aggregateBlocking(r, c);
            }
        }
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Robot ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.color().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Robot color"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.loadCap().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Robot load capacity"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0 || parseInt(self.loadCap()) < 0) {
            shouter.notifySubscribers({
                text: STR[2010](),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate ID check
        let pos = state.map.getObjectPos(parseInt(self.id()), MAP_CELL.ROBOT);

        if (pos !== undefined && (pos[0] !== self.activeRobotRow || pos[1] !== self.activeRobotCol)) {
            shouter.notifySubscribers({
                text: STR[2002](["Robot ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // HTML color
        if (!self.color().match(REG_HTML_COLOR)) {
            shouter.notifySubscribers({
                text: STR[2006](["color code"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.ip().length > 0 && !self.ip().match(REG_IP)) {
            shouter.notifySubscribers({
                text: STR[2006](["IP address"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.port().length > 0 && isNaN(self.port())) {
            shouter.notifySubscribers({
                text: STR[2006](["port"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let unselect = function () {
        self.activeRobotRow = self.activeRobotCol = -1;
        self.editing(false);
        self.showable(false);
    };

    let clear = function () {
        self.id(state.nextIDs.robot);
        self.color("#FF0000");
        self.loadCap(100);
        self.ip("");
        self.port("");
    };

    // Events
    shouter.subscribe(function () {
        unselect();
        clear();
    }, self, SHOUT.STATE_UPDATED);
};

module.exports = robotPanelViewModel;