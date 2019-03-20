require('../utils/constants');
require('knockout-mapping');
let ko = require('knockout');

let rackViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.capacity = ko.observable(RACK_CAP);

    self.items = ko.observableArray();
    self.itemID = ko.observable();
    self.itemQuantity = ko.observable();

    self.applyVisible = ko.observable(false);
    self.activeRackRow = -1;
    self.activeRackCol = -1;

    self.add = function (row, col) {
        if (state.map.grid[row][col].facility === undefined && self.activeRackRow === -1 && self.activeRackCol === -1) {
            if (!self.check()) {
                return;
            }

            state.map.grid[row][col].facility = {
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
        } else if (state.map.grid[row][col].facility !== undefined && self.activeRackRow === -1 && self.activeRackCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (state.map.grid[row][col].facility === undefined && self.activeRackRow !== -1 && self.activeRackCol !== -1) {
            gfxEventHandler({
                type: GFX_EVENT_TYPE.ESC
            });
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
        // TODO: rack to be moved with the robot carrying it :'D
        // state.map.grid[dstRow][dstCol].facility = state.map.grid[srcRow][srcCol].facility;
        // state.map.grid[srcRow][srcCol].facility = undefined;
    };

    self.dragRack = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].facility === undefined) {
            state.map.grid[dstRow][dstCol].facility = Object.assign({}, state.map.grid[srcRow][srcCol].facility);
            state.map.grid[srcRow][srcCol] = undefined;

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

    self.delete = function (row, col) {
        if (state.map.grid[row][col].facility.type === MAP_CELL.RACK) {
            state.map.grid[row][col].facility = undefined;

            gfxEventHandler({
                type: GFX_EVENT_TYPE.OBJECT_DELETE,
                object: MAP_CELL.RACK,
                row: row,
                col: col
            });

            self.unselect();

            return true;
        }

        return false;
    };

    self.fill = function (row, col) {
        let rack = state.map.grid[row][col].facility;

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

    self.edit = function (row, col) {
        self.fill(row, col);
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

    self.update = function () {
        if (!self.check()) {
            return false;
        }

        state.map.grid[self.activeRackRow][self.activeRackCol].facility = {
            type: MAP_CELL.RACK,
            capacity: parseInt(self.capacity()),
            items: ko.mapping.toJS(self.items())
        };

        shouter.notifySubscribers({text: "Rack updated successfully!", type: MSG_INFO}, SHOUT_MSG);

        self.unselect();

        gfxEventHandler({
            type: GFX_EVENT_TYPE.ESC
        });

        return true;
    };

    self.check = function () {
        if (self.items().length === 0) {
            shouter.notifySubscribers({text: "Rack must contain items!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        let load = 0;

        for (let i = 0; i < self.items().length; ++i) {
            let item = self.items()[i];

            if (!self.checkItem(parseInt(item.id()), parseInt(item.quantity()), 1))
                return false;

            load += parseInt(item.quantity()) * state.getItemWeight(parseInt(item.id()));
        }

        if (load > parseInt(self.capacity())) {
            shouter.notifySubscribers({text: "Rack load is " + load + " which exceeds the capacity!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };

    self.addItem = function () {
        if (!self.checkItem(parseInt(self.itemID()), parseInt(self.itemQuantity()), 0))
            return;

        self.items.push({
            id: ko.observable(parseInt(self.itemID())),
            quantity: ko.observable(parseInt(self.itemQuantity()))
        });

        console.log(state.map);
    };

    self.removeItem = function () {
        self.items.remove(this);
    };

    self.checkItem = function (id, quantity, count) {
        if (id.length === 0) {
            shouter.notifySubscribers({text: "Item ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (quantity.length === 0) {
            shouter.notifySubscribers({text: "Quantity is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (id < 0 || quantity < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        let cnt = 0;
        for (let i = 0; i < self.items().length; ++i) {
            if (parseInt(self.items()[i].id()) === id) {
                cnt++;
            }
        }

        if (cnt > count) {
            shouter.notifySubscribers({text: "Items IDs should be unique!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Check if item exists
        if (state.getItemWeight(id) === -1) {
            shouter.notifySubscribers({text: "Items IDs doesn't exist!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };

    self.unselect = function() {
        self.activeRackRow = self.activeRackCol = -1;
        self.applyVisible(false);
    };

    self.handleEsc = function () {
        self.unselect();
    };
};

module.exports = rackViewModel;