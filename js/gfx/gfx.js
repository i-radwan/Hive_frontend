require('two.js');
let $ = require('jquery');
let ko = require('knockout');

let gfx = function () {
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