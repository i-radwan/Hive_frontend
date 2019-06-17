require('two.js');
let $ = require('jquery');
let ZUI = require('./zui');

// Z-Index enum
let Z_INDEX = {
    BACKGROUND: 0,
    STATION: 1,
    GATE: 2,
    ROBOT: 3,
    RACK: 4,
    OBSTACLE: 5,
    DRAG: 6,
    HOVER: 6
};

const Z_INDEX_GROUPS_CNT = 7;

let gfxEngine = function () {
    let self = this;

    // Zui and Two.js variables
    let zui;
    let canvas = $('.map-row');
    self.two = new Two({
        width: canvas.width(),
        height: canvas.height(),
        autostart: true
    }).appendTo(canvas[0]);

    // Map information
    let mapWidth, mapHeight;

    // Two.js Groups for Z-Index
    let zIndexGroups = [];

    // Map Drag variables
    let dragVariables = {};

    // Mouse state
    let isMouseDown = false;

    // Hovered & dragged & selected object & their metadata
    let hoveredObject = {};
    let draggedObject = {};
    let selectedObject = {};

    // Keyboard Dragging Variables
    let goingLeft = false;
    let goingRight = false;
    let goingUp = false;
    let goingDown = false;

    // SVG Objects
    let robotSVG = [], gateSVG = 0, stationSVG = 0, obstacleSVG = 0, rackSVG = 0;

    // Removes all the translations and scale to the scene and reinitialize the Z-Index groups
    let resetScene = function () {
        zui.reset();
        zui.updateSurface();
        self.two.scene.translation.set(0, 0);
        self.two.clear();

        // Initialize z index groups
        zIndexGroups = new Array(Z_INDEX_GROUPS_CNT);
        for (let i = 0; i < Z_INDEX_GROUPS_CNT; i++) {
            zIndexGroups[i] = self.two.makeGroup();
        }
    };

    // Resize window
    window.addEventListener('resize', function (e) {
        self.two.width = canvas.width();
        self.two.height = canvas.height();
    });

    // Return the Z-Index enum value from the object type
    let getObjectZIndex = function (objectType) {
        switch (objectType) {
            case MAP_CELL.GATE:
                return Z_INDEX.GATE;
            case MAP_CELL.OBSTACLE:
                return Z_INDEX.OBSTACLE;
            case MAP_CELL.RACK:
                return Z_INDEX.RACK;
            case MAP_CELL.ROBOT:
                return Z_INDEX.ROBOT;
            case MAP_CELL.STATION:
                return Z_INDEX.STATION;
        }
    };

    // Translate the scene with the given direction (Handles ZUI transformation matrix)
    let translateScene = function (dx, dy) {
        zui.translateSurface(dx, dy);
        self.two.scene.translation.addSelf(dx, dy);
    };

    // Gets the Top left of the cell in coordinate values (x, y) to draw the objects
    let getCellTopLeft = function (row, col) {
        let cellCenterX = col * GRID_CELL_LENGTH;
        let cellCenterY = row * GRID_CELL_LENGTH;

        return {x: cellCenterX, y: cellCenterY};
    };

    // Gets the center of the cell in coordinate values (x, y) to draw the objects
    let getCellCenter = function (row, col) {
        let ret = getCellTopLeft(row, col);

        ret.x += GRID_CELL_LENGTH / 2;
        ret.y += GRID_CELL_LENGTH / 2;

        return ret;
    };

    // Creates a cell at the given position and creates the objects that this cell contains
    let createCell = function (row, col) {
        let cellCenter = getCellCenter(row, col);

        let square = self.two.makeRectangle(cellCenter.x, cellCenter.y, GRID_CELL_LENGTH, GRID_CELL_LENGTH);
        square.fill = '#1d1d1e';
        square.stroke = '#bababa';

        return square;
    };

    // Updates the object Z-Index
    let updateZIndex = function (renderObject, targetZIndex) {
        renderObject.z_index = targetZIndex;

        zIndexGroups[targetZIndex].add(renderObject.two_object);
        self.two.update();
    };

    // Converts from DIR enum to scalar angle
    let dirToAngle = function (direction) {
        switch (direction) {
            case ROBOT_DIR.RIGHT:
                return 0;
            case ROBOT_DIR.UP:
                return 90;
            case ROBOT_DIR.LEFT:
                return 180;
            case ROBOT_DIR.DOWN:
                return 270;
        }
    };

    // Returns the default color of the object
    let objectTypeToDefaultColor = function (type) {
        switch (type) {
            case MAP_CELL.ROBOT:
                return GFX_COLORS_DEFAULT.ROBOT;
            case MAP_CELL.GATE:
                return GFX_COLORS_DEFAULT.GATE;
            case MAP_CELL.RACK:
                return GFX_COLORS_DEFAULT.RACK;
            case MAP_CELL.STATION:
                return GFX_COLORS_DEFAULT.STATION;
            case MAP_CELL.OBSTACLE:
                return GFX_COLORS_DEFAULT.OBSTACLE;
        }
    };

    // Returns the color of the bound object
    let objectTypeToBindColor = function (type) {
        switch (type) {
            case MAP_CELL.GATE:
                return GFX_COLORS.GATE_BIND_COLOR;
            case MAP_CELL.RACK:
                return GFX_COLORS.RACK_LOAD_COLOR;
            case MAP_CELL.STATION:
                return GFX_COLORS.STATION_BIND_COLOR;
        }
    };

    // Returns the flash color to make.
    let getFlashType = function (isBound, isLoaded, isFailed) {
        if (isFailed)
            return FLASH_TYPE.FAILURE;
        if (isBound)
            return FLASH_TYPE.BIND;
        if (isLoaded)
            return FLASH_TYPE.LOAD;

        return FLASH_TYPE.NO_FLASH;
    };

    // Move object with the given time delta
    let moveObject = function (object, timeDelta) {
        let dir = new Two.Vector(object.animation_variables.nxt_x - object.animation_variables.cur_x, object.animation_variables.nxt_y - object.animation_variables.cur_y);

        dir.normalize();
        dir.multiplyScalar(object.animation_variables.moving_speed * timeDelta);

        object.animation_variables.cur_x += dir.x;
        object.animation_variables.cur_y += dir.y;

        let dir2 = new Two.Vector(object.animation_variables.nxt_x - object.animation_variables.cur_x, object.animation_variables.nxt_y - object.animation_variables.cur_y);

        dir2.normalize();
        dir2.multiplyScalar(object.animation_variables.moving_speed * timeDelta);

        // End of animation
        if (!dir.equals(dir2) || (object.animation_variables.cur_x === object.animation_variables.nxt_x && object.animation_variables.cur_y === object.animation_variables.nxt_y)) {
            let v = new Two.Vector(object.animation_variables.cur_x - dir.x, object.animation_variables.cur_y - dir.y);
            let v2 = new Two.Vector(object.animation_variables.nxt_x, object.animation_variables.nxt_y);

            dir.setLength(v.distanceTo(v2));

            object.animation_variables.cur_x = object.animation_variables.nxt_x;
            object.animation_variables.cur_y = object.animation_variables.nxt_y;
            object.animation_variables.is_moving = false;
        }

        object.two_object.translation.addSelf(dir);
    };

    // Normalizes a given angle (positive <= 360)
    let normalizeAngle = function (angle) {
        while (angle > 360)
            angle -= 360;

        while (angle < 0)
            angle += 360;

        return angle
    };

    // Rotate object with the given time delta
    let rotateObject = function (object, timeDelta) {
        let dir = (object.animation_variables.nxt_angle - object.animation_variables.cur_angle) / Math.abs(object.animation_variables.nxt_angle - object.animation_variables.cur_angle);
        dir *= object.animation_variables.rotating_speed * timeDelta;

        object.animation_variables.cur_angle += dir;

        let dir2 = (object.animation_variables.nxt_angle - object.animation_variables.cur_angle) / Math.abs(object.animation_variables.nxt_angle - object.animation_variables.cur_angle);
        dir2 *= object.animation_variables.rotating_speed * timeDelta;

        // End of animation
        if (dir !== dir2 || object.animation_variables.cur_angle === object.animation_variables.nxt_angle) {
            dir = object.animation_variables.nxt_angle - object.animation_variables.cur_angle + dir;
            object.animation_variables.cur_angle = object.animation_variables.nxt_angle;
            object.animation_variables.is_rotating = false;
        }

        // I hate Two.js 😅
        let theta = dir * Math.PI / 180;
        let v2 = object.animation_variables.rotation_vector;
        let v1 = v2.clone();

        v2.x = v1.x * Math.cos(theta) - v1.y * Math.sin(theta);
        v2.y = v1.x * Math.sin(theta) + v1.y * Math.cos(theta);

        v1.multiplyScalar(-1);
        v1.addSelf(v2);

        object.two_object.rotation -= dir * Math.PI / 180;
        object.two_object.translation.addSelf(v1.y, v1.x);
    };

    // Colorizes the rack
    let colorizeRack = function (renderObject, color) {
        for (let i = 0; i < renderObject.two_object.children.length; i++) {
            renderObject.two_object.children[i].fill = color;
            renderObject.two_object.children[i].stroke = color;
        }

        renderObject.color = color;
    };

    // Colorizes the robot
    let colorizeRobot = function (renderObject, color) {
        for (let i = 0; i < renderObject.two_object.children.length; i++) {
            if (renderObject.two_object.children[i].fill === renderObject.color) {
                renderObject.two_object.children[i].fill = color;
            }
        }

        renderObject.color = color;
    };

    // Colorize the robot LED
    let colorizeRobotLed = function (renderObject, color) {
        for (let i = 0; i < renderObject.two_object.children.length; i++) {
            if (renderObject.two_object.children[i].fill === renderObject.led_color) {
                renderObject.two_object.children[i].fill = color;
            }
        }

        renderObject.led_color = color;
    };

    // Colorizes the station
    let colorizeStation = function (renderObject, color) {
        for (let i = 0; i < renderObject.two_object.children.length; i++) {
            renderObject.two_object.children[i].fill = color;
        }

        renderObject.color = color;
    };

    // Colorizes the obstacle
    let colorizeObstacle = function (renderObject, color) {
        for (let i = 0; i < renderObject.two_object.children.length; i++) {
            renderObject.two_object.children[i].fill = color;
        }

        renderObject.color = color;
    };

    // Colorizes the gate
    let colorizeGate = function (renderObject, color) {
        for (let i = 0; i < renderObject.two_object.children.length; i++) {
            renderObject.two_object.children[i].fill = color;
            renderObject.two_object.children[i].stroke = color;
        }

        renderObject.color = color;
    };

    // Initialize the Graphics engine
    self.init = function () {
        zui = new ZUI(self.two);
        zui.addLimits(MIN_ZOOM_VAL, MAX_ZOOM_VAL);

        // Load robot svg
        robotSVG = new Array(GFX_SVG_MODEL.ROBOT.length);

        for (let i = 0; i < GFX_SVG_MODEL.ROBOT.length; i++) {
            robotSVG[i] = self.two.load(GFX_SVG_MODEL.ROBOT[i]);
        }

        gateSVG = self.two.load(GFX_SVG_MODEL.GATE);
        stationSVG = self.two.load(GFX_SVG_MODEL.STATION);
        obstacleSVG = self.two.load(GFX_SVG_MODEL.OBSTACLE);
        rackSVG = self.two.load(GFX_SVG_MODEL.RACK);
    };

    // Draw the grid of the map with the given width and height
    self.drawMapGrid = function (width, height) {
        mapWidth = width;
        mapHeight = height;

        resetScene();

        for (let c = 0; c < width; c++) {
            for (let r = 0; r < height; r++) {
                zIndexGroups[Z_INDEX.BACKGROUND].add(createCell(r, c));
            }
        }

        translateScene(self.two.width / 2, self.two.height / 2);
        translateScene(-(mapWidth * GRID_CELL_LENGTH) / 2, -(mapHeight * GRID_CELL_LENGTH) / 2);

        // What a magical equation !
        zui.zoomBy(-Math.pow(mapWidth * mapHeight, 0.5) / 30, self.two.width / 2 + canvas.offset().left, self.two.height / 2 + canvas.offset().top);

        self.two.update();
    };

    // Return the object that is currently selected
    self.getSelectedObject = function () {
        return selectedObject;
    };

    // Gets from the mouse raw position the row and column of the cell that is being clicked
    self.getMouseCell = function (mouseX, mouseY) {
        mouseX = mouseX - canvas.offset().left - zIndexGroups[Z_INDEX.BACKGROUND].getBoundingClientRect().left;
        mouseY = mouseY - canvas.offset().top - zIndexGroups[Z_INDEX.BACKGROUND].getBoundingClientRect().top;

        let cellWidth = (zIndexGroups[Z_INDEX.BACKGROUND].getBoundingClientRect().width) / mapWidth;

        let cellRow = Math.floor(mouseY / cellWidth);
        let cellCol = Math.floor(mouseX / cellWidth);

        return {row: cellRow, col: cellCol};
    };

    // Adds an object to the scene
    self.addObject = function (id, type, row, col, color, zIndexValue = -1) {
        let cellTopLeft = getCellTopLeft(row, col);
        let defaultColor;
        let targetColor = color;
        let ledColor = undefined;

        let twoObject;

        switch (type) {
            case MAP_CELL.GATE:
                twoObject = gateSVG.clone();
                twoObject.translation.set(cellTopLeft.x, cellTopLeft.y);
                defaultColor = GFX_COLORS_DEFAULT.GATE;
                break;
            case MAP_CELL.ROBOT:
                twoObject = robotSVG[10].clone();
                twoObject.translation.set(cellTopLeft.x, cellTopLeft.y);
                defaultColor = GFX_COLORS_DEFAULT.ROBOT;
                ledColor = GFX_COLORS_DEFAULT.ROBOT_LED;
                break;
            case MAP_CELL.RACK:
                twoObject = rackSVG.clone();
                twoObject.translation.set(cellTopLeft.x, cellTopLeft.y);
                defaultColor = GFX_COLORS_DEFAULT.RACK;
                break;
            case MAP_CELL.STATION:
                twoObject = stationSVG.clone();
                twoObject.translation.set(cellTopLeft.x, cellTopLeft.y);
                defaultColor = GFX_COLORS_DEFAULT.STATION;
                break;
            case MAP_CELL.OBSTACLE:
                twoObject = obstacleSVG.clone();
                twoObject.translation.set(cellTopLeft.x, cellTopLeft.y);
                defaultColor = GFX_COLORS_DEFAULT.OBSTACLE;
                break;
        }

        zIndexValue = (zIndexValue === -1 ? getObjectZIndex(type) : zIndexValue);
        zIndexGroups[zIndexValue].add(twoObject);

        let ret = {
            type: type,
            id: id,
            loaded_object_id: -1,
            loaded_object_type: -1,
            bound_object_id: -1,
            bound_object_type: -1,
            render_variables: {
                two_object: twoObject,
                z_index: zIndexValue,
                direction: ROBOT_DIR.RIGHT,
                color: defaultColor,
                led_color: ledColor,
                animation_variables: {
                    cur_x: cellTopLeft.x,
                    cur_y: cellTopLeft.y,
                    cur_angle: 0,
                    rotation_vector: new Two.Vector(-GRID_CELL_LENGTH / 2, -GRID_CELL_LENGTH / 2)
                }
            }
        };

        self.colorizeObject(ret.render_variables, ret.type, targetColor);

        return ret;
    };

    // Translates the given object to the given new row and column
    self.translateObject = function (renderObject, dstRow, dstCol) {
        let cellTopLeft = getCellTopLeft(dstRow, dstCol);

        renderObject.two_object.translation.set(cellTopLeft.x, cellTopLeft.y);
    };

    // Deletes an object from the scene
    self.deleteObject = function (renderObject, type) {
        zIndexGroups[getObjectZIndex(type)].remove(renderObject.two_object);
    };

    // Creates a hover object of the given type
    self.addHoverObject = function (type, color) {
        self.removeHoveringObject();

        hoveredObject.item = self.addObject(-1, type, 0, 0, color, Z_INDEX.HOVER);
        hoveredObject.row = 0;
        hoveredObject.col = 0;

        self.hideHoveringObject();
    };

    // Shows a hover object if it is hidden
    self.showHoverObject = function () {
        if (hoveredObject.is_drawn)
            return;

        hoveredObject.is_drawn = true;

        let cellTopLeft = getCellTopLeft(hoveredObject.row, hoveredObject.col);

        zIndexGroups[Z_INDEX.HOVER].add(hoveredObject.item.render_variables.two_object);

        hoveredObject.item.render_variables.two_object.translation.set(cellTopLeft.x, cellTopLeft.y);
    };

    // Hide hovering object from the drawing area
    self.hideHoveringObject = function () {
        hoveredObject.is_drawn = false;
        zIndexGroups[Z_INDEX.HOVER].remove(hoveredObject.item.render_variables.two_object);
    };

    // Moves the hover object to the given row and column
    self.moveHoverObject = function (dstRow, dstCol, inBounds) {
        hoveredObject.row = dstRow;
        hoveredObject.col = dstCol;

        self.translateObject(hoveredObject.item.render_variables, dstRow, dstCol);

        if (!inBounds)
            self.hideHoveringObject();
        else
            self.showHoverObject();
    };

    // Delete the hover object
    self.removeHoveringObject = function () {
        if (hoveredObject.is_drawn) {
            zIndexGroups[Z_INDEX.HOVER].remove(hoveredObject.item.render_variables.two_object);
        }

        hoveredObject = {};
    };

    // Initialize dragging of given object
    self.startDragObject = function (object, row, col) {
        draggedObject.item = object;
        draggedObject.src_row = row;
        draggedObject.src_col = col;

        updateZIndex(draggedObject.item.render_variables, Z_INDEX.DRAG);
        //draggedObject.dst_row = row;
        //draggedObject.dst_col = col;
    };

    // Move the drag object to the given row and column
    self.moveDragObject = function (dstRow, dstCol) {
        draggedObject.dst_row = dstRow;
        draggedObject.dst_col = dstCol;

        self.translateObject(draggedObject.item.render_variables, dstRow, dstCol);
    };

    // Finalize dragging the object and return the initial position of the object
    self.finishDragObject = function () {
        updateZIndex(draggedObject.item.render_variables, getObjectZIndex(draggedObject.item.type));

        return {src_row: draggedObject.src_row, src_col: draggedObject.src_col};
    };

    // Highlight a given object
    self.highlightObject = function (object, row, col) {
        self.unhighlightObject();
        selectedObject.row = row;
        selectedObject.col = col;
        selectedObject.item = object;
        self.colorizeCell(row, col, GFX_COLORS.CELL_HIGHLIGHT_COLOR);
    };

    // UnHighlight a given object
    self.unhighlightObject = function () {
        if (typeof selectedObject.row !== 'undefined')
            self.colorizeCell(selectedObject.row, selectedObject.col, GFX_COLORS_DEFAULT.CELL);

        selectedObject = {};
    };

    // Change color of a given cell
    self.colorizeCell = function (row, col, color) {
        zIndexGroups[Z_INDEX.BACKGROUND].children[col * mapHeight + row].fill = color;
    };

    // Change color of a given object
    self.colorizeObject = function (renderObject, type, color) {
        switch (type) {
            case MAP_CELL.RACK:
                colorizeRack(renderObject, color);
                break;
            case MAP_CELL.ROBOT:
                colorizeRobot(renderObject, color);
                break;
            case MAP_CELL.STATION:
                colorizeStation(renderObject, color);
                break;
            case MAP_CELL.OBSTACLE:
                colorizeObstacle(renderObject, color);
                break;
            case MAP_CELL.GATE:
                colorizeGate(renderObject, color);
                break;
        }
    };

    // remove color from a given object
    self.deColorizeObject = function (renderObject, type) {
        switch (type) {
            case MAP_CELL.RACK:
                colorizeRack(renderObject, GFX_COLORS_DEFAULT.RACK);
                break;
            case MAP_CELL.ROBOT:
                colorizeRobot(renderObject, GFX_COLORS_DEFAULT.ROBOT);
                break;
            case MAP_CELL.STATION:
                colorizeStation(renderObject, GFX_COLORS_DEFAULT.STATION);
                break;
            case MAP_CELL.OBSTACLE:
                colorizeObstacle(renderObject, GFX_COLORS_DEFAULT.OBSTACLE);
                break;
            case MAP_CELL.GATE:
                colorizeGate(renderObject, GFX_COLORS_DEFAULT.GATE);
                break;
        }
    };

    self.startObjectFlashing = function (renderObject, flashType) {
        if (flashType === FLASH_TYPE.NO_FLASH)
            self.stopObjectFlashing(renderObject);

        renderObject.animation_variables.is_flashing = true;
        renderObject.animation_variables.flash_time = 0;
        renderObject.animation_variables.flash_type = flashType;
    };

    self.flashObject = function (renderObject, timeDelta) {
        if (!renderObject.animation_variables.is_flashing)
            return;

        renderObject.animation_variables.flash_time += timeDelta;

        let sequence = Math.floor(renderObject.animation_variables.flash_time / FLASHING_SPEED) % 2;

        if (sequence === 0) {
            switch (renderObject.animation_variables.flash_type) {
                case FLASH_TYPE.BIND:
                    colorizeRobotLed(renderObject, GFX_COLORS.LED_BIND_COLOR);
                    break;
                case FLASH_TYPE.LOAD:
                    colorizeRobotLed(renderObject, GFX_COLORS.LED_LOAD_COLOR);
                    break;
                case FLASH_TYPE.FAILURE:
                    colorizeRobotLed(renderObject, GFX_COLORS.LED_FAIL_COLOR);
                    break;
            }
        } else {
            colorizeRobotLed(renderObject, GFX_COLORS_DEFAULT.ROBOT_LED);
        }
    };

    self.pauseObjectFlashing = function (renderObject) {
        renderObject.animation_variables.is_flashing = false;
    };

    self.stopObjectFlashing = function (renderObject) {
        renderObject.animation_variables.is_flashing = false;
        colorizeRobotLed(renderObject, GFX_COLORS_DEFAULT.ROBOT_LED);
    };

    // Initialize animation of a given object
    self.startObjectAnimation = function (row, col, renderObject, animationType) {
        renderObject.animation_variables.is_animating = true;
        renderObject.animation_variables.animation_type = animationType;
        renderObject.animation_variables.is_moving = false;
        renderObject.animation_variables.is_rotating = false;

        let dstRow = row;
        let dstCol = col;
        let dstAngle = renderObject.animation_variables.cur_angle;

        switch (animationType) {
            case ANIMATION_TYPE.MOVE:
                renderObject.animation_variables.is_moving = true;
                dstRow = row + (renderObject.direction === ROBOT_DIR.DOWN) - (renderObject.direction === ROBOT_DIR.UP);
                dstCol = col + (renderObject.direction === ROBOT_DIR.RIGHT) - (renderObject.direction === ROBOT_DIR.LEFT);
                break;
            case ANIMATION_TYPE.ROTATE_RIGHT:
            case ANIMATION_TYPE.ROTATE_LEFT:
                renderObject.animation_variables.is_rotating = true;
                dstAngle = dirToAngle(renderObject.direction) + 90 * (animationType === ANIMATION_TYPE.ROTATE_LEFT) - 90 * (animationType === ANIMATION_TYPE.ROTATE_RIGHT) + 360;
                dstAngle = normalizeAngle(dstAngle);

                if (Math.abs(dstAngle - renderObject.animation_variables.cur_angle) > 180) {
                    renderObject.animation_variables.cur_angle += 360;
                    renderObject.animation_variables.cur_angle = normalizeAngle(renderObject.animation_variables.cur_angle);
                }

                break;
            case ANIMATION_TYPE.RETREAT:
                renderObject.animation_variables.is_moving = true;
                renderObject.animation_variables.is_rotating = true;
                dstRow = row + ((renderObject.direction + 2) % 4 === ROBOT_DIR.DOWN) - ((renderObject.direction + 2) % 4 === ROBOT_DIR.UP);
                dstCol = col + ((renderObject.direction + 2) % 4 === ROBOT_DIR.RIGHT) - ((renderObject.direction + 2) % 4 === ROBOT_DIR.LEFT);
                dstAngle = dirToAngle(renderObject.direction) + 180;
                dstAngle = normalizeAngle(dstAngle);
                break;
        }

        let dstTopLeft = getCellTopLeft(dstRow, dstCol);

        renderObject.animation_variables.nxt_x = dstTopLeft.x;
        renderObject.animation_variables.nxt_y = dstTopLeft.y;
        renderObject.animation_variables.nxt_row = dstRow;
        renderObject.animation_variables.nxt_col = dstCol;
        renderObject.animation_variables.moving_speed = MOVING_SPEED;
        renderObject.animation_variables.nxt_angle = dstAngle;
        renderObject.animation_variables.rotating_speed = ROTATING_SPEED;
    };

    // Animate a given object
    self.animateObject = function (renderObject, timeDelta) {
        self.flashObject(renderObject, timeDelta);

        if (!renderObject.animation_variables.is_animating)
            return false;

        //if (renderObject.animation_variables.cur_angle === renderObject.animation_variables.nxt_angle)
        //    renderObject.animation_variables.is_rotating = false;

        if (renderObject.animation_variables.is_rotating) {
            rotateObject(renderObject, timeDelta);
        } else if (renderObject.animation_variables.is_moving) {
            moveObject(renderObject, timeDelta);
        }

        if (!renderObject.animation_variables.is_moving && !renderObject.animation_variables.is_rotating) {
            renderObject.animation_variables.is_animating = false;
            return true;
        }
    };

    // Pause animation for a given object
    self.pauseObjectAnimation = function (renderObject) {
        renderObject.animation_variables.is_paused = renderObject.animation_variables.is_animating;
        renderObject.animation_variables.is_animating = false;
    };

    // Resume animation for a given object
    self.resumeObjectAnimation = function (renderObject) {
        renderObject.animation_variables.is_animating = renderObject.animation_variables.is_paused;
        renderObject.animation_variables.is_paused = false;
    };

    // Stop animation for a given object
    self.stopObjectAnimation = function (renderObject) {
        renderObject.animation_variables.is_animating = false;
    };

    // Bind 2 given objects together
    self.bindObject = function (renderObject1, renderObject2, object2Type, isLoaded) {
        self.startObjectFlashing(renderObject1, getFlashType(true, isLoaded, false));
        self.colorizeObject(renderObject2, object2Type, objectTypeToBindColor(object2Type));
    };

    // Unbind 2 given objects
    self.unbindObject = function (renderObject1, renderObject2, object2Type, isLoaded) {
        self.startObjectFlashing(renderObject1, getFlashType(false, isLoaded, false));
        self.colorizeObject(renderObject2, object2Type, objectTypeToDefaultColor(object2Type));
    };

    // Load 2 given objects
    self.loadObject = function (renderObject1, renderObject2, object2Type, isBound) {
        renderObject2.animation_variables.cur_angle = renderObject1.animation_variables.cur_angle;
        renderObject2.direction = renderObject1.direction;

        self.startObjectFlashing(renderObject1, getFlashType(isBound, true, false));
        self.colorizeObject(renderObject2, object2Type, objectTypeToBindColor(object2Type));
    };

    // Offload 2 given objects
    self.offloadObject = function (renderObject1, renderObject2, object2Type, isBound) {
        self.startObjectFlashing(renderObject1, getFlashType(isBound, false, false));
        self.colorizeObject(renderObject2, object2Type, objectTypeToDefaultColor(object2Type));
    };

    // object is failed
    self.objectFailure = function (renderObject, type) {
        if (type === MAP_CELL.ROBOT)
            self.startObjectFlashing(renderObject, getFlashType(false, false, true));

        self.pauseObjectAnimation(renderObject);
    };

    // object is stopped
    self.objectStop = function (renderObject, type) {
        if (type === MAP_CELL.ROBOT)
            self.stopObjectFlashing(renderObject);

        self.pauseObjectAnimation(renderObject);
    };

    // object is fixed
    self.objectFixed = function (renderObject, type, isBound, isLoaded) {
        if (type === MAP_CELL.ROBOT)
            self.startObjectFlashing(renderObject, getFlashType(isBound, isLoaded, false));

        // self.resumeObjectAnimation(renderObject);
    };

    // Update object battery level
    self.updateObject = function (renderObject, battery) {
        let robotSVGIdx = Math.floor(battery / 10);
        let twoObject = robotSVG[robotSVGIdx].clone();
        let color = renderObject.color;
        let ledColor = renderObject.led_color;

        zIndexGroups[renderObject.z_index].remove(renderObject.two_object);
        twoObject.rotation = renderObject.two_object.rotation;
        twoObject.translation.set(renderObject.two_object.translation.x, renderObject.two_object.translation.y);
        renderObject.color = GFX_COLORS_DEFAULT.ROBOT;
        renderObject.led_color = GFX_COLORS_DEFAULT.ROBOT_LED;
        renderObject.two_object = twoObject;
        zIndexGroups[renderObject.z_index].add(renderObject.two_object);

        colorizeRobot(renderObject, color);
        colorizeRobotLed(renderObject, ledColor);
    };

    // Key press event handler
    self.keyDownEvent = function (e) {
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
    };

    // Key release event handler
    self.keyUpEvent = function (e) {
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
                self.drawMapGrid(mapWidth, mapHeight);
                break;
        }
    };

    // Translates the scene a tiny amount according to the pressed keys (should only be called in update function)
    self.keyboardDragEvent = function (timeDelta) {
        return;

        let verticalDir = 0;
        let horizontalDir = 0;
        if (goingLeft)
            horizontalDir = 1;
        else if (goingRight)
            horizontalDir = -1;

        if (goingUp)
            verticalDir = 1;
        else if (goingDown)
            verticalDir = -1;

        translateScene(timeDelta * KEYBOARD_DRAG_SPEED * horizontalDir, timeDelta * KEYBOARD_DRAG_SPEED * verticalDir);
    };

    // Zoom event handler
    self.zoomEvent = function (e) {
        const delta = e.originalEvent.wheelDelta / 1000;

        zui.zoomBy(delta, e.clientX, e.clientY);
    };

    // Mouse press event handler
    self.mouseDownEvent = function (e) {
        dragVariables.startDragX = e.clientX - canvas.offset().left;
        dragVariables.startDragY = e.clientY - canvas.offset().top;

        isMouseDown = true;
    };

    // Mouse move event handler
    self.mouseMoveEvent = function (e) {
        if (!isMouseDown) return;

        let dirX = e.clientX - canvas.offset().left - dragVariables.startDragX;
        let dirY = e.clientY - canvas.offset().top - dragVariables.startDragY;

        translateScene(dirX, dirY);

        dragVariables.startDragX = e.clientX - canvas.offset().left;
        dragVariables.startDragY = e.clientY - canvas.offset().top;
    };

    // Mouse release event handler
    self.mouseUpEvent = function () {
        isMouseDown = false;
    }
};

module.exports = gfxEngine;