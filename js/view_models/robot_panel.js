require('../utils/constants');
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

    self.add = function (row, col) {
        let isRobotFree = state.map.isRobotFree(row, col);

        if (self.editing()) {
            if (isRobotFree) {
                gfxEventHandler({ // ToDo call controllers handle escape functions
                    type: EVENT_TO_GFX.ESC
                });
            }

            return;
        }

        if (isRobotFree) {
            if (!check()) {
                return;
            }

            state.map.addObject(row, col, {
                type: MAP_CELL.ROBOT,
                id: parseInt(self.id()),
                color: self.color(),
                direction: ROBOT_DIR.RIGHT,
                load_cap: parseInt(self.loadCap()),
                ip: self.ip(),
                port: self.port()
            });

            self.id(Math.max(state.nextIDs.robot, parseInt(self.id()) + 1));
            state.nextIDs.robot = parseInt(self.id());

            shouter.notifySubscribers({
                text: "Robot placed successfully!",
                type: MSG_TYPE.INFO
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: {
                    type: MAP_CELL.ROBOT,
                    row: row,
                    col: col,
                    id: parseInt(self.id()),
                    load_cap: parseInt(self.loadCap()),
                    color: self.color(),
                    ip: self.ip(),
                    port: self.port()
                }
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + row + ", " + col + ") is occupied!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);
        }
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.isFree(dstRow, dstCol)) {
            let rob = state.map.getRobot(srcRow, srcCol);

            state.map.moveObject(srcRow, srcCol, dstRow, dstCol, rob);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.ROBOT,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: dstRow,
                    dst_col: dstCol
                }
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + dstRow + ", " + dstCol + ") is occupied!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.ROBOT,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: srcRow,
                    dst_col: srcCol
                }
            });
        }
    };

    self.delete = function (row, col) {
        let rob = state.map.getRobot(row, col);

        state.map.deleteObject(row, col, rob);

        unselect();
        clear();

        return true;
    };

    self.fill = function (row, col) {
        let rob = state.map.getRobot(row, col);

        if (rob === null)
            return;


        self.activeRobotRow = row;
        self.activeRobotCol = col;

        self.id(rob.id);
        self.color(rob.color);
        self.loadCap(rob.load_cap);
        self.ip(rob.ip);
        self.port(rob.port);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.ROBOT,
                row: row,
                col: col
            }
        });
    };

    self.edit = function (row, col) {
        self.fill(row, col);
        self.editing(true);
        self.activeRobotRow = row;
        self.activeRobotCol = col;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.ROBOT,
                row: row,
                col: col
            }
        });
    };

    self.update = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (!check())
            return false;

        let rob = state.map.getRobot(self.activeRobotRow, self.activeRobotCol);

        state.map.updateObject(self.activeRobotRow, self.activeRobotCol, {
            type: MAP_CELL.ROBOT,
            id: parseInt(self.id()),
            color: self.color(),
            load_cap: parseInt(self.loadCap()),
            ip: self.ip(),
            port: self.port()
        }, rob.id);

        state.nextIDs.robot = Math.max(state.nextIDs.robot, parseInt(self.id()) + 1);

        shouter.notifySubscribers({
            text: "Robot updated successfully!",
            type: MSG_TYPE.INFO
        }, SHOUT.MSG);

        unselect();
        clear();

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            data: {
                type: MAP_CELL.ROBOT
            }
        });
    };

    self.move = function (r, c) {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_MOVE,
            data: {
                row: r,
                col: c
            }
        });
    };

    self.rotateRight = function (r, c) {
        let rob = state.map.getRobot(r, c);

        rob.direction = (rob.direction - 1 + ROBOT_DIR_CNT) % ROBOT_DIR_CNT;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_ROTATE_RIGHT,
            data: {
                row: r,
                col: c
            }
        });
    };

    self.rotateLeft = function (r, c) {
        let rob = state.map.getRobot(r, c);

        rob.moving = true;
        rob.direction = (rob.direction + 1) % ROBOT_DIR_CNT;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_ROTATE_LEFT,
            data: {
                row: r,
                col: c
            }
        });
    };

    self.retreat = function (r, c) {
        let rob = state.map.getRobot(r, c);

        rob.moving = true;
        rob.direction = (rob.direction + 2) % ROBOT_DIR_CNT;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_RETREAT,
            data: {
                row: r,
                col: c
            }
        });
    };

    self.bind = function (id, r, c) {
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
                id: id,
                row: r,
                col: c,
                object_id: fac.id,
                object_type: fac.type
            }
        });

        if (fac.type === MAP_CELL.GATE) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: "Robot <b>(#" + rob.id + ")</b> is bound to the Gate#<b>(" + fac.id + ")</b>."
            });
        } else if (fac.type === MAP_CELL.STATION) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: "Robot <b>(#" + rob.id + ")</b> is charging at Station#<b>(" + fac.id + ")</b>."
            });
        }
    };

    self.unbind = function (id, r, c) {
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
                id: id,
                row: r,
                col: c,
                object_id: fac.id,
                object_type: fac.type
            }
        });

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DECOLORIZE,
            data: {
                type: fac.type,
                row: r,
                col: c
            }
        });

        if (fac.type === MAP_CELL.GATE) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: "Robot <b>(#" + rob.id + ")</b> is released from the Gate#<b>(" + fac.id + ")</b>."
            });
        } else if (fac.type === MAP_CELL.STATION) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ROBOT,
                color: rob.color,
                msg: "Robot <b>(#" + rob.id + ")</b> is leaving Station#<b>(" + fac.id + ")</b>."
            });
        }
    };

    self.load = function (id, r, c) {
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
                id: fac.id,
                row: r,
                col: c
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: "Robot <b>(#" + rob.id + ")</b> loaded Rack#<b>(" + fac.id + ")</b>."
        });
    };

    self.offload = function (id, r, c) {
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
                row: r,
                col: c,
                id: fac.id
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: "Robot <b>(#" + rob.id + ")</b> offloaded Rack#<b>(" + fac.id + ")</b>."
        });
    };

    self.assignTask = function (robot_id, robot_row, robot_col, rack_id, rack_row, rack_col) {
        let rob = state.map.getRobot(robot_row, robot_col);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_COLORIZE,
            data: {
                type: MAP_CELL.RACK,
                row: rack_row,
                col: rack_col,
                color: rob.color
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: "Robot <b>(#" + robot_id + ")</b> is assigned to Rack#<b>(" + rack_id + ")</b>."
        });
    };

    /**
     * Listens for robot activate/deactivate button click.
     * Called from the main view model.
     */
    self.toggleActivation = function () {
        if (!self.deactivated()) { // Deactivate the robot
            sendToServer({
                type: MSG_TO_SERVER.DEACTIVATE,
                data: {
                    id: parseInt(self.id())
                }
            });

            self.deactivateRobot(self.activeRobotRow, self.activeRobotCol);
        } else {
            sendToServer({
                type: MSG_TO_SERVER.ACTIVATE,
                data: {
                    id: parseInt(self.id())
                }
            });

            self.activateRobot(self.activeRobotRow, self.activeRobotCol);
        }

        self.deactivated(!self.deactivated());
    };

    self.deactivateRobot = function (row, col) {
        let rob = state.map.getRobot(row, col);

        if (rob.moving) {
            aggregateBlocking(row, col);
        }

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_FAILURE, // ToDo: STOP or FAILURE (depends on ACK)
            data: {
                id: parseInt(self.id()),
                row: row,
                col: col
            }
        });

        logger({
            level: LOG_LEVEL.ERROR,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: "Robot <b>(#" + rob.id + ")</b> has failed</b>."
        });
    };

    self.activateRobot = function (row, col) {
        let rob = state.map.getRobot(row, col);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_FIXED,
            data: {
                id: parseInt(self.id()),
                row: row,
                col: col
            }
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ROBOT,
            color: rob.color,
            msg: "Robot <b>(#" + rob.id + ")</b> is back</b>."
        });
    };

    self.doneMoving = function (id, row, col) {
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

    self.updateBattery = function (id, row, col, battery) {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_UPDATE,
            data: {
                id: id,
                row: row,
                col: col,
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
                // rob.moving = false; // ToDo: consider this optimization, it will cause an error

                sendToServer({
                    type: MSG_TO_SERVER.BLOCKED,
                    data: {
                        id: parseInt(rob.id)
                    }
                });

                gfxEventHandler({
                    type: EVENT_TO_GFX.OBJECT_FAILURE,
                    data: {
                        id: parseInt(rob.id),
                        row: r,
                        col: c
                    }
                });

                logger({
                    level: LOG_LEVEL.ERROR,
                    object: LOG_TYPE.ROBOT,
                    color: rob.color,
                    msg: "Robot <b>(#" + parseInt(rob.id) + ")</b> cannot move</b>."
                });

                aggregateBlocking(r, c);
            }
        }
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({
                text: "Robot ID is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.color().length === 0) {
            shouter.notifySubscribers({
                text: "Robot color is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.loadCap().length === 0) {
            shouter.notifySubscribers({
                text: "Robot load capacity is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0 || parseInt(self.loadCap()) < 0) {
            shouter.notifySubscribers({
                text: "Use only +ve values!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate ID check
        let pos = state.map.getObjectPos(parseInt(self.id()), MAP_CELL.ROBOT);

        if (pos !== undefined && (pos[0] !== self.activeRobotRow || pos[1] !== self.activeRobotCol)) {
            shouter.notifySubscribers({
                text: "Robot ID must be unique!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // HTML color
        if (!self.color().match(REG_HTML_COLOR)) {
            shouter.notifySubscribers({
                text: "Invalid color code!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.ip().length > 0 && !self.ip().match(REG_IP)) {
            shouter.notifySubscribers({
                text: "Invalid IP address!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.port().length > 0 && isNaN(self.port())) {
            shouter.notifySubscribers({
                text: "Invalid Port!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let unselect = function () {
        self.activeRobotRow = self.activeRobotCol = -1;
        self.editing(false);
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