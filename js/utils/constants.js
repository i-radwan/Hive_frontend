SERVER_IP = "127.0.0.1";
SERVER_PORT = 1337;

RECONNECT_INTERVAL = 150;   // ms

MIN_TIMESTEP = 1000;        // ms

//
// Shouting codes
//
SHOUT = {
    STATE_UPDATED: 0,
    MSG: 1,
    LOADING: 2,
    ESC: 3
};

//
// Running modes
//
RUNNING_MODE = {
    DESIGN: 0,
    SIMULATE: 1,
    DEPLOY: 2,
    PAUSE: 3
};

// Panels
LEFT_PANEL = {
    EMPTY: 0,
    TEMPS: 1,
    MAP: 2,
    GATE: 3,
    ROBOT: 4,
    RACK: 5,
    STATION: 6,
    OBSTACLE: 7,
    ORDER: 8
};

RIGHT_PANEL = {
    EMPTY: 0,
    LOGS: 1,
    STATS: 2,
    ITEMS: 3
};

ORDER_PANEL = {
    ADD: 0,
    ONGOING: 1,
    UPCOMING: 2,
    FINISHED: 3
};

// Map
MAP_INIT_WIDTH = 17;
MAP_INIT_HEIGHT = 10;
MAP_CELL = {
    GATE: 0,
    ROBOT: 1,
    RACK: 2,
    STATION: 3,
    OBSTACLE: 4
};

// Msgs configs
MSG_TIMEOUT = 2500; // ms

// Msgs types
MSG_TYPE = {
    INFO: 0,
    ERROR: 1
};

// Logs levels
LOG_LEVEL = {
    INFO: 0,
    WARNING: 1,
    ERROR: 2
};

LOG_TYPE = {
    ROBOT: 0,
    RACK: 1,
    ORDER: 2,
    TEXT: 3
};

// Regex
REG_HTML_COLOR = "^#([A-Fa-f0-9]{6})$";
REG_IP = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$";

RACK_INIT_CAP = 250;
RACK_INIT_WEIGHT = 50;

ORDER_TYPE = {
    COLLECT: 0,
    REFILL: 1
};

ORDER_STATUS = {
    ONGOING: 0,
    UPCOMING: 1,
    FINISHED: 2
};

UPCOMING_ORDERS_CONSUMPTION_INTERVAL = 1000 * 60; // 1 Min

ROBOT_DIR_CNT = 4;
ROBOT_DIR = {
    RIGHT: 0,
    UP: 1,
    LEFT: 2,
    DOWN: 3
};

ROW_DELTA = [0, -1, 0, 1];
COL_DELTA = [1, 0, -1, 0];

//
// GFX
//
GRID_CELL_LENGTH = 50;
MAX_ZOOM_VAL = 8;
MIN_ZOOM_VAL = 0.06;
KEYBOARD_DRAG_SPEED = 0.5;

ARROW = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
};

KEY_CODE = {
    F5: 116,
    DELETE: 46,
    ESC: 27
};

MOVING_SPEED = 0.1;
ROTATING_SPEED = 0.1;
FLASHING_SPEED = 500;

ANIMATION_TYPE = {
    MOVE: 5,
    ROTATE_RIGHT: 6,
    ROTATE_LEFT: 7,
    RETREAT: 8
};

FLASH_TYPE = {
    FAILURE: 0,
    LOAD: 1,
    BIND: 2,
    NO_FLASH: 3
};

CURSOR_STYLES = {
    CROSS: "move",
    DEFAULT: "default",
    POINTER: "pointer",
    CAN_GRAB: "grab",
    GRABBING: "grabbing"
};

//
// Events
//

// Server Msgs

MSG_TO_SERVER = {
    START: 0,
    ORDER: 1,
    PAUSE: 2,
    STOP: 3,
    RESUME: 4,
    ACK: 5,
    DEACTIVATE: 6,
    ACTIVATE: 7,
    BLOCKED: 8
};

MSG_FROM_SERVER = {
    ACK_START: 0,
    ACK_RESUME: 1,
    ACK_ORDER: 2,
    UPDATE: 3,
    DEACTIVATE: 4,
    ACTIVATE: 5,
    MSG: 6
};

START_MODE = {
    SIMULATE: 0,
    DEPLOY: 1
};

ACK_START_STATUS = {
    OK: 0,
    ERROR: 1
};

ACK_RESUME_STATUS = {
    OK: 0,
    ERROR: 1
};

ACK_ORDER_STATUS = {
    OK: 0,
    ERROR: 1
};

SERVER_ACTIONS = {
    MOVE: 0,
    ROTATE_RIGHT: 1,
    ROTATE_LEFT: 2,
    RETREAT: 3,
    LOAD: 4,
    OFFLOAD: 5,
    BIND: 6,
    UNBIND: 7
};

SERVER_LOGS = {
    TASK_ASSIGNED: 0,
    TASK_COMPLETED: 1,
    ORDER_FULFILLED: 2,
    ORDER_ISSUED: 3,
    ORDER_DELAYED: 4,
    ORDER_RESUMED: 5,
    BATTERY_UPDATED: 6
};

// GFX Events
EVENT_FROM_GFX = {
    CELL_CLICK: 0,
    CELL_DRAG: 1,
    CELL_DELETE: 2,
    CELL_HOVER: 3,
    ACK_ACTION: 4,
    ESC: 5
};

