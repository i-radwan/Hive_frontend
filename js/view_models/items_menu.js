require("../utils/constants");
let ko = require('knockout');

let itemsViewModel = function (shouter, map, gfxEventHandler) {
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
    };

    self.addItem = function () {
        if (!self.checkValid())
            return;

        self.items.push({
            id: ko.observable(parseInt(self.newItemID())),
            weight: ko.observable(parseFloat(self.newItemWeight()))
        });

        // Auto increment
        self.newItemID(parseInt(self.newItemID()) + 1);
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