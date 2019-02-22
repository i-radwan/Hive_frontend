require("../utils/constants");
let ko = require('knockout');

let parkViewModel = function (shouter, map) {
    let self = this;

    self.addPark = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY || map.grid[row][col].type === MAP_CELL.PARK) {
            map.grid[row][col] = {
                type: MAP_CELL.PARK
            }
        } else {
            shouter.notifySubscribers("(" + row + ", " + col + ") is occupied!", SHOUT_ERROR);
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
            shouter.notifySubscribers("(" + dstRow + ", " + dstCol + ") is occupied!", SHOUT_ERROR);
        }
    };
};

module.exports = parkViewModel;