EVENT_TO_GFX = {
    INIT: 0,
    OBJECT_HOVER: 1,
    OBJECT_ADD: 2,
    OBJECT_DELETE: 3,
    OBJECT_DRAG: 4,
    OBJECT_MOVE: 5,
    OBJECT_ROTATE_RIGHT: 6,
    OBJECT_ROTATE_LEFT: 7,
    OBJECT_RETREAT: 8,
    OBJECT_HIGHLIGHT: 9,
    OBJECT_COLORIZE: 10,
    OBJECT_DECOLORIZE: 11,
    OBJECT_BIND: 12,
    OBJECT_UNBIND: 13,
    OBJECT_LOAD: 14,
    OBJECT_OFFLOAD: 15,
    OBJECT_FAILURE: 16,
    OBJECT_STOP: 17,
    OBJECT_FIXED: 18,
    OBJECT_UPDATE: 19,
    SIMULATION_START: 20,
    SIMULATION_PAUSE: 21,
    SIMULATION_RESUME: 22,
    SIMULATION_STOP: 23,
    ESC: 24
};

// GFX SVG models
GFX_SVG_MODEL = {
    ROBOT: '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>robot_80</title><path d="M25,5A20,20,0,1,0,45,25,20,20,0,0,0,25,5Zm0,32.5A12.5,12.5,0,1,1,37.5,25,12.5,12.5,0,0,1,25,37.5Z" fill="#df9626"/><path d="M25,12.5A12.5,12.5,0,1,0,37.5,25,12.5,12.5,0,0,0,25,12.5ZM25,37A12,12,0,1,1,37,25,12,12,0,0,1,25,37Z" fill="#0277bd"/><path d="M25,13V12.5a12.5,12.5,0,0,0-11.89,8.64l0.48,0.16A12,12,0,0,1,25,13Z" fill="#263238"/><path d="M45,24.94c0,0.26,0,.69,0,1.22s-0.07,1.12-.17,1.87c-3,.23-5.22-1.5-5.21-2.84,0-1.56,2.24-3,5.11-3.22l0,0.22c0.08,0.48.18,1.05,0.23,1.67C45,24.15,45,24.41,45,24.94Z" fill="#bababa"/><circle cx="42" cy="25.13" r="0.5" fill="#1d1d1e"/></svg>',
    GATE: '<svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>entry</title><line x1="5.15" y1="22.23" x2="44.85" y2="22.23" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="44.85" y1="22.23" x2="35.31" y2="12.69" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="44.85" y1="27.77" x2="5.15" y2="27.77" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="5.15" y1="27.77" x2="14.69" y2="37.31" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/></svg>',
    STATION: '<svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>park 2_small</title><polygon points="30 24.17 25.42 24.17 27.25 15 20 25.83 24.58 25.83 22.75 35 30 24.17" fill="#feea3a"/></svg>',
    OBSTACLE: '<svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>Obstacle 4</title><path d="M0,0H23a0,0,0,0,1,0,0V9.5a1,1,0,0,1-1,1H0a0,0,0,0,1,0,0V0A0,0,0,0,1,0,0Z" fill="#bababa"/><path d="M25,0H48a0,0,0,0,1,0,0V9.5a1,1,0,0,1-1,1H26a1,1,0,0,1-1-1V0A0,0,0,0,1,25,0Z" fill="#bababa"/><path d="M0,25H22a1,1,0,0,1,1,1v8.5a1,1,0,0,1-1,1H0a0,0,0,0,1,0,0V25A0,0,0,0,1,0,25Z" fill="#bababa"/><rect x="25" y="25" width="23" height="10.5" rx="1" ry="1" fill="#bababa"/><rect x="13.5" y="12.5" width="23" height="10.5" rx="1" ry="1" fill="#bababa"/><path d="M0,12.5H10.5a1,1,0,0,1,1,1V22a1,1,0,0,1-1,1H0a0,0,0,0,1,0,0V12.5A0,0,0,0,1,0,12.5Z" fill="#bababa"/><path d="M39.5,12.5H50a0,0,0,0,1,0,0V23a0,0,0,0,1,0,0H39.5a1,1,0,0,1-1-1V13.5A1,1,0,0,1,39.5,12.5Z" fill="#bababa"/><rect x="13.5" y="37.5" width="23" height="10.5" rx="1" ry="1" fill="#bababa"/><path d="M0,37.5H10.5a1,1,0,0,1,1,1V47a1,1,0,0,1-1,1H0a0,0,0,0,1,0,0V37.5A0,0,0,0,1,0,37.5Z" fill="#bababa"/><path d="M39.5,37.5H50a0,0,0,0,1,0,0V48a0,0,0,0,1,0,0H39.5a1,1,0,0,1-1-1V38.5A1,1,0,0,1,39.5,37.5Z" fill="#bababa"/></svg>',
    RACK: '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>Rack</title><line x1="25" y1="34.84" x2="40" y2="26.18" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="34.84" x2="10" y2="26.18" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="32.59" x2="40" y2="23.93" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="32.59" x2="10" y2="23.93" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="37.09" x2="40" y2="28.43" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="37.09" x2="10" y2="28.43" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><polygon points="40 21.57 40 21.68 25 30.34 10 21.68 10 21.57 25 12.91 40 21.57" fill="#bababa"/><line x1="25" y1="30.34" x2="40" y2="21.68" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="30.34" x2="10" y2="21.68" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="12.91" x2="40" y2="21.57" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="12.91" x2="10" y2="21.57" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/></svg>'
};

GFX_SVG_DEFAULT_COLOR = {
    ROBOT: "#df9626",
    ROBOT_LED: "#bababa",
    GATE: "#bababa",
    STATION: "#feea3a",
    OBSTACLE: "#bababa",
    RACK: "#bababa"
};

GFX_COLORS = {
    LED_LOAD_COLOR: "#18FFFF",
    LED_BIND_COLOR: "#76FF03",
    LED_FAIL_COLOR: "#B71C1C",
    RACK_LOAD_COLOR: "#18FFFF",
    STATION_BIND_COLOR: "#76FF03",
    GATE_BIND_COLOR: "#76FF03"
};