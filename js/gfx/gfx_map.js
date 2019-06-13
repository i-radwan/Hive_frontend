let GfxEngine = require('./gfx_engine');

let gfxMap = function (logicEventHandler) {
    let self = this;

    // Event Handler that communicates with main VM
    self.logicEventHandler = logicEventHandler;

    // Map grid
    let map = [];
    let mapWidth, mapHeight;

    // Gfx Engine
    self.gfxEngine = new GfxEngine();

    // Sets the cursor style to the given style
    let setCursorStyle = function (style) {
        document.body.style.cursor = style;
    };

    // Mouse States Variables
    let isMouseDownOnObject = false;
    let isDraggingMap = false;
    let isMouseDown = false;
    let isDraggingObject = false;
    let isHovering = false;
    let isMouseInBounds = false;
    let isMouseOnObject = false;

    // Convert given angle to DIR enum
    let angleToDir = function (angle) {
        switch (angle) {
            case 0:
            case 360:
                return ROBOT_DIR.RIGHT;
            case 90:
            case -270:
                return ROBOT_DIR.UP;
            case 180:
            case -180:
                return ROBOT_DIR.LEFT;
            case 270:
            case -90:
                return ROBOT_DIR.DOWN;
        }
    };

    // Return the 3rd dimension index of a given objects id, type, row, col
    let getObjectIndex = function (id, type, row, col) {
        for (let i = 0; i < map[row][col].length; i++) {
            if (map[row][col][i].id === id && map[row][col][i].type === type)
                return i;
        }

        return -1;
    };

    // Return the object of a given objects id, type, row, col
    let getObject = function (id, type, row, col) {
        let idx = getObjectIndex(id, type, row, col);

        return (idx === -1 ? -1 : map[row][col][idx]);
    };

    // Swaps position of an object in the map
    let swapObjectPosition = function (id, type, row, col, newRow, newCol) {
        let obj = map[row][col].splice(getObjectIndex(id, type, row, col), 1);

        map[newRow][newCol].push(obj[0]);
    };

    // Returns the object with the highest Z-Index at a given row, col
    let getHighestZIndexObject = function (row, col) {
        let ret = {render_variables: {z_index: -1}};

        for (let k = 0; k < map[row][col].length; k++) {
            if (ret.render_variables.z_index < map[row][col][k].render_variables.z_index)
                ret = map[row][col][k];
        }

        return (ret.render_variables.z_index === -1 ? -1 : ret);
    };

    // Gets from the mouse raw position the row and column of the cell that is being clicked (if out of bounds it returns the nearest cell)
    let getMouseCell = function (mouseX, mouseY) {
        let ret = self.gfxEngine.getMouseCell(mouseX, mouseY);

        ret.inBounds = !(ret.col < 0 || ret.col >= mapWidth || ret.row < 0 || ret.row >= mapHeight);

        ret.row = Math.min(ret.row, mapHeight - 1);
        ret.row = Math.max(ret.row, 0);

        ret.col = Math.min(ret.col, mapWidth - 1);
        ret.col = Math.max(ret.col, 0);

        return ret;
    };

    let updateCursorStyle = function () {
        setCursorStyle(CURSOR_STYLES.DEFAULT);

        if (isDraggingMap) {
            setCursorStyle(CURSOR_STYLES.CROSS);
            return;
        }

        if (!isMouseInBounds)
            return;

        if (isHovering && isMouseDown && !isDraggingMap) {
            setCursorStyle(CURSOR_STYLES.GRABBING);
            return;
        }

        if (isHovering && !isMouseDown) {
            setCursorStyle(CURSOR_STYLES.CAN_GRAB);
            return;
        }

        if (isMouseOnObject && !isMouseDown) {
            setCursorStyle(CURSOR_STYLES.CAN_GRAB);
            return;
        }

        if (isMouseOnObject && isMouseDown) {
            setCursorStyle(CURSOR_STYLES.GRABBING);
            return;
        }

        if (isDraggingObject) {
            setCursorStyle(CURSOR_STYLES.GRABBING);
        }
    };

    // Finalize the animation of a given objects position
    let finishObjectAnimation = function (row, col, idx) {
        let dstRow = map[row][col][idx].render_variables.animation_variables.nxt_row;
        let dstCol = map[row][col][idx].render_variables.animation_variables.nxt_col;

        map[row][col][idx].render_variables.direction = angleToDir(map[row][col][idx].render_variables.animation_variables.cur_angle);

        swapObjectPosition(map[row][col][idx].id, map[row][col][idx].type, row, col, dstRow, dstCol);
    };

    // Set the event handler that communicates with the mainVM
    self.setLogicEventHandler = function (logicEventHandler) {
        self.logicEventHandler = logicEventHandler;
    };

    // Initializes the gfx map
    self.init = function () {
        self.gfxEngine.init();
    };

    // Create the map grid
    self.createMap = function (width, height) {
        mapWidth = width;
        mapHeight = height;
        map = new Array(height);

        for (let i = 0; i < height; i++) {
            map[i] = new Array(width);

            for (let j = 0; j < width; j++) {
                map[i][j] = [];
            }
        }

        self.gfxEngine.drawMapGrid(mapWidth, mapHeight);
    };

    // Start object hovering
    self.objectHover = function (type, color) {
        isHovering = true;
        self.gfxEngine.addHoverObject(type, color);
    };

    // Add an object at the given row, col with a given type and id
    self.objectAdd = function (id, type, row, col, color) {
        map[row][col].push(self.gfxEngine.addObject(id, type, row, col, color));
    };

    // Delete an object at the given row, col with a given type and id
    self.objectDelete = function (id, type, row, col) {
        self.gfxEngine.deleteObject(getObject(id, type, row, col).render_variables, type);
        map[row][col].splice(getObjectIndex(id, type, row, col), 1);

        updateCursorStyle();
    };

    // Drag an object at the given row, col with a given type and id to the given row, col
    self.objectDrag = function (id, type, srcRow, srcCol, dstRow, dstCol) {
        self.gfxEngine.moveDragObject(dstRow, dstCol);

        if (srcRow === dstRow && srcCol === dstCol)
            return;

        swapObjectPosition(id, type, srcRow, srcCol, dstRow, dstCol);
    };

    // Move an object one step in its direction
    self.objectMove = function (id, row, col) {
        let obj = getObject(id, MAP_CELL.ROBOT, row, col);
        self.gfxEngine.startObjectAnimation(row, col, obj.render_variables, ANIMATION_TYPE.MOVE);

        if (obj.loaded_object_id !== -1) {
            self.gfxEngine.startObjectAnimation(row, col, getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).render_variables, ANIMATION_TYPE.MOVE);
        }
    };

    // Rotate an object 90 degrees to the right
    self.objectRotateRight = function (id, row, col) {
        let obj = getObject(id, MAP_CELL.ROBOT, row, col);
        self.gfxEngine.startObjectAnimation(row, col, obj.render_variables, ANIMATION_TYPE.ROTATE_RIGHT);

        if (obj.loaded_object_id !== -1) {
            self.gfxEngine.startObjectAnimation(row, col, getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).render_variables, ANIMATION_TYPE.ROTATE_RIGHT);
        }
    };

    // Rotate an object 90 degrees to the left
    self.objectRotateLeft = function (id, row, col) {
        let obj = getObject(id, MAP_CELL.ROBOT, row, col);
        self.gfxEngine.startObjectAnimation(row, col, obj.render_variables, ANIMATION_TYPE.ROTATE_LEFT);

        if (obj.loaded_object_id !== -1) {
            self.gfxEngine.startObjectAnimation(row, col, getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).render_variables, ANIMATION_TYPE.ROTATE_LEFT);
        }
    };

    // Rotate an object 180 degrees then move one step
    self.objectRetreat = function (id, row, col) {
        let obj = getObject(id, MAP_CELL.ROBOT, row, col);
        self.gfxEngine.startObjectAnimation(row, col, obj.render_variables, ANIMATION_TYPE.RETREAT);

        if (obj.loaded_object_id !== -1) {
            self.gfxEngine.startObjectAnimation(row, col, getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).render_variables, ANIMATION_TYPE.RETREAT);
        }
    };

    // Highlight a given object
    self.objectHighlight = function (id, type, row, col) {
        self.gfxEngine.highlightObject(getObject(id, type, row, col), row, col);
    };

    // Colorize a given object
    self.objectColorize = function (id, type, row, col, color) {
        self.gfxEngine.colorizeObject(getObject(id, type, row, col).render_variables, type, color);
    };

    // Decolorize a given object
    self.objectDecolorize = function (id, type, row, col) {
        self.gfxEngine.deColorizeObject(getObject(id, type, row, col).render_variables, type);
    };

    // Bind 2 given objects together
    self.objectBind = function (id, type, row, col, objectId, objectType) {
        getObject(id, type, row, col).bound_object_id = objectId;
        getObject(id, type, row, col).bound_object_type = objectType;

        self.gfxEngine.bindObject(
            getObject(id, type, row, col).render_variables,
            getObject(objectId, objectType, row, col).render_variables,
            objectType,
            (getObject(id, type, row, col).loaded_object_id !== -1)
        );

        self.logicEventHandler({
            type: EVENT_FROM_GFX.ACK_ACTION,
            data: {
                type: EVENT_TO_GFX.OBJECT_BIND,
                data: {
                    id: id,
                    type: type,
                    row: row,
                    col: col,
                    object_id: objectId,
                    object_type: objectType
                }
            }
        });
    };

    // Unbind 2 given objects
    self.objectUnbind = function (id, type, row, col, objectId, objectType) {
        getObject(id, type, row, col).bound_object_id = -1;
        getObject(id, type, row, col).bound_object_type = -1;

        self.gfxEngine.unbindObject(
            getObject(id, type, row, col).render_variables,
            getObject(objectId, objectType, row, col).render_variables,
            objectType,
            (getObject(id, type, row, col).loaded_object_id !== -1)
        );

        self.logicEventHandler({
            type: EVENT_FROM_GFX.ACK_ACTION,
            data: {
                type: EVENT_TO_GFX.OBJECT_UNBIND,
                data: {
                    id: id,
                    type: type,
                    row: row,
                    col: col,
                    object_id: objectId,
                    object_type: objectType
                }
            }
        });
    };

    // Load 2 given objects
    self.objectLoad = function (id, type, row, col, objectId, objectType) {
        getObject(id, type, row, col).loaded_object_id = objectId;
        getObject(id, type, row, col).loaded_object_type = objectType;

        self.gfxEngine.loadObject(
            getObject(id, type, row, col).render_variables,
            getObject(objectId, objectType, row, col).render_variables,
            objectType,
            getObject(id, type, row, col).bound_object_id !== -1
        );

        self.logicEventHandler({
            type: EVENT_FROM_GFX.ACK_ACTION,
            data: {
                type: EVENT_TO_GFX.OBJECT_LOAD,
                data: {
                    id: id,
                    type: type,
                    row: row,
                    col: col,
                    object_id: objectId,
                    object_type: objectType
                }
            }
        });
    };

    // Offload 2 given objects
    self.objectOffload = function (id, type, row, col, objectId, objectType) {
        getObject(id, type, row, col).loaded_object_id = -1;
        getObject(id, type, row, col).loaded_object_type = -1;

        self.gfxEngine.offloadObject(
            getObject(id, type, row, col).render_variables,
            getObject(objectId, objectType, row, col).render_variables,
            objectType,
            getObject(id, type, row, col).bound_object_id !== -1
        );

        self.logicEventHandler({
            type: EVENT_FROM_GFX.ACK_ACTION,
            data: {
                type: EVENT_TO_GFX.OBJECT_OFFLOAD,
                data: {
                    id: id,
                    type: type,
                    row: row,
                    col: col,
                    object_id: objectId,
                    object_type: objectType
                }
            }
        });
    };

    // Force fail a given object and the loaded object on it
    self.objectFailure = function (id, type, row, col) {
        let obj = getObject(id, type, row, col);

        self.gfxEngine.objectFailure(obj.render_variables, type);

        if (obj.loaded_object_id !== -1) {
            let loadedObj = getObject(obj.loaded_object_id, obj.loaded_object_type, row, col);

            self.gfxEngine.objectFailure(loadedObj.render_variables, loadedObj.type);
        }

        self.logicEventHandler({
            type: EVENT_FROM_GFX.ACK_ACTION,
            data: {
                type: EVENT_TO_GFX.OBJECT_FAILURE,
                data: {
                    id: id,
                    type: type,
                    row: row,
                    col: col
                }
            }
        });
    };

    // Force stop a given object and the loaded object on it
    self.objectStop = function (id, type, row, col) {
        let obj = getObject(id, type, row, col);

        self.gfxEngine.objectStop(obj.render_variables, type);

        if (obj.loaded_object_id !== -1) {
            let loadedObj = getObject(obj.loaded_object_id, obj.loaded_object_type, row, col);

            self.gfxEngine.objectStop(loadedObj.render_variables, loadedObj.type);
        }
    };

    // Resume a given object
    self.objectFixed = function (id, type, row, col) {
        let obj = getObject(id, type, row, col);

        self.gfxEngine.objectFixed(
            obj.render_variables,
            type,
            obj.bound_object_id !== -1,
            obj.loaded_object_id !== -1
        );

        if (obj.loaded_object_id !== -1) {
            let loadedObj = getObject(obj.loaded_object_id, obj.loaded_object_type, row, col);

            self.gfxEngine.objectFixed(
                loadedObj.render_variables,
                loadedObj.type,
                obj.bound_object_id !== -1,
                obj.loaded_object_id !== -1);
        }
    };

    // Update an object battery level
    self.objectUpdate = function (id, type, row, col, battery) {
        self.gfxEngine.updateObject(getObject(id, type, row, col).render_variables, battery);
    };

    // Animate all objects with the given time step
    self.animateObjects = function (timeDelta) {
        for (let row = 0; row < mapHeight; row++) {
            for (let col = 0; col < mapWidth; col++) {
                for (let k = 0; k < map[row][col].length; k++) {
                    let isAnimationFinished = self.gfxEngine.animateObject(map[row][col][k].render_variables, timeDelta);

                    if (isAnimationFinished) {
                        if (map[row][col][k].type === MAP_CELL.ROBOT) {
                            self.logicEventHandler({
                                type: EVENT_FROM_GFX.ACK_ACTION,
                                data: {
                                    type: map[row][col][k].render_variables.animation_variables.animation_type,
                                    data: {
                                        id: map[row][col][k].id,
                                        row: row,
                                        col: col
                                    }
                                }
                            });
                        }

                        finishObjectAnimation(row, col, k);
                    }
                }
            }
        }
    };

    // Pause all animations
    self.pauseAllAnimations = function () {
        for (let row = 0; row < mapHeight; row++) {
            for (let col = 0; col < mapWidth; col++) {
                for (let k = 0; k < map[row][col].length; k++) {
                    self.gfxEngine.pauseObjectAnimation(map[row][col][k].render_variables);
                }
            }
        }
    };

    // Resume all Animations
    self.resumeAllAnimations = function () {
        for (let row = 0; row < mapHeight; row++) {
            for (let col = 0; col < mapWidth; col++) {
                for (let k = 0; k < map[row][col].length; k++) {
                    self.gfxEngine.resumeObjectAnimation(map[row][col][k].render_variables);
                }
            }
        }
    };

    // Start simulation mode
    self.simulationStart = function () {
        isHovering = false;

        self.gfxEngine.removeHoveringObject();
    };

    // Escape key event handler
    self.escapeEvent = function () {
        isHovering = false;

        self.gfxEngine.unhighlightObject();
        self.gfxEngine.removeHoveringObject();

        updateCursorStyle();
    };

    // Mouse press in design mode event handler
    self.designModeMouseDownEvent = function (e) {
        isMouseDown = true;

        let cell = getMouseCell(e.clientX, e.clientY);
        let obj = getHighestZIndexObject(cell.row, cell.col);

        if (cell.inBounds && !isHovering && obj !== -1) {
            isMouseDownOnObject = true;

            self.gfxEngine.startDragObject(obj, cell.row, cell.col);
        } else {
            self.gfxEngine.mouseDownEvent(e);
        }

        updateCursorStyle(e);
    };

    // Mouse press in simulation mode event handler
    self.simulationModeMouseDownEvent = function (e) {
        isMouseDown = true;

        self.gfxEngine.mouseDownEvent(e);

        updateCursorStyle(e);
    };

    // Mouse move in design mode event handler
    self.designModeMouseMoveEvent = function (e) {
        let cell = getMouseCell(e.clientX, e.clientY);

        isMouseOnObject = (cell.inBounds && getHighestZIndexObject(cell.row, cell.col) !== -1);
        isMouseInBounds = cell.inBounds;

        self.logicEventHandler({
            type: EVENT_FROM_GFX.CELL_HOVER,
            row: (cell.inBounds ? cell.row : ""),
            col: (cell.inBounds ? cell.col : "")
        });

        if (isMouseDown && !isMouseDownOnObject)
            isDraggingMap = true;

        if (isHovering) {
            self.gfxEngine.moveHoverObject(cell.row, cell.col, cell.inBounds);
        }

        if (isMouseDownOnObject) {
            isDraggingObject = true;

            self.gfxEngine.moveDragObject(cell.row, cell.col);
        } else {
            self.gfxEngine.mouseMoveEvent(e);
        }

        updateCursorStyle(e);
    };

    // Mouse move in simulation mode event handler
    self.simulationModeMouseMoveEvent = function (e) {
        self.designModeMouseMoveEvent(e);

        updateCursorStyle(e);
    };

    // Mouse release in design mode event handler
    self.designModeMouseUpEvent = function (e) {
        let cell = getMouseCell(e.clientX, e.clientY);
        let srcCell = {};

        if (isMouseDownOnObject)
            srcCell = self.gfxEngine.finishDragObject();

        if (isDraggingObject) {
            self.logicEventHandler({
                type: EVENT_FROM_GFX.CELL_DRAG,
                src_row: srcCell.src_row,
                src_col: srcCell.src_col,
                dst_row: cell.row,
                dst_col: cell.col
            });
        } else if (isMouseInBounds && !isDraggingMap) {
            self.logicEventHandler({
                type: EVENT_FROM_GFX.CELL_CLICK,
                row: cell.row,
                col: cell.col
            });
        }

        self.gfxEngine.mouseUpEvent();

        isDraggingObject = false;
        isMouseDownOnObject = false;
        isMouseDown = false;
        isDraggingMap = false;

        updateCursorStyle(e);
    };

    // Mouse release in simulation mode event handler
    self.simulationModeMouseUpEvent = function (e) {
        let cell = getMouseCell(e.clientX, e.clientY);

        self.gfxEngine.mouseUpEvent(e);

        if (cell.inBounds && !isDraggingMap) {
            self.logicEventHandler({
                type: EVENT_FROM_GFX.CELL_CLICK,
                row: cell.row,
                col: cell.col
            });
        }

        isDraggingMap = false;
        isMouseDown = false;

        updateCursorStyle(e);
    };

    // Delete key event handler
    self.deleteEvent = function (e) {
        let obj = self.gfxEngine.getSelectedObject();

        if (obj.row === undefined)
            return;

        self.logicEventHandler({
            type: EVENT_FROM_GFX.CELL_DELETE,
            row: obj.row,
            col: obj.col
        });
    };
};


module.exports = gfxMap;