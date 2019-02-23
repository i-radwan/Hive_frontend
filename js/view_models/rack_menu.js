require("../utils/constants");
let ko = require('knockout');

let rackViewModel = function (shouter, map) {
    let self = this;

    self.itemNumber = ko.observable(1);
    self.quantity = ko.observable(10);
    self.itemWeight = ko.observable(1);

    self.addRack = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY) {
            map.grid[row][col] = {
                type: MAP_CELL.RACK,
                item_number: self.itemNumber(),
                quantity: self.quantity(),
                item_weight: self.itemWeight()
            };

            shouter.notifySubscribers({text: "Rack placed successfully!", type: MSG_INFO}, SHOUT_MSG);
        } else {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        }
    };

    self.deleteRack = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.RACK) {
            map.grid[row][col] = {
                type: MAP_CELL.EMPTY
            }
        }
    };

    self.moveRack = function (srcRow, srcCol, dstRow, dstCol) {
        if (map.grid[dstRow][dstCol].type === MAP_CELL.EMPTY) {
            map.grid[dstRow][dstCol] = map.grid[srcRow][srcCol];
            map.grid[srcRow][srcCol] = {
                type: MAP_CELL.EMPTY
            }
        } else {
            shouter.notifySubscribers({
                text: "(" + dstRow + ", " + dstCol + ") is occupied!",
                type: MSG_ERROR
            }, SHOUT_MSG);
        }
    };

    self.fillFields = function (row, col) {
        let rack = map.grid[row][col];

        if (rack.type !== MAP_CELL.RACK)
            return;

        self.itemNumber(rack.item_number);
        self.quantity(rack.quantity);
        self.itemWeight(rack.item_weight);
    };
};

module.exports = rackViewModel;