require('../utils/constants');
require('../utils/strings');
require('knockout-mapping');
const utils = require('../utils/utils')();
const $ = require('jquery');
const ko = require('knockout');

let orderPanelViewModel = function (runningMode, shouter, state, gfxEventHandler, sendToServer, logger) {
    let self = this;

    self.time = ko.observable(0);

    self.activePanel = ko.observable(ORDER_PANEL.ADD);

    self.active = ko.computed(function () {
        return runningMode() === RUNNING_MODE.SIMULATE ||
            runningMode() === RUNNING_MODE.DEPLOY ||
            runningMode() === RUNNING_MODE.PAUSE;
    });

    self.id = ko.observable(1);
    self.refill = ko.observable(false);
    self.gateID = ko.observable("");
    self.rackID = ko.observable("");
    self.issueTimeHours = ko.observable("00");
    self.issueTimeMinutes = ko.observable("00");
    self.issueTimeSeconds = ko.observable("00");
    self.items = ko.observableArray();
    self.itemID = ko.observable("");
    self.itemQuantity = ko.observable("");

    self.pendingOrder = null;

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

        let raw_items = ko.mapping.toJS(self.items());
        let items = ko.observableArray();

        for (let i = 0; i < raw_items.length; ++i) {
            let it = Object.assign({}, raw_items[i]);

            it.delivered = ko.observable(0);
            items.push(it);
        }

        let issue_time_raw = parseInt(self.issueTimeHours()) * 3600 +
            parseInt(self.issueTimeMinutes()) * 60 +
            parseInt(self.issueTimeSeconds());

        let issue_time = self.issueTimeHours() + ":" + self.issueTimeMinutes() + ":" + self.issueTimeSeconds();

        if (issue_time_raw < self.time()) {
            issue_time_raw = self.time();

            issue_time = secondsToFormattedTime(issue_time_raw);
        }

        let order = {
            id: parseInt(self.id()),
            type: (self.refill() ? ORDER_TYPE.REFILL : ORDER_TYPE.COLLECT),
            gate_id: parseInt(self.gateID()),
            rack_id: parseInt(self.rackID()),
            raw_items: raw_items,
            items: items,
            more: ko.observable(false),
            satisfiable: ko.observable(true),
            issue_time_raw: issue_time_raw,
            issue_time: issue_time,
            fulfilled_time: ko.observable("TBD"),
            scheduled: false,
            progress: ko.computed(function () {
                let del = 0;
                let tot = 0;

                items().forEach(function (i) {
                    del += i.delivered();
                    tot += i.quantity;
                });

                return (del / tot) * 100;
            }),
            error: ko.observable("")
        };

        shouter.notifySubscribers(true, SHOUT.LOADING);

        if (order.issue_time_raw <= self.time()) {
            self.pendingOrder = order;

            sendOrderToServer(order);
        } else {
            order.scheduled = true;

            self.upcomingOrders.push(order);

            self.id(parseInt(self.id()) + 1);

            shouter.notifySubscribers({
                text: STR[1005](),
                type: MSG_TYPE.INFO,
                volatile: true
            }, SHOUT.MSG);

            clear();

            shouter.notifySubscribers(false, SHOUT.LOADING);
        }
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
            text: STR[1002](),
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

    self.finishOngoingOrder = function (id) {
        let o = self.ongoingOrders.remove(function (or) {
            return or.id === id;
        });

        o.forEach(function (or) {
            or.fulfilled_time(secondsToFormattedTime(self.time()));

            self.finishedOrders.push(or);
        });

        logger({
            level: LOG_LEVEL.INFO,
            object: LOG_TYPE.ORDER,
            color: "#bababa",
            msg: STR[3005]([id])
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

    self.handleOrderAck = function (msg) {
        let data = msg.data;

        if (data.status === ACK_ORDER_STATUS.OK) {
            let o = self.pendingOrder;

            self.ongoingOrders.push(o);

            if (!self.pendingOrder.scheduled) {
                self.id(parseInt(self.id()) + 1);
            }

            clear();

            self.pendingOrder = null;

            shouter.notifySubscribers({
                text: STR[1000](["Order"]),
                type: MSG_TYPE.INFO,
                volatile: true
            }, SHOUT.MSG);

            logger({
                level: LOG_LEVEL.INFO,
                object: LOG_TYPE.ORDER,
                color: "#bababa",
                msg: STR[3004]([o.id])
            });
        } else if (data.status === ACK_ORDER_STATUS.ERROR) {
            console.log(data.msg.id, data.msg.args);

            shouter.notifySubscribers({
                text: STR[data.msg.id](data.msg.args),
                title: data.msg.reason,
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            if (self.pendingOrder.scheduled) {
                self.pendingOrder.error(STR[data.msg.id](data.msg.args));
                self.pendingOrder.satisfiable(false);
                self.upcomingOrders.push(self.pendingOrder);
            }
        }

        shouter.notifySubscribers(false, SHOUT.LOADING);

        self.consumeUpcomingOrders();
    };

    self.incrementTime = function () {
        self.time(self.time() + 1);

        self.consumeUpcomingOrders();
    };

    self.consumeUpcomingOrders = function () {
        let upcoming = self.upcomingOrders();

        for (let i = 0; i < upcoming.length; i++) {
            let o = upcoming[i];

            if (o.issue_time_raw <= self.time() && o.satisfiable()) {
                self.upcomingOrders.splice(i, 1);

                self.pendingOrder = o;

                shouter.notifySubscribers(true, SHOUT.LOADING);

                sendOrderToServer(o);
            }
        }
    };

    self.clearOrders = function () {
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
            data: {
                id: order.id,
                type: order.type,
                gate_id: order.gate_id,
                rack_id: order.rack_id,
                items: order.raw_items
            }
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
                text: STR[2001](["Order ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.gateID().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Gate ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.items().length === 0) {
            shouter.notifySubscribers({
                text: STR[2011]([]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        try {
            if (self.issueTimeHours().length === 0 || parseInt(self.issueTimeHours()) < 0 ||
                self.issueTimeMinutes().length === 0 || parseInt(self.issueTimeMinutes()) < 0 ||
                parseInt(self.issueTimeMinutes()) > 59 || self.issueTimeSeconds().length === 0 ||
                parseInt(self.issueTimeSeconds()) < 0 || parseInt(self.issueTimeSeconds()) > 59) {
                shouter.notifySubscribers({
                    text: STR[2006](["issue time"]),
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                return false;
            }
        } catch (e) {
            shouter.notifySubscribers({
                text: STR[2006](["issue time"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.id()) < 0) {
            shouter.notifySubscribers({
                text: STR[2010](),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
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
                text: STR[2005](["gate"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (!f2 && self.rackID().length > 0) {
            shouter.notifySubscribers({
                text: STR[2005](["rack"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        return true;
    };

    let checkItem = function () {
        if (self.itemID().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Item ID"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        if (self.itemQuantity().length === 0) {
            shouter.notifySubscribers({
                text: STR[2001](["Quantity"]),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // -ve values
        if (parseInt(self.itemID()) < 0 || parseInt(self.itemQuantity()) <= 0) {
            shouter.notifySubscribers({
                text: STR[2010](),
                type: MSG_TYPE.ERROR
            }, SHOUT.MSG);

            return false;
        }

        // Duplicate id check
        for (let i = 0; i < self.items().length; ++i) {
            if (parseInt(self.items()[i].id) === parseInt(self.itemID())) {
                shouter.notifySubscribers({
                    text: STR[2002](["Item ID"]),
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                return false;
            }
        }

        // Check if item exists
        if (state.getItem(parseInt(self.itemID())) === undefined) {
            shouter.notifySubscribers({
                text: STR[2003](["Item ID"]),
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
                    text: STR[2002](["Order ID"]),
                    type: MSG_TYPE.ERROR
                }, SHOUT.MSG);

                return false;
            }
        }

        return true;
    };
};

module.exports = orderPanelViewModel;