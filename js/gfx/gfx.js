require('two.js');
let ZUI = require('./zui');
let $ = require('jquery');
let ko = require('knockout');

let gfx = function (mainVM) {
    // Canvas & Two & ZUI initialization
    let canvas = $('.map-row');
    let two = new Two({
        width: canvas.width(),
        height: canvas.height(),
        autostart: true
    }).appendTo(canvas[0]);
    let zui = new ZUI(two);
    let gridMap;
    zui.addLimits(MIN_ZOOM_VAL, MAX_ZOOM_VAL);

    // all of the scene objects (Racks, Robots...)
    let mapObjects = [];

    // Dragging & Selecting Variables
    let startDragX = 0;
    let startDragY = 0;
    let draggedObject;
    let selectedObject = -1;
    let dragging = false;
    let draggingObject = false;

    // Keyboard Dragging Variables
    let goingLeft = false;
    let goingRight = false;
    let goingUp = false;
    let goingDown = false;

    // SVG Objects
    let robotSVG = 0;

    // Translate the scene with the given direction (Handles ZUI transformation matrix)
    let translateScene = function (dx, dy) {
        zui.translateSurface(dx ,dy);
        two.scene.translation.addSelf(dx ,dy);
    };

    // Removes all the translations and scale to the scene
    let resetScene = function () {
        zui.reset();
        zui.updateSurface();
        two.scene.translation.set(0, 0);
        two.clear();
    };

    // Gets from the mouse raw position the row and column of the cell that is being clicked (if out of bounds it returns the nearest cell)
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

    // Gets the idx of the object in the mapObject array (if it doesn't exist returns -1)
    let getMapObjectIdx = function (row, col) {
      for(let i = 0; i < mapObjects.length;i++) {
          if (mapObjects[i].row == row && mapObjects[i].col == col)
              return i;
      }
      return -1;
    };

    // Gets the object in the mapObject array (if it doesn't exist returns -1)
    let getMapObject = function (row, col) {
        let idx = getMapObjectIdx(row, col);
        return idx == -1 ? -1 : mapObjects[idx];
    };

    // Gets the idx of the object in the mapGrid two.Group
    let getRendererObjectIdx = function (row, col) {
      return col * mainVM.map.height + row;
    };

    // Gets the object in the mapGrid two.Group
    let getRendererObject = function (row, col) {
      return gridMap.children[getRendererObjectIdx(row, col)];
    };

    // Gets the Top left of the cell in coordinate values (x, y) to draw the objects
    let getCellTopLeft = function (row, col) {
        let cellCenterX = col*GRID_CELL_LENGTH;
        let cellCenterY = row*GRID_CELL_LENGTH;

        return {x: cellCenterX, y: cellCenterY};
    };

    // Gets the center of the cell in coordinate values (x, y) to draw the objects
    let getCellCenter = function (row, col) {
        let ret = getCellTopLeft(row, col);

        ret.x += GRID_CELL_LENGTH / 2;
        ret.y += GRID_CELL_LENGTH / 2;

        return ret;
    };



    let loadSvgFile = async function(path) {
        let promise = new Promise(function (resolve) {
            two.load(path, function (svg) {
                resolve(svg);
            });
        });

        return await promise;
    };

    // Creates the object given its type and position and appends it to the mapObjects array
    let createObject = function (row, col, type) {
        let cellCenter = getCellCenter(row, col);
        let object;
        switch (type) {
            case MAP_CELL.ENTRY:
                object = two.makeCircle(cellCenter.x, cellCenter.y, 10);
                object.fill = "#8b0000";
                break;
            case MAP_CELL.ROBOT:
                object = robotSVG.clone();
                let cellTopLeft = getCellTopLeft(row, col);
                object.translation.set(cellTopLeft.x, cellTopLeft.y);
                //object = two.makeCircle(cellCenter.x, cellCenter.y, 10);
                //object.fill = "#e09500";
                break;
            case MAP_CELL.RACK:
                object = two.makeCircle(cellCenter.x, cellCenter.y, 10);
                object.fill = "#3972bf";
                break;
            case MAP_CELL.PARK:
                object = two.makeCircle(cellCenter.x, cellCenter.y, 10);
                object.fill = "#78c631";
                break;
            case MAP_CELL.OBSTACLE:
                object = two.makeCircle(cellCenter.x, cellCenter.y, 10);
                object.fill = "#1d1d1e";
                break;
        }
        let ret = {twoObject: object, type: type, row: row, col: col, idx: mapObjects.length};
        mapObjects.push(ret);
        return ret;
    };

    // Creates a cell at the given position and creates the objects that this cell contains
    let createCell = function (row, col, type) {
        let cellCenter = getCellCenter(row, col);
        let cellGroup = two.makeGroup();

        let square = two.makeRectangle(cellCenter.x, cellCenter.y, GRID_CELL_LENGTH, GRID_CELL_LENGTH);
        square.fill = '#bababa';
        cellGroup.add(square);
        if (type !== MAP_CELL.EMPTY) {
            let object = createObject(row, col, type);

            cellGroup.add(object.twoObject);
        }

        return cellGroup;
    };

    // Translates a twoObject given its current position and destination
    let translateObject = function (object, srcRow, srcCol, dstRow, dstCol) {
        if (srcRow == dstRow && srcCol == dstCol) return;
        console.log('Moving from (', srcRow, ', ', srcCol, ') to (', dstRow, ', ',dstCol,')');

        getRendererObject(srcRow, srcCol).remove(object.twoObject);

        let cellTopLeft = getCellTopLeft(dstRow, dstCol);

        getRendererObject(dstRow, dstCol).add(object.twoObject);
        let childIdx = getRendererObject(dstRow, dstCol).children.length - 1;
        getRendererObject(dstRow, dstCol).children[childIdx].translation.set(cellTopLeft.x, cellTopLeft.y);

        return object;
    };

    // Deletes an object from the scene and removes it from mabObjects array.
    let deleteCellObject = function (cellObject) {
        getRendererObject(cellObject.row, cellObject.col).remove(cellObject.twoObject);

        mapObjects[cellObject.idx] = mapObjects[mapObjects.length - 1];
        mapObjects[cellObject.idx].idx = cellObject.idx;
        mapObjects.pop();
    };

    // Draws the grid
    let drawGrid = function (map) {
        mapObjects = [];
        resetScene();

        let width = map.width;
        let height = map.height;

        gridMap = two.makeGroup();
        for(let c = 0;c < width; c++) {
            for(let r = 0; r < height; r++) {
                gridMap.add(createCell(r, c, mainVM.map.grid[r][c].type));
            }
        }

        translateScene(two.width / 2, two.height / 2);
        translateScene(-(width * GRID_CELL_LENGTH) / 2, -(height * GRID_CELL_LENGTH) / 2);

        // What a magical equation !
        zui.zoomBy(-Math.pow(mainVM.map.width * mainVM.map.height, 0.5) / 30, two.width / 2 + canvas.offset().left,  two.height / 2 + canvas.offset().top);


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

    // Translates the scene a tiny amount according to the pressed keys (should only be called in update function)
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

        translateScene(KEYBOARD_DRAG_SPEED * horizontalDir, KEYBOARD_DRAG_SPEED * verticalDir);
    };

    // Does the updates required at every time step
    two.bind('update', function () {
        handleKeyboardDrag();
    });

    // Handles zooming
    canvas.bind('mousewheel', function (e) {
        const delta = e.originalEvent.wheelDelta / 1000;
        zui.zoomBy(delta, e.clientX, e.clientY);
    });

    // Handles initial Dragging click
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
        }
    });

    // Handles intermediate Dragging move
    canvas.bind('mousemove', function (e) {
        if(!dragging) return;
        if (draggingObject) {
            let currentCell = getMouseCell(e.clientX, e.clientY);
            translateObject(draggedObject, draggedObject.draggingRow, draggedObject.draggingCol, currentCell.row, currentCell.col);

            draggedObject.draggingRow = currentCell.row;
            draggedObject.draggingCol = currentCell.col;
            return;
        }
        let dirX = e.clientX - canvas.offset().left - startDragX;
        let dirY = e.clientY - canvas.offset().top - startDragY;


        translateScene(dirX, dirY);

        startDragX = e.clientX - canvas.offset().left;
        startDragY = e.clientY - canvas.offset().top;
    });

    // Handles final dragging move and mouse clicks
    canvas.bind('mouseup', function (e) {
        let currentCell = getMouseCell(e.clientX, e.clientY);
        if (!draggingObject)
            selectedObject = -1;
        else {
            selectedObject = mapObjects[draggedObject.idx];

            if (draggedObject.row != currentCell.row || draggedObject.col != currentCell.col) {
                mainVM.handleCellDrag(draggedObject.row, draggedObject.col, currentCell.row, currentCell.col);

                if (getMapObjectIdx(draggedObject.draggingRow, draggedObject.draggingCol) !== -1)  { // not empty cell
                    translateObject(draggedObject, draggedObject.draggingRow, draggedObject.draggingCol, draggedObject.row, draggedObject.col);
                }
                else {
                    mapObjects[draggedObject.idx].row = draggedObject.draggingRow;
                    mapObjects[draggedObject.idx].col = draggedObject.draggingCol;
                }
            }
        }

        dragging = false;
        draggingObject = false;
    });

    // Handles Drag arrow keys
    $(document).on('keydown', function(e) {
        switch (e.which) {
            case ARROW.LEFT:
                goingLeft = true;
                break;
            case ARROW.RIGHT:
                goingRight = true;
                break;
            case ARROW.UP:
                goingUp = true;
                break;
            case ARROW.DOWN:
                goingDown = true;
                break;
        }
    });

    // Handles other keys pressed and stops the dragging arrows
    $(document).on('keyup', function (e) {
        switch (e.which) {
            case ARROW.LEFT:
                goingLeft = false;
                break;
            case ARROW.RIGHT:
                goingRight = false;
                break;
            case ARROW.UP:
                goingUp = false;
                break;
            case ARROW.DOWN:
                goingDown = false;
                break;
            case KEY_CODE.F5:
                drawGrid(mainVM.map);
                break;
            case KEY_CODE.DELETE:
                if (selectedObject != -1) {
                    deleteCellObject(selectedObject);
                    mainVM.handleCellDeleteClick(selectedObject.row, selectedObject.col);
                    selectedObject = -1;
                }
                break;
            case KEY_CODE.ESC:
                selectedObject = -1;
                mainVM.handleEsc();
                break;
        }
    });
    
    let init = async function() {
        // Load robot svg
        robotSVG = await loadSvgFile('./svg_models/robot.svg');

        drawGrid(mainVM.map);
    };

    // The only line of code in this file :V
    init();
};

module.exports = gfx;