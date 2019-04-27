require('../utils/constants');
let ko = require('knockout');

let stationViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.id = ko.observable(1);

    self.applyVisible = ko.observable(false);
    self.activeStationRow = -1;
    self.activeStationCol = -1;

    self.add = function (row, col) {
        if (state.map.grid[row][col].facility === undefined && self.activeStationRow === -1 && self.activeStationCol === -1) {
            if (!check()) {
                return;
            }

            state.map.grid[row][col].facility = {
                id: parseInt(self.id()),
                type: MAP_CELL.STATION
            };

            self.id(parseInt(self.id()) + 1);
            state.nextIDs.station = Math.max(state.nextIDs.station, parseInt(self.id()));

            shouter.notifySubscribers({text: "Station placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_ADD,
                object: MAP_CELL.STATION,
                row: row,
                col: col
            });
        } else if (state.map.grid[row][col].facility !== undefined && self.activeStationRow === -1 && self.activeStationCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (state.map.grid[row][col].facility === undefined && self.activeStationRow !== -1 && self.activeStationCol !== -1) {
            gfxEventHandler({
                type: GFX_EVENT_TYPE.ESC
            });
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].robot === undefined && state.map.grid[dstRow][dstCol].facility === undefined) {
            state.map.grid[dstRow][dstCol].facility = Object.assign({}, state.map.grid[srcRow][srcCol].facility);
            state.map.grid[srcRow][srcCol].facility = undefined;

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DRAG,
                object: MAP_CELL.STATION,
                src_row: srcRow,
                src_col: srcCol,
                dst_row: dstRow,
                dst_col: dstCol
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + dstRow + ", " + dstCol + ") is occupied!",
                type: MSG_ERROR
            }, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DRAG,
                object: MAP_CELL.STATION,
                src_row: srcRow,
                src_col: srcCol,
                dst_row: srcRow,
                dst_col: srcCol
            });
        }
    };

    self.delete = function (row, col) {
        if (state.map.grid[row][col].facility.type === MAP_CELL.STATION) {
            state.map.grid[row][col].facility = undefined;

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.STATION,
                row: row,
                col: col
            });

            unselect();
            clear();

            return true;
        }

        return false;
    };

    self.fill = function (row, col) {
        let facility = state.map.grid[row][col].facility;

        if (facility === undefined || facility.type !== MAP_CELL.STATION)
            return;

        self.id(facility.id);

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.STATION,
            row: row,
            col: col
        });
    };

    self.edit = function (row, col) {
        self.fill(row, col);
        self.applyVisible(true);
        self.activeStationRow = row;
        self.activeStationCol = col;

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.STATION,
            row: row,
            col: col
        });
    };

    self.update = function () {
        if (!check())
            return false;

        state.map.grid[self.activeStationRow][self.activeStationCol].facility = {
            type: MAP_CELL.STATION,
            id: parseInt(self.id())
        };

        state.nextIDs.station = Math.max(state.nextIDs.station, parseInt(self.id()) + 1);

        shouter.notifySubscribers({text: "Station updated successfully!", type: MSG_INFO}, SHOUT_MSG);

        unselect();
        clear();

        gfxEventHandler({
            type: GFX_EVENT_TYPE.ESC
        });

        return true;
    };

    self.handleEsc = function () {
        unselect();
        clear();
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({text: "Station ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicate ID check
        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j].facility;

                if (c !== undefined && c.type === MAP_CELL.STATION && c.id === parseInt(self.id()) &&
                    !(i === self.activeStationRow && j === self.activeStationCol)) {
                    shouter.notifySubscribers({text: "Station ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                    return false;
                }
            }
        }

        return true;
    };

    let unselect = function () {
        self.activeStationRow = self.activeStationCol = -1;
        self.applyVisible(false);
    };

    let clear = function() {
        self.id(state.nextIDs.station);
    };

    // Events
    shouter.subscribe(function () {
        unselect();
        clear();
    }, self, SHOUT_STATE_UPDATED);
};

module.exports = stationViewModel;