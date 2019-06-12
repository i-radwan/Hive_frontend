require('../utils/constants');
require('knockout-mapping');
let $ = require('jquery');
let ko = require('knockout');

let rackPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.capacity = ko.observable(RACK_INIT_CAP);
    self.weight = ko.observable(RACK_INIT_WEIGHT);

    self.id = ko.observable(1);
    self.items = ko.observableArray();
    self.itemID = ko.observable("");
    self.itemQuantity = ko.observable("");

    self.editing = ko.observable(false);
    self.activeRackRow = -1;
    self.activeRackCol = -1;

    self.add = function (row, col) {
        let isFacilityFree = state.map.isFacilityFree(row, col);

        if (self.editing()) {
            if (isFacilityFree) {
                shouter.notifySubscribers({}, SHOUT.ESC);
            }

            return;
        }

        if (isFacilityFree) {
            if (!check()) {
                return;
            }

            let id = parseInt(self.id());

            state.map.addObject(row, col, {
                type: MAP_CELL.RACK,
                id: id,
                capacity: parseInt(self.capacity()),
                weight: parseInt(self.weight()),
                items: ko.mapping.toJS(self.items())
            });

            let nextID = Math.max(state.nextIDs.rack, id + 1);

            self.id(nextID);
            state.nextIDs.rack = nextID;

            shouter.notifySubscribers({
                text: "Rack placed successfully!",
                type: MSG_TYPE.INFO
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_ADD,
                data: {
                    type: MAP_CELL.RACK,
                    id: id,
                    row: row,
                    col: col,
                    capacity: parseInt(self.capacity()),
                    weight: parseInt(self.weight()),
                    items: ko.mapping.toJS(self.items())
                }
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + (row + 1) + ", " + (col + 1) + ") is occupied!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);
        }
    };

    self.move = function (srcRow, srcCol, dstRow, dstCol) {
    };

    self.drag = function (srcRow, srcCol, dstRow, dstCol) {
        if (srcRow === dstRow && srcCol === dstCol)
            return;

        let fac = state.map.getSpecificFacility(srcRow, srcCol, MAP_CELL.RACK);

        if (state.map.isFree(dstRow, dstCol)) {
            state.map.moveObject(srcRow, srcCol, dstRow, dstCol, fac);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.RACK,
                    id: fac.id,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: dstRow,
                    dst_col: dstCol
                }
            });
        } else {
            shouter.notifySubscribers({
                text: "(" + (dstRow + 1) + ", " + (dstCol + 1) + ") is occupied!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            gfxEventHandler({
                type: EVENT_TO_GFX.OBJECT_DRAG,
                data: {
                    type: MAP_CELL.RACK,
                    id: fac.id,
                    src_row: srcRow,
                    src_col: srcCol,
                    dst_row: srcRow,
                    dst_col: srcCol
                }
            });
        }
    };

    self.delete = function (row, col) {
        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.RACK);

        state.map.deleteObject(row, col, fac);

        unselect();
        clear();

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_DELETE,
            data: {
                type: MAP_CELL.RACK,
                id: fac.id,
                row: row,
                col: col
            }
        });

        return true;
    };

    self.fill = function (row, col) {
        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.RACK);

        if (fac === null)
            return;

        self.activeRackRow = row;
        self.activeRackCol = col;

        self.id(fac.id);
        self.capacity(fac.capacity);
        self.weight(fac.weight);

        self.items.removeAll();
        for (let i = 0; i < fac.items.length; ++i) {
            self.items.push(fac.items[i]);
        }

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HIGHLIGHT,
            data: {
                type: MAP_CELL.RACK,
                id: fac.id,
                row: row,
                col: col
            }
        });
    };

    self.edit = function (row, col) {
        self.fill(row, col);
        self.editing(true);
        self.activeRackRow = row;
        self.activeRackCol = col;
    };

    self.update = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (!check())
            return false;

        let fac = state.map.getSpecificFacility(self.activeRackRow, self.activeRackCol, MAP_CELL.RACK);

        let id = parseInt(self.id());

        state.map.updateObject(self.activeRackRow, self.activeRackCol, {
            type: MAP_CELL.RACK,
            id: id,
            capacity: parseInt(self.capacity()),
            weight: parseInt(self.weight()),
            items: ko.mapping.toJS(self.items())
        }, fac.id);

        state.nextIDs.rack = Math.max(state.nextIDs.rack, id + 1);

        shouter.notifySubscribers({
            text: "Rack updated successfully!",
            type: MSG_TYPE.INFO
        }, SHOUT.MSG);

        unselect();
        clear();

        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_HOVER,
            data: {
                type: MAP_CELL.RACK
            }
        });
    };

    self.addItem = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (!checkItem())
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
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return;
        }

        self.items.remove(this);
    };

    self.adjustRack = function (id, items) {
        let pos = state.map.getObjectPos(id, MAP_CELL.RACK);

        let row = pos[0];
        let col = pos[1];

        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.RACK);

        if (fac === null)
            return;

        let rackItems = fac.items;

        for (let i = 0; i < items.length; ++i) {
            for (let j = 0; j < rackItems.length; ++j) {
                if (rackItems[j].id === items[i].id) {
                    rackItems[j].quantity += items[i].quantity;
                }
            }

            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.RACK,
                color: "#bababa",
                msg: "Rack <b>(#" + id + ")</b> has been " + (items[i].quantity > 0 ? "filled" : "discharged") +
                    " by <b>(" + items[i].quantity + ")</b> from Item#<b>(" + items[i].id + ")</b>."
            });
        }

        self.items.removeAll();
        for (let i = 0; i < rackItems.length; ++i) {
            self.items.push(rackItems[i]);
        }
        self.items.valueHasMutated();
    };

    self.handleEsc = function () {
        unselect();
        clear();
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({
                text: "Rack ID is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.items().length === 0) {
            shouter.notifySubscribers({
                text: "Rack must contain items!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0 || parseInt(self.capacity()) < 0 || parseInt(self.weight()) < 0) {
            shouter.notifySubscribers({
                text: "Use only +ve values!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate ID check
        let pos = state.map.getObjectPos(parseInt(self.id()), MAP_CELL.RACK);

        if (pos !== undefined && (pos[0] !== self.activeRackRow || pos[1] !== self.activeRackCol)) {
            shouter.notifySubscribers({
                text: "Rack ID must be unique!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Rack load
        let load = 0;

        for (let i = 0; i < self.items().length; ++i) {
            let item = self.items()[i];

            try {
                load += parseInt(item.quantity) * state.getItem(parseInt(item.id)).weight;
            } catch (e) {
                shouter.notifySubscribers({
                    text: "Item ID #" + item.id + " doesn't exist!",
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                return false;
            }
        }

        if (load > parseInt(self.capacity())) {
            shouter.notifySubscribers({
                text: "Rack load is " + load + " which exceeds the capacity!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let checkItem = function () {
        if (self.itemID().length === 0) {
            shouter.notifySubscribers({
                text: "Item ID is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.itemQuantity().length === 0) {
            shouter.notifySubscribers({
                text: "Quantity is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.itemID()) < 0 || parseInt(self.itemQuantity()) < 0) {
            shouter.notifySubscribers({
                text: "Use only +ve values!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate id check
        for (let i = 0; i < self.items().length; ++i) {
            if (parseInt(self.items()[i].id) === parseInt(self.itemID())) {
                shouter.notifySubscribers({
                    text: "Item ID must be unique!",
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                return false;
            }
        }

        // Check if item exists
        if (state.getItem(parseInt(self.itemID())) === undefined) {
            shouter.notifySubscribers({
                text: "Item ID doesn't exist!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let unselect = function () {
        self.activeRackRow = self.activeRackCol = -1;
        self.editing(false);
    };

    let clear = function () {
        self.id(state.nextIDs.rack);
        self.capacity(RACK_INIT_CAP);
        self.weight(RACK_INIT_WEIGHT);
        self.items.removeAll();
        self.itemID("");
        self.itemQuantity("");
    };

    // Events
    shouter.subscribe(function () {
        unselect();
        clear();
    }, self, SHOUT.STATE_UPDATED);
};

module.exports = rackPanelViewModel;