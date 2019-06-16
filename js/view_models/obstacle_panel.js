require('../utils/constants');
let ko = require('knockout');

let obstaclePanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.id = ko.observable(1);

    self.editing = ko.observable(false);
    self.activeObstacleRow = -1;
    self.activeObstacleCol = -1;

    self.showable = ko.observable(true); // In simulation mode, when robot is clicked
    self.active = ko.computed(function () {
        return self.showable() || runningMode() === RUNNING_MODE.DESIGN;
    });

    self.add = function (row, col) {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        let isFacilityFree = state.map.isFacilityFree(row, col);

        if (self.editing()) {
            if (isFacilityFree) {
                shouter.notifySubscribers({}, SHOUT.ESC);
            }

            return;
        }

        if (isFacilityFree) {
            if (!check()) {
                return;
            }

            let id = parseInt(self.id());

            state.map.addObject(row, col, {
                type: MAP_CELL.OBSTACLE,
                id: id,
                color: GFX_SVG_DEFAULT_COLOR.OBSTACLE
            });

            let nextID = Math.max(state.nextIDs.obstacle, id + 1);

            self.id(nextID);
            state.nextIDs.obstacle = nextID;

            shouter.notifySubscribers({
                text: "Obstacle placed successfully!",
                type: MSG_TYPE.INFO,
                volatile: true
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: {
                    type: MAP_CELL.OBSTACLE,
                    id: id,
                    row: row,
                    col: col,
                    color: GFX_SVG_DEFAULT_COLOR.OBSTACLE
                }
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + (row + 1) + ", " + (col + 1) + ") is occupied!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (srcRow === dstRow && srcCol === dstCol)
            return;

        let fac = state.map.getSpecificFacility(srcRow, srcCol, MAP_CELL.OBSTACLE);

        if (state.map.isFree(dstRow, dstCol)) {
            state.map.moveObject(srcRow, srcCol, dstRow, dstCol, fac);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.OBSTACLE,
                    id: fac.id,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: dstRow,
                    dst_col: dstCol
                }
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + (dstRow + 1) + ", " + (dstCol + 1) + ") is occupied!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.OBSTACLE,
                    id: fac.id,
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
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.OBSTACLE);

        state.map.deleteObject(row, col, fac);

        unselect();
        clear();

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DELETE,
            data: {
                type: MAP_CELL.OBSTACLE,
                id: fac.id,
                row: row,
                col: col
            }
        });

        return true;
    };

    self.fill = function (row, col) {
        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.OBSTACLE);

        if (fac === undefined)
            return;

        self.activeObstacleRow = row;
        self.activeObstacleCol = col;
        self.showable(true);

        self.id(fac.id);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.OBSTACLE,
                id: fac.id,
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
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        shouter.notifySubscribers({
            text: "Obstacle updated successfully!",
            type: MSG_TYPE.INFO,
            volatile: true
        }, SHOUT.MSG);
    };

    self.handleEsc = function () {
        unselect();
        clear();
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({
                text: "Obstacle ID is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({
                text: "Use only +ve values!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate ID check
        let pos = state.map.getObjectPos(parseInt(self.id()), MAP_CELL.OBSTACLE);

        if (pos !== undefined && (pos[0] !== self.activeObstacleRow || pos[1] !== self.activeObstacleCol)) {
            shouter.notifySubscribers({
                text: "Obstacle ID must be unique!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let unselect = function () {
        self.activeObstacleRow = self.activeObstacleCol = -1;
        self.editing(false);
        self.showable(false);
    };

    let clear = function () {
        self.id(state.nextIDs.obstacle);
    };

    // Events
    shouter.subscribe(function () {
        unselect();
        clear();
    }, self, SHOUT.STATE_UPDATED);
};

module.exports = obstaclePanelViewModel;