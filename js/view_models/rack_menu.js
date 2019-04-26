require('../utils/constants');
require('knockout-mapping');
let ko = require('knockout');

let rackViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.capacity = ko.observable(RACK_CAP);

    self.id = ko.observable(1);
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
                id: parseInt(self.id()),
                type: MAP_CELL.RACK,
                capacity: parseInt(self.capacity()),
                items: ko.mapping.toJS(self.items())
            };

            self.id(parseInt(self.id()) + 1);
            state.nextIDs.rack = Math.max(state.nextIDs.rack, parseInt(self.id()));

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

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].robot === undefined && state.map.grid[dstRow][dstCol].facility === undefined) {
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

            unselect();
            clear();

            return true;
        }

        return false;
    };

    self.fill = function (row, col) {
        let facility = state.map.grid[row][col].facility;

        if (facility === undefined || facility.type !== MAP_CELL.RACK)
            return;

        self.id(facility.id);
        self.capacity(facility.capacity);
        self.items(ko.mapping.fromJS(facility.items)());

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
            id: parseInt(self.id()),
            capacity: parseInt(self.capacity()),
            items: ko.mapping.toJS(self.items())
        };

        state.nextIDs.rack = Math.max(state.nextIDs.rack, parseInt(self.id()) + 1);

        shouter.notifySubscribers({text: "Rack updated successfully!", type: MSG_INFO}, SHOUT_MSG);

        unselect();
        clear();

        gfxEventHandler({
            type: GFX_EVENT_TYPE.ESC
        });

        return true;
    };

    self.check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({text: "Rack ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.items().length === 0) {
            shouter.notifySubscribers({text: "Rack must contain items!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicate ID check
        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j].facility;

                if (c !== undefined && c.type === MAP_CELL.RACK && c.id === parseInt(self.id()) &&
                    !(i === self.activeRackRow && j === self.activeRackCol)) {
                    shouter.notifySubscribers({text: "Rack ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                    return false;
                }
            }
        }

        // Rack load
        let load = 0;

        for (let i = 0; i < self.items().length; ++i) {
            let item = self.items()[i];

            if (!self.checkItem(parseInt(item.id()), parseInt(item.quantity()), 1))
                return false;

            load += parseInt(item.quantity()) * state.getItem(parseInt(item.id())).weight;
        }

        if (load > parseInt(self.capacity())) {
            shouter.notifySubscribers({
                text: "Rack load is " + load + " which exceeds the capacity!",
                type: MSG_ERROR
            }, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

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
        if (state.getItem(id) === undefined) {
            shouter.notifySubscribers({text: "Items IDs doesn't exist!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };

    /**
     * Fill the rack during simulation upon server request.
     *
     * @param rack_id
     * @param item_id
     * @param item_quantity
     */
    self.fillRack = function (rack_id, item_id, item_quantity) {
        for (let i = 0; i < state.map.height; ++i) {
            for (let j = 0; j < state.map.width; ++j) {
                let c = state.map.grid[i][j].facility;

                if (c !== undefined && c.type === MAP_CELL.RACK && c.id === rack_id) {
                    for (let k = 0; k < c.items; ++k) {
                        if (c.items[k].id === item_id) {
                            c.items[k].quantity += item_quantity;
                        }
                    }
                }
            }
        }

        // Inform the state
        state.adjustItemQuantity(item_id, item_quantity);
    };

    self.handleEsc = function () {
        unselect();
        clear();
    };

    let unselect = function () {
        self.activeRackRow = self.activeRackCol = -1;
        self.applyVisible(false);
    };

    let clear = function () {
        self.id(state.nextIDs.rack);
        self.capacity(RACK_CAP);
        self.items.removeAll();
        self.itemID("");
        self.itemQuantity("");
    };

    // Events
    shouter.subscribe(function () {
        unselect();
        clear();
    }, self, SHOUT_STATE_UPDATED);
};

module.exports = rackViewModel;