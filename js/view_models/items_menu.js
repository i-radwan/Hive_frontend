require("../utils/constants"); // TODO use single quotes
require('knockout-mapping');

let ko = require('knockout');

let itemsViewModel = function (shouter, state, gfxEventHandler) {
    let self = this;

    self.searchValue = ko.observable("");
    self.items = ko.observableArray();
    self.newItemID = ko.observable(1);
    self.newItemWeight = ko.observable("");

    self.filteredItems = ko.computed(function () {
        return self.items().filter(function (item) {
            return self.searchValue().length === 0 || item.id() === parseInt(self.searchValue());
        });
    });

    self.removeItem = function () {
        self.items.remove(this);

        state.items = ko.mapping.toJS(self.items()); // TODO try w/o brackets
    };

    self.addItem = function () {
        if (!self.checkValid())
            return;

        let id = ko.observable(parseInt(self.newItemID()));
        let weight = ko.observable(parseFloat(self.newItemWeight()));

        self.items.push({
            id: id,
            weight: weight
        });

        // Auto increment
        self.newItemID(parseInt(self.newItemID()) + 1);

        // Subscribe to any changes
        id.subscribe(function (newID) {
            state.items = ko.mapping.toJS(self.items());
        });

        weight.subscribe(function (newID) {
            state.items = ko.mapping.toJS(self.items());
        });

        state.items = ko.mapping.toJS(self.items()); // TODO try w/o brackets
    };

    self.checkValid = function () {
        if (self.newItemID().length === 0) {
            shouter.notifySubscribers({text: "Item ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.newItemWeight().length === 0) {
            shouter.notifySubscribers({text: "Item weight is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicate id check
        for (let i = 0; i < self.items().length; ++i) {
            if (self.items()[i].id() === parseInt(self.newItemID())) {
                shouter.notifySubscribers({text: "Item ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                return false;
            }
        }

        // -ve values
        if (parseInt(self.newItemID()) < 0 || parseInt(self.newItemWeight()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };
};

module.exports = itemsViewModel;