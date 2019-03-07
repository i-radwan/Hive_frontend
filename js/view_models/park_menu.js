require("../utils/constants");
let ko = require('knockout');

let parkViewModel = function (shouter, map) {
    let self = this;

    self.addPark = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY || map.grid[row][col].type === MAP_CELL.PARK) {
            map.grid[row][col] = {
                type: MAP_CELL.PARK
            };

            shouter.notifySubscribers({text: "Park placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            return {
                type: EVENT_TYPE.ADD_OBJECT,
                object: MAP_CELL.PARK,
                row: row,
                col: col
            };
        } else {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        }
    };

    self.deletePark = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.PARK) {
            map.grid[row][col] = {
                type: MAP_CELL.EMPTY
            }
        }
    };

    self.movePark = function (srcRow, srcCol, dstRow, dstCol) {
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

module.exports = parkViewModel;