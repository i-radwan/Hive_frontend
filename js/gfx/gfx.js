let GfxMap = require('./gfx_map');
const $ = require('jquery');

let gfx = function (logicEventHandler) {
    let self = this;

    // Event Handler that communicates with main VM
    self.logicEventHandler = logicEventHandler;

    // Gfx map and engine variables
    let gfxMap = new GfxMap(self.logicEventHandler);
    let canvas = $('.map-row');
    let gfxEngine = gfxMap.gfxEngine;

    gfxMap.init();

    // Running mode
    let runningMode = RUNNING_MODE.DESIGN;

    // Start Simulation Event
    let simulationStartEvent = function () {
        runningMode = RUNNING_MODE.SIMULATE;
        gfxMap.simulationStart();
    };

    // Pause Simulation Event
    let simulationPauseEvent = function () {
        runningMode = RUNNING_MODE.PAUSE;
        gfxMap.pauseAllAnimations();
    };

    // Resume Simulation Event
    let simulationResumeEvent = function () {
        runningMode = RUNNING_MODE.SIMULATE;
        gfxMap.resumeAllAnimations();
    };

    // Stop Simulation Event
    let simulationStopEvent = function () {
        runningMode = RUNNING_MODE.DESIGN;
        gfxMap.stopAllAnimations();
    };

    // Update function of two.js (Calls everything that needs execution each frame)
    gfxEngine.pixi_app.ticker.add((delta) => {
        gfxEngine.gfxUpdateEvent(delta);

        if (runningMode === RUNNING_MODE.SIMULATE)
            gfxMap.gfxUpdateEvent(delta);
    });

    // Mouse press event handler
    canvas.bind('mousedown', function (e) {
        if (e.which !== 1)
            return;
        if (runningMode === RUNNING_MODE.DESIGN)
            gfxMap.designModeMouseDownEvent(e);
        else
            gfxMap.simulationModeMouseDownEvent(e);
    });

    // Mouse move event handler
    canvas.bind('mousemove', function (e) {
        if (runningMode === RUNNING_MODE.DESIGN)
            gfxMap.designModeMouseMoveEvent(e);
        else
            gfxMap.simulationModeMouseMoveEvent(e);
    });

    // Mouse release event handler
    canvas.bind('mouseup', function (e) {
        if (e.which !== 1)
            return;
        if (runningMode === RUNNING_MODE.DESIGN)
            gfxMap.designModeMouseUpEvent(e);
        else
            gfxMap.simulationModeMouseUpEvent(e);
    });

    // Test Code for simulation mode
    let x = -1;
    canvas.bind('contextmenu', function () {
        switch (x) {
            case -1:
                simulationStartEvent();
                break;
            case 0:
                //gfxMap.objectColorize(1, MAP_CELL.ROBOT, 0,0,"#ffcc00");
                //gfxMap.objectMove(1, 0, 0);
                gfxMap.objectRotateRight(1, 0, 0);
                gfxMap.objectRotateRight(2, 0, 1);
                gfxMap.objectRotateRight(3, 0, 2);
                gfxMap.objectRotateRight(4, 0, 3);
                gfxMap.objectColorizeLed(1, MAP_CELL.ROBOT, 0, 0, GFX_COLORS.LED_GREEN_COLOR, LED_COLOR_MODE.ON);
                gfxMap.objectColorizeLed(2, MAP_CELL.ROBOT, 0, 1, GFX_COLORS.LED_BLUE_COLOR, LED_COLOR_MODE.FLASH);
                gfxMap.objectColorizeLed(3, MAP_CELL.ROBOT, 0, 2, GFX_COLORS.LED_GREEN_COLOR, LED_COLOR_MODE.FLASH);
                gfxMap.objectColorizeLed(4, MAP_CELL.ROBOT, 0, 3, GFX_COLORS.LED_BLUE_COLOR, LED_COLOR_MODE.FLASH);
                break;
            case 1:
                gfxMap.objectMove(1, 0, 0);
                gfxMap.objectMove(2, 0, 1);
                gfxMap.objectMove(3, 0, 2);
                gfxMap.objectMove(4, 0, 3);
                //gfxMap.objectRotateRight(1, 0, 1);
                break;
            case 2:
                gfxMap.objectUpdate(1, MAP_CELL.ROBOT, 1, 0, 70);
                gfxMap.objectUpdate(2, MAP_CELL.ROBOT, 1, 1, 30);
                gfxMap.objectUpdate(3, MAP_CELL.ROBOT, 1, 2, 90);
                gfxMap.objectBind(1, MAP_CELL.ROBOT, 1, 0, 1, MAP_CELL.GATE);
                gfxMap.objectBind(3, MAP_CELL.ROBOT, 1, 2, 2, MAP_CELL.STATION);
                gfxMap.objectLoad(2, MAP_CELL.ROBOT, 1, 1, 2, MAP_CELL.RACK);
                gfxMap.objectLoad(4, MAP_CELL.ROBOT, 1, 3, 1, MAP_CELL.RACK);
                gfxMap.objectHighlight(4, MAP_CELL.ROBOT, 1, 3);
                gfxMap.objectHighlight(1, MAP_CELL.RACK, 1, 3);
                gfxMap.objectColorizeLed(1, MAP_CELL.ROBOT, 1, 0, GFX_COLORS.LED_GREEN_COLOR, LED_COLOR_MODE.FLASH);
                gfxMap.objectColorizeLed(2, MAP_CELL.ROBOT, 1, 1, GFX_COLORS.LED_RED_COLOR, LED_COLOR_MODE.FLASH);
                gfxMap.objectColorizeLed(3, MAP_CELL.ROBOT, 1, 2, GFX_COLORS.LED_GREEN_COLOR, LED_COLOR_MODE.ON);
                gfxMap.objectColorizeLed(4, MAP_CELL.ROBOT, 1, 3, GFX_COLORS.LED_BLUE_COLOR, LED_COLOR_MODE.ON);
                gfxMap.objectColorize(1, MAP_CELL.GATE, 1, 0, "#12DDFF");
                gfxMap.objectColorize(2, MAP_CELL.RACK, 1, 1, "#962FFD");
                gfxMap.objectColorize(2, MAP_CELL.STATION, 1, 2, "#12DD55");
                gfxMap.objectColorize(1, MAP_CELL.RACK, 1, 3, "#FD6255");
                break;
            case 3:
                // gfxMap.objectRotateLeft(4, 1, 3);
                gfxMap.objectRetreat(4, 1, 3);
                break;
            case 4:
                gfxMap.objectOffload(4, MAP_CELL.ROBOT, 0, 3, 1, MAP_CELL.RACK);
                gfxMap.objectDecolorize(1, MAP_CELL.RACK, 0, 3);
                gfxMap.objectColorizeLed(4, MAP_CELL.ROBOT, 0, 3, GFX_COLORS.LED_BLUE_COLOR, LED_COLOR_MODE.OFF);
                break;
            case 5:
                gfxMap.objectRetreat(4, 0, 3);
                // gfxMap.objectRotateRight(4, 1, 3);
                break;
            case 6:
                gfxMap.objectMove(4, 1, 3);
                break;
            case 7:
                gfxMap.objectBind(4, MAP_CELL.ROBOT, 2, 3, 1, MAP_CELL.STATION);
                gfxMap.objectColorize(1, MAP_CELL.STATION, 2, 3, "#FA15DD");
                break;
            case 8:
                gfxMap.objectLoad(1, MAP_CELL.ROBOT, 2, 0, 1, MAP_CELL.RACK);
                break;
            case 9:
                gfxMap.objectMove(1, 2, 0);
                break;
        }
        x++;
    });

    // Key press event handler
    $(document).on('keydown', function (e) {
        switch (e.which) {
            case KEY_CODE.SPACE:
                gfxEngine.keyDownEvent(e);
                break;
            case KEY_CODE.CTRL:
                gfxMap.keyDownEvent(e);
        }
    });

    // Key release event handler
    $(document).on('keyup', function (e) {
        switch (e.which) {
            case KEY_CODE.SPACE:
                gfxEngine.keyUpEvent(e);
                break;
            case KEY_CODE.DELETE:
                gfxMap.deleteEvent(e);
                break;
            case KEY_CODE.ESC:
                self.logicEventHandler({
                    type: EVENT_FROM_GFX.ESC
                });
                break;
            case KEY_CODE.CTRL:
                gfxMap.keyUpEvent(e);
                break;
        }
    });

    // The handler that handles all the events coming from the mainVM
    self.eventHandler = function (event) {
        switch (event.type) {
            case EVENT_TO_GFX.INIT:
                gfxMap.createMap(event.data.width, event.data.height);
                break;
            case EVENT_TO_GFX.OBJECT_HOVER:
                gfxMap.objectHover(event.data.type, event.data.color);
                break;
            case EVENT_TO_GFX.OBJECT_ADD:
                gfxMap.objectAdd(event.data.id, event.data.type, event.data.row, event.data.col, event.data.color);
                break;
            case EVENT_TO_GFX.OBJECT_DELETE:
                gfxMap.objectDelete(event.data.id, event.data.type, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_DRAG:
                gfxMap.objectDrag(event.data.id, event.data.type, event.data.src_row, event.data.src_col, event.data.dst_row, event.data.dst_col);
                break;
            case EVENT_TO_GFX.OBJECT_MOVE:
                gfxMap.objectMove(event.data.id, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_ROTATE_RIGHT:
                gfxMap.objectRotateRight(event.data.id, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_ROTATE_LEFT:
                gfxMap.objectRotateLeft(event.data.id, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_RETREAT:
                gfxMap.objectRetreat(event.data.id, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_HIGHLIGHT:
                gfxMap.objectHighlight(event.data.id, event.data.type, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_UNHIGHLIGHT:
                gfxMap.objectUnhighlight();
                break;
            case EVENT_TO_GFX.OBJECT_COLORIZE:
                gfxMap.objectColorize(event.data.id, event.data.type, event.data.row, event.data.col, event.data.color);
                break;
            case EVENT_TO_GFX.OBJECT_DECOLORIZE:
                gfxMap.objectDecolorize(event.data.id, event.data.type, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_COLORIZE_LED:
                gfxMap.objectColorizeLed(event.data.id, event.data.type, event.data.row, event.data.col, event.data.color, event.data.mode);
                break;
            case EVENT_TO_GFX.OBJECT_BIND:
                gfxMap.objectBind(event.data.id, event.data.type, event.data.row, event.data.col, event.data.object_id, event.data.object_type);
                break;
            case EVENT_TO_GFX.OBJECT_UNBIND:
                gfxMap.objectUnbind(event.data.id, event.data.type, event.data.row, event.data.col, event.data.object_id, event.data.object_type);
                break;
            case EVENT_TO_GFX.OBJECT_LOAD:
                gfxMap.objectLoad(event.data.id, event.data.type, event.data.row, event.data.col, event.data.object_id, event.data.object_type);
                break;
            case EVENT_TO_GFX.OBJECT_OFFLOAD:
                gfxMap.objectOffload(event.data.id, event.data.type, event.data.row, event.data.col, event.data.object_id, event.data.object_type);
                break;
            case EVENT_TO_GFX.OBJECT_FAILURE:
                gfxMap.objectFailure(event.data.id, event.data.type, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_STOP:
                gfxMap.objectStop(event.data.id, event.data.type, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_FIXED:
                gfxMap.objectFixed(event.data.id, event.data.type, event.data.row, event.data.col);
                break;
            case EVENT_TO_GFX.OBJECT_UPDATE:
                gfxMap.objectUpdate(event.data.id, event.data.type, event.data.row, event.data.col, event.data.battery);
                break;
            case EVENT_TO_GFX.SIMULATION_START:
                simulationStartEvent();
                break;
            case EVENT_TO_GFX.SIMULATION_PAUSE:
                simulationPauseEvent();
                break;
            case EVENT_TO_GFX.SIMULATION_RESUME:
                simulationResumeEvent();
                break;
            case EVENT_TO_GFX.SIMULATION_STOP:
                simulationStopEvent();
                break;
            case EVENT_TO_GFX.ESC:
                gfxMap.escapeEvent();
                break;
        }
    };

    // Set the event handler that communicates with the mainVM
    self.setLogicEventHandler = function (logicEventHandler) {
        self.logicEventHandler = logicEventHandler;

        gfxMap.setLogicEventHandler(self.logicEventHandler);
    };
};

module.exports = gfx;