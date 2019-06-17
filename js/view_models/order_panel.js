require('../utils/constants');
require('knockout-mapping');
let $ = require('jquery');
let ko = require('knockout');

let orderPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.activePanel = ko.observable(ORDER_PANEL.ADD);

    self.active = ko.computed(function () {
        return runningMode() === RUNNING_MODE.SIMULATE;
    });

    self.id = ko.observable(1);
    self.refill = ko.observable(false);
    self.gateID = ko.observable("");
    self.rackID = ko.observable("");
    self.startTimestep = ko.observable(0);
    self.items = ko.observableArray();
    self.itemID = ko.observable();
    self.itemQuantity = ko.observable();

    self.lastOrder = null;

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

    self.ordersLists = [{
        panel: ORDER_PANEL.ONGOING,
        searchValue: self.ongoingSearchValue,
        list: self.filteredOngoingOrders
    }, {
        panel: ORDER_PANEL.UPCOMING,
        searchValue: self.upcomingSearchValue,
        list: self.filteredUpcomingOrders
    }, {
        panel: ORDER_PANEL.FINISHED,
        searchValue: self.finishedSearchValue,
        list: self.filteredFinishedOrders
    }];

    self.tabsClipPath = ko.computed(function () {
        if (self.activePanel() === ORDER_PANEL.ADD) {
            return 'polygon(0% 0%, 25% 0%, 25% 100%, 0% 100%)';
        } else if (self.activePanel() === ORDER_PANEL.ONGOING) {
            return 'polygon(25% 0%, 50% 0%, 50% 100%, 25% 100%)';
        } else if (self.activePanel() === ORDER_PANEL.UPCOMING) {
            return 'polygon(50% 0%, 75% 0%, 75% 100%, 50% 100%)';
        } else if (self.activePanel() === ORDER_PANEL.FINISHED) {
            return 'polygon(75% 0%, 100% 0%, 100% 100%, 75% 100%)';
        }
    });

    self.add = function () {
        if (!check())
            return;

        let order = {
            id: parseInt(self.id()),
            type: (self.refill() ? ORDER_TYPE.REFILL : ORDER_TYPE.COLLECT),
            gate_id: parseInt(self.gateID()),
            rack_id: parseInt(self.rackID()),
            items: ko.mapping.toJS(self.items()),
            start_timestep: self.startTimestep() !== 0 ? self.startTimestep() : state.timestep
        };

        self.lastOrder = order;

        sendOrderToServer(order);

        shouter.notifySubscribers(true, SHOUT.LOADING);
    };

    self.addItem = function () {
        if (!checkItem())
            return;

        let id = parseInt(self.itemID());
        self.items.push({
            id: id,
            quantity: parseInt(self.itemQuantity())
        });

        self.itemID(id + 1);

        // Scroll view to bottom
        let container = $(".lpanel .order .add");
        container.animate({scrollTop: container[0].scrollHeight}, 250);

        container = $(".lpanel .order .add .items-list .items-list-rows");
        container.animate({scrollTop: container[0].scrollHeight}, 250);

        // Return focus to new item fields
        $(".lpanel .order .add-item .item-id").focus();
        $(".lpanel .add-item .item-id").select();

        shouter.notifySubscribers({
            text: "Item added successfully!",
            type: MSG_TYPE.INFO,
            volatile: true
        }, SHOUT.MSG);
    };

    self.removeItem = function () {
        self.items.remove(this);
    };

    self.removeAll = function () {
        self.items.removeAll();

        self.itemID(1);
    };

    self.toggleActiveOrdersPanel = function (m) {
        self.activePanel(m);
    };

    self.finishOngoingOrder = function (id, timestep) {
        let o = self.ongoingOrders.remove(function (or) {
            return or.id === id;
        });

        o.forEach(function (or) {
            or.fulfilled_timestep(timestep);

            self.finishedOrders.push(or);
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ORDER,
            color: "#bababa",
            msg: "Order <b>(#" + id + ")</b> has been fulfilled."
        });
    };

    self.issueOrder = function (id) {
        let o = self.upcomingOrders.remove(function (or) {
            return or.id === id;
        });

        o.forEach(function (or) {
            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ORDER,
                color: "#bababa",
                msg: "Order <b>(#" + or.id + ")</b> has been issued."
            });

            self.ongoingOrders.push(or);
        });
    };

    self.updateOrderDeliveredItems = function (orderID, items) {
        self.ongoingOrders().forEach(function (o) {
            if (o.id !== orderID)
                return;

            for (let i = 0; i < items.length; ++i) {
                let itemID = items[i].id;
                let itemQuantity = items[i].quantity;

                o.items().forEach(function (i) {
                    if (i.id !== itemID)
                        return;

                    i.delivered(i.delivered() + Math.abs(parseInt(itemQuantity)));
                });
            }
        });
    };

    self.handleAckOrder = function (msg) {
        let data = msg.data;

        if (data.status === ACK_ORDER_STATUS.OK) {
            let o = self.lastOrder;

            let items = ko.observableArray();

            for (let i = 0; i < o.items.length; ++i) {
                o.items[i].delivered = ko.observable(0);
                items.push(o.items[i]);
            }

            let order = {
                id: o.id,
                gate_id: o.gate_id,
                items: items,
                more: ko.observable(false),
                satisfiable: ko.observable(true),
                start_timestep: o.start_timestep,
                fulfilled_timestep: ko.observable("TBD"),
                progress: ko.computed(function () {
                    let del = 0;
                    let tot = 0;

                    items().forEach(function (i) {
                        del += i.delivered();
                        tot += i.quantity;
                    });

                    return (del / tot) * 100;
                })
            };

            if (o.start_timestep > state.timestep) {
                self.upcomingOrders.push(order);
            } else {
                self.ongoingOrders.push(order);
            }

            self.id(parseInt(self.id()) + 1);

            shouter.notifySubscribers({
                text: "Order placed successfully!",
                type: MSG_TYPE.INFO,
                volatile: true
            }, SHOUT.MSG);

            clear();

            shouter.notifySubscribers(false, SHOUT.LOADING);

            self.lastOrder = null;
        } else if (data.status === ACK_ORDER_STATUS.ERROR) {
            shouter.notifySubscribers({
                text: data.msg,
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            shouter.notifySubscribers(false, SHOUT.LOADING);
        }
    };

    self.clearOrders = function() {
        self.id(1);

        self.ongoingOrders.removeAll();
        self.upcomingOrders.removeAll();
        self.finishedOrders.removeAll();
    };

    self.onEnter = function (d, e) {
        if (e.keyCode !== 13)  // Not Enter
            return true;

        self.addItem();

        return true;
    };

    let sendOrderToServer = function (order) {
        sendToServer({
            type: MSG_TO_SERVER.ORDER,
            data: order
        });
    };

    let clear = function () {
        self.refill(false);
        self.gateID("");
        self.rackID("");
        self.items.removeAll();
        self.itemID("");
        self.itemQuantity("");
    };

    let check = function () {
        if (self.id().length === 0) {
            shouter.notifySubscribers({
                text: "Order ID is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.gateID().length === 0) {
            shouter.notifySubscribers({
                text: "Gate ID is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.items().length === 0) {
            shouter.notifySubscribers({
                text: "Order must contain items!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({
                text: "Use only +ve values!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Check start timestep
        if (parseInt(self.startTimestep()) !== 0 && parseInt(self.startTimestep()) < state.timestep) {
            shouter.notifySubscribers({
                text: "Start timestep has to be in the future or zero (fro now)!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);
        }

        // Duplicate ID checks
        if (!checkDuplicateOrderID(self.ongoingOrders()) ||
            !checkDuplicateOrderID(self.finishedOrders()) ||
            !checkDuplicateOrderID(self.upcomingOrders())) {
            return false;
        }

        // Gate and Rack exists
        let f1 = state.map.getObjectPos(self.gateID(), MAP_CELL.GATE) !== undefined;
        let f2 = self.rackID().length > 0 && state.map.getObjectPos(self.rackID(), MAP_CELL.RACK) !== undefined;

        if (!f1) {
            shouter.notifySubscribers({
                text: "No gate with this ID!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (!f2 && self.rackID().length > 0) {
            shouter.notifySubscribers({
                text: "No rack with this ID!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let checkItem = function () {
        if (self.itemID().length === 0) {
            shouter.notifySubscribers({
                text: "Item ID is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.itemQuantity().length === 0) {
            shouter.notifySubscribers({
                text: "Quantity is mandatory!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.itemID()) < 0 || parseInt(self.itemQuantity()) <= 0) {
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

        // Check if item exists
        if (state.getItem(parseInt(self.itemID())) === undefined) {
            shouter.notifySubscribers({
                text: "Item ID doesn't exist!",
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let checkDuplicateOrderID = function (array) {
        for (let i = 0; i < array.length; ++i) {
            let o = array[i];

            if (o.id === parseInt(self.id())) {
                shouter.notifySubscribers({
                    text: "Order ID must be unique!",
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                return false;
            }
        }

        return true;
    };
};

module.exports = orderPanelViewModel;