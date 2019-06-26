require('../utils/constants');
const ko = require("knockout");

// Models
const State = require("../models/state");

// ViewModels
const leftPanelViewModel = require("./left_panel");
const centerPanelViewModel = require("./center_panel");
const rightPanelViewModel = require("./right_panel");

let mainViewModel = function (gfxEventHandler, comm) {
    let self = this;

    self.state = new State();

    self.time = ko.observable(0);

    self.shouter = new ko.subscribable();

    self.runningMode = ko.observable(RUNNING_MODE.DESIGN);

    self.gfxEventHandler = gfxEventHandler;

    self.rightPanelVM = new rightPanelViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send);
    self.centerPanelVM = new centerPanelViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm, self.rightPanelVM.addLog);
    self.leftPanelVM = new leftPanelViewModel(self.runningMode, self.shouter, self.state, gfxEventHandler, comm.send, self.rightPanelVM.addLog);

    self.logger = self.rightPanelVM.addLog;

    self.pendingActions = []; // No. of actions sent to graphics and waiting for their ACKs

    self.loadingVisible = ko.observable(false);

    let incrementTimeInterval;

    self.setGFXEventHandler = function (gfxEventHandler) {
        self.gfxEventHandler = gfxEventHandler;
    };

    self.handleServerMsg = function (msg) {
        console.log("Received:", JSON.stringify(msg));

        switch (msg.type) {
            case MSG_FROM_SERVER.ACK_START: {
                self.centerPanelVM.controlConsoleVM.handleAckStart(msg);

                break;
            }

            case MSG_FROM_SERVER.ACK_RESUME: {
                self.centerPanelVM.controlConsoleVM.handleAckResume(msg);

                break;
            }

            case MSG_FROM_SERVER.ACK_ORDER: {
                self.leftPanelVM.orderVM.handleAckOrder(msg);

                break;
            }

            case MSG_FROM_SERVER.ACTION: {
                let actionType = msg.data.type;
                let robotID = msg.data.id;

                if (actionType === SERVER_ACTIONS.STOP) {
                    self.leftPanelVM.robotVM.stop(robotID);

                    reducePendingActions(self.pendingActions, robotID);
                } else if (actionType === SERVER_ACTIONS.MOVE) {
                    self.leftPanelVM.robotVM.move(robotID);

                    self.pendingActions.push(robotID);
                } else if (actionType === SERVER_ACTIONS.ROTATE_RIGHT) {
                    self.leftPanelVM.robotVM.rotateRight(robotID);

                    self.pendingActions.push(robotID);
                } else if (actionType === SERVER_ACTIONS.ROTATE_LEFT) {
                    self.leftPanelVM.robotVM.rotateLeft(robotID);

                    self.pendingActions.push(robotID);
                } else if (actionType === SERVER_ACTIONS.RETREAT) {
                    self.leftPanelVM.robotVM.retreat(robotID);

                    self.pendingActions.push(robotID);
                } else if (actionType === SERVER_ACTIONS.LOAD) {
                    self.leftPanelVM.robotVM.load(robotID);

                    self.pendingActions.push(robotID);
                } else if (actionType === SERVER_ACTIONS.OFFLOAD) {
                    self.leftPanelVM.robotVM.offload(robotID);

                    self.pendingActions.push(robotID);
                } else if (actionType === SERVER_ACTIONS.BIND) {
                    self.leftPanelVM.robotVM.bind(robotID);

                    self.pendingActions.push(robotID);
                } else if (actionType === SERVER_ACTIONS.UNBIND) {
                    self.leftPanelVM.robotVM.unbind(robotID);

                    self.pendingActions.push(robotID);
                }

                break;
            }

            case MSG_FROM_SERVER.LOG: {
                let logType = msg.data.type;
                let logData = msg.data.data;

                if (logType === SERVER_LOGS.TASK_ASSIGNED) {
                    let robotID = logData.robot_id;
                    let rackID = logData.rack_id;

                    self.leftPanelVM.robotVM.assignTask(robotID, rackID);
                } else if (logType === SERVER_LOGS.TASK_COMPLETED) {
                    let robotID = logData.robot_id;
                    let orderID = logData.order_id;
                    let rackID = logData.rack_id;
                    let items = logData.items;

                    self.leftPanelVM.robotVM.completeTask(robotID, rackID);
                    self.leftPanelVM.rackVM.adjustRack(rackID, items);
                    self.leftPanelVM.orderVM.updateOrderDeliveredItems(orderID, items);
                } else if (logType === SERVER_LOGS.ORDER_FULFILLED) {
                    let id = logData.id;

                    self.leftPanelVM.orderVM.finishOngoingOrder(id);
                } else if (logType === SERVER_LOGS.BATTERY_UPDATED) {
                    let id = logData.id;
                    let battery = logData.battery;

                    self.leftPanelVM.robotVM.updateBattery(id, battery);
                }

                break;
            }

            case MSG_FROM_SERVER.CONTROL: {
                let msgType = msg.data.type;
                let robotID = msg.data.id;

                if (msgType === CONTROL_MSG.ACTIVATE) {
                    self.leftPanelVM.robotVM.activate(robotID);
                } else if (msgType === CONTROL_MSG.DEACTIVATE) {
                    self.leftPanelVM.robotVM.deactivate(robotID);

                    reducePendingActions(self.pendingActions, robotID);
                }

                break;
            }

            case MSG_FROM_SERVER.MSG: {
                self.shouter.notifySubscribers({
                    text: STR[data.msg.id](data.msg.args),
                    title: data.msg.reason,
                    type: msg.data.status
                }, SHOUT.MSG);

                if (msg.data.status === MSG_TYPE.ERROR) {
                    self.centerPanelVM.controlConsoleVM.stop();
                }

                break;
            }
        }
    };

    self.eventHandler = function (event) {
        switch (event.type) {
            case EVENT_FROM_GFX.CELL_CLICK:
                handleCellClick(event.row, event.col);
                break;

            case EVENT_FROM_GFX.CELL_DRAG:
                handleCellDrag(event.src_row, event.src_col, event.dst_row, event.dst_col);
                break;

            case EVENT_FROM_GFX.CELL_DELETE:
                handleCellDeleteClick(event.row, event.col);
                break;

            case EVENT_FROM_GFX.CELL_HOVER:
                handleCellHover(event.row, event.col);
                break;

            case EVENT_FROM_GFX.DONE:
                handleDone(event.data);
                break;

            case EVENT_FROM_GFX.ESC:
                handleEsc();
                break;
        }
    };

    self.toggleActivation = function () {
        self.leftPanelVM.robotVM.toggleActivation();
    };

    let handleCellClick = function (row, col) {
        gfxEventHandler({
            type: EVENT_TO_GFX.OBJECT_UNHIGHLIGHT
        });

        self.leftPanelVM.handleCellClick(row, col);
    };

    let handleCellDrag = function (srcRow, srcCol, dstRow, dstCol) {
        self.leftPanelVM.handleCellDrag(srcRow, srcCol, dstRow, dstCol);
    };

    let handleCellDeleteClick = function (row, col) {
        self.leftPanelVM.handleCellDeleteClick(row, col);
    };

    let handleCellHover = function (row, col) {
        self.centerPanelVM.controlConsoleVM.handleCellHover(row, col);
    };

    let handleDone = function (data) {
        console.log("GFX Action DONE received: " + JSON.stringify(data),
            "PendingActions: " + JSON.stringify(self.pendingActions));

        let robotID = data.data.id;

        if (data.type === EVENT_TO_GFX.OBJECT_MOVE) {
            self.leftPanelVM.robotVM.doneMoving(robotID);
        } else if (data.type === EVENT_TO_GFX.OBJECT_ROTATE_RIGHT) {
            self.leftPanelVM.robotVM.doneRotatingRight(robotID);
        } else if (data.type === EVENT_TO_GFX.OBJECT_ROTATE_LEFT) {
            self.leftPanelVM.robotVM.doneRotatingLeft(robotID);
        } else if (data.type === EVENT_TO_GFX.OBJECT_RETREAT) {
            self.leftPanelVM.robotVM.doneRetreating(robotID);
        }

        reducePendingActions(robotID);
    };

    let handleEsc = function () {
        self.leftPanelVM.handleEsc();
        self.centerPanelVM.controlConsoleVM.handleEsc();
        self.rightPanelVM.handleEsc();

        gfxEventHandler({
            type: EVENT_TO_GFX.ESC
        });
    };

    let reducePendingActions = function (robotID) {
        if (self.pendingActions.length === 0)
            return;

        let index = self.pendingActions.indexOf(robotID);

        while (index > -1) { // If robot id found
            self.pendingActions.splice(index, 1);

            comm.send({
                type: MSG_TO_SERVER.DONE,
                data: {
                    id: robotID
                }
            });

            console.log("DONE sent from reduce pending actions for the Robot #" + robotID);

            index = self.pendingActions.indexOf(robotID);
        }
    };

    let incrementTime = function () {
        if (self.runningMode() === RUNNING_MODE.SIMULATE || self.runningMode() === RUNNING_MODE.DEPLOY) {
            self.time(self.time() + 1);

            self.centerPanelVM.controlConsoleVM.time(self.time());
            self.leftPanelVM.orderVM.incrementTime();
        }
    };

    // Events
    self.shouter.subscribe(function (on) {
        self.loadingVisible(on);
    }, self, SHOUT.LOADING);

    self.shouter.subscribe(function () {
        handleEsc();
    }, self, SHOUT.ESC);

    self.runningMode.subscribe(function (newRunningMode) {
        if (newRunningMode === RUNNING_MODE.DESIGN) {
            self.time(0);
            self.centerPanelVM.controlConsoleVM.time(0);
            self.leftPanelVM.orderVM.time(0);

            self.loadingVisible(false);

            self.pendingActions = [];

            clearInterval(incrementTimeInterval);
        } else {
            clearInterval(incrementTimeInterval);
            incrementTimeInterval = setInterval(incrementTime, 1000);
        }
    });

    gfxEventHandler({
        type: EVENT_TO_GFX.INIT,
        data: {
            width: self.state.map.width,
            height: self.state.map.height
        }
    });
};

module.exports = mainViewModel;