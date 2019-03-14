require('../utils/constants');
let ko = require('knockout');

let gateViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.activeGateRow = -1;
    self.activeGateCol = -1;

    self.add = function (row, col) {
        if (state.map.grid[row][col].facility === undefined && self.activeGateRow === -1 && self.activeGateCol === -1) {
            state.map.grid[row][col].facility = {
                type: MAP_CELL.GATE
            };

            shouter.notifySubscribers({text: "Gate placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_ADD,
                object: MAP_CELL.GATE,
                row: row,
                col: col
            });
        } else if (state.map.grid[row][col].facility !== undefined && self.activeGateRow === -1 && self.activeGateCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (state.map.grid[row][col].facility === undefined && self.activeGateRow !== -1 && self.activeGateCol !== -1) {
            gfxEventHandler({
                type: GFX_EVENT_TYPE.ESC
            });
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].facility === undefined) {
            state.map.grid[dstRow][dstCol].facility = Object.assign({}, state.map.grid[srcRow][srcCol].facility);
            state.map.grid[srcRow][srcCol].facility = undefined;

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DRAG,
                object: MAP_CELL.GATE,
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
                object: MAP_CELL.GATE,
                src_row: srcRow,
                src_col: srcCol,
                dst_row: srcRow,
                dst_col: srcCol
            });
        }
    };

    self.delete = function (row, col) {
        if (state.map.grid[row][col].facility.type === MAP_CELL.GATE) {
            state.map.grid[row][col].facility = undefined;

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.GATE,
                row: row,
                col: col
            });

            self.unselect();

            return true;
        }

        return false;
    };

    self.fill = function (row, col) {
        let gate = state.map.grid[row][col].facility;

        if (gate.type !== MAP_CELL.GATE)
            return;

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.GATE,
            row: row,
            col: col
        });
    };

    self.edit = function (row, col) {
        self.fill(row, col);
        self.activeGateRow = row;
        self.activeGateCol = col;

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.GATE,
            row: row,
            col: col
        });
    };

    self.update = function () {
        if (!check())
            return false;

        return true;
    };

    self.check = function () {
        return true;
    };

    self.unselect = function () {
        self.activeGateRow = self.activeGateCol = -1;
    };

    self.handleEsc = function () {
        self.unselect();
    };
};

module.exports = gateViewModel;