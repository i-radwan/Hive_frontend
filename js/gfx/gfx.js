require('two.js');
let ZUI = require('./zui');
let $ = require('jquery');
let ko = require('knockout');
let gridMap;

let arrow = {left: 37, up: 38, right: 39, down: 40};
let key_code = {F5: 116, delete: 46, esc: 27};

let gfx = function (mainVM) {
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
    let mapObjects = [];

    let translateScene = function (dx, dy) {
        zui.translateSurface(dx ,dy);
        two.scene.translation.addSelf(dx ,dy);
    };

    let getMouseCell = function (mouseX, mouseY) {
        mouseX = mouseX - canvas.offset().left - gridMap.getBoundingClientRect().left;
        mouseY = mouseY - canvas.offset().top - gridMap.getBoundingClientRect().top;
        let cellWidth = (gridMap.getBoundingClientRect().right - gridMap.getBoundingClientRect().left) / mainVM.map.width;

        let cellRow = parseInt(mouseY / cellWidth);
        let cellCol = parseInt(mouseX / cellWidth);
        let ret = {row: cellRow, col: cellCol, inBounds: true};

        if (cellCol < 0 || cellCol >= mainVM.map.width || cellRow < 0 || cellRow >= mainVM.map.height)
            ret.inBounds = false;

        ret.row = Math.min(ret.row, mainVM.map.height - 1);
        ret.row = Math.max(ret.row, 0);

        ret.col = Math.min(ret.col, mainVM.map.width - 1);
        ret.col = Math.max(ret.col, 0);

        return ret;
    };

    let getMapObjectIdx = function (row, col) {
      for(let i = 0; i < mapObjects.length;i++) {
          if (mapObjects[i].row == row && mapObjects[i].col == col)
              return i;
      }
      return -1;
    };

    let getMapObject = function (row, col) {
        let idx = getMapObjectIdx(row, col);
        return idx == -1 ? -1 : mapObjects[idx];
    };

    let getRendererObjectIdx = function (row, col) {
      return col * mainVM.map.height + row;
    };

    let getRendererObject = function (row, col) {
      return gridMap.children[getRendererObjectIdx(row, col)];
    };

    let translateObject = function (object, srcRow, srcCol, dstRow, dstCol) {
        if (srcRow == dstRow && srcCol == dstCol) return;

        getRendererObject(srcRow, srcCol).remove(object.twoObject);

        let cellCenterX = dstCol*gridCellLength + gridCellLength / 2;
        let cellCenterY = dstRow*gridCellLength + gridCellLength / 2;

        getRendererObject(dstRow, dstCol).add(object.twoObject);
        let childIdx = getRendererObject(dstRow, dstCol).children.length - 1;
        getRendererObject(dstRow, dstCol).children[childIdx].translation.set(cellCenterX, cellCenterY);

        return object;
    };

    let deleteCellObjects = function (cellObject) {
        getRendererObject(cellObject.row, cellObject.col).remove(cellObject.twoObject);
        mapObjects.splice(cellObject.idx, 1);
    };

    let drawGrid = function (map) {
        mapObjects = [];
        two.clear();

        let width = map.width;
        let height = map.height;

        let gridHeight = height * gridCellLength;
        let gridWidth = width * gridCellLength;
        gridMap = two.makeGroup();
        for(let c = 0;c < width; c++) {
            for(let r = 0; r < height; r++) {
                let cellCenterX = c*gridCellLength + gridCellLength / 2;
                let cellCenterY = r*gridCellLength + gridCellLength / 2;
                let cellGroup = two.makeGroup();
                let square = two.makeRectangle(cellCenterX, cellCenterY, gridCellLength, gridCellLength);
                square.fill = '#bababa';
                cellGroup.add(square);

                let object, makeObject = true;
                switch (map.grid[r][c].type) {
                    case MAP_CELL.EMPTY:
                        makeObject = false;
                        break;
                    case MAP_CELL.ENTRY:
                        object = two.makeCircle(cellCenterX, cellCenterY, 10);
                        object.fill = "#8b0000";
                        break;
                    case MAP_CELL.ROBOT:
                        object = two.makeCircle(cellCenterX, cellCenterY, 10);
                        object.fill = "#e09500";
                        break;
                    case MAP_CELL.RACK:
                        object = two.makeCircle(cellCenterX, cellCenterY, 10);
                        object.fill = "#3972bf";
                        break;
                    case MAP_CELL.PARK:
                        object = two.makeCircle(cellCenterX, cellCenterY, 10);
                        object.fill = "#78c631";
                        break;
                    case MAP_CELL.OBSTACLE:
                        object = two.makeCircle(cellCenterX, cellCenterY, 10);
                        object.fill = "#1d1d1e";
                        break;
                }

                if (makeObject) {
                    cellGroup.add(object);
                    let x = {twoObject: object, type: map.grid[r][c], row: r, col: c, idx: mapObjects.length};
                    mapObjects.push(x);
                }

                gridMap.add(cellGroup);
            }
        }
        let circle = two.makeCircle(gridWidth / 2, gridHeight / 2, 10);
        circle.fill = "#FF0000";
        gridMap.add(circle);

        //translateScene(two.width / 2, two.height / 2);
        //gridMap.translation.addSelf(-(mapWidth * gridCellLength) / 2, -(mapHeight * gridCellLength) / 2);
        two.update();

        $(gridMap._renderer.elem)
            .css({
                cursor: 'pointer'
            })
            .bind('click', function (e) {
                let cell = getMouseCell(e.clientX, e.clientY);

                mainVM.handleCellClick(cell.row, cell.col);

                console.log('Clicking on Cell = {', cell.row, ', ',cell.col,'}');
            });
    };

    console.log(mainVM);

    drawGrid(mainVM.map);

    let handleKeyboardDrag = function () {
        let verticalDir = 0;
        let horizontalDir = 0;
        if(goingLeft)
            horizontalDir = 1;
        else if(goingRight)
            horizontalDir = -1;

        if(goingUp)
            verticalDir = 1;
        else if(goingDown)
            verticalDir = -1;

        translateScene(4 * horizontalDir, 4 * verticalDir);
    };

    two.bind('update', function () {
        handleKeyboardDrag();
    });

    let canvas = $('#map-container');
    zui.zoomBy(-0.4, two.width / 2 + canvas.offset().left,  two.height / 2 + canvas.offset().top);

    //gridMap.translation.set(two.width / 2, two.height / 2);


    canvas.bind('mousewheel', function (e) {
        const delta = e.originalEvent.wheelDelta / 1000;
        zui.zoomBy(delta, e.clientX, e.clientY);
    });

    canvas.bind('contextmenu', function (e) {
    });

    let startDragX = 0;
    let startDragY = 0;
    let draggedObject;
    let selectedObject = -1;
    let dragging = false;
    let draggingObject = false;

    canvas.bind('mousedown', function (e) {
        dragging = true;
        startDragX = e.clientX - canvas.offset().left;
        startDragY = e.clientY - canvas.offset().top;
        let cell = getMouseCell(e.clientX, e.clientY);

        if(cell.inBounds) {
            let cellType = mainVM.map.grid[cell.row][cell.col].type;

            if (cellType != MAP_CELL.EMPTY) {
                draggingObject = true;
                draggedObject = getMapObject(cell.row, cell.col);
                draggedObject.draggingRow = draggedObject.row;
                draggedObject.draggingCol = draggedObject.col;
            } else
                draggingObject = false;

            console.log('Cell Type = ', cellType);
        }
    });

    canvas.bind('mousemove', function (e) {
        if(!dragging) return;
        if (!draggingObject) {
            let dirX = e.clientX - canvas.offset().left - startDragX;
            let dirY = e.clientY - canvas.offset().top - startDragY;


            translateScene(dirX, dirY);

            startDragX = e.clientX - canvas.offset().left;
            startDragY = e.clientY - canvas.offset().top;
            return;
        }
        let currentCell = getMouseCell(e.clientX, e.clientY);
        translateObject(draggedObject, draggedObject.draggingRow, draggedObject.draggingCol, currentCell.row, currentCell.col);

        draggedObject.draggingRow = currentCell.row;
        draggedObject.draggingCol = currentCell.col;
    });

    canvas.bind('mouseup', function (e) {
        let currentCell = getMouseCell(e.clientX, e.clientY);
        if(draggingObject && (draggedObject.row != currentCell.row || draggedObject.col != currentCell.col)) {
            mainVM.handleCellDrag(draggedObject.row, draggedObject.col, currentCell.row, currentCell.col);

            if (getMapObjectIdx(draggedObject.draggingRow, draggedObject.draggingCol) !== -1)  { // not empty cell
                translateObject(draggedObject, draggedObject.draggingRow, draggedObject.draggingCol, draggedObject.row, draggedObject.col);
            }
            else {
                mapObjects[draggedObject.idx].row = draggedObject.draggingRow;
                mapObjects[draggedObject.idx].col = draggedObject.draggingCol;
            }
        } else if (currentCell.inBounds) {
            //mainVM.handleCellClick(currentCell.row, currentCell.col);
        }

        selectedObject = draggedObject;
        dragging = false;
        draggingObject = false;
    });

    let goingLeft = false;
    let goingRight = false;
    let goingUp = false;
    let goingDown = false;

    $(document).on('keydown', function(e) {
        switch (e.which) {
            case arrow.left:
                goingLeft = true;
                break;
            case arrow.right:
                goingRight = true;
                break;
            case arrow.up:
                goingUp = true;
                break;
            case arrow.down:
                goingDown = true;
                break;
        }
    });

    $(document).on('keyup', function (e) {
        switch (e.which) {
            case arrow.left:
                goingLeft = false;
                break;
            case arrow.right:
                goingRight = false;
                break;
            case arrow.up:
                goingUp = false;
                break;
            case arrow.down:
                goingDown = false;
                break;
            case key_code.F5:
                drawGrid(mainVM.map);
                break;
            case key_code.delete:
                if (selectedObject != -1) {
                    deleteCellObjects(selectedObject);
                    mainVM.handleCellDeleteClick(selectedObject.row, selectedObject.col);
                }
                break;
            case key_code.esc:
                selectedObject = -1;
                mainVM.handleEsc();
                break;
        }
    });

    canvas.bind('click', function (e) {

    });

    // Ex:
    // In case of click
    // shouter.notifySubscribers({row: 0, col: 0}, SHOUT_GRID_CLICK);
    // In case of drag
    // shouter.notifySubscribers({row_src: 0, col_src: 0, row_dst: 0, col_dst: 0}, SHOUT_GRID_DRAG);
    // let updateGrid = function () {
    //   setTimeout(function () {
    //       drawGrid(mainVM.map);
    //       console.log('Updated Map');
    //       updateGrid();
    //   }, 1000);
    // };
    //
    // updateGrid();
};

module.exports = gfx;