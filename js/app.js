// Includes
require("./utils/constants");
let $ = require('jquery');
let ko = require('knockout');

// ViewModels
let mainViewModel = require("./view_models/main");

// Apply the binding
$(document).ready(() => {
    let mainVM = new mainViewModel();

    ko.applyBindings(mainVM, $("#main")[0]);

    // TESTING CODE
    let map = $(".map-row");
    let h = map.height();
    let w = map.width();

    map.click(function(e) {
        mainVM.handleCellClick(Math.floor(e.offsetY / h * mainVM.map.height), Math.floor(e.offsetX / w * mainVM.map.width));
        console.log(mainVM.map);
    });

    // GFX code

    // Communication logic

    // Simulation logic
});