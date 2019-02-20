require("../utils/constants");
let ko = require('knockout');

let orderViewModel = function (shouter) {
    let self = this;
    self.name = ko.observable("");
    self.items = ko.observableArray();
    self.itemNumber = ko.observable();
    self.quantity = ko.observable();

    self.addItem = function () {
        if (!self.itemNumber() || !self.quantity()) return;

        self.items.push({
            item_number: ko.observable(self.itemNumber()),
            quantity: ko.observable(self.quantity())
        });

        self.itemNumber("");
        self.quantity("");
    };

    self.removeItem = function () {
        self.items.remove(this);
    }
};

module.exports = orderViewModel;