require('../utils/constants');
require('knockout-mapping');
let $ = require('jquery');
let ko = require('knockout');

let itemsPanelViewModel = function (runningMode, shouter, state, gfxEventHandler) {
    let self = this;

    self.searchValue = ko.observable("");
    self.items = ko.observableArray();
    self.itemID = ko.observable(1);
    self.itemWeight = ko.observable("");

    self.filteredItems = ko.computed(function () {
        return self.items().filter(function (item) {
            return self.searchValue().length === 0 || parseInt(item.id) === parseInt(self.searchValue());
        });
    });

    self.remove = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({text: "This action is allowed in design mode only!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        self.items.remove(this);

        state.items = ko.mapping.toJS(self.items());
    };

    self.add = function () {
        if (runningMode() !== RUNNING_MODE.DESIGN) {
            shouter.notifySubscribers({text: "This action is allowed in design mode only!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (!check())
            return;

        self.items.push({
            id: parseInt(self.itemID()),
            weight: parseFloat(self.itemWeight())
        });

        // Auto increment
        self.itemID(parseInt(self.itemID()) + 1);
        state.nextIDs.item = Math.max(state.nextIDs.item, parseInt(self.itemID()));

        state.items = ko.mapping.toJS(self.items());
        console.log(state.items);

        // Scroll view to bottom
        let container = $(".rpanel .items .items-container");
        container.animate({scrollTop: container[0].scrollHeight}, 250);
    };

    let check = function () {
        if (self.itemID().length === 0) {
            shouter.notifySubscribers({text: "Item ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.itemWeight().length === 0) {
            shouter.notifySubscribers({text: "Item weight is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.itemID()) < 0 || parseInt(self.itemWeight()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicate id check
        for (let i = 0; i < self.items().length; ++i) {
            if (parseInt(self.items()[i].id) === parseInt(self.itemID())) {
                shouter.notifySubscribers({text: "Item ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                return false;
            }
        }

        return true;
    };

    let clear = function () {
        self.searchValue("");
        self.itemID(state.nextIDs.item);
        self.itemWeight("");

        self.items.removeAll();
        for (let i = 0; i < state.items.length; ++i) {
            self.items.push(state.items[i]);
        }

        console.log(self.items());
    };

    // Events
    shouter.subscribe(function () {
        clear();
    }, self, SHOUT_STATE_UPDATED);
};

module.exports = itemsPanelViewModel;