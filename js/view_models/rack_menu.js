require("../utils/constants");
let ko = require('knockout');

let rackViewModel = function (shouter, map, gfxEventHandler) {
    let self = this;

    self.itemNumber = ko.observable(1);
    self.quantity = ko.observable(10);
    self.itemWeight = ko.observable(1);

    self.applyVisible = ko.observable(false);
    self.activeRackRow = -1;
    self.activeRackCol = -1;

    self.addRack = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY && self.activeRackRow === -1 && self.activeRackCol === -1) {
            if (!self.checkValid()) {
                return;
            }

            map.grid[row][col] = {
                type: MAP_CELL.RACK,
                item_number: parseInt(self.itemNumber()),
                quantity: parseInt(self.quantity()),
                item_weight: parseFloat(self.itemWeight())
            };

            shouter.notifySubscribers({text: "Rack placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_ADD,
                object: MAP_CELL.RACK,
                row: row,
                col: col,
                item_number: parseInt(self.itemNumber()),
                quantity: parseInt(self.quantity()),
                item_weight: parseFloat(self.itemWeight())
            });
        } else if (map.grid[row][col].type === MAP_CELL.EMPTY) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        }
    };

    self.moveRack = function (srcRow, srcCol, dstRow, dstCol) {
        // TODO: rack to be moved with the robot carrying it :'D
        // map.grid[dstRow][dstCol] = map.grid[srcRow][srcCol];
        // map.grid[srcRow][srcCol] = {
        //     type: MAP_CELL.EMPTY
        // };
    };

    self.dragRack = function (srcRow, srcCol, dstRow, dstCol) {
        if (map.grid[dstRow][dstCol].type === MAP_CELL.EMPTY) {
            map.grid[dstRow][dstCol] = Object.assign({}, map.grid[srcRow][srcCol]);
            map.grid[srcRow][srcCol] = {
                type: MAP_CELL.EMPTY
            };

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DRAG,
                object: MAP_CELL.RACK,
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
                object: MAP_CELL.RACK,
                src_row: srcRow,
                src_col: srcCol,
                dst_row: srcRow,
                dst_col: srcCol
            });
        }
    };

    self.deleteRack = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.RACK) {
            map.grid[row][col] = {
                type: MAP_CELL.EMPTY
            };

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.RACK,
                row: row,
                col: col
            });
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

    self.editRack = function (row, col) {
        self.fillFields(row, col);
        self.applyVisible(true);
        self.activeRackRow = row;
        self.activeRackCol = col;
    };

    self.updateRack = function () {
        if (!self.checkValid()) {
            return;
        }

        map.grid[self.activeRackRow][self.activeRackCol] = {
            type: MAP_CELL.RACK,
            item_number: parseInt(self.itemNumber()),
            quantity: parseInt(self.quantity()),
            item_weight: parseFloat(self.itemWeight())
        };

        shouter.notifySubscribers({text: "Rack updated successfully!", type: MSG_INFO}, SHOUT_MSG);

        self.activeRackRow = self.activeRackCol = -1;
        self.applyVisible(false);
    };

    self.checkValid = function () {
        if (self.itemNumber().length === 0) {
            shouter.notifySubscribers({text: "Item number is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.quantity().length === 0) {
            shouter.notifySubscribers({text: "Quantity is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.itemWeight().length === 0) {
            shouter.notifySubscribers({text: "Item weight is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.itemNumber()) < 0 || parseInt(self.quantity()) < 0 || parseInt(self.itemWeight()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };
};

module.exports = rackViewModel;