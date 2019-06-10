require('../utils/constants');
let ko = require('knockout');

let stationPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.id = ko.observable(1);

    self.editing = ko.observable(false);
    self.activeStationRow = -1;
    self.activeStationCol = -1;

    self.add = function (row, col) {
        let isFacilityFree = state.map.isFacilityFree(row, col);

        if (self.editing()) {
            if (isFacilityFree) {
                gfxEventHandler({ // ToDo call controllers handle escape functions
                    type: EVENT_TO_GFX.ESC
                });
            }

            return;
        }

        if (isFacilityFree) {
            if (!check()) {
                return;
            }

            state.map.addObject(row, col, {
                type: MAP_CELL.STATION,
                id: parseInt(self.id())
            });

            self.id(Math.max(state.nextIDs.station, parseInt(self.id()) + 1));
            state.nextIDs.station = parseInt(self.id());

            shouter.notifySubscribers({
                text: "Station placed successfully!",
                type: MSG_TYPE.INFO
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: {
                    type: MAP_CELL.STATION,
                    row: row,
                    col: col
                }
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + row + ", " + col + ") is occupied!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.isFree(dstRow, dstCol)) {
            let fac = state.map.getSpecificFacility(srcRow, srcCol, MAP_CELL.STATION);

            state.map.moveObject(srcRow, srcCol, dstRow, dstCol, fac);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.STATION,
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
                    type: MAP_CELL.STATION,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: srcRow,
                    dst_col: srcCol
                }
            });
        }
    };

    self.delete = function (row, col) {
        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.STATION);

        state.map.deleteObject(row, col, fac);

        unselect();
        clear();

        return true;
    };

    self.fill = function (row, col) {
        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.STATION);

        if (fac === null)
            return;

        self.activeStationRow = row;
        self.activeStationCol = col;

        self.id(fac.id);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.STATION,
                row: row,
                col: col
            }
        });
    };

    self.edit = function (row, col) {
        self.fill(row, col);
        self.editing(true);
        self.activeStationRow = row;
        self.activeStationCol = col;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.STATION,
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

        let fac = state.map.getSpecificFacility(self.activeStationRow, self.activeStationCol, MAP_CELL.STATION);

        state.map.updateObject(self.activeStationRow, self.activeStationCol, {
            type: MAP_CELL.STATION,
            id: parseInt(self.id())
        }, fac.id);

        state.nextIDs.station = Math.max(state.nextIDs.station, parseInt(self.id()) + 1);

        shouter.notifySubscribers({
            text: "Station updated successfully!",
            type: MSG_TYPE.INFO
        }, SHOUT.MSG);

        unselect();
        clear();

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            data: {
                type: MAP_CELL.STATION
            }
        });
    };

    self.handleEsc = function () {
        unselect();
        clear();
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({
                text: "Station ID is mandatory!",
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
        let pos = state.map.getObjectPos(parseInt(self.id()), MAP_CELL.STATION);

        if (pos !== undefined && (pos[0] !== self.activeStationRow || pos[1] !== self.activeStationCol)) {
            shouter.notifySubscribers({
                text: "Station ID must be unique!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let unselect = function () {
        self.activeStationRow = self.activeStationCol = -1;
        self.editing(false);
    };

    let clear = function () {
        self.id(state.nextIDs.station);
    };

    // Events
    shouter.subscribe(function () {
        unselect();
        clear();
    }, self, SHOUT.STATE_UPDATED);
};

module.exports = stationPanelViewModel;