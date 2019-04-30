require('../utils/constants');
require('knockout-mapping');
let $ = require('jquery');
let ko = require('knockout');

let itemsViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.searchValue = ko.observable("");
    self.items = ko.observableArray();
    self.newItemID = ko.observable(1);
    self.newItemWeight = ko.observable("");

    self.filteredItems = ko.computed(function () {
        console.log(self.items());
        return self.items().filter(function (item) {
            return self.searchValue().length === 0 || parseInt(item.id) === parseInt(self.searchValue());
        });
    });

    self.remove = function () {
        self.items.remove(this);

        state.items = ko.mapping.toJS(self.items());
    };

    self.add = function () {
        if (!check())
            return;

        self.items.push({
            id: parseInt(self.newItemID()),
            weight: parseFloat(self.newItemWeight())
        });

        // Auto increment
        self.newItemID(parseInt(self.newItemID()) + 1);
        state.nextIDs.item = Math.max(state.nextIDs.item, parseInt(self.newItemID()));

        state.items = ko.mapping.toJS(self.items());

        // Scroll view to bottom
        let container = $(".rmenu .items .items-container");
        container.animate({scrollTop: container[0].scrollHeight}, 250);
    };

    let check = function () {
        if (self.newItemID().length === 0) {
            shouter.notifySubscribers({text: "Item ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.newItemWeight().length === 0) {
            shouter.notifySubscribers({text: "Item weight is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.newItemID()) < 0 || parseInt(self.newItemWeight()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicate id check
        for (let i = 0; i < self.items().length; ++i) {
            if (parseInt(self.items()[i].id) === parseInt(self.newItemID())) {
                shouter.notifySubscribers({text: "Item ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                return false;
            }
        }

        return true;
    };

    let clear = function () {
        self.searchValue("");
        self.newItemID(state.nextIDs.item);
        self.newItemWeight("");
        self.items(ko.mapping.fromJS(state.items)());
    };

    // Events
    shouter.subscribe(function () {
        clear();
    }, self, SHOUT_STATE_UPDATED);
};

module.exports = itemsViewModel;