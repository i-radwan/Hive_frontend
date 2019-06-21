let PIXI = require('pixi.js');
const $ = require('jquery');
let Viewport = require('pixi-viewport');

// Z-Index enum
let Z_INDEX = {
    BACKGROUND: 0,
    STATION: 1,
    GATE: 2,
    RACK: 3,
    ROBOT: 4,
    OBSTACLE: 5,
    DRAG: 6,
    HOVER: 6
};

const Z_INDEX_GROUPS_CNT = 7;

let gfxEngine = function () {
    let self = this;

    // Pixi.js and Viewport variables
    let canvas = $('.map-row');
    self.pixi_app = new PIXI.Application({
        width: canvas.width(),
        height: canvas.height(),
        backgroundColor: 0x1d1d1e,
        resolution: 1,
        antialias: true
    });
    canvas[0].appendChild(self.pixi_app.view);

    let viewport = self.pixi_app.stage.addChild(new Viewport({
        screenWidth: canvas.width(),
        screenHeight: canvas.width(),
        interaction: self.pixi_app.renderer.plugins.interaction
    }));

    // Map information
    let mapWidth, mapHeight;

    // Pixi.js Groups for Z-Index
    let zIndexGroups = [];

    // Hovered & dragged & selected object & their metadata
    let hoveredObject = {};
    let draggedObject = {};
    let selectedObject = {};

    // Removes all the translations and scale to the scene and reinitialize the Z-Index groups
    let resetScene = function () {
        viewport.removeChildren();
        viewport.resize(canvas.width(), canvas.height(), mapWidth * GRID_CELL_LENGTH, mapHeight * GRID_CELL_LENGTH);

        viewport.drag()
            .decelerate()
            .clampZoom({
                minWidth: MIN_ZOOM_LENGTH,
                minHeight: MIN_ZOOM_LENGTH,
                maxWidth: MAX_ZOOM_LENGTH,
                maxHeight: MAX_ZOOM_LENGTH})
            .wheel();

        viewport.moveCorner(0, 0);

        // Initialize z index groups
        zIndexGroups = new Array(Z_INDEX_GROUPS_CNT);
        for (let i = 0; i < Z_INDEX_GROUPS_CNT; i++) {
            zIndexGroups[i] = new PIXI.Container();
            viewport.addChild(zIndexGroups[i]);
        }
    };

    // Resize window
    window.addEventListener('resize', function () {
        self.pixi_app.renderer.resize(canvas.width(), canvas.height());
        viewport.resize(canvas.width(), canvas.height());
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
    let translateScene = function (newX, newY) {
        viewport.moveCenter(newX, newY);
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

    // updates a square object.
    let updateSquare = function(squareGraphicsObject, row, col, color, strokeColor) {
        let cell = getCellTopLeft(row, col);

        squareGraphicsObject.clear();
        squareGraphicsObject.lineStyle(2, strokeColor);
        squareGraphicsObject.beginFill(color);
        squareGraphicsObject.drawRect(cell.x, cell.y, GRID_CELL_LENGTH, GRID_CELL_LENGTH);
        squareGraphicsObject.endFill();
    };

    // Creates a cell at the given position and creates the objects that this cell contains
    let createCell = function (row, col) {
        let square = new PIXI.Graphics();

        updateSquare(square, row, col, GFX_COLORS_DEFAULT.CELL, GFX_COLORS_DEFAULT.CELL_STROKE);

        return square;
    };

    // Updates the object Z-Index
    let updateZIndex = function (renderObject, targetZIndex) {
        zIndexGroups[targetZIndex].removeChild(renderObject.pixi_object);
        zIndexGroups[targetZIndex].addChild(renderObject.pixi_object);
        renderObject.pixi_object.zIndex = targetZIndex;
        renderObject.z_index = targetZIndex;
    };

    // Converts from DIR enum to scalar angle
    let dirToAngle = function (direction) {
        switch (direction) {
            case ROBOT_DIR.RIGHT:
                return 0;
            case ROBOT_DIR.UP:
                return 270;
            case ROBOT_DIR.LEFT:
                return 180;
            case ROBOT_DIR.DOWN:
                return 90;
        }
    };

    // Convert given angle to DIR enum
    let angleToDir = function (angle) {
        switch (angle) {
            case 0:
            case 360:
                return ROBOT_DIR.RIGHT;
            case 90:
            case -270:
                return ROBOT_DIR.DOWN;
            case 180:
            case -180:
                return ROBOT_DIR.LEFT;
            case 270:
            case -90:
                return ROBOT_DIR.UP;
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
    let moveObject = function (renderObject, timeDelta) {
        let dirX = renderObject.animation_variables.nxt_x - renderObject.animation_variables.cur_x;
        let dirY = renderObject.animation_variables.nxt_y - renderObject.animation_variables.cur_y;
        let length = Math.sqrt(dirX*dirX + dirY*dirY);

        dirX = (dirX / length) * renderObject.animation_variables.moving_speed * timeDelta;
        dirY = (dirY / length) * renderObject.animation_variables.moving_speed * timeDelta;

        renderObject.animation_variables.cur_x += dirX;
        renderObject.animation_variables.cur_y += dirY;

        let dir2X = renderObject.animation_variables.nxt_x - renderObject.animation_variables.cur_x;
        let dir2Y = renderObject.animation_variables.nxt_y - renderObject.animation_variables.cur_y;
        let length2 = Math.sqrt(dir2X*dir2X + dir2Y*dir2Y);

        dir2X = (dir2X / length2) * renderObject.animation_variables.moving_speed * timeDelta;
        dir2Y = (dir2Y / length2) * renderObject.animation_variables.moving_speed * timeDelta;

        // End of animation
        if ((dirX !== dir2X || dirY !== dir2Y) ||
            (renderObject.animation_variables.cur_x === renderObject.animation_variables.nxt_x &&
                renderObject.animation_variables.cur_y === renderObject.animation_variables.nxt_y)) {

            renderObject.animation_variables.cur_x = renderObject.animation_variables.nxt_x;
            renderObject.animation_variables.cur_y = renderObject.animation_variables.nxt_y;
            renderObject.animation_variables.is_moving = false;
        }

        renderObject.pixi_object.x = renderObject.animation_variables.cur_x;
        renderObject.pixi_object.y = renderObject.animation_variables.cur_y;
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
            object.animation_variables.cur_angle = object.animation_variables.nxt_angle;
            object.animation_variables.is_rotating = false;
        }

        object.pixi_object.angle = object.animation_variables.cur_angle;
    };

    // Load the texture from SVG.
    let loadTexture = function(type, color, options) {
        let targetColor = color;
        let svgString;
        switch (type) {
            case MAP_CELL.GATE:
                if (options.is_bound)
                    targetColor = GFX_COLORS.GATE_BIND_COLOR;

                svgString = $(GFX_SVG_MODEL.GATE).wrapAll('<div>');
                svgString = $(svgString).find('.gate_body').attr('fill', targetColor).closest('div').html();
                break;
            case MAP_CELL.ROBOT:
                let batteryIdx = Math.floor(options.battery / 10);
                let targetLedColor = GFX_COLORS_DEFAULT.ROBOT_LED;

                if (options.is_failed)
                    targetLedColor = GFX_COLORS.LED_FAIL_COLOR;
                else if (options.is_bound)
                    targetLedColor = GFX_COLORS.LED_BIND_COLOR;
                else if (options.is_loaded)
                    targetLedColor = GFX_COLORS.LED_LOAD_COLOR;

                svgString = $(GFX_SVG_MODEL.ROBOT[batteryIdx]).wrapAll('<div>');

                if (batteryIdx > 0)         // TODO remove if you change the robot model so it includes the class = "robot_body" in 0% charge level
                    $(svgString).find('.robot_body').attr('fill', targetColor);

                svgString = $(svgString).find('.led_body').attr('fill', targetLedColor).closest('div').html();
                break;
            case MAP_CELL.RACK:
                if (options.is_loaded)
                    targetColor = GFX_COLORS.RACK_LOAD_COLOR;

                svgString = $(GFX_SVG_MODEL.RACK).wrapAll('<div>');
                svgString = $(svgString).find('.rack_body').attr('fill', targetColor).closest('div').html();
                break;
            case MAP_CELL.STATION:
                if (options.is_bound)
                    targetColor = GFX_COLORS.STATION_BIND_COLOR;

                svgString = $(GFX_SVG_MODEL.STATION).wrapAll('<div>');
                svgString = $(svgString).find('.station_body').attr('fill', targetColor).closest('div').html();
                break;
            case MAP_CELL.OBSTACLE:
                svgString = $(GFX_SVG_MODEL.OBSTACLE).wrapAll('<div>');
                svgString = $(svgString).find('.obstacle_body').attr('fill', targetColor).closest('div').html();
                break;
        }

        return PIXI.Texture.from(svgString);
    };

    // Load all the Gate textures from SVG.
    let loadTexturesGate = function(color) {
        return {
            idle: loadTexture(MAP_CELL.GATE, color, {
                is_bound: false,
            }),
            bound: loadTexture(MAP_CELL.GATE, color, {
                is_bound: true,
            })
        };
    };

    // Load all the robot textures from SVG.
    let loadTexturesRobot = function(color, battery = 100) {
        return {
            idle: loadTexture(MAP_CELL.ROBOT, color, {
                battery: battery,
                is_loaded: false,
                is_bound: false,
                is_failed: false
            }),
            loaded: loadTexture(MAP_CELL.ROBOT, color, {
                battery: battery,
                is_loaded: true,
                is_bound: false,
                is_failed: false
            }),
            bound: loadTexture(MAP_CELL.ROBOT, color, {
                battery: battery,
                is_loaded: false,
                is_bound: true,
                is_failed: false
            }),
            failed: loadTexture(MAP_CELL.ROBOT, color, {
                battery: battery,
                is_loaded: false,
                is_bound: false,
                is_failed: true
            })
        };
    };

    // Load all the rack textures from SVG.
    let loadTexturesRack = function(color) {
        return {
            idle: loadTexture(MAP_CELL.RACK, color, {
                is_loaded: false,
            }),
            loaded: loadTexture(MAP_CELL.RACK, color, {
                is_loaded: true,
            })
        };
    };

    // Load all the Station textures from SVG.
    let loadTexturesStation = function(color) {
        return {
            idle: loadTexture(MAP_CELL.STATION, color, {
                is_bound: false,
            }),
            bound: loadTexture(MAP_CELL.STATION, color, {
                is_bound: true,
            })
        };
    };

    // Load all the Obstacle textures from SVG.
    let loadTexturesObstacle = function(color) {
        return {
            idle: loadTexture(MAP_CELL.OBSTACLE, color, undefined),
        };
    };


    // Colorizes the rack
    let colorizeRack = function (renderObject, color) {
        renderObject.textures = loadTexturesRack(color);
        renderObject.pixi_object.texture = renderObject.textures.idle;

        renderObject.color = color;
    };

    // Colorizes the robot
    let colorizeRobot = function (renderObject, color) {
        renderObject.textures = loadTexturesRobot(color);
        renderObject.pixi_object.texture = renderObject.textures.idle;

        renderObject.color = color;
    };

    // Colorizes the station
    let colorizeStation = function (renderObject, color) {
        renderObject.textures = loadTexturesStation(color);
        renderObject.pixi_object.texture = renderObject.textures.idle;

        renderObject.color = color;
    };

    // Colorizes the obstacle
    let colorizeObstacle = function (renderObject, color) {
        renderObject.textures = loadTexturesObstacle(color);
        renderObject.pixi_object.texture = renderObject.textures.idle;

        renderObject.color = color;
    };

    // Colorizes the gate
    let colorizeGate = function (renderObject, color) {
        renderObject.textures = loadTexturesGate(color);
        renderObject.pixi_object.texture = renderObject.textures.idle;

        renderObject.color = color;
    };

    // Initialize the Graphics engine
    self.init = function () {
    };

    // Draw the grid of the map with the given width and height
    self.drawMapGrid = function (width, height) {
        mapWidth = width;
        mapHeight = height;

        resetScene();

        for (let c = 0; c < width; c++) {
            for (let r = 0; r < height; r++) {
                zIndexGroups[Z_INDEX.BACKGROUND].addChild(createCell(r, c));
            }
        }

        translateScene((mapWidth * GRID_CELL_LENGTH) / 2, (mapHeight * GRID_CELL_LENGTH) / 2);
        viewport.zoom((mapWidth + 1) * GRID_CELL_LENGTH - canvas.width(), true);
    };

    // Return the object that is currently selected
    self.getSelectedObject = function () {
        return selectedObject;
    };

    // Gets from the mouse raw position the row and column of the cell that is being clicked
    self.getMouseCell = function (mouseX, mouseY) {
        let worldPosition = viewport.toWorld(mouseX - canvas.offset().left, mouseY - canvas.offset().top);

        let cellRow = Math.floor(worldPosition.y / GRID_CELL_LENGTH);
        let cellCol = Math.floor(worldPosition.x / GRID_CELL_LENGTH);

        return {row: cellRow, col: cellCol};
    };

    // Adds an object to the scene
    self.addObject = function (id, type, row, col, color, zIndexValue = -1) {
        let cellCenter = getCellCenter(row, col);
        let ledColor = undefined;

        let textures, pixiObject;

        switch (type) {
            case MAP_CELL.GATE:
                textures = loadTexturesGate(color);
                pixiObject = new PIXI.Sprite(textures.idle);
                break;
            case MAP_CELL.ROBOT:
                textures = loadTexturesRobot(color);
                pixiObject = new PIXI.Sprite(textures.idle);
                ledColor = GFX_COLORS_DEFAULT.ROBOT_LED;
                break;
            case MAP_CELL.RACK:
                textures = loadTexturesRack(color);
                pixiObject = new PIXI.Sprite(textures.idle);
                break;
            case MAP_CELL.STATION:
                textures = loadTexturesStation(color);
                pixiObject = new PIXI.Sprite(textures.idle);
                break;
            case MAP_CELL.OBSTACLE:
                textures = loadTexturesObstacle(color);
                pixiObject = new PIXI.Sprite(textures.idle);
                break;
        }

        zIndexValue = (zIndexValue === -1 ? getObjectZIndex(type) : zIndexValue);
        pixiObject.scale.x = 1/3;
        pixiObject.scale.y = 1/3;
        pixiObject.anchor.set(0.5, 0.5);
        pixiObject.x = cellCenter.x;
        pixiObject.y = cellCenter.y;
        pixiObject.zIndex = zIndexValue;
        zIndexGroups[zIndexValue].addChild(pixiObject);

        return {
            type: type,
            id: id,
            loaded_object_id: -1,
            loaded_object_type: -1,
            bound_object_id: -1,
            bound_object_type: -1,
            render_variables: {
                pixi_object: pixiObject,
                textures: textures,
                is_selected: false,
                z_index: zIndexValue,
                direction: ROBOT_DIR.RIGHT,
                color: color,
                led_color: ledColor,
                animation_variables: {
                    cur_x: cellCenter.x,
                    cur_y: cellCenter.y,
                    cur_angle: 0,
                    rotation_vector: 0
                }
            }
        };
    };

    // Translates the given object to the given new row and column
    self.translateObject = function (renderObject, dstRow, dstCol) {
        let cellCenter = getCellCenter(dstRow, dstCol);

        renderObject.animation_variables.cur_x = cellCenter.x;
        renderObject.animation_variables.cur_y = cellCenter.y;
        renderObject.pixi_object.x = cellCenter.x;
        renderObject.pixi_object.y = cellCenter.y;
    };

    // Deletes an object from the scene
    self.deleteObject = function (renderObject, type) {
        self.unhighlightObject();
        zIndexGroups[getObjectZIndex(type)].removeChild(renderObject.pixi_object);
        renderObject.pixi_object.destroy(false, false, false);
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

        let cellCenter = getCellCenter(hoveredObject.row, hoveredObject.col);

        hoveredObject.is_drawn = true;
        hoveredObject.item.render_variables.pixi_object.renderable = true;
        hoveredObject.item.render_variables.pixi_object.x = cellCenter.x;
        hoveredObject.item.render_variables.pixi_object.y = cellCenter.y;
    };

    // Hide hovering object from the drawing area
    self.hideHoveringObject = function () {
        hoveredObject.is_drawn = false;
        hoveredObject.item.render_variables.pixi_object.renderable = false;
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
            zIndexGroups[Z_INDEX.HOVER].removeChild(hoveredObject.item.render_variables.pixi_object);
            hoveredObject.item.render_variables.pixi_object.destroy(false, false, false);
        }

        hoveredObject = {};
    };

    // Initialize dragging of given object
    self.startDragObject = function (object, row, col) {
        draggedObject.item = object;
        draggedObject.src_row = row;
        draggedObject.src_col = col;

        updateZIndex(draggedObject.item.render_variables, Z_INDEX.DRAG);
    };

    // Move the drag object to the given row and column
    self.moveDragObject = function (dstRow, dstCol) {
        draggedObject.dst_row = dstRow;
        draggedObject.dst_col = dstCol;

        if (draggedObject.item.render_variables.is_selected === true)
            self.moveHighlightObject(dstRow, dstCol);

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
        selectedObject.item.render_variables.is_selected = true;

        self.colorizeCell(row, col, GFX_COLORS.CELL_HIGHLIGHT_COLOR, GFX_COLORS.CELL_HIGHLIGHT_STROKE);
    };

    // Move the highlighted object
    self.moveHighlightObject = function (row, col) {
        self.colorizeCell(selectedObject.row, selectedObject.col, GFX_COLORS_DEFAULT.CELL, GFX_COLORS_DEFAULT.CELL_STROKE);
        selectedObject.row = row;
        selectedObject.col = col;
        self.colorizeCell(selectedObject.row, selectedObject.col, GFX_COLORS.CELL_HIGHLIGHT_COLOR, GFX_COLORS.CELL_HIGHLIGHT_STROKE);
    };

    // Unhighlight the highlighted object
    self.unhighlightObject = function () {
        if (typeof selectedObject.row !== 'undefined') {
            self.colorizeCell(selectedObject.row, selectedObject.col, GFX_COLORS_DEFAULT.CELL, GFX_COLORS_DEFAULT.CELL_STROKE);
            selectedObject.item.render_variables.is_selected = false;
        }

        selectedObject = {};
    };

    // Change color of a given cell
    self.colorizeCell = function (row, col, color, strokeColor) {
        let square = zIndexGroups[Z_INDEX.BACKGROUND].children[col * mapHeight + row];

        updateSquare(square, row, col, color, strokeColor);
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
                    renderObject.pixi_object.texture = renderObject.textures.bound;
                    renderObject.led_color = GFX_COLORS.LED_BIND_COLOR;
                    break;
                case FLASH_TYPE.LOAD:
                    renderObject.pixi_object.texture = renderObject.textures.loaded;
                    renderObject.led_color = GFX_COLORS.LED_LOAD_COLOR;
                    break;
                case FLASH_TYPE.FAILURE:
                    renderObject.pixi_object.texture = renderObject.textures.failed;
                    renderObject.led_color = GFX_COLORS.LED_FAIL_COLOR;
                    break;
            }
        } else {
            renderObject.pixi_object.texture = renderObject.textures.idle;
            renderObject.led_color = GFX_COLORS_DEFAULT.ROBOT_LED;
        }
    };

    self.pauseObjectFlashing = function (renderObject) {
        renderObject.animation_variables.is_flashing = false;
    };

    self.stopObjectFlashing = function (renderObject) {
        renderObject.animation_variables.is_flashing = false;
        renderObject.pixi_object.texture = renderObject.textures.idle;
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
                let dir = (animationType === ANIMATION_TYPE.ROTATE_LEFT ? -1 : 1);
                dstAngle = dirToAngle(renderObject.direction) + dir * 90;
                dstAngle = normalizeAngle(dstAngle);

                if (Math.abs(dstAngle - renderObject.animation_variables.cur_angle) > 180) {
                    renderObject.animation_variables.cur_angle -= dir * 360;
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

        let dstCenter = getCellCenter(dstRow, dstCol);

        renderObject.animation_variables.nxt_x = dstCenter.x;
        renderObject.animation_variables.nxt_y = dstCenter.y;
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

    // Finishes the object's animation
    self.finishObjectAnimation = function(object, loadedObject) {
        let dstRow = object.render_variables.animation_variables.nxt_row;
        let dstCol = object.render_variables.animation_variables.nxt_col;

        object.render_variables.direction = angleToDir(object.render_variables.animation_variables.cur_angle);

        if (object.render_variables.is_selected === true)
            self.moveHighlightObject(dstRow, dstCol);

        if (loadedObject !== -1) {
            loadedObject.render_variables.animation_variables.cur_angle = object.render_variables.animation_variables.cur_angle;
            loadedObject.render_variables.direction = object.render_variables.direction;
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
        renderObject2.pixi_object.texture = renderObject2.textures.bound;
    };

    // Unbind 2 given objects
    self.unbindObject = function (renderObject1, renderObject2, object2Type, isLoaded) {
        self.startObjectFlashing(renderObject1, getFlashType(false, isLoaded, false));
        renderObject2.pixi_object.texture = renderObject2.textures.idle;
    };

    // Load 2 given objects
    self.loadObject = function (renderObject1, renderObject2, object2Type, isBound) {
        renderObject2.animation_variables.cur_angle = renderObject1.animation_variables.cur_angle;
        renderObject2.direction = renderObject1.direction;

        self.startObjectFlashing(renderObject1, getFlashType(isBound, true, false));
        renderObject2.pixi_object.texture = renderObject2.textures.loaded;
    };

    // Offload 2 given objects
    self.offloadObject = function (renderObject1, renderObject2, object2Type, isBound) {
        self.startObjectFlashing(renderObject1, getFlashType(isBound, false, false));
        renderObject2.pixi_object.texture = renderObject2.textures.idle;
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
    };

    // Update object battery level
    self.updateObject = function (renderObject, battery) {
        renderObject.textures = loadTexturesRobot(renderObject.color, battery);
        self.flashObject(renderObject, 0);
    };

    // Key press event handler
    self.keyDownEvent = function (e) {
    };

    // Key release event handler
    self.keyUpEvent = function (e) {
    };

    // Translates the scene a tiny amount according to the pressed keys (should only be called in update function)
    self.keyboardDragEvent = function (timeDelta) {
    };

    // Zoom event handler
    self.zoomEvent = function (e) {
    };

    // Mouse press event handler
    self.mouseDownEvent = function (isMouseDownOnObject) {
        if (isMouseDownOnObject)
            viewport.pausePlugin('drag');
    };

    // Mouse move event handler
    self.mouseMoveEvent = function (isMouseDown, isMouseOnObject, isCtrlDown) {
        if (isMouseDown) return;

        if (isMouseOnObject && !isCtrlDown)
            viewport.pausePlugin('drag');
        else
            viewport.resumePlugin('drag');
    };

    // Mouse release event handler
    self.mouseUpEvent = function () {
    }
};

module.exports = gfxEngine;