require('two.js');
let ZUI = require('./zui');
let $ = require('jquery');
let ko = require('knockout');
let camera;

let gfx = function (shouter) {
    let mapRow = $('.map-row');

    let two = new Two({
        width: mapRow.width(),
        height: mapRow.height(),
        autostart: true
    }).appendTo(mapRow[0]);

    // let rect = two.makeRectangle(two.width / 2, two.height / 2, 150, 150);
    //
    // two.bind('update', function () {
    //     rect.rotation += 0.01;
    // });
    let gridCellLength = 50;

    let drawGrid = function (width, height) {
        let gridHeight = height * gridCellLength;
        let gridWidth = width * gridCellLength;

        /*for (let i = 0; i <= height; i++) {
            let line = two.makeLine(0, i*gridCellLength, gridWidth, i*gridCellLength);
            camera = two.makeGroup(camera, line);
        }

        for (let i = 0; i <= width; i++) {
            let line = two.makeLine(i*gridCellLength, 0, i*gridCellLength, gridHeight);
            camera = two.makeGroup(camera, line);
        }*/
        camera = two.makeGroup();
        for(let i = 0;i < width; i++) {
            for(let j = 0; j < height; j++) {
                let square = two.makeRectangle(j*gridCellLength + gridCellLength / 2, i*gridCellLength + gridCellLength / 2, gridCellLength, gridCellLength);
                square.fill = '#bababa';
                camera.add(square);
            }
        }
        let circle = two.makeCircle(gridWidth / 2, gridHeight / 2, 10);
        circle.fill = "#FF0000";
        camera.add(circle);

        //camera.center();
        two.scene.translation.addSelf(two.width / 2, two.height / 2);
        camera.translation.addSelf(-(mapWidth * gridCellLength) / 2, -(mapHeight * gridCellLength) / 2);
        //camera.translation.addSelf(-two.width / 2, -two.height / 2);
    };

    let mapWidth = 10;
    let mapHeight = 10;

    drawGrid(mapWidth, mapHeight);
    let x = 0;

    two.bind('update', function () {
        //camera.translation.set(two.width / 2, two.height / 2);
        //camera.corner();

        //camera.translation.addSelf(-two.width / 2, -two.height / 2);
        //two.scene.translation.addSelf(-two.width / 2, -two.height / 2);
        //two.scene.rotation += 0.01;
        //two.scene.translation.addSelf(-(mapWidth * gridCellLength *0.6) / 2, -(mapHeight * gridCellLength * 0.6) / 2);
        //if (x > 0)
            //camera.rotation += 0.01;
        //two.scene.translation.addSelf((mapWidth * gridCellLength *0.6) / 2, (mapHeight * gridCellLength * 0.6) / 2);
        //camera.translation.set(-two.width / 2, -two.height / 2);
        //camera.center();
        //camera.scale -= 0.001;
        //camera.translation.addSelf(two.width / 2, two.height / 2);
        //two.scene.translation.addSelf(two.width / 2, two.height / 2);
        //camera.translation.addSelf(0.3, 0);
        //two.scene.scale -= 0.001;

    });

    let map = $('#map-container');
    two.scene.scale -= 0.4;

    let zui = new ZUI(two);
    zui.addLimits(0.06, 8);
    //camera.translation.set(two.width / 2, two.height / 2);


    map.bind('mousewheel', function (e) {
        const delta = e.originalEvent.wheelDelta / 1000;
        console.log("scrolling with delta = ", delta);
        zui.zoomBy(delta, e.clientX, e.clientY);
    });

    map.bind('contextmenu', function (e) {
        two.scene.translation.addSelf(two.width / 2, two.height / 2);
        x = 0;
    });

    map.bind('keydown', function(e) {
        let character = String.fromCharCode(e.which);
        console.log(character);
    });

    two.update();

    $(camera._renderer.elem)
        .css({
            cursor: 'pointer'
        })
        .bind('click', function (e) {
            console.log("Hey oooooh!");
            let mouseX = e.clientX - map.offset().left - camera.getBoundingClientRect().left;
            let mouseY = e.clientY - map.offset().top - camera.getBoundingClientRect().top;
            let cellWidth = (camera.getBoundingClientRect().right - camera.getBoundingClientRect().left) / mapWidth;

            let cellRow = parseInt(mouseY / cellWidth);
            let cellCol = parseInt(mouseX / cellWidth);

            console.log('mouseX = ', mouseX, 'mouseY = ', mouseY, 'cellWidth = ', cellWidth);
            console.log('Clicking on Cell = {', cellRow, ', ',cellCol,'}');
    });

    map.bind('click', function (e) {
        if(x/100 < 1) {
            console.log((mapWidth * gridCellLength) / 2, ' ', (mapHeight * gridCellLength) / 2);
            console.log(camera.getBoundingClientRect());
            //console.log(camera.children);
            //camera.translation.addSelf(-(mapWidth * gridCellLength *0.6) / 2, -(mapHeight * gridCellLength * 0.6) / 2);
            for(let i=0;i<camera.children.length - 1;i++) {
                camera.children[i].origin.x = 50;
                camera.children[i].origin.y = 50;
                //camera.children[i].rotation += 0.1;

            }
            //two.scene.translation.addSelf(-(mapWidth * gridCellLength *0.6) / 2, -(mapHeight * gridCellLength * 0.6) / 2);
        }
        else {
            two.scene.rotation += 0.1;
        }
        /*else {
            camera.translation.addSelf(two.width / 2, two.height / 2);
        }*/
        console.log(two.width, ' ',two.height);
        x++;
        //zui.zoomBy(0.1, e.clientX, e.clientY);





        let mouseX = e.clientX - map.offset().left;
        let mouseY = e.clientY - map.offset().top;
        // console.log('mouseX = ', mouseX, 'mouseY = ', mouseY, 'gridCellLength = ', gridCellLength);

        let cellRow = parseInt(mouseY / gridCellLength);
        let cellCol = parseInt(mouseX / gridCellLength);

        //console.log('cellRow = ', cellRow, 'cellCol = ', cellCol);
    });

    // Ex:
    // In case of click
    // shouter.notifySubscribers({row: 0, col: 0}, SHOUT_GRID_CLICK);
    // In case of drag
    // shouter.notifySubscribers({row_src: 0, col_src: 0, row_dst: 0, col_dst: 0}, SHOUT_GRID_DRAG);
};

module.exports = gfx;