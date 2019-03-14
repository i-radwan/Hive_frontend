require("../utils/constants");
let ko = require('knockout');

let entryViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.activeEntryRow = -1;
    self.activeEntryCol = -1;

    self.addEntry = function (row, col) {
        if (state.map.grid[row][col].type === MAP_CELL.EMPTY && self.activeEntryRow === -1 && self.activeEntryCol === -1) {
            state.map.grid[row][col] = {
                type: MAP_CELL.ENTRY
            };

            shouter.notifySubscribers({text: "Entry placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_ADD,
                object: MAP_CELL.ENTRY,
                row: row,
                col: col
            });
        } else if (state.map.grid[row][col].type !== MAP_CELL.EMPTY && self.activeEntryRow === -1 && self.activeEntryCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (state.map.grid[row][col].type === MAP_CELL.EMPTY && self.activeEntryRow !== -1 && self.activeEntryCol !== -1) {
            gfxEventHandler({
                type: GFX_EVENT_TYPE.ESC
            });
        }
    };

    self.moveEntry = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.dragEntry = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].type === MAP_CELL.EMPTY) {
            state.map.grid[dstRow][dstCol] = Object.assign({}, state.map.grid[srcRow][srcCol]);
            state.map.grid[srcRow][srcCol] = {
                type: MAP_CELL.EMPTY
            };

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DRAG,
                object: MAP_CELL.ENTRY,
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
                object: MAP_CELL.ENTRY,
                src_row: srcRow,
                src_col: srcCol,
                dst_row: srcRow,
                dst_col: srcCol
            });
        }
    };

    self.deleteEntry = function (row, col) {
        if (state.map.grid[row][col].type === MAP_CELL.ENTRY) {
            state.map.grid[row][col] = {
                type: MAP_CELL.EMPTY
            };

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.ENTRY,
                row: row,
                col: col
            });

            self.clearSelection();

            return true;
        }

        return false;
    };

    self.fillFields = function (row, col) {
        let entry = state.map.grid[row][col];

        if (entry.type !== MAP_CELL.ENTRY)
            return;

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.ENTRY,
            row: row,
            col: col
        });
    };

    self.editEntry = function (row, col) {
        self.fillFields(row, col);
        self.activeEntryRow = row;
        self.activeEntryCol = col;

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.ENTRY,
            row: row,
            col: col
        });
    };

    self.updateEntry = function () {
    };

    self.checkValid = function () {
    };

    self.clearSelection = function () {
        self.activeEntryRow = self.activeEntryCol = -1;
    };

    self.handleEsc = function () {
        self.clearSelection();
    };
};

module.exports = entryViewModel;