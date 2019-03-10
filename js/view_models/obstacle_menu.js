require("../utils/constants");
let ko = require('knockout');

let obstacleViewModel = function (shouter, map, gfxEventHandler) {
    let self = this;

    self.addObstacle = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY || map.grid[row][col].type === MAP_CELL.OBSTACLE) {
            map.grid[row][col] = {
                type: MAP_CELL.OBSTACLE
            };

            shouter.notifySubscribers({text: "Obstacle placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_ADD,
                object: MAP_CELL.OBSTACLE,
                row: row,
                col: col
            });
        } else {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        }
    };

    self.moveObstacle = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.dragObstacle = function (srcRow, srcCol, dstRow, dstCol) {
        if (map.grid[dstRow][dstCol].type === MAP_CELL.EMPTY) {
            map.grid[dstRow][dstCol] = Object.assign({}, map.grid[srcRow][srcCol]);
            map.grid[srcRow][srcCol] = {
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
        if (map.grid[row][col].type === MAP_CELL.OBSTACLE) {
            map.grid[row][col] = {
                type: MAP_CELL.EMPTY
            };

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.OBSTACLE,
                row: row,
                col: col
            });
        }
    };
};

module.exports = obstacleViewModel;