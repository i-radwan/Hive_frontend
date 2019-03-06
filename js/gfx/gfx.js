require('two.js');
let ZUI = require('./zui');
let $ = require('jquery');
let ko = require('knockout');
let camera;

let arrow = {left: 37, up: 38, right: 39, down: 40};

let gfx = function () {
    let mapRow = $('.map-row');

    let two = new Two({
        width: mapRow.width(),
        height: mapRow.height(),
        autostart: true
    }).appendTo(mapRow[0]);

    let zui = new ZUI(two);
    zui.addLimits(0.06, 8);

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
                let square = two.makeRectangle(i*gridCellLength + gridCellLength / 2, j*gridCellLength + gridCellLength / 2, gridCellLength, gridCellLength);
                square.fill = '#bababa';
                camera.add(square);
            }
        }
        let circle = two.makeCircle(gridWidth / 2, gridHeight / 2, 10);
        circle.fill = "#FF0000";
        camera.add(circle);

        //camera.center();
        zui.translateSurface(two.width / 2, two.height / 2);
        two.scene.translation.addSelf(two.width / 2, two.height / 2);
        camera.translation.addSelf(-(mapWidth * gridCellLength) / 2, -(mapHeight * gridCellLength) / 2);
        //camera.translation.addSelf(-two.width / 2, -two.height / 2);
    };

    let mapWidth = 17;
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

        let verticalDir = 0;
        let HorizontalDir = 0;
        if(goingLeft)
            HorizontalDir = 1;
        else if(goingRight)
            HorizontalDir = -1;

        if(goingUp)
            verticalDir = 1;
        else if(goingDown)
            verticalDir = -1;

        zui.translateSurface(4 * HorizontalDir ,4 * verticalDir);
        two.scene.translation.addSelf(4 * HorizontalDir ,4 * verticalDir);
    });

    let map = $('#map-container');
    zui.zoomBy(-0.4, two.width / 2 + map.offset().left,  two.height / 2 + map.offset().top);

    //camera.translation.set(two.width / 2, two.height / 2);


    map.bind('mousewheel', function (e) {
        const delta = e.originalEvent.wheelDelta / 1000;
        zui.zoomBy(delta, e.clientX, e.clientY);
    });

    map.bind('contextmenu', function (e) {
        x = 0;
    });

    let startDragX = 0;
    let startDragY = 0;
    let mouseDown = false;

    map.bind('mousedown', function (e) {
        mouseDown = true;
        startDragX = e.clientX - map.offset().left;
        startDragY = e.clientY - map.offset().top;
    });

    map.bind('mousemove', function (e) {
        if(mouseDown) {
            let dirX = e.clientX - map.offset().left - startDragX;
            let dirY = e.clientY - map.offset().top - startDragY;

            zui.translateSurface(dirX, dirY);
            two.scene.translation.addSelf(dirX, dirY);

            startDragX = e.clientX - map.offset().left;
            startDragY = e.clientY - map.offset().top;
        }
    });

    map.bind('mouseup', function (e) {
        mouseDown = false;
    });

    let goingLeft = false;
    let goingRight = false;
    let goingUp = false;
    let goingDown = false;

    $(document).on('keydown', function(e) {
        if(e.which == arrow.left) {
            goingLeft = true;
        } else if(e.which == arrow.right) {
            goingRight = true;
        } else if(e.which == arrow.up) {
            goingUp = true;
        } else if(e.which == arrow.down) {
            goingDown = true;
        }
    });

    $(document).on('keyup', function (e) {
        if(e.which == arrow.left) {
            goingLeft = false;
        } else if(e.which == arrow.right) {
            goingRight = false;
        } else if(e.which == arrow.up) {
            goingUp = false;
        } else if(e.which == arrow.down) {
            goingDown = false;
        }
    });

    two.update();

    $(camera._renderer.elem)
        .css({
            cursor: 'pointer'
        })
        .bind('click', function (e) {
            let mouseX = e.clientX - map.offset().left - camera.getBoundingClientRect().left;
            let mouseY = e.clientY - map.offset().top - camera.getBoundingClientRect().top;
            let cellWidth = (camera.getBoundingClientRect().right - camera.getBoundingClientRect().left) / mapWidth;

            let cellRow = parseInt(mouseY / cellWidth);
            let cellCol = parseInt(mouseX / cellWidth);
            console.log('Clicking on Cell = {', cellRow, ', ',cellCol,'}');
        });

    map.bind('click', function (e) {

    });

    // Ex:
    // In case of click
    // shouter.notifySubscribers({row: 0, col: 0}, SHOUT_GRID_CLICK);
    // In case of drag
    // shouter.notifySubscribers({row_src: 0, col_src: 0, row_dst: 0, col_dst: 0}, SHOUT_GRID_DRAG);
};

module.exports = gfx;