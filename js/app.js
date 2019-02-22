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

    // $(".map-row")[0].click(function() {
    //
    // });

    // GFX code

    // Communication logic

    // Simulation logic

});
