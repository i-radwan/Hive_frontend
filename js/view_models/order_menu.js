require("../utils/constants");
let ko = require('knockout');

let orderViewModel = function (shouter, state, gfxEventHandler, commSender) {
    let self = this;

    self.name = ko.observable("");
    self.items = ko.observableArray();
    self.itemNumber = ko.observable();
    self.quantity = ko.observable();

    self.addItem = function () {
        if (!self.itemNumber() || !self.quantity()) return;

        console.log("Add item");

        self.items.push({
            item_number: ko.observable(self.itemNumber()),
            quantity: ko.observable(self.quantity())
        });

        self.itemNumber("");
        self.quantity("");
    };

    self.removeItem = function () {
        console.log("Remove item");

        self.items.remove(this);
    };

    self.addOrder = function () {
        console.log("Add order");

        commSender({
            type: SERVER_EVENT_TYPE.ORDER_NEW,
            name: self.name(),
            items: self.items()
        });
    };
};

module.exports = orderViewModel;