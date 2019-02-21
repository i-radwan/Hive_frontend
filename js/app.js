// Includes
require("./utils/constants");
let $ = require('jquery');
let ko = require('knockout');
let communicator = require('./comm/comm');
let serverMiddleWare = require('./comm/server_middleware');
let GFX = require('./gfx/gfx');

// ViewModels
let mainViewModel = require("./view_models/main");

// Apply the binding
$(document).ready(() => {
    // TODO: replace with GFX
    let gfxEventHandler = function (event) {
        console.log(event);
    };

    let comm = new communicator(new serverMiddleWare());

    let mainVM = new mainViewModel(gfxEventHandler, comm);

    ko.applyBindings(mainVM, $("#main")[0]);

    // TESTING CODE
    let map = $(".map-row");
    let h = map.height();
    let w = map.width();

    map.click(function (e) {
        mainVM.eventHandler({
            type: EVENT_FROM_GFX.CELL_CLICK,
            row: Math.floor(e.offsetY / h * mainVM.state.map.height),
            col: Math.floor(e.offsetX / w * mainVM.state.map.width)
        });

        console.log(mainVM.state.map);
    });

    // GFX code
    let gfx = new GFX();

    // Communication logic
    let rcv = function (msg) {
        mainVM.handleServerMsg(msg);
    };

    comm.rcv = rcv;

    // Simulation logic
});