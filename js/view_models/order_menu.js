require('../utils/constants');
require('knockout-mapping');
require('flatpickr');
let $ = require('jquery');
let ko = require('knockout');

let orderViewModel = function (shouter, state, gfxEventHandler, sendToServer, runningMode) {
    let self = this;

    self.activeMenu = ko.observable(ORDER_MENU.ADD);

    self.id = ko.observable(1);
    self.gateID = ko.observable("");
    self.startDateTime = ko.observable(flatpickr.formatDate(new Date(), "Y-m-d H:i"));
    self.items = ko.observableArray();
    self.itemID = ko.observable();
    self.itemQuantity = ko.observable();

    self.ongoingOrders = ko.observableArray();
    self.upcomingOrders = ko.observableArray();
    self.finishedOrders = ko.observableArray();

    self.ongoingSearchValue = ko.observable("");
    self.upcomingSearchValue = ko.observable("");
    self.finishedSearchValue = ko.observable("");

    self.filteredOngoingOrders = ko.computed(function () {
        return self.ongoingOrders().filter(function (order) {
            return self.ongoingSearchValue().length === 0 || parseInt(order.id) === parseInt(self.ongoingSearchValue());
        });
    });

    self.filteredUpcomingOrders = ko.computed(function () {
        return self.upcomingOrders().filter(function (order) {
            return self.upcomingSearchValue().length === 0 || parseInt(order.id) === parseInt(self.upcomingSearchValue());
        });
    });

    self.filteredFinishedOrders = ko.computed(function () {
        return self.finishedOrders().filter(function (order) {
            return self.finishedSearchValue().length === 0 || parseInt(order.id) === parseInt(self.finishedSearchValue());
        });
    });

    self.tabsClipPath = ko.computed(function () {
        if (self.activeMenu() === ORDER_MENU.ADD) {
            return 'polygon(0% 0%, 25% 0%, 25% 100%, 0% 100%)';
        } else if (self.activeMenu() === ORDER_MENU.ONGOING) {
            return 'polygon(25% 0%, 50% 0%, 50% 100%, 25% 100%)';
        } else if (self.activeMenu() === ORDER_MENU.UPCOMING) {
            return 'polygon(50% 0%, 75% 0%, 75% 100%, 50% 100%)';
        } else if (self.activeMenu() === ORDER_MENU.FINISHED) {
            return 'polygon(75% 0%, 100% 0%, 100% 100%, 75% 100%)';
        }
    });

    self.consumeUpcomingOrders = function () {
        let now = new Date();

        let o = self.upcomingOrders.remove(function (or) {
            return flatpickr.parseDate(or.start_time, "Y-m-d H:i") <= now;
        });

        console.log(o);

        o.forEach(function (or) {
            self.ongoingOrders.push(or);

            // ToDo: send the order to the server
        });
    };

    self.ongoingOrderFinished = function (id) {
        let o = self.ongoingOrders.remove(function (or) {
            return or.id === id;
        });

        o.forEach(function (or) {
            self.finishedOrders.push(or);
        });
    };

    self.ongoingOrderUpdate = function (id, update) {
        for (let i = 0; i < self.ongoingOrders().length(); ++i) {
            if (self.ongoingOrders()[i].id === id) {
                self.ongoingOrders()[i].gate_id(update.gate_id);

                break;
            }
        }
    };

    self.add = function () {
        console.log(picker.input);

        if (!check())
            return;

        let items = ko.observableArray();

        self.items().forEach(function (i) {
            i.delivered = ko.observable(0);
            items.push(i);

            state.stock[i.id] -= i.quantity;
        });

        let order = {
            id: parseInt(self.id()),
            gate_id: ko.observable(self.gateID().length ? parseInt(self.gateID()) : "-"), // ToDo: get gate from server
            items: items,
            more: ko.observable(false),
            start_time: self.startDateTime(),
            start_time_formatted: flatpickr.formatDate(flatpickr.parseDate(self.startDateTime(), "Y-m-d H:i"), "H:i M j, y"),
            fullfilled_time_formatted: ko.observable("TBD"),
            progress: ko.computed(function () {
                let del = 0;
                let tot = 0;

                items().forEach(function (i) {
                    del += i.delivered();
                    tot += i.quantity;
                });

                return del / tot;
            })
        };

        if (flatpickr.parseDate(self.startDateTime(), "Y-m-d H:i") > new Date()) {
            self.upcomingOrders.push(order);
        } else {
            self.ongoingOrders.push(order);

            // ToDo: send order
            // sendToServer({
            //     type: SERVER_EVENT_TYPE.ORDER_NEW,
            //     data: {
            //         id: self.id(),
            //         gate_id: self.gateID(),
            //         items: ko.mapping.toJS(self.items())
            //     }
            // });
        }

        self.id(parseInt(self.id()) + 1);

        shouter.notifySubscribers({text: "Order placed successfully!", type: MSG_INFO}, SHOUT_MSG);

        clear();
    };

    self.addItem = function () {
        if (!checkItem())
            return;

        self.items.push({
            id: parseInt(self.itemID()),
            quantity: parseInt(self.itemQuantity())
        });

        self.itemID("");
        self.itemQuantity("");

        // Scroll view to bottom
        let container = $(".lmenu .order .items-container");
        container.animate({scrollTop: container[0].scrollHeight}, 250);
    };

    self.removeItem = function () {
        self.items.remove(this);
    };

    self.toggleActiveOrdersMenu = function (m) {
        self.activeMenu(m);
    };

    let clear = function () {
        self.gateID("");
        self.items.removeAll();
        self.itemID("");
        self.itemQuantity("");
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({text: "Order ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.items().length === 0) {
            shouter.notifySubscribers({text: "Order must contain items!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicate ID check
        for (let i = 0; i < self.ongoingOrders().length; ++i) {
            let o = self.ongoingOrders()[i];

            if (o.id === parseInt(self.id())) {
                shouter.notifySubscribers({text: "Order ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                return false;
            }
        }

        for (let i = 0; i < self.upcomingOrders().length; ++i) {
            let o = self.upcomingOrders()[i];

            if (o.id === parseInt(self.id())) {
                shouter.notifySubscribers({text: "Order ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                return false;
            }
        }

        for (let i = 0; i < self.finishedOrders().length; ++i) {
            let o = self.finishedOrders()[i];

            if (o.id === parseInt(self.id())) {
                shouter.notifySubscribers({text: "Order ID must be unique!", type: MSG_ERROR}, SHOUT_MSG);

                return false;
            }
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
            if (state.stock[i.id] === undefined || state.stock[i.id] < i.quantity) {
                itemsIDs += i.id + " ";

                e = false;
            }
        });

        if (!e) {
            shouter.notifySubscribers({
                text: "Stock isn't enough for the items: " + itemsIDs + "!",
                type: MSG_ERROR
            }, SHOUT_MSG);

            return false;
        }

        return true;
    };

    let checkItem = function () {
        if (self.itemID().length === 0) {
            shouter.notifySubscribers({text: "Item ID is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        if (self.itemQuantity().length === 0) {
            shouter.notifySubscribers({text: "Quantity is mandatory!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.itemID()) < 0 || parseInt(self.itemQuantity()) <= 0) {
            shouter.notifySubscribers({text: "Use only +ve values!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Duplicates
        let cnt = 0;
        for (let i = 0; i < self.items().length; ++i) {
            if (parseInt(self.items()[i].id) === parseInt(self.itemID())) {
                cnt++;
            }
        }

        if (cnt > 0) {
            shouter.notifySubscribers({text: "Items IDs should be unique!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        // Check if item exists
        if (state.getItem(parseInt(self.itemID())) === undefined) {
            shouter.notifySubscribers({text: "Item ID doesn't exist!", type: MSG_ERROR}, SHOUT_MSG);

            return false;
        }

        return true;
    };

    // Listen for mode change
    runningMode.subscribe(function (newRunningMode) {
        if (newRunningMode === RUNNING_MODE.SIMULATE || newRunningMode === RUNNING_MODE.DEPLOY) {
            self.consumeUpcomingOrdersInterval = setInterval(self.consumeUpcomingOrders, UPCOMING_ORDERS_CONSUMPTION_INTERVAL);
        } else {
            clearInterval(self.consumeUpcomingOrdersInterval);
        }
    });

    // Configure date time picker
    let picker = flatpickr("#order_datetime", {
        enableTime: true,
        altInput: true,
        dateFormat: "Y-m-d H:i",
        altFormat: "H:i M j, y",
        defaultDate: new Date(),
        minDate: new Date(),
        minuteIncrement: 1
    });
};

module.exports = orderViewModel;