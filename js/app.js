// Includes
require("./utils/constants");
let $ = require('jquery');
let ko = require('knockout');
let communicator = require('./comm/comm');

// ViewModels
let mainViewModel = require("./view_models/main");

// Apply the binding
$(document).ready(() => {
    let koConfig = function () {
        ko.subscribable.fn.subscribeChanged = function (callback) {
            var oldValue;
            this.subscribe(function (_oldValue) {
                oldValue = _oldValue;
            }, this, 'beforeChange');

            this.subscribe(function (newValue) {
                callback(newValue, oldValue);
            });
        };
    }();

    // TODO: replace with GFX
    let gfxEventHandler = function (event) {
        console.log(event);
    };

    let comm = new communicator();

    let mainVM = new mainViewModel(gfxEventHandler, comm.send);

    ko.applyBindings(mainVM, $("#main")[0]);

    // TESTING CODE
    let map = $(".map-row");
    let h = map.height();
    let w = map.width();

    map.click(function (e) {
        mainVM.eventHandler({
            type: LOGIC_EVENT_TYPE.CELL_CLICK,
            row: Math.floor(e.offsetY / h * mainVM.state.map.height),
            col: Math.floor(e.offsetX / w * mainVM.state.map.width)
        });

        console.log(mainVM.state.map);
    });

    // GFX code

    // Communication logic
    let rcv = function (msg) {
        switch (msg.type) {
            case SERVER_EVENT_TYPE.OBJECT_UPDATE:
                gfxEventHandler({
                    type: GFX_EVENT_TYPE.OBJECT_MOVE,
                    src_row: msg.src_row,
                    src_col: msg.src_col,
                    dst_row: msg.dst_row,
                    dst_col: msg.dst_col
                });
                break;
            case SERVER_EVENT_TYPE.FILL_RACK:
                mainVM.leftMenuVM.rackVM.fillRack(msg.rack_id, msg.item_id, msg.item_quantity);
                break;
            case SERVER_EVENT_TYPE.LOG:
                mainVM.rightMenuVM.addLog(msg.level, msg.object, msg.text);
                break;
            case SERVER_EVENT_TYPE.STATS:
                mainVM.rightMenuVM.updateStats(msg.key, msg.value);
                break;
            case SERVER_EVENT_TYPE.MSG:
                shouter.notifySubscribers({text: msg.text, type: msg.log_type}, SHOUT_MSG);
                break;
        }
    };

    comm.connect(SERVER_IP, SERVER_PORT, rcv);

    // Simulation logic

});
