require("../utils/constants");
require('knockout-mapping');
let ko = require('knockout');

let rackViewModel = function (shouter, map, gfxEventHandler) {
    let self = this;

    self.capacity = ko.observable(RACK_CAP);

    self.items = ko.observableArray();
    self.itemID = ko.observable();
    self.itemQuantity = ko.observable();

    self.applyVisible = ko.observable(false);
    self.activeRackRow = -1;
    self.activeRackCol = -1;

    self.addItem = function () {
        if (!self.checkValidItem(self.itemID(), self.itemQuantity(), 0))
            return;

        self.items.push({
            id: ko.observable(parseInt(self.itemID())),
            quantity: ko.observable(parseInt(self.itemQuantity()))
        });

        console.log(map);
    };

    self.removeItem = function () {
        self.items.remove(this);
    };

    self.addRack = function (row, col) {
        if (map.grid[row][col].type === MAP_CELL.EMPTY && self.activeRackRow === -1 && self.activeRackCol === -1) {
            if (!self.checkValidRack()) {
                return;
            }

            map.grid[row][col] = {
                type: MAP_CELL.RACK,
                capacity: parseInt(self.capacity()),
                items: ko.mapping.toJS(self.items())
            };

            shouter.notifySubscribers({text: "Rack placed successfully!", type: MSG_INFO}, SHOUT_MSG);

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_ADD,
                object: MAP_CELL.RACK,
                row: row,
                col: col,
                capacity: parseInt(self.capacity()),
                items: ko.mapping.toJS(self.items())
            });
        } else if (map.grid[row][col].type !== MAP_CELL.EMPTY && self.activeRackRow === -1 && self.activeRackCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (map.grid[row][col].type === MAP_CELL.EMPTY && self.activeRackRow !== -1 && self.activeRackCol !== -1) {
            gfxEventHandler({
                type: GFX_EVENT_TYPE.ESC
            });
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

            self.clearSelection();

            return true;
        }

        return false;
    };

    self.fillFields = function (row, col) {
        let rack = map.grid[row][col];

        if (rack.type !== MAP_CELL.RACK)
            return;

        self.capacity(rack.capacity);
        self.items(ko.mapping.fromJS(rack.items)());

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.RACK,
            row: row,
            col: col
        });
    };

    self.editRack = function (row, col) {
        self.fillFields(row, col);
        self.applyVisible(true);
        self.activeRackRow = row;
        self.activeRackCol = col;

        gfxEventHandler({
            type: GFX_EVENT_TYPE.OBJECT_HIGHLIGHT,
            object: MAP_CELL.RACK,
            row: row,
            col: col
        });
    };

    self.updateRack = function () {
        if (!self.checkValidRack()) {
            return;
        }

        map.grid[self.activeRackRow][self.activeRackCol] = {
            type: MAP_CELL.RACK,
            capacity: parseInt(self.capacity()),
            items: ko.mapping.toJS(self.items())
        };

        shouter.notifySubscribers({text: "Rack updated successfully!", type: MSG_INFO}, SHOUT_MSG);

        self.clearSelection();

        gfxEventHandler({
            type: GFX_EVENT_TYPE.ESC
        });
    };

    self.checkValidRack = function () {
        if (self.items().length === 0) {
            shouter.notifySubscribers({text: "Rack must contain items!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        for (let i = 0; i < self.items().length; ++i) {
            let item = self.items()[i];

            if (!self.checkValidItem(item.id(), item.quantity(), 1))
                return false;

            // TODO: check for capacity and items existence
        }

        return true;
    };

    self.checkValidItem = function (id, quantity, count) {
        if (id.length === 0) {
            shouter.notifySubscribers({text: "Item ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (quantity.length === 0) {
            shouter.notifySubscribers({text: "Quantity is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(id) < 0 || parseInt(quantity) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        let cnt = 0;
        for (let i = 0; i < self.items().length; ++i) {
            if (parseInt(self.items()[i].id()) === parseInt(id)) {
                cnt++;
            }
        }

        if (cnt > count) {
            shouter.notifySubscribers({text: "Items IDs should be unique!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };

    self.clearSelection = function() {
        self.activeRackRow = self.activeRackCol = -1;
        self.applyVisible(false);
    };

    self.handleEsc = function () {
        self.clearSelection();
    };
};

module.exports = rackViewModel;