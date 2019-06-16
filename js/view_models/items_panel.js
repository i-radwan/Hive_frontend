require('../utils/constants');
require('knockout-mapping');
let $ = require('jquery');
let ko = require('knockout');

let itemsPanelViewModel = function (runningMode, shouter, state, gfxEventHandler) {
    let self = this;

    self.searchValue = ko.observable("");
    self.items = ko.observableArray();
    self.itemID = ko.observable(1);
    self.itemName = ko.observable("");
    self.itemWeight = ko.observable("");

    self.filteredItems = ko.computed(function () {
        return self.items().filter(function (item) {
            if (self.searchValue().length === 0)
                return true;

            if (self.searchValue().length === 1 && self.searchValue() === "#")
                return true;

            if (self.searchValue()[0] === "#") {
                return parseInt(item.id) === parseInt(self.searchValue().substring(1));
            }

            return item.name.includes(self.searchValue());
        });
    });

    self.removeAll = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        self.items.remove(function (i) {
            let rack = state.map.getItemRack(i.id); // The rack who uses this item

            if (rack === undefined) {
                return true;
            } else {
                shouter.notifySubscribers({
                    text: "Rack (#" + rack.id + ") at (" + (rack.row + 1) + ", " + (rack.col + 1) + ") uses item #" + i.id + "!",
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                return false;
            }
        });

        state.items = ko.mapping.toJS(self.items());
    };

    self.remove = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        let rack = state.map.getItemRack(this.id); // The rack who uses this item

        if (rack === undefined) {
            self.items.remove(this);

            state.items = ko.mapping.toJS(self.items());
        } else {
            shouter.notifySubscribers({
                text: "Rack (#" + rack.id + ") at (" + (rack.row + 1) + ", " + (rack.col + 1) + ") uses item #" + this.id + "!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);
        }
    };

    self.add = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({
                text: "This action is allowed in design mode only!",
                type: MSG_TYPE.ERROR,
                volatile: true
            }, SHOUT.MSG);

            return false;
        }

        if (!check())
            return;

        self.items.push({
            id: parseInt(self.itemID()),
            weight: parseFloat(self.itemWeight()),
            name: self.itemName()
        });

        // Auto increment
        self.itemID(parseInt(self.itemID()) + 1);
        state.nextIDs.item = Math.max(state.nextIDs.item, parseInt(self.itemID()));

        state.items = ko.mapping.toJS(self.items());

        // Scroll view to bottom
        let container = $(".rpanel .items .items-list .items-list-rows");
        container.animate({scrollTop: container[0].scrollHeight}, 250);

        // Return focus to new item fields
        $(".rpanel .add-item .item-name").focus();
        $(".rpanel .add-item .item-name").select();

        shouter.notifySubscribers({
            text: "Item added successfully!",
            type: MSG_TYPE.INFO,
            volatile: true
        }, SHOUT.MSG);
    };

    self.onEnter = function (d, e) {
        if (e.keyCode !== 13)  // Not Enter
            return true;

        self.add();

        return true;
    };

    let check = function () {
        if (self.itemID().length === 0) {
            shouter.notifySubscribers({
                text: "Item ID is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.itemName().length === 0) {
            shouter.notifySubscribers({
                text: "Item name is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.itemWeight().length === 0) {
            shouter.notifySubscribers({
                text: "Item weight is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.itemID()) < 0 || parseInt(self.itemWeight()) < 0) {
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

        return true;
    };

    let clear = function () {
        self.searchValue("");
        self.itemID(state.nextIDs.item);
        self.itemName("");
        self.itemWeight("");

        self.items.removeAll();
        for (let i = 0; i < state.items.length; ++i) {
            self.items.push(state.items[i]);
        }
    };

    // Events
    shouter.subscribe(function () {
        clear();
    }, self, SHOUT.STATE_UPDATED);
};

module.exports = itemsPanelViewModel;