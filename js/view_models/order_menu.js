require('../utils/constants');
require('knockout-mapping');
let ko = require('knockout');

let orderViewModel = function (shouter, state, gfxEventHandler, commSender) {
    let self = this;

    self.name = ko.observable("");
    self.items = ko.observableArray();
    self.itemID = ko.observable();
    self.itemQuantity = ko.observable();

    self.addItem = function () {
        if (!self.itemID() || !self.itemQuantity()) return;

        console.log("Add item");

        self.items.push({
            id: ko.observable(parseInt(self.itemID())),
            quantity: ko.observable(parseInt(self.itemQuantity()))
        });

        self.itemID("");
        self.itemQuantity("");
    };

    self.removeItem = function () {
        console.log("Remove item");

        self.items.remove(this);
    };

    self.addOrder = function () {
        console.log("Add order");

        commSender({
            type: SERVER_EVENT_TYPE.ORDER_NEW,
            data: {
                name: self.name(),
                items: ko.mapping.toJS(self.items())
            }
        });
    };
};

module.exports = orderViewModel;