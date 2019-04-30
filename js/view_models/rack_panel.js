require('../utils/constants');
require('knockout-mapping');
let $ = require('jquery');
let ko = require('knockout');

let rackPanelViewModel = function (shouter, state, gfxEventHandler, logger) {
    let self = this;

    self.capacity = ko.observable(RACK_CAP);

    self.id = ko.observable(1);
    self.items = ko.observableArray();
    self.itemID = ko.observable("");
    self.itemQuantity = ko.observable("");

    self.applyVisible = ko.observable(false);
    self.activeRackRow = -1;
    self.activeRackCol = -1;

    self.add = function (row, col) {
        if (state.map.grid[row][col].facility === undefined && self.activeRackRow === -1 && self.activeRackCol === -1) {
            if (!check()) {
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
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: {
                    type: MAP_CELL.RACK,
                    row: row,
                    col: col,
                    capacity: parseInt(self.capacity()),
                    items: ko.mapping.toJS(self.items())
                }
            });
        } else if (state.map.grid[row][col].facility !== undefined && self.activeRackRow === -1 && self.activeRackCol === -1) {
            shouter.notifySubscribers({text: "(" + row + ", " + col + ") is occupied!", type: MSG_ERROR}, SHOUT_MSG);
        } else if (state.map.grid[row][col].facility === undefined && self.activeRackRow !== -1 && self.activeRackCol !== -1) {
            gfxEventHandler({
                type: EVENT_TO_GFX.ESC
            });
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (state.map.grid[dstRow][dstCol].robot === undefined && state.map.grid[dstRow][dstCol].facility === undefined) {
            state.map.grid[dstRow][dstCol].facility = Object.assign({}, state.map.grid[srcRow][srcCol].facility);
            state.map.grid[srcRow][srcCol] = undefined;

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.RACK,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: dstRow,
                    dst_col: dstCol
                }
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + dstRow + ", " + dstCol + ") is occupied!",
                type: MSG_ERROR
            }, SHOUT_MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.RACK,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: srcRow,
                    dst_col: srcCol
                }
            });
        }
    };

    self.delete = function (row, col) {
        if (state.map.grid[row][col].facility.type === MAP_CELL.RACK) {
            state.map.grid[row][col].facility = undefined;

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DELETE,
                data: {
                    type: MAP_CELL.RACK,
                    row: row,
                    col: col
                }
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
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.RACK,
                row: row,
                col: col
            }
        });
    };

    self.edit = function (row, col) {
        self.fill(row, col);
        self.applyVisible(true);
        self.activeRackRow = row;
        self.activeRackCol = col;

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.RACK,
                row: row,
                col: col
            }
        });
    };

    self.update = function () {
        if (!check()) {
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
            type: EVENT_TO_GFX.ESC
        });

        return true;
    };

    self.addItem = function () {
        if (!checkItem(self.itemID(), self.itemQuantity(), 0))
            return;

        self.items.push({
            id: parseInt(self.itemID()),
            quantity: parseInt(self.itemQuantity())
        });

        console.log(state.map);

        // Scroll view to bottom
        let container = $(".lpanel .rack .items-container");
        container.animate({scrollTop: container[0].scrollHeight}, 250);
    };

    self.removeItem = function () {
        self.items.remove(this);
    };

    self.adjustRack = function (rack_id, rack_row, rack_col, item_id, item_quantity) {
        let cell = state.map.grid[rack_row][rack_col];

        if (cell.facility === undefined || cell.facility.type !== MAP_CELL.RACK) {
            throw "Error: there should be a rack here!";
        }

        let items = cell.facility.items;

        for (let j = 0; j < items.length; ++j) {
            if (items[j].id === item_id) {
                items[j].quantity += item_quantity;

                // Inform the state
                state.adjustItemQuantity(item_id, item_quantity);
            }
        }

        logger({
            level: LOG_LEVEL_INFO,
            object: LOG_OBJECT_RACK,
            color: "#bababa",
            msg: "Rack <b>(#" + rack_id + ")</b> has been filled by (" + item_quantity + ") from Item#<b>(" + item_id + ")</b>."
        });

        // ToDo: check if this works
        self.items(ko.mapping.fromJS(cell.facility.items)());
        self.items.valueHasMutated();
    };

    self.handleEsc = function () {
        unselect();
        clear();
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({text: "Rack ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.items().length === 0) {
            shouter.notifySubscribers({text: "Rack must contain items!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

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

            if (!checkItem(parseInt(item.id), parseInt(item.quantity), 1))
                return false;

            load += parseInt(item.quantity) * state.getItem(parseInt(item.id)).weight;
        }

        if (load > parseInt(self.capacity())) {
            shouter.notifySubscribers({
                text: "Rack load is " + load + " which exceeds the capacity!",
                type: MSG_ERROR
            }, SHOUT_MSG);

            return false;
        }

        return true;
    };

    let checkItem = function (id, quantity, count) {
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
            if (parseInt(self.items()[i].id) === id) {
                cnt++;
            }
        }

        if (cnt > count) {
            shouter.notifySubscribers({text: "Items IDs should be unique!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Check if item exists
        if (state.getItem(parseInt(id)) === undefined) {
            shouter.notifySubscribers({text: "Item ID doesn't exist!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
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

module.exports = rackPanelViewModel;