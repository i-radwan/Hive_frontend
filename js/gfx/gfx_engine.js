let PIXI = require('pixi.js');
const $ = require('jquery');
let Viewport = require('pixi-viewport').Viewport;
let PIXI_FILTERS = require('pixi-filters');

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
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        antialias: true
    });
    canvas[0].appendChild(self.pixi_app.view);

    let viewport;

    // Map information
    let mapWidth, mapHeight;

    // Pixi.js Groups for Z-Index
    let zIndexGroups = [];

    // Keys information.
    let isSpaceKeyDown = false;

    // Hovered & dragged & selected object & their metadata
    let hoveredObject = {};
    let draggedObject = {};
    let selectedObjects = [];

    // Removes all the translations and scale to the scene and reinitialize the Z-Index groups
    let resetScene = function () {
        self.pixi_app.stage.removeChildren();
        viewport = self.pixi_app.stage.addChild(new Viewport({
            screenWidth: canvas.width(),
            screenHeight: canvas.height(),
            interaction: self.pixi_app.renderer.plugins.interaction
        }));
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

    // Convert from "#FFFFFF" format to 0xFFFFFF
    let hexToPixiColor = function(hexString) {
        return parseInt(hexString.substring(1, hexString.length), 16);
    };

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

        if (renderObject.is_selected && renderObject.animation_variables.should_move_view_port)
            viewport.moveCenter(renderObject.animation_variables.cur_x, renderObject.animation_variables.cur_y);

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
    let rotateObject = function (renderObject, timeDelta) {
        let dir = (renderObject.animation_variables.nxt_angle - renderObject.animation_variables.cur_angle) / Math.abs(renderObject.animation_variables.nxt_angle - renderObject.animation_variables.cur_angle);
        dir *= renderObject.animation_variables.rotating_speed * timeDelta;

        renderObject.animation_variables.cur_angle += dir;

        let dir2 = (renderObject.animation_variables.nxt_angle - renderObject.animation_variables.cur_angle) / Math.abs(renderObject.animation_variables.nxt_angle - renderObject.animation_variables.cur_angle);
        dir2 *= renderObject.animation_variables.rotating_speed * timeDelta;

        // End of animation
        if (dir !== dir2 || renderObject.animation_variables.cur_angle === renderObject.animation_variables.nxt_angle) {
            renderObject.animation_variables.cur_angle = renderObject.animation_variables.nxt_angle;
            renderObject.animation_variables.is_rotating = false;
        }

        if (renderObject.is_selected && renderObject.animation_variables.should_move_view_port)
            viewport.moveCenter(renderObject.animation_variables.cur_x, renderObject.animation_variables.cur_y);

        if (renderObject.animation_variables.should_rotate)
            renderObject.pixi_object.angle = renderObject.animation_variables.cur_angle;
    };

    // Load the texture from SVG.
    let loadTexture = function(type, color, options) {
        let targetColor = color;
        let svgString;
        switch (type) {
            case MAP_CELL.GATE:
                svgString = $(GFX_SVG_MODEL.GATE).wrapAll('<div>');
                svgString = $(svgString).find('.gate_body').attr('fill', targetColor).closest('div').html();
                break;
            case MAP_CELL.ROBOT:
                let batteryIdx = Math.floor(options.battery / 10);
                let targetLedColor = GFX_COLORS_DEFAULT.ROBOT_LED;

                if (options.is_failed)
                    targetLedColor = GFX_COLORS.LED_RED_COLOR;
                else if (options.is_bound)
                    targetLedColor = GFX_COLORS.LED_GREEN_COLOR;
                else if (options.is_loaded)
                    targetLedColor = GFX_COLORS.LED_BLUE_COLOR;

                svgString = $(GFX_SVG_MODEL.ROBOT[batteryIdx]).wrapAll('<div>');

                if (batteryIdx > 0)         // TODO remove if you change the robot model so it includes the class = "robot_body" in 0% charge level
                    $(svgString).find('.robot_body').attr('fill', targetColor);

                svgString = $(svgString).find('.led_body').attr('fill', targetLedColor).closest('div').html();
                break;
            case MAP_CELL.RACK:
                svgString = $(GFX_SVG_MODEL.RACK).wrapAll('<div>');
                svgString = $(svgString).find('.rack_body').attr('fill', targetColor).closest('div').html();
                break;
            case MAP_CELL.STATION:
                svgString = $(GFX_SVG_MODEL.STATION).wrapAll('<div>');
                svgString = $(svgString).find('.station_body').attr('fill', targetColor).closest('div').html();
                break;
            case MAP_CELL.OBSTACLE:
                svgString = $(GFX_SVG_MODEL.OBSTACLE).wrapAll('<div>');
                svgString = $(svgString).find('.obstacle_body').attr('fill', targetColor).closest('div').html();
                break;
        }

        return PIXI.Texture.from(svgString, {
            scaleMode: PIXI.SCALE_MODES.LINEAR,
            mipmap: PIXI.MIPMAP_MODES.ON,
            resourceOptions: {
                scale: 5
            }
        });
    };

    // Load all the Gate textures from SVG.
    let loadTexturesGate = function(color) {
        return {
            idle: loadTexture(MAP_CELL.GATE, color)
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
            idle: loadTexture(MAP_CELL.RACK, color)
        };
    };

    // Load all the Station textures from SVG.
    let loadTexturesStation = function(color) {
        return {
            idle: loadTexture(MAP_CELL.STATION, color)
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

        if (renderObject.is_selected)
            renderObject.pixi_object.filters = [new PIXI_FILTERS.GlowFilter(15, 1, 0, hexToPixiColor(color), 1)];

        renderObject.color = color;
    };

    // Colorizes the robot
    let colorizeRobot = function (renderObject, color) {
        renderObject.textures = loadTexturesRobot(color);
        renderObject.pixi_object.texture = renderObject.textures.idle;

        if (renderObject.is_selected)
            renderObject.pixi_object.filters = [new PIXI_FILTERS.GlowFilter(15, 1, 0, hexToPixiColor(color), 1)];

        renderObject.color = color;
    };

    // Colorizes the station
    let colorizeStation = function (renderObject, color) {
        renderObject.textures = loadTexturesStation(color);
        renderObject.pixi_object.texture = renderObject.textures.idle;

        if (renderObject.is_selected)
            renderObject.pixi_object.filters = [new PIXI_FILTERS.GlowFilter(15, 1, 0, hexToPixiColor(color), 1)];

        renderObject.color = color;
    };

    // Colorizes the obstacle
    let colorizeObstacle = function (renderObject, color) {
        renderObject.textures = loadTexturesObstacle(color);
        renderObject.pixi_object.texture = renderObject.textures.idle;

        if (renderObject.is_selected)
            renderObject.pixi_object.filters = [new PIXI_FILTERS.GlowFilter(15, 1, 0, hexToPixiColor(color), 1)];

        renderObject.color = color;
    };

    // Colorizes the gate
    let colorizeGate = function (renderObject, color) {
        renderObject.textures = loadTexturesGate(color);
        renderObject.pixi_object.texture = renderObject.textures.idle;

        if (renderObject.is_selected)
            renderObject.pixi_object.filters = [new PIXI_FILTERS.GlowFilter(15, 1, 0, hexToPixiColor(color), 1)];

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

        for (let c = 0; c < mapWidth; c++) {
            for (let r = 0; r < mapHeight; r++) {
                zIndexGroups[Z_INDEX.BACKGROUND].addChild(createCell(r, c));
            }
        }

        // Add indexing for rows and columns
        for (let c = 0; c < mapWidth; c++) {
            zIndexGroups[Z_INDEX.BACKGROUND].addChild(self.createText((c+1).toString(), GRID_CELL_LENGTH / 2 + c * GRID_CELL_LENGTH, -GRID_CELL_LENGTH / 2));
            zIndexGroups[Z_INDEX.BACKGROUND].addChild(self.createText((c+1).toString(), GRID_CELL_LENGTH / 2 + c * GRID_CELL_LENGTH, mapHeight * GRID_CELL_LENGTH + GRID_CELL_LENGTH / 2));
        }
        for (let r = 0; r < mapHeight; r++) {
            zIndexGroups[Z_INDEX.BACKGROUND].addChild(self.createText((r+1).toString(), -GRID_CELL_LENGTH / 2, GRID_CELL_LENGTH / 2 + r * GRID_CELL_LENGTH));
            zIndexGroups[Z_INDEX.BACKGROUND].addChild(self.createText((r+1).toString(), mapWidth * GRID_CELL_LENGTH + GRID_CELL_LENGTH / 2, GRID_CELL_LENGTH / 2 + r * GRID_CELL_LENGTH));
        }

        translateScene((mapWidth * GRID_CELL_LENGTH) / 2, (mapHeight * GRID_CELL_LENGTH) / 2);
        if (mapWidth * (self.pixi_app.renderer.height / self.pixi_app.renderer.width) >= mapHeight)
            viewport.zoom((mapWidth + 2) * GRID_CELL_LENGTH - self.pixi_app.renderer.width, true);
        else
            viewport.zoom((mapHeight + 4) * GRID_CELL_LENGTH - self.pixi_app.renderer.height, true);
    };

    // Return the top object that is currently selected
    self.getFirstSelectedObject = function () {
        return selectedObjects[0];
    };

    // Return the First robot that is currently selected
    self.getFirstSelectedObjectTypeIndex = function (type) {
        for (let i = 0; i < selectedObjects.length; i++) {
            if (selectedObjects[i].item.type === type)
                return i;
        }

        return -1;
    };

    // Return the First robot that is currently selected
    self.getFirstSelectedObjectType = function (type) {
        return selectedObjects[self.getFirstSelectedObjectTypeIndex(type)];
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
        pixiObject.scale.x = 1/15;
        pixiObject.scale.y = 1/15;
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
                default_color: color,
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
        self.unhighlightObjects();
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

        self.translateObject(draggedObject.item.render_variables, dstRow, dstCol);
    };

    // Finalize dragging the object and return the initial position of the object
    self.finishDragObject = function () {
        updateZIndex(draggedObject.item.render_variables, getObjectZIndex(draggedObject.item.type));

        return {src_row: draggedObject.src_row, src_col: draggedObject.src_col};
    };

    // Highlight a given object
    self.highlightObject = function (object, row, col) {
        let selectedObject = {};
        selectedObject.row = row;
        selectedObject.col = col;
        selectedObject.item = object;
        selectedObject.item.render_variables.is_selected = true;
        selectedObject.item.render_variables.pixi_object.filters = [new PIXI_FILTERS.GlowFilter(15, 1, 0, hexToPixiColor(selectedObject.item.render_variables.color), 1)];
        selectedObjects.push(selectedObject);
    };

    // Unhighlight the highlighted object
    self.unhighlightObjects = function () {
        for (let i = 0; i < selectedObjects.length; i++) {
            let selectedObject = selectedObjects[i];

            selectedObject.item.render_variables.pixi_object.filters = [];
            selectedObject.item.render_variables.is_selected = false;
        }

        selectedObjects = [];
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
                colorizeRack(renderObject, renderObject.default_color);
                break;
            case MAP_CELL.ROBOT:
                colorizeRobot(renderObject, renderObject.default_color);
                break;
            case MAP_CELL.STATION:
                colorizeStation(renderObject, renderObject.default_color);
                break;
            case MAP_CELL.OBSTACLE:
                colorizeObstacle(renderObject, renderObject.default_color);
                break;
            case MAP_CELL.GATE:
                colorizeGate(renderObject, renderObject.default_color);
                break;
        }
    };

    // change the led color of a given robot
    self.changeLedColor = function(renderObject, color) {
        switch (color) {
            case GFX_COLORS.LED_BLUE_COLOR:
                renderObject.pixi_object.texture = renderObject.textures.loaded;
                break;
            case GFX_COLORS.LED_GREEN_COLOR:
                renderObject.pixi_object.texture = renderObject.textures.bound;
                break;
            case GFX_COLORS.LED_RED_COLOR:
                renderObject.pixi_object.texture = renderObject.textures.failed;
                break;
            case GFX_COLORS_DEFAULT.ROBOT_LED:
                renderObject.pixi_object.texture = renderObject.textures.idle;
                break;
        }
    };

    // colorize the led of a given robot
    self.colorizeObjectLed = function (renderObject, color, mode) {
        renderObject.led_color = color;
        renderObject.animation_variables.is_flashing = false;
        renderObject.animation_variables.flash_time = 0;
        renderObject.animation_variables.led_color_mode = mode;

        switch (mode) {
            case LED_COLOR_MODE.OFF:
                self.stopObjectFlashing(renderObject);
                break;
            case LED_COLOR_MODE.ON:
                self.changeLedColor(renderObject, color);
                break;
            case LED_COLOR_MODE.FLASH:
                renderObject.animation_variables.is_flashing = true;
                break;
        }
    };

    self.flashObject = function (renderObject, timeDelta) {
        if (!renderObject.animation_variables.is_flashing)
            return;

        renderObject.animation_variables.flash_time += timeDelta;

        let sequence = Math.floor(renderObject.animation_variables.flash_time / FLASHING_SPEED) % 2;

        if (sequence === 0) {
            self.changeLedColor(renderObject, renderObject.led_color)
        } else {
            self.changeLedColor(renderObject, GFX_COLORS_DEFAULT.ROBOT_LED);
        }
    };

    self.pauseObjectFlashing = function (renderObject) {
        renderObject.animation_variables.is_flashing = false;
    };

    self.stopObjectFlashing = function (renderObject) {
        renderObject.animation_variables.is_flashing = false;
        self.changeLedColor(renderObject, GFX_COLORS_DEFAULT.ROBOT_LED);
    };

    // Initialize animation of a given object
    self.startObjectAnimation = function (row, col, type, renderObject, animationType) {
        renderObject.animation_variables.is_animating = true;
        renderObject.animation_variables.animation_type = animationType;
        renderObject.animation_variables.is_moving = false;
        renderObject.animation_variables.is_rotating = false;
        renderObject.animation_variables.should_rotate = false;
        renderObject.animation_variables.should_move_view_port = (type === MAP_CELL.ROBOT);

        let dstRow = row;
        let dstCol = col;
        let dstAngle = renderObject.animation_variables.cur_angle;

        switch (animationType) {
            case ANIMATION_TYPE.MOVE_RIGHT:
            case ANIMATION_TYPE.MOVE_LEFT:
            case ANIMATION_TYPE.MOVE_UP:
            case ANIMATION_TYPE.MOVE_DOWN:
                renderObject.animation_variables.is_moving = true;
                renderObject.animation_variables.animation_type = ANIMATION_TYPE.MOVE;
                dstRow = row + (animationType === ANIMATION_TYPE.MOVE_DOWN) - (animationType === ANIMATION_TYPE.MOVE_UP);
                dstCol = col + (animationType === ANIMATION_TYPE.MOVE_RIGHT) - (animationType === ANIMATION_TYPE.MOVE_LEFT);
                break;
            case ANIMATION_TYPE.ROTATE_RIGHT:
            case ANIMATION_TYPE.ROTATE_LEFT:
                renderObject.animation_variables.is_rotating = true;
                renderObject.animation_variables.should_rotate = (type === MAP_CELL.ROBOT);
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
                renderObject.animation_variables.should_rotate = (type === MAP_CELL.ROBOT);
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
            return true;
        }
    };

    // Finishes the object's animation
    self.finishObjectAnimation = function(renderObject) {
        renderObject.animation_variables.cur_x = renderObject.animation_variables.nxt_x;
        renderObject.animation_variables.cur_y = renderObject.animation_variables.nxt_y;
        renderObject.pixi_object.x = renderObject.animation_variables.cur_x;
        renderObject.pixi_object.y = renderObject.animation_variables.cur_y;

        if (renderObject.animation_variables.should_rotate)
            renderObject.pixi_object.angle = renderObject.animation_variables.cur_angle;

        renderObject.direction = angleToDir(renderObject.animation_variables.nxt_angle);
        renderObject.animation_variables.is_animating = false;
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
    self.bindObject = function (renderObject1, renderObject2) {
    };

    // Unbind 2 given objects
    self.unbindObject = function (renderObject1, renderObject2) {
    };

    // Load 2 given objects
    self.loadObject = function (renderObject1, renderObject2) {
        renderObject2.animation_variables.cur_angle = renderObject1.animation_variables.cur_angle;
        renderObject2.direction = renderObject1.direction;
    };

    // Offload 2 given objects
    self.offloadObject = function (renderObject1, renderObject2) {
    };

    // object is failed
    self.objectFailure = function (renderObject) {
        self.pauseObjectAnimation(renderObject);
    };

    // object is stopped
    self.objectStop = function (renderObject) {
        self.pauseObjectAnimation(renderObject);
    };

    // object is fixed
    self.objectFixed = function (renderObject, type, isBound, isLoaded) {
    };

    // Update object battery level
    self.updateObject = function (renderObject, battery) {
        renderObject.textures = loadTexturesRobot(renderObject.color, battery);
        self.flashObject(renderObject, 0);
    };

    // Key press event handler
    self.keyDownEvent = function (e) {
        switch (e.which) {
            case KEY_CODE.SPACE:
                isSpaceKeyDown = true;
                break;
        }
    };

    // Key release event handler
    self.keyUpEvent = function (e) {
        switch (e.which) {
            case KEY_CODE.SPACE:
                isSpaceKeyDown = false;
                break;
        }
    };

    // gfx Update loop
    self.gfxUpdateEvent = function (timeDelta) {
        if (isSpaceKeyDown) {
            let selectedObject = self.getFirstSelectedObject();
            if (typeof selectedObject === "undefined")
                return;

            viewport.moveCenter(selectedObject.item.render_variables.animation_variables.cur_x,
                selectedObject.item.render_variables.animation_variables.cur_y);
        }
    };

    // Mouse press event handler
    self.mouseDownEvent = function (isMouseDownOnObject) {
        if (isMouseDownOnObject)
            viewport.plugins.pause('drag');
    };

    // Mouse move event handler
    self.mouseMoveEvent = function (mouseCellPos, isMouseDown, isMouseOnObject, isCtrlDown) {
        if (isMouseDown) return;

        if (isMouseOnObject && !isCtrlDown)
            viewport.plugins.pause('drag');
        else
            viewport.plugins.resume('drag');
    };

    // Mouse release event handler
    self.mouseUpEvent = function () {
    };

    // Creates a text at a certain x, y (x, y represent the text center)
    self.createText = function(text, x, y) {
        let ret;
        // Initialize the position Text
        let textStyle = new PIXI.TextStyle({
            fill: GFX_COLORS_DEFAULT.CELL_STROKE,
            fontFamily: 'Asap',
            fontSize: 195,
        });
        ret = new PIXI.Text(text, textStyle);
        ret.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
        ret.texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.ON;
        ret.scale.x = 1/15;
        ret.scale.y = 1/15;
        ret.anchor.set(0.5, 0.5);
        ret.x = x;
        ret.y = y;

        return ret;
    };
};

module.exports = gfxEngine;