// Includes
require("./utils/constants");
let $ = require('jquery');
let ko = require('knockout');

// ViewModels
let mainViewModel = require("./view_models/main");

// Apply the binding
$(document).ready(() => {
    // TODO: replace with GFX
    let gfxEventHandler = function(event) {
        console.log(event);
    };

    let mainVM = new mainViewModel(gfxEventHandler);

    ko.applyBindings(mainVM, $("#main")[0]);

    // TESTING CODE
    let map = $(".map-row");
    let h = map.height();
    let w = map.width();

    map.click(function(e) {
        let events = mainVM.handleCellClick(Math.floor(e.offsetY / h * mainVM.map.height), Math.floor(e.offsetX / w * mainVM.map.width));
        console.log(events, mainVM.map);
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

    // Simulation logic

});
