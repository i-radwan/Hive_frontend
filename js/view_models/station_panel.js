require('../utils/constants');
require('../utils/strings');
const ko = require('knockout');

let stationPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.id = ko.observable(1);

    self.editing = ko.observable(false);
    self.activeStationRow = -1;
    self.activeStationCol = -1;

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
                type: MAP_CELL.STATION,
                id: id,
                color: GFX_COLORS_DEFAULT.STATION
            });

            let nextID = Math.max(state.nextIDs.station, id + 1);

            self.id(nextID);
            state.nextIDs.station = nextID;

            shouter.notifySubscribers({
                text: STR[1000](["Station"]),
                type: MSG_TYPE.INFO,
                volatile: true
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: {
                    type: MAP_CELL.STATION,
                    id: id,
                    row: row,
                    col: col,
                    color: GFX_COLORS_DEFAULT.STATION
                }
            });
        } else {
            shouter.notifySubscribers({
                text: STR[2000]([row + 1, col + 1]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (srcRow === dstRow && srcCol === dstCol)
            return;

        let fac = state.map.getSpecificFacility(srcRow, srcCol, MAP_CELL.STATION);

        if (state.map.isFree(dstRow, dstCol)) {
            state.map.moveObject(srcRow, srcCol, dstRow, dstCol, fac);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.STATION,
                    id: fac.id,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: dstRow,
                    dst_col: dstCol
                }
            });
        } else {
            shouter.notifySubscribers({
                text: STR[2000]([dstRow + 1, dstCol + 1]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.STATION,
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
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.STATION);

        state.map.deleteObject(row, col, fac);

        unselect();
        clear();

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DELETE,
            data: {
                type: MAP_CELL.STATION,
                id: fac.id,
                row: row,
                col: col
            }
        });

        return true;
    };

    self.fill = function (row, col) {
        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.STATION);

        if (fac === undefined)
            return;

        self.activeStationRow = row;
        self.activeStationCol = col;
        self.showable(true);

        self.id(fac.id);

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.STATION,
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
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        shouter.notifySubscribers({
            text: STR[1001](["Station"]),
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
                text: STR[2001](["Station ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({
                text: STR[2010](),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate ID check
        let pos = state.map.getObjectPos(parseInt(self.id()), MAP_CELL.STATION);

        if (pos !== undefined && (pos[0] !== self.activeStationRow || pos[1] !== self.activeStationCol)) {
            shouter.notifySubscribers({
                text: STR[2002](["Station ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let unselect = function () {
        self.activeStationRow = self.activeStationCol = -1;
        self.editing(false);
        self.showable(false);
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