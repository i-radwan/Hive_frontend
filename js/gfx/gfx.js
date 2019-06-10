require('two.js');
let ZUI = require('./zui');
let $ = require('jquery');
let ko = require('knockout');

let gfx = function (logicEventHandler) {
    let self = this;

    self.logicEventHandler = logicEventHandler;

    // Canvas & Two & ZUI initialization
    let canvas = $('.map-row');
    let two = new Two({
        width: canvas.width(),
        height: canvas.height(),
        autostart: true
    }).appendTo(canvas[0]);
    let zui = new ZUI(two);
    zui.addLimits(MIN_ZOOM_VAL, MAX_ZOOM_VAL);

    // Map Scene
    let gridMap;
    // Running mode
    let runningMode = RUNNING_MODE.DESIGN;
    let simulationPaused = false;

    // Mouse positions
    let mouseX = 0, mouseY = 0;

    // all of the scene objects (Racks, Robots...)
    let mapObjects;
    let mapWidth, mapHeight;

    // Dragging & Selecting Variables
    let startDragX = 0;
    let startDragY = 0;
    let draggedObject;
    let selectedObject = -1;
    let hoveredObject = {};
    let hovering = false;
    let hoveredObjectIsDrawn = false;
    let dragging = false;
    let draggingObject = false;

    // Keyboard Dragging Variables
    let goingLeft = false;
    let goingRight = false;
    let goingUp = false;
    let goingDown = false;

    // SVG Objects
    let robotSVG = 0, gateSVG = 0, stationSVG = 0, obstacleSVG = 0, rackSVG = 0;

    // Set the event handler that communicates with the mainVM
    self.setLogicEventHandler = function (logicEventHandler) {
        self.logicEventHandler = logicEventHandler;
    };

    let cursorCross = "move";
    let cursorDefault = "default";
    let cursorPointer = "pointer";
    let cursorCanGrab = "grab";
    let cursorGrabbing = "grabbing";
    // Sets the cursor style to the given style
    let setCursorStyle = function (style) {
      document.body.style.cursor = style;
    };

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
    let getMouseCell = function (mousePosX, mousePosY) {
        mousePosX = mousePosX - canvas.offset().left - gridMap.getBoundingClientRect().left;
        mousePosY = mousePosY - canvas.offset().top - gridMap.getBoundingClientRect().top;
        let cellWidth = (gridMap.getBoundingClientRect().width) / mapWidth;

        let cellRow = Math.floor(mousePosY / cellWidth);
        let cellCol = Math.floor(mousePosX / cellWidth);
        let ret = {row: cellRow, col: cellCol, inBounds: true};

        if (cellCol < 0 || cellCol >= mapWidth || cellRow < 0 || cellRow >= mapHeight)
            ret.inBounds = false;

        ret.row = Math.min(ret.row, mapHeight - 1);
        ret.row = Math.max(ret.row, 0);

        ret.col = Math.min(ret.col, mapWidth - 1);
        ret.col = Math.max(ret.col, 0);

        return ret;
    };

    // Gets the row and col of the cell based on the local x &y values
    let getCell = function (x, y) {
        let cellRow = Math.floor(y / GRID_CELL_LENGTH);
        let cellCol = Math.floor(x / GRID_CELL_LENGTH);
        let ret = {row: cellRow, col: cellCol, inBounds: true};

        if (cellCol < 0 || cellCol >= mapWidth || cellRow < 0 || cellRow >= mapHeight)
            ret.inBounds = false;

        ret.row = Math.min(ret.row, mapHeight - 1);
        ret.row = Math.max(ret.row, 0);

        ret.col = Math.min(ret.col, mapWidth - 1);
        ret.col = Math.max(ret.col, 0);

        return ret;
    };

    // Gets the idx of the object in the mapGrid two.Group
    let getRendererObjectIdx = function (row, col) {
      return col * mapHeight + row;
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

    // Creates the object given its type and position
    let createObject = function (row, col, type) {
        let cellTopLeft = getCellTopLeft(row, col);

        let object;
        switch (type) {
            case MAP_CELL.GATE:
                object = gateSVG.clone();
                object.translation.set(cellTopLeft.x, cellTopLeft.y);
                break;
            case MAP_CELL.ROBOT:
                object = robotSVG.clone();
                object.translation.set(cellTopLeft.x, cellTopLeft.y);
                break;
            case MAP_CELL.RACK:
                object = rackSVG.clone();
                object.translation.set(cellTopLeft.x, cellTopLeft.y);
                break;
            case MAP_CELL.STATION:
                object = stationSVG.clone();
                object.translation.set(cellTopLeft.x, cellTopLeft.y);
                break;
            case MAP_CELL.OBSTACLE:
                object = obstacleSVG.clone();
                object.translation.set(cellTopLeft.x, cellTopLeft.y);
                break;
        }

        return {two_object: object, type: type, row: row, col: col, rotation_vector: new Two.Vector(-GRID_CELL_LENGTH/2, -GRID_CELL_LENGTH/2)};
    };

    // Creates a cell at the given position and creates the objects that this cell contains
    let createCell = function (row, col) {
        let cellCenter = getCellCenter(row, col);
        let cellGroup = two.makeGroup();

        let square = two.makeRectangle(cellCenter.x, cellCenter.y, GRID_CELL_LENGTH, GRID_CELL_LENGTH);
        square.fill = '#1d1d1e';
        square.stroke = '#bababa';
        cellGroup.add(square);

        return cellGroup;
    };

    // Remove the dummy hovering object from being drawn
    let removeHoveringObject = function () {
        if (hoveredObjectIsDrawn) {
            getRendererObject(hoveredObject.row, hoveredObject.col).remove(hoveredObject.two_object);
        }
        hoveredObject = {};
        hovering = false;
        hoveredObjectIsDrawn = false;
    };

    // Remove the dummy hovering object that represents hovering
    let showHoveringObject = function () {
        console.log('Showing the hovering object');
        hoveredObjectIsDrawn = true;
        let cellTopLeft = getCellTopLeft(hoveredObject.row, hoveredObject.col);
        getRendererObject(hoveredObject.row, hoveredObject.col).add(hoveredObject.two_object);
        hoveredObject.two_object.translation.set(cellTopLeft.x, cellTopLeft.y);
    };

    // Hide hovering object from the drawing area
    let hideHoveringObject = function () {
        hoveredObjectIsDrawn = false;
        getRendererObject(hoveredObject.row, hoveredObject.col).remove(hoveredObject.two_object);
    };

    // Translates a two_object given its current position and destination
    let translateObject = function (object, srcRow, srcCol, dstRow, dstCol) {
        if (srcRow === dstRow && srcCol === dstCol) return;
        console.log('Moving from (', srcRow, ', ', srcCol, ') to (', dstRow, ', ',dstCol,')');

        getRendererObject(srcRow, srcCol).remove(object.two_object);

        let cellTopLeft = getCellTopLeft(dstRow, dstCol);

        getRendererObject(dstRow, dstCol).add(object.two_object);
        object.two_object.translation.set(cellTopLeft.x, cellTopLeft.y);

        return object;
    };

    // Start the hovering action
    let handleHover = function (type) {
        removeHoveringObject();

        let cell = getMouseCell(mouseX, mouseY);
        hoveredObject = createObject(cell.row, cell.col, type);
        hoveredObject.row = cell.row;
        hoveredObject.col = cell.col;
        hovering = true;
        hideHoveringObject();
    };

    // Adds object to the scene and put it in the mapObjects array
    let addObject = function (row, col, type) {
        let object = createObject(row, col, type);

        if (type === MAP_CELL.ROBOT)
            mapObjects[row][col].robot = object;
        else
            mapObjects[row][col].facility = object;
        getRendererObject(row, col).add(object.two_object);
    };

    // Updates the dragged object to the mapObject
    let dragObject = function (srcRow, srcCol, dstRow, dstCol) {
        translateObject(draggedObject, draggedObject.draggingRow, draggedObject.draggingCol, dstRow, dstCol);

        if (dstRow === srcRow && dstCol === srcCol)
            return;

        mapObjects[dstRow][dstCol] = {
            facility: {
                type: mapObjects[srcRow][srcCol].facility.type,
                two_object: mapObjects[srcRow][srcCol].facility.two_object,
                row: dstRow,
                col: dstCol,
                rotation_vector: mapObjects[srcRow][srcCol].facility.rotation_vector
            },
            robot: {
                type: mapObjects[srcRow][srcCol].robot.type,
                two_object: mapObjects[srcRow][srcCol].robot.two_object,
                row: dstRow,
                col: dstCol,
                rotation_vector: mapObjects[srcRow][srcCol].robot.rotation_vector
            }
        };
        mapObjects[srcRow][srcCol] = {
            facility: {
                type: MAP_CELL.EMPTY,
                two_object: -1,
                row: dstRow,
                col: dstCol
            },
            robot: {
                type: MAP_CELL.EMPTY,
                two_object: -1,
                row: dstRow,
                col: dstCol
            }
        };
    };

    // Deletes an object from the scene and removes it from mapObjects array.
    let deleteObject = function (row, col) {
        if (mapObjects[row][col].robot.type !== MAP_CELL.EMPTY)
            getRendererObject(row, col).remove(mapObjects[row][col].robot.two_object);

        if (mapObjects[row][col].facility.type !== MAP_CELL.EMPTY)
            getRendererObject(row, col).remove(mapObjects[row][col].facility.two_object);

        mapObjects[row][col] = {
            facility: {
                type: MAP_CELL.EMPTY,
                two_object: -1
            },
            robot: {
                type: MAP_CELL.EMPTY,
                two_object: -1
            }
        };
        selectedObject = -1;
    };

    // Highlights a certain object to be drawn differently and make it selected
    let highlightObject = function (row, col) {
        console.log('highlighting Object at  {', row, ', ', col, '}');

        // Can't select multiple would default to the facility
        if (mapObjects[row][col].facility.type !== MAP_CELL.EMPTY)
            selectedObject = mapObjects[row][col].facility;
        else
            selectedObject = mapObjects[row][col].robot;
        removeHoveringObject();
    };

    let animateObject = function (srcRow, srcCol, dstRow, dstCol, angle, translate_speed, rotate_speed) {
        let animatedObject;

        // Can't animate multiple would default to the robot
        if (mapObjects[srcRow][srcCol].robot.type !== MAP_CELL.EMPTY)
            animatedObject = mapObjects[srcRow][srcCol].robot;
        else
            animatedObject = mapObjects[srcRow][srcCol].facility;

        getRendererObject(srcRow, srcCol).remove(animatedObject.two_object);
        gridMap.add(animatedObject.two_object);
        animatedObject.animating = true;

            let dstTopLeft = getCellTopLeft(dstRow, dstCol);
            let srcTopLeft = getCellTopLeft(srcRow, srcCol);

        animatedObject.cur_x = srcTopLeft.x;
        animatedObject.cur_y = srcTopLeft.y;
        animatedObject.nxt_x = dstTopLeft.x;
        animatedObject.nxt_y = dstTopLeft.y;
        animatedObject.translate_speed = translate_speed;
        animatedObject.translating = true;
        animatedObject.cur_angle = 0;
        animatedObject.nxt_angle = angle;
        animatedObject.rotate_speed = rotate_speed;
        animatedObject.rotating = true;
    };

    let handleObjectsAnimation = function (timeDelta) {
        if (runningMode !== RUNNING_MODE.SIMULATE)
            return;

        for (let r = 0; r < mapObjects.length; r++) {
            for (let c = 0; c < mapObjects[r].length; c++) {
                if (mapObjects[r][c].facility.type === MAP_CELL.EMPTY && mapObjects[r][c].robot.type === MAP_CELL.EMPTY)
                    continue;
                if(!mapObjects[r][c].facility.animating && !mapObjects[r][c].robot.animating)
                    continue;

                // Can't animate multiple would default to the robot
                let animatedObject;

                if (mapObjects[r][c].robot.animating && mapObjects[r][c].robot.type !== MAP_CELL.EMPTY)
                    animatedObject = mapObjects[r][c].robot;
                else
                    animatedObject = mapObjects[r][c].facility;

                if (animatedObject.nxt_angle === animatedObject.cur_angle)
                    animatedObject.rotating = false;

                if (animatedObject.translating) {
                    let dir = new Two.Vector(animatedObject.nxt_x - animatedObject.cur_x, animatedObject.nxt_y - animatedObject.cur_y);
                    dir.normalize();
                    dir.multiplyScalar(animatedObject.translate_speed * timeDelta);

                    animatedObject.cur_x += dir.x;
                    animatedObject.cur_y += dir.y;

                    let dir2 = new Two.Vector(animatedObject.nxt_x - animatedObject.cur_x, animatedObject.nxt_y - animatedObject.cur_y);
                    dir2.normalize();
                    dir2.multiplyScalar(animatedObject.translate_speed * timeDelta);

                    // End of animation
                    if(!dir.equals(dir2) || (animatedObject.cur_x === animatedObject.nxt_x && animatedObject.cur_y === animatedObject.nxt_y)) {
                        let v = new Two.Vector(animatedObject.cur_x - dir.x, animatedObject.cur_y - dir.y);
                        let v2 = new Two.Vector(animatedObject.nxt_x, animatedObject.nxt_y);
                        dir.setLength(v.distanceTo(v2));
                        animatedObject.cur_x = animatedObject.nxt_x;
                        animatedObject.cur_y = animatedObject.nxt_y;
                        animatedObject.translating = false;
                    }
                    animatedObject.two_object.translation.addSelf(dir);
                }
                if (animatedObject.rotating) {
                    let dir = (animatedObject.nxt_angle - animatedObject.cur_angle) / Math.abs(animatedObject.nxt_angle - animatedObject.cur_angle);
                    dir *= animatedObject.rotate_speed * timeDelta;
                    animatedObject.cur_angle += dir;

                    let dir2 = (animatedObject.nxt_angle - animatedObject.cur_angle) / Math.abs(animatedObject.nxt_angle - animatedObject.cur_angle);
                    dir2 *= animatedObject.rotate_speed * timeDelta;

                    // End of animation
                    if (dir !== dir2 || animatedObject.cur_angle === animatedObject.nxt_angle) {
                        dir = animatedObject.nxt_angle - animatedObject.cur_angle + dir;
                        animatedObject.cur_angle = animatedObject.nxt_angle;
                        animatedObject.rotating = false;
                    }

                    // I hate Two.js
                    let theta = dir * Math.PI / 180;
                    let v2 = animatedObject.rotation_vector;
                    let v1 = v2.clone();

                    v2.x = v1.x * Math.cos(theta) - v1.y * Math.sin(theta);
                    v2.y = v1.x * Math.sin(theta) + v1.y * Math.cos(theta);

                    v1.multiplyScalar(-1);
                    v1.addSelf(v2);

                    animatedObject.two_object.rotation -= dir * Math.PI / 180;
                    animatedObject.two_object.translation.addSelf(v1.y, v1.x);
                }

                if (!animatedObject.translating && !animatedObject.rotating) {
                    animatedObject.animating = false;
                    let dst = getCell(animatedObject.nxt_x, animatedObject.nxt_y);

                    if (dst.row !== r || dst.col !== c) {
                        if (animatedObject.type === MAP_CELL.ROBOT) {
                            mapObjects[dst.row][dst.col].robot = {
                                type: animatedObject.type,
                                two_object: animatedObject.two_object,
                                row: dst.row,
                                col: dst.col,
                                rotation_vector: animatedObject.rotation_vector
                            };

                            mapObjects[r][c].robot = {
                                type: MAP_CELL.EMPTY,
                                two_object: -1
                            };
                        }

                        else {
                            mapObjects[dst.row][dst.col].facility = {
                                type: animatedObject.type,
                                two_object: animatedObject.two_object,
                                row: dst.row,
                                col: dst.col,
                                rotation_vector: animatedObject.rotation_vector
                            };

                            mapObjects[r][c].facility = {
                                type: MAP_CELL.EMPTY,
                                two_object: -1
                            };
                        }
                    }

                    gridMap.remove(animatedObject.two_object);
                    getRendererObject(dst.row, dst.col).add(animatedObject.two_object);

                    // TODO inform the event handler that the animation is done
                }
            }
        }
    };

    // Remove hovering object or deselect the selected object
    let handleEscape = function () {
        removeHoveringObject();
        selectedObject = -1;
    };

    let handleSimulationStart = function () {
        removeHoveringObject();
        runningMode = RUNNING_MODE.SIMULATE;
        simulationPaused = false;
    };

    let handleSimulationPause = function () {
        simulationPaused = true;
    };

    let handleSimulationResume = function () {
        simulationPaused = false;
    };

    let handleSimulationEnd = function () {
        runningMode = RUNNING_MODE.DESIGN;
    };

    // Draws the grid
    let drawGrid = function () {
        resetScene();

        gridMap = two.makeGroup();
        for(let c = 0;c < mapWidth; c++) {
            for(let r = 0; r < mapHeight; r++) {
                gridMap.add(createCell(r, c));
                mapObjects[r][c] = {
                    facility: {
                        type: MAP_CELL.EMPTY,
                        two_object: -1
                    },
                    robot: {
                        type: MAP_CELL.EMPTY,
                        two_object: -1
                    }
                };
            }
        }

        translateScene(two.width / 2, two.height / 2);
        translateScene(-(mapWidth * GRID_CELL_LENGTH) / 2, -(mapHeight * GRID_CELL_LENGTH) / 2);

        // What a magical equation !
        zui.zoomBy(-Math.pow(mapWidth * mapHeight, 0.5) / 30, two.width / 2 + canvas.offset().left,  two.height / 2 + canvas.offset().top);

        two.update();
    };

    // Translates the scene a tiny amount according to the pressed keys (should only be called in update function)
    let handleKeyboardDragEvent = function (timeDelta) {
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

        translateScene(timeDelta * KEYBOARD_DRAG_SPEED * horizontalDir, timeDelta * KEYBOARD_DRAG_SPEED * verticalDir);
    };

    // Sends to the mainVM event to delete the selected object
    let handleDeleteEvent = function () {
        if (selectedObject !== -1) {
            self.logicEventHandler({
                type: EVENT_FROM_GFX.CELL_DELETE,
                row: selectedObject.row,
                col: selectedObject.col
            });
        }
    };

    let handleDesignModeMouseDownEvent = function (e) {
        dragging = true;
        startDragX = e.clientX - canvas.offset().left;
        startDragY = e.clientY - canvas.offset().top;
        let cell = getMouseCell(e.clientX, e.clientY);
        setCursorStyle(cursorCross);

        if(cell.inBounds && !hovering) {
            let obj, cellType;
            if (mapObjects[cell.row][cell.col].facility.type !== MAP_CELL.EMPTY) {
                obj = mapObjects[cell.row][cell.col].facility;
                cellType = mapObjects[cell.row][cell.col].facility.type;
            }

            else if (mapObjects[cell.row][cell.col].robot.type !== MAP_CELL.EMPTY) {
                obj = mapObjects[cell.row][cell.col].robot;
                cellType = mapObjects[cell.row][cell.col].robot.type;
            }

            if (cellType !== MAP_CELL.EMPTY) {
                setCursorStyle(cursorGrabbing);
                draggingObject = true;
                draggedObject = obj;
                draggedObject.draggingRow = cell.row;
                draggedObject.draggingCol = cell.col;
                draggedObject.row = cell.row;
                draggedObject.col = cell.col;
            } else {
                draggingObject = false;
                draggedObject = -1;
            }
        }
        else if (hovering) {
            setCursorStyle(cursorGrabbing);
        }
    };

    let handleSimulationModeMouseDownEvent = function (e) {
        dragging = true;
        draggingObject = false;
        draggedObject = -1;
        startDragX = e.clientX - canvas.offset().left;
        startDragY = e.clientY - canvas.offset().top;
    };

    // Does the updates required at every time step
    two.bind('update', function () {
        handleKeyboardDragEvent(two.timeDelta);
        handleObjectsAnimation(two.timeDelta);
    });

    // Handles zooming
    canvas.bind('mousewheel', function (e) {
        const delta = e.originalEvent.wheelDelta / 1000;
        zui.zoomBy(delta, e.clientX, e.clientY);
    });

    // Handles initial Dragging click
    canvas.bind('mousedown', function (e) {
        if (e.which !== 1)
            return;
        if (runningMode === RUNNING_MODE.DESIGN)
            handleDesignModeMouseDownEvent(e);
        else
            handleSimulationModeMouseDownEvent(e);
    });

    // Handles intermediate Dragging move
    canvas.bind('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        let currentCell = getMouseCell(mouseX, mouseY);
        self.logicEventHandler({
            type: EVENT_FROM_GFX.CELL_HOVER,
            row: currentCell.row,
            col: currentCell.col
        });

        if(hovering) {
            setCursorStyle(cursorCanGrab);
            if(currentCell.inBounds && !hoveredObjectIsDrawn) {
                // I think they could be removed TODO
                hoveredObject.row = currentCell.row;
                hoveredObject.col = currentCell.col;

                showHoveringObject();
            }
            if (!currentCell.inBounds && hoveredObjectIsDrawn) {
                hideHoveringObject();
            }

            if(hoveredObjectIsDrawn) {
                translateObject(hoveredObject, hoveredObject.row, hoveredObject.col, currentCell.row, currentCell.col);
            }

            hoveredObject.row = currentCell.row;
            hoveredObject.col = currentCell.col;
        }

        if(!dragging) {
            if (currentCell.inBounds) {
                if (mapObjects[currentCell.row][currentCell.col].facility.type !== MAP_CELL.EMPTY || mapObjects[currentCell.row][currentCell.col].robot.type !== MAP_CELL.EMPTY) {
                    setCursorStyle(cursorCanGrab);
                    return;
                }
            }
            if (!hovering)
                setCursorStyle(cursorDefault);
            return;
        }
        if (draggingObject) {
            translateObject(draggedObject, draggedObject.draggingRow, draggedObject.draggingCol, currentCell.row, currentCell.col);
            draggedObject.draggingRow = currentCell.row;
            draggedObject.draggingCol = currentCell.col;
            return;
        }
        let dirX = mouseX - canvas.offset().left - startDragX;
        let dirY = mouseY - canvas.offset().top - startDragY;


        translateScene(dirX, dirY);

        startDragX = mouseX - canvas.offset().left;
        startDragY = mouseY - canvas.offset().top;
    });

    let x = 0;

    canvas.bind('contextmenu', function () {
       //  if (x%9 === 0) {
       //      handleSimulationStart();
       //      animateObject(0, 0, 0, 0, 90, 0.1, 0.5);
       //  } else if (x%9 === 1) {
       //      animateObject(0, 0, 0, 5, 0, 0.1, 0.1);
       //  } else if (x%9 === 2) {
       //      animateObject(0, 5, 0, 5, -90, 0.1, 0.5);
       //  } else if (x%9 === 3) {
       //      animateObject(0, 5, 5, 5, 0, 0.1, 0.1);
       //  } else if (x%9 === 4) {
       //      animateObject(5, 5, 5, 5, -90, 0.1, 0.5);
       //  } else if (x%9 === 5) {
       //      animateObject(5, 5, 5, 0, 0, 0.1, 0.1);
       //  } else if (x%9 === 6) {
       //      animateObject(5, 0, 5, 0, -90, 0.1, 0.5);
       //  } else if (x%9 === 7) {
       //      animateObject(5, 0, 0, 0, 0, 0.1, 0.1);
       //  } else if (x%9 === 8) {
       //      animateObject(0, 0, 0, 0, -180, 0.1, 0.5);
       //  }
       // x++;
    });

    // Handles final dragging move and mouse clicks
    canvas.bind('mouseup', function (e) {
        if (e.which !== 1)
            return;

        let currentCell = getMouseCell(e.clientX, e.clientY);
        setCursorStyle(cursorDefault);
        if (draggingObject && (draggedObject.row !== currentCell.row || draggedObject.col !== currentCell.col)) {
            self.logicEventHandler({
                type: EVENT_FROM_GFX.CELL_DRAG,
                src_row: draggedObject.row,
                src_col: draggedObject.col,
                dst_row: currentCell.row,
                dst_col: currentCell.col
            });
        }
        else {
            if(currentCell.inBounds) {
                self.logicEventHandler({
                    type: EVENT_FROM_GFX.CELL_CLICK,
                    row: currentCell.row,
                    col: currentCell.col
                });
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
                drawGrid();
                break;
            case KEY_CODE.DELETE:
                handleDeleteEvent();
                break;
            case KEY_CODE.ESC:
                self.logicEventHandler({
                    type: EVENT_FROM_GFX.ESC,
                });
                break;
        }
    });

    // Initializes the canvas with a certain width and height
    let init = function(width, height) {
        // Set width and height
        mapWidth = width;
        mapHeight = height;

        mapObjects = new Array(mapHeight);

        for(let i = 0; i < mapHeight; i++) {
            mapObjects[i] = new Array(mapWidth);
        }

        // Load robot svg
        robotSVG = two.load(GFX_SVG_MODEL.ROBOT);
        gateSVG = two.load(GFX_SVG_MODEL.GATE);
        stationSVG = two.load(GFX_SVG_MODEL.STATION);
        obstacleSVG = two.load(GFX_SVG_MODEL.OBSTACLE);
        rackSVG = two.load(GFX_SVG_MODEL.RACK);

        drawGrid();
    };

    // The handler that handles all the events coming from the mainVM
    self.eventHandler = function (event) {
        switch (event.type) {
            case EVENT_TO_GFX.INIT:
                init(event.data.width, event.data.height);
                break;
            case EVENT_TO_GFX.OBJECT_HOVER:
                handleHover(event.data.type);
                break;
            case EVENT_TO_GFX.OBJECT_ADD:
                addObject(event.data.row, event.data.col, event.data.type);
                break;
            case EVENT_TO_GFX.OBJECT_DELETE:
                deleteObject(event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_DRAG:
                dragObject(event.data.src_row, event.data.src_col, event.data.dst_row, event.data.dst_col);
                break;
            case EVENT_TO_GFX.OBJECT_MOVE:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_ROTATE_RIGHT:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_ROTATE_LEFT:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_RETREAT:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_HIGHLIGHT:
                highlightObject(event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_COLORIZE:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_DECOLORIZE:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_BIND:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_UNBIND:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_LOAD:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_OFFLOAD:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_FAILURE:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_STOP:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_FIXED:
                // TODO
                break;
            case EVENT_TO_GFX.OBJECT_UPDATE:
                // TODO
                break;
            case EVENT_TO_GFX.SIMULATION_START:
                handleSimulationStart();
                break;
            case EVENT_TO_GFX.SIMULATION_PAUSE:
                handleSimulationPause();
                break;
            case EVENT_TO_GFX.SIMULATION_RESUME:
                handleSimulationResume();
                break;
            case EVENT_TO_GFX.SIMULATION_STOP:
                handleSimulationEnd();
                break;
            case EVENT_TO_GFX.ESC:
                handleEscape();
                break;
            //case EVENT_TO_GFX.ANIMATE_OBJECT:
            //    animateObject(event.src_row, event.src_col, event.dst_row, event.dst_col, event.animation_speed);
            //    break;
        }
    };


    // Redraws the grid in a loop forever (until we find a way to update the map)
    // let updateGrid = function () {
    //   setTimeout(function () {
    //       drawGrid();
    //       console.log('Updated Map');
    //       updateGrid();
    //   }, 500);
    // };
    //
    // updateGrid();
};

module.exports = gfx;