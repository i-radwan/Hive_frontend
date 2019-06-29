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

    // Keyboard key states
    let isCtrlDown = false;

    // Mouse States Variables
    let isMouseDownOnObject = false;
    let isDraggingMap = false;
    let isMouseDown = false;
    let isDraggingObject = false;
    let isHovering = false;
    let isMouseInBounds = false;
    let isMouseOnObject = false;

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

        if (isDraggingMap || isCtrlDown) {
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

    // Converts from a direction to a specific move action
    let dirToMoveAction = function(direction) {
        switch (direction) {
            case ROBOT_DIR.RIGHT:
                return ANIMATION_TYPE.MOVE_RIGHT;
            case ROBOT_DIR.LEFT:
                return ANIMATION_TYPE.MOVE_LEFT;
            case ROBOT_DIR.UP:
                return ANIMATION_TYPE.MOVE_UP;
            case ROBOT_DIR.DOWN:
                return ANIMATION_TYPE.MOVE_DOWN;
        }
    };


    // Finalize the animation of a given objects position
    let finishObjectAnimation = function (row, col, idx) {
        let object = map[row][col][idx];
        let dstRow = object.render_variables.animation_variables.nxt_row;
        let dstCol = object.render_variables.animation_variables.nxt_col;

        // console.log("Finished animation for", object, "Moving it from ", row, col, " to ", dstRow, dstCol);
        let loadedObject = (object.loaded_object_id !== -1 ?
            getObject(object.loaded_object_id, object.loaded_object_type, row, col) : -1);

        if (loadedObject !== -1) {
            finishObjectAnimation(row, col, getObjectIndex(object.loaded_object_id, object.loaded_object_type, row, col));
        }

        self.gfxEngine.finishObjectAnimation(object.render_variables);
        swapObjectPosition(object.id, object.type, row, col, dstRow, dstCol);
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
        // console.log("Moving object at ", row, col, "and is ", obj);
        let action = dirToMoveAction(obj.render_variables.direction);
        self.gfxEngine.startObjectAnimation(row,
            col,
            obj.type,
            obj.render_variables,
            action);

        if (obj.loaded_object_id !== -1) {
            self.gfxEngine.startObjectAnimation(row,
                col,
                getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).type,
                getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).render_variables,
                action);
        }
    };

    // Rotate an object 90 degrees to the right
    self.objectRotateRight = function (id, row, col) {
        let obj = getObject(id, MAP_CELL.ROBOT, row, col);
        self.gfxEngine.startObjectAnimation(row,
            col,
            obj.type,
            obj.render_variables,
            ANIMATION_TYPE.ROTATE_RIGHT);

        if (obj.loaded_object_id !== -1) {
            self.gfxEngine.startObjectAnimation(row,
                col,
                getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).type,
                getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).render_variables,
                ANIMATION_TYPE.ROTATE_RIGHT);
        }
    };

    // Rotate an object 90 degrees to the left
    self.objectRotateLeft = function (id, row, col) {
        let obj = getObject(id, MAP_CELL.ROBOT, row, col);
        self.gfxEngine.startObjectAnimation(row,
            col,
            obj.type,
            obj.render_variables,
            ANIMATION_TYPE.ROTATE_LEFT);

        if (obj.loaded_object_id !== -1) {
            self.gfxEngine.startObjectAnimation(row,
                col,
                getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).type,
                getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).render_variables,
                ANIMATION_TYPE.ROTATE_LEFT);
        }
    };

    // Rotate an object 180 degrees then move one step
    self.objectRetreat = function (id, row, col) {
        let obj = getObject(id, MAP_CELL.ROBOT, row, col);
        self.gfxEngine.startObjectAnimation(row, col, obj.type, obj.render_variables, ANIMATION_TYPE.RETREAT);

        if (obj.loaded_object_id !== -1) {
            self.gfxEngine.startObjectAnimation(row,
                col,
                getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).type,
                getObject(obj.loaded_object_id, obj.loaded_object_type, row, col).render_variables,
                ANIMATION_TYPE.RETREAT);
        }
    };

    // Highlight a given object
    self.objectHighlight = function (id, type, row, col) {
        self.gfxEngine.highlightObject(getObject(id, type, row, col), row, col);
    };

    // Highlight all highlighted objects
    self.objectUnhighlight = function () {
        self.gfxEngine.unhighlightObjects();
    };

    // Colorize a given object
    self.objectColorize = function (id, type, row, col, color) {
        self.gfxEngine.colorizeObject(getObject(id, type, row, col).render_variables, type, color);
    };

    // Decolorize a given object
    self.objectDecolorize = function (id, type, row, col) {
        self.gfxEngine.deColorizeObject(getObject(id, type, row, col).render_variables, type);
    };

    // colorize the led of a given object
    self.objectColorizeLed = function (id, type, row, col, color, mode) {
        self.gfxEngine.colorizeObjectLed(getObject(id, type, row, col).render_variables, color, mode);
    };

    // Bind 2 given objects together
    self.objectBind = function (id, type, row, col, objectId, objectType) {
        getObject(id, type, row, col).bound_object_id = objectId;
        getObject(id, type, row, col).bound_object_type = objectType;

        self.gfxEngine.bindObject(
            getObject(id, type, row, col).render_variables,
            getObject(objectId, objectType, row, col).render_variables
        );

        self.logicEventHandler({
            type: EVENT_FROM_GFX.DONE,
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
            getObject(objectId, objectType, row, col).render_variables
        );

        self.logicEventHandler({
            type: EVENT_FROM_GFX.DONE,
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
            getObject(objectId, objectType, row, col).render_variables
        );

        self.logicEventHandler({
            type: EVENT_FROM_GFX.DONE,
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
            getObject(objectId, objectType, row, col).render_variables
        );

        self.logicEventHandler({
            type: EVENT_FROM_GFX.DONE,
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

        self.gfxEngine.objectFailure(obj.render_variables);

        if (obj.loaded_object_id !== -1) {
            let loadedObj = getObject(obj.loaded_object_id, obj.loaded_object_type, row, col);

            self.gfxEngine.objectFailure(loadedObj.render_variables);
        }

        self.logicEventHandler({
            type: EVENT_FROM_GFX.DONE,
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

        self.gfxEngine.objectStop(obj.render_variables);

        if (obj.loaded_object_id !== -1) {
            let loadedObj = getObject(obj.loaded_object_id, obj.loaded_object_type, row, col);

            self.gfxEngine.objectStop(loadedObj.render_variables);
        }

        self.logicEventHandler({
            type: EVENT_FROM_GFX.DONE,
            data: {
                type: EVENT_TO_GFX.OBJECT_STOP,
                data: {
                    id: id,
                    type: type,
                    row: row,
                    col: col
                }
            }
        });
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

    // Gfx update event
    self.gfxUpdateEvent = function(timeDelta) {
        self.animateObjects(timeDelta);
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
                                type: EVENT_FROM_GFX.DONE,
                                data: {
                                    type: map[row][col][k].render_variables.animation_variables.animation_type,
                                    data: {
                                        id: map[row][col][k].id,
                                        row: row,
                                        col: col
                                    }
                                }
                            });

                            finishObjectAnimation(row, col, k);
                        }
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

    // Stop all Animations
    self.stopAllAnimations = function () {
        for (let row = 0; row < mapHeight; row++) {
            for (let col = 0; col < mapWidth; col++) {
                for (let k = 0; k < map[row][col].length; k++) {
                    self.gfxEngine.stopObjectAnimation(map[row][col][k].render_variables);
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

        self.gfxEngine.unhighlightObjects();
        self.gfxEngine.removeHoveringObject();

        updateCursorStyle();
    };

    // Mouse press in design mode event handler
    self.designModeMouseDownEvent = function (e) {
        isMouseDown = true;

        let cell = getMouseCell(e.clientX, e.clientY);
        let obj = getHighestZIndexObject(cell.row, cell.col);

        if (cell.inBounds && !isHovering && obj !== -1 && !isCtrlDown) {
            isMouseDownOnObject = true;

            self.gfxEngine.startDragObject(obj, cell.row, cell.col);
        }

        self.gfxEngine.mouseDownEvent(isMouseDownOnObject);

        updateCursorStyle(e);
    };

    // Mouse press in simulation mode event handler
    self.simulationModeMouseDownEvent = function (e) {
        isMouseDown = true;

        self.gfxEngine.mouseDownEvent(false);

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

        self.gfxEngine.mouseMoveEvent(cell, isMouseDown, isMouseOnObject, isCtrlDown);

        if (isMouseDown && (!isMouseDownOnObject || isCtrlDown))
            isDraggingMap = true;

        if (isHovering) {
            self.gfxEngine.moveHoverObject(cell.row, cell.col, cell.inBounds);
        }

        if (isMouseDownOnObject && !isCtrlDown) {
            isDraggingObject = true;

            self.gfxEngine.moveDragObject(cell.row, cell.col);
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

    // Key down event handler
    self.keyDownEvent = function (e) {
        switch (e.which) {
            case KEY_CODE.CTRL:
                isCtrlDown = true;
                updateCursorStyle();
                break;
        }
    };

    // Key up event handler
    self.keyUpEvent = function (e) {
        switch (e.which) {
            case KEY_CODE.CTRL:
                isCtrlDown = false;
                updateCursorStyle();
                break;
        }
    };

    // Delete key event handler
    self.deleteEvent = function () {
        let obj = self.gfxEngine.getFirstSelectedObject();

        if (typeof obj === 'undefined')
            return;

        self.logicEventHandler({
            type: EVENT_FROM_GFX.CELL_DELETE,
            row: obj.row,
            col: obj.col
        });
    };
};


module.exports = gfxMap;