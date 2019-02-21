require('two.js');
let $ = require('jquery');
let ko = require('knockout');

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

    // Ex:
    // In case of click
    // shouter.notifySubscribers({row: 0, col: 0}, SHOUT_GRID_CLICK);
    // In case of drag
    // shouter.notifySubscribers({row_src: 0, col_src: 0, row_dst: 0, col_dst: 0}, SHOUT_GRID_DRAG);
};

module.exports = gfx;