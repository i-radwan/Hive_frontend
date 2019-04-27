require('../utils/constants');
require('knockout-mapping');
let ko = require('knockout');

let orderViewModel = function (shouter, state, gfxEventHandler, commSender) {
    let self = this;

    self.id = ko.observable(1);
    self.gateID = ko.observable("");
    self.items = ko.observableArray();
    self.itemID = ko.observable();
    self.itemQuantity = ko.observable();

    self.addItem = function () {
        if (!self.itemID() || !self.itemQuantity()) return;

        // Check if item exists
        if (state.getItem(self.itemID()) === undefined) {
            shouter.notifySubscribers({text: "Item ID doesn't exist!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        self.items.push({
            id: ko.observable(parseInt(self.itemID())),
            quantity: ko.observable(parseInt(self.itemQuantity()))
        });

        self.itemID("");
        self.itemQuantity("");
    };

    self.removeItem = function () {
        self.items.remove(this);
    };

    self.addOrder = function () {
        if (!check())
            return;

        console.log("Add order");

        state.orders.push({
            id: parseInt(self.id()),
            gate_id: parseInt(self.gateID()),
            items: ko.mapping.toJS(self.items())
        });

        self.id(parseInt(self.id()) + 1);

        self.items().forEach(function (i) {
            state.stock[i.id()] -= i.quantity();
        });

        // ToDo: send order
        // commSender({
        //     type: SERVER_EVENT_TYPE.ORDER_NEW,
        //     data: {
        //         id: self.id(),
        //         gate_id: self.gateID(),
        //         items: ko.mapping.toJS(self.items())
        //     }
        // });

        shouter.notifySubscribers({text: "Order placed successfully!", type: MSG_INFO}, SHOUT_MSG);

        clear();
    };

    let clear = function() {
        self.gateID("");
        self.items.removeAll();
        self.itemID("");
        self.itemQuantity("");
    };

    let check = function() {
        if (self.id().length === 0) {
            shouter.notifySubscribers({text: "Order ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicate ID check
        for (let i = 0; i < state.orders.length; ++i) {
            let o = state.orders[i];

            if (o.id === parseInt(self.id())) {
                shouter.notifySubscribers({text: "Order ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                return false;
            }
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Gate exists
        let f = (self.gateID().length === 0); // Blank gate allows for dynamic selection via our task allocation algorithm

        for (let i = 0; i < state.map.height && !f; ++i) {
            for (let j = 0; j < state.map.width && !f; ++j) {
                let c = state.map.grid[i][j].facility;

                if (c !== undefined && c.type === MAP_CELL.GATE && c.id === parseInt(self.gateID())) {
                    f = true;
                }
            }
        }

        if (!f) {
            shouter.notifySubscribers({text: "No gate with this ID!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Does stock cover
        let e = true;
        let itemsIDs = "";

        self.items().forEach(function (i) {
            if (state.stock[i.id()] === undefined || state.stock[i.id()] < i.quantity()) {
                itemsIDs += i.id() + " ";

                e = false;
            }
        });

        if (!e) {
            shouter.notifySubscribers({text: "Stock isn't enough for the items: " + itemsIDs + "!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    }
};

module.exports = orderViewModel;