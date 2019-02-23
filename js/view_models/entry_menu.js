require("../utils/constants");
let ko = require('knockout');

let entryViewModel = function (shouter, map) {
    let self = this;

    self.addEntry = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY || map.grid[row][col].type === MAP_CELL.ENTRY) {
            map.grid[row][col] = {
                type: MAP_CELL.ENTRY
            };

            shouter.notifySubscribers({text: "Entry placed successfully!", type: MSG_INFO}, SHOUT_MSG);
        } else {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        }
    };

    self.deleteEntry = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.ENTRY) {
            map.grid[row][col] = {
                type: MAP_CELL.EMPTY
            }
        }
    };

    self.moveEntry = function (srcRow, srcCol, dstRow, dstCol) {
        if (map.grid[dstRow][dstCol].type === MAP_CELL.EMPTY) {
            map.grid[dstRow][dstCol] = map.grid[srcRow][srcCol];
            map.grid[srcRow][srcCol] = {
                type: MAP_CELL.EMPTY
            }
        } else {
            shouter.notifySubscribers({text: "(" + dstRow + ", " + dstCol + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        }
    };
};

module.exports = entryViewModel;