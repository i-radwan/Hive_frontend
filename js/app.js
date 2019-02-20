//
// Includes
//
let $ = require('jquery');
let ko = require('knockout');
require("./utils/constants");

//
// ViewModels
//
let leftMenuVM = require("./view_models/left_menu");

let toggle = document.getElementById('container');
let toggleContainer = document.getElementById('toggle-container');
let toggleNumber = 1;

toggle.addEventListener('click', function () {
    toggleNumber = !toggleNumber;
    if (toggleNumber) {
        toggleContainer.style.clipPath = 'inset(0 50% 0 0)';
    }
    else {
        toggleContainer.style.clipPath = 'inset(0 0 0 50%)';
    }
});

// Apply the binding
$(document).ready(() => {
    let shouter = new ko.subscribable();
    ko.applyBindings(new leftMenuVM(shouter), $("#left-menu")[0]);
});
