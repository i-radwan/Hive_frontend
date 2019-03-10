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

    // Simulation logic

});
