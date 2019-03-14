require("../utils/constants");
let ko = require('knockout');

let obstacleViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.activeObstacleCol = -1;
    self.activeObstacleCol = -1;

    self.addObstacle = function (row, col) {
        if (state.map.grid[row][col].type === MAP_CELL.EMPTY && self.activeObstacleRow === -1 && self.activeObstacleCol === -1) {
            state.map.grid[row][col] = {
                type: MAP_CELL.OBSTACLE
            };

            shouter.notifySubscribers({text: "Obstacle placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_ADD,
                object: MAP_CELL.OBSTACLE,
                row: row,
                col: col
            });
        } else if (state.map.grid[row][col].type !== MAP_CELL.EMPTY && self.activeObstacleRow === -1 && self.activeObstacleCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (state.map.grid[row][col].type === MAP_CELL.EMPTY && self.activeObstacleRow !== -1 && self.activeObstacleCol !== -1) {
            gfxEventHandler({
                type: GFX_EVENT_TYPE.ESC
            });
        }
    };

    self.moveObstacle = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.dragObstacle = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].type === MAP_CELL.EMPTY) {
            state.map.grid[dstRow][dstCol] = Object.assign({}, state.map.grid[srcRow][srcCol]);
            state.map.grid[srcRow][srcCol] = {
                type: MAP_CELL.EMPTY
            };

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DRAG,
                object: MAP_CELL.OBSTACLE,
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
                object: MAP_CELL.OBSTACLE,
                src_row: srcRow,
                src_col: srcCol,
                dst_row: srcRow,
                dst_col: srcCol
            });
        }
    };

    self.deleteObstacle = function (row, col) {
        if (state.map.grid[row][col].type === MAP_CELL.OBSTACLE) {
            state.map.grid[row][col] = {
                type: MAP_CELL.EMPTY
            };

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.OBSTACLE,
                row: row,
                col: col
            });

            self.clearSelection();

            return true;
        }

        return false;
    };

    self.fillFields = function (row, col) {
        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.OBSTACLE,
            row: row,
            col: col
        });
    };

    self.editObstacle = function (row, col) {
        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.OBSTACLE,
            row: row,
            col: col
        });
    };

    self.updateObstacle = function () {
        return true;
    };

    self.checkValid = function () {
    };

    self.clearSelection = function () {
        self.activeObstacleRow = self.activeObstacleCol = -1;
    };

    self.handleEsc = function () {
        self.clearSelection();
    };
};

module.exports = obstacleViewModel;