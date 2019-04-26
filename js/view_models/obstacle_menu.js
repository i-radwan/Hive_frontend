require('../utils/constants');
let ko = require('knockout');

let obstacleViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.id = ko.observable(1);

    self.applyVisible = ko.observable(false);
    self.activeObstacleRow = -1;
    self.activeObstacleCol = -1;

    self.add = function (row, col) {
        if (state.map.grid[row][col].facility === undefined && self.activeObstacleRow === -1 && self.activeObstacleCol === -1) {
            if (!self.check()) {
                return;
            }

            state.map.grid[row][col].facility = {
                id: parseInt(self.id()),
                type: MAP_CELL.OBSTACLE
            };

            self.id(parseInt(self.id()) + 1);

            shouter.notifySubscribers({text: "Obstacle placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_ADD,
                object: MAP_CELL.OBSTACLE,
                row: row,
                col: col
            });
        } else if (state.map.grid[row][col].facility !== undefined && self.activeObstacleRow === -1 && self.activeObstacleCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (state.map.grid[row][col].facility === undefined && self.activeObstacleRow !== -1 && self.activeObstacleCol !== -1) {
            gfxEventHandler({
                type: GFX_EVENT_TYPE.ESC
            });
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].robot === undefined && state.map.grid[dstRow][dstCol].facility === undefined) {
            state.map.grid[dstRow][dstCol] = Object.assign({}, state.map.grid[srcRow][srcCol]);
            state.map.grid[srcRow][srcCol] = undefined;

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

    self.delete = function (row, col) {
        if (state.map.grid[row][col].facility.type === MAP_CELL.OBSTACLE) {
            state.map.grid[row][col].facility = undefined;

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.OBSTACLE,
                row: row,
                col: col
            });

            self.unselect();

            return true;
        }

        return false;
    };

    self.fill = function (row, col) {
        let facility = state.map.grid[row][col].facility;

        if (facility === undefined || facility.type !== MAP_CELL.OBSTACLE)
            return;

        self.id(facility.id);

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.OBSTACLE,
            row: row,
            col: col
        });
    };

    self.edit = function (row, col) {
        self.fill(row, col);
        self.applyVisible(true);
        self.activeObstacleRow = row;
        self.activeObstacleCol = col;

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.OBSTACLE,
            row: row,
            col: col
        });
    };

    self.update = function () {
        if (!self.check())
            return false;

        state.map.grid[self.activeObstacleRow][self.activeObstacleCol].facility = {
            type: MAP_CELL.OBSTACLE,
            id: parseInt(self.id())
        };

        shouter.notifySubscribers({text: "Obstacle updated successfully!", type: MSG_INFO}, SHOUT_MSG);

        self.unselect();

        gfxEventHandler({
            type: GFX_EVENT_TYPE.ESC
        });

        return true;
    };

    self.check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({text: "Obstacle ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicate ID check
        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j].facility;

                if (c !== undefined && c.type === MAP_CELL.OBSTACLE && c.id === parseInt(self.id()) &&
                    !(i === self.activeObstacleRow && j === self.activeObstacleCol)) {
                    shouter.notifySubscribers({text: "Obstacle ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                    return false;
                }
            }
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };

    self.unselect = function () {
        self.activeObstacleRow = self.activeObstacleCol = -1;
        self.applyVisible(false);
    };

    self.handleEsc = function () {
        self.unselect();
    };
};

module.exports = obstacleViewModel;