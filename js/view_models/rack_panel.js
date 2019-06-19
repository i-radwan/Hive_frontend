require('../utils/constants');
require('../utils/strings');
require('knockout-mapping');
const $ = require('jquery');
const ko = require('knockout');

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

    self.showable = ko.observable(false); // In simulation mode, when robot is clicked
    self.active = ko.computed(function () {
        return self.showable() || runningMode() === RUNNING_MODE.DESIGN;
    });

    self.add = function (row, col) {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

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
                items: ko.mapping.toJS(self.items()),
                color: GFX_COLORS_DEFAULT.RACK
            });

            let nextID = Math.max(state.nextIDs.rack, id + 1);

            self.id(nextID);
            state.nextIDs.rack = nextID;

            shouter.notifySubscribers({
                text: STR[1000](["Rack"]),
                type: MSG_TYPE.INFO,
                volatile: true
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
                    items: ko.mapping.toJS(self.items()),
                    color: GFX_COLORS_DEFAULT.RACK
                }
            });
        } else {
            shouter.notifySubscribers({
                text: STR[2000]([row + 1, col + 1]),
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
                text: STR[2000]([dstRow + 1, dstCol + 1]),
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
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

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

        if (fac === undefined)
            return;

        self.activeRackRow = row;
        self.activeRackCol = col;
        self.showable(true);

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
        self.editing(true);

        self.fill(row, col);
    };

    self.update = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        if (!check())
            return false;

        let fac = state.map.getSpecificFacility(self.activeRackRow, self.activeRackCol, MAP_CELL.RACK);

        let id = fac.id;

        state.map.updateObject(self.activeRackRow, self.activeRackCol, {
            type: MAP_CELL.RACK,
            id: id,
            capacity: parseInt(self.capacity()),
            weight: parseInt(self.weight()),
            items: ko.mapping.toJS(self.items()),
            color: GFX_COLORS_DEFAULT.RACK
        });

        shouter.notifySubscribers({
            text: STR[1001](["Rack"]),
            type: MSG_TYPE.INFO,
            volatile: true
        }, SHOUT.MSG);
    };

    self.addItem = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        if (!checkItem())
            return;

        let id = parseInt(self.itemID());

        self.items.push({
            id: id,
            quantity: parseInt(self.itemQuantity())
        });

        self.itemID(id + 1);

        // Scroll view to bottom
        let container = $(".lpanel .rack .items-list .items-list-rows");
        container.animate({scrollTop: container[0].scrollHeight}, 250);

        // Return focus to new item fields
        $(".lpanel .rack .add-item .item-id").focus();
        $(".lpanel .add-item .item-id").select();

        shouter.notifySubscribers({
            text: STR[1002](),
            type: MSG_TYPE.INFO,
            volatile: true
        }, SHOUT.MSG);
    };

    self.removeItem = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return;
        }

        self.items.remove(this);
    };

    self.removeAll = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: STR[2012]([]),
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return;
        }

        self.itemID(1);

        self.items.removeAll();
    };

    self.adjustRack = function (id, items) {
        let pos = state.map.getObjectPos(id, MAP_CELL.RACK);

        let row = pos[0];
        let col = pos[1];

        let fac = state.map.getSpecificFacility(row, col, MAP_CELL.RACK);

        if (fac === undefined)
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
                msg: STR[3006]([id, items[i].quantity, items[i].id])
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

    self.onEnter = function (d, e) {
        if (e.keyCode !== 13)  // Not Enter
            return true;

        self.addItem();

        return true;
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Rack ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0 || parseInt(self.capacity()) < 0 || parseInt(self.weight()) < 0) {
            shouter.notifySubscribers({
                text: STR[2010](),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate ID check
        let pos = state.map.getObjectPos(parseInt(self.id()), MAP_CELL.RACK);

        if (pos !== undefined && (pos[0] !== self.activeRackRow || pos[1] !== self.activeRackCol)) {
            shouter.notifySubscribers({
                text: STR[2002](["Rack ID"]),
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
                    text: STR[2004]([item.id]),
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                return false;
            }
        }

        if (load > parseInt(self.capacity())) {
            shouter.notifySubscribers({
                text: STR[2009]([load]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let checkItem = function () {
        if (self.itemID().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Item ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.itemQuantity().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Quantity"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.itemID()) < 0 || parseInt(self.itemQuantity()) < 0) {
            shouter.notifySubscribers({
                text: STR[2010](),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate id check
        for (let i = 0; i < self.items().length; ++i) {
            if (parseInt(self.items()[i].id) === parseInt(self.itemID())) {
                shouter.notifySubscribers({
                    text: STR[2002](["Item ID"]),
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                return false;
            }
        }

        // Check if item exists
        if (state.getItem(parseInt(self.itemID())) === undefined) {
            shouter.notifySubscribers({
                text: STR[2003](["Item ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let unselect = function () {
        self.activeRackRow = self.activeRackCol = -1;
        self.editing(false);
        self.showable(false);
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