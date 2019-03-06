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

    // // TESTING CODE
    // let map = $(".map-row");
    // let h = map.height();
    // let w = map.width();
    //
    // map.click(function(e) {
    //     mainVM.handleCellClick(Math.floor(e.offsetY / h * mainVM.map.height), Math.floor(e.offsetX / w * mainVM.map.width));
    //     //console.log(mainVM.map);
    // });

    // GFX code
    let gfx = new GFX(mainVM);

    // Communication logic
    let rcv = function (msg) {
        mainVM.handleServerMsg(msg);
    };

    comm.rcv = rcv;

    // Simulation logic
});