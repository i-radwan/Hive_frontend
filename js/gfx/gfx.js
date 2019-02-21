require('two.js');
let ZUI = require('./zui');
let $ = require('jquery');
let ko = require('knockout');
let camera;

let arrow = {left: 37, up: 38, right: 39, down: 40};

let gfx = function (shouter) {
    let mapRow = $('.map-row');

    let two = new Two({
        width: mapRow.width(),
        height: mapRow.height(),
        autostart: true
    }).appendTo(mapRow[0]);

    let rect = two.makeRectangle(two.width / 2, two.height / 2, 150, 150);

    two.bind('update', function () {
        rect.rotation += 0.01;
    });
};

module.exports = gfx;