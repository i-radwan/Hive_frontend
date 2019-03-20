SERVER_IP = "127.0.0.1";
SERVER_PORT = 1337;

//
// Shouting codes
//
SHOUT_STATE_UPDATED = 0;
SHOUT_MSG = 1;
SHOUT_LOADING = 2;

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
MSG_TIMEOUT = 1500; // ms

// Msgs types
MSG_ERROR = 0;
MSG_INFO = 1;

SHOUT_RUNNING_MODE = 0;
SHOUT_MAP_SIZE_CHANGED = 1;
SHOUT_MAP_TEMP_APPLIED = 2;
SHOUT_ERROR = 3;
SHOUT_GRID_CLICK = 3;
SHOUT_GRID_DRAG = 4;

// Logs levels
LOG_LEVEL_INFO = 0;
LOG_LEVEL_WARNING = 1;
LOG_LEVEL_ERROR = 2;

LOG_OBJECT_ROBOT = 0;
LOG_OBJECT_RACK = 1;
LOG_OBJECT_ORDER = 2;
LOG_OBJECT_SIMULATION = 3;

// Regex
REG_HTML_COLOR = "^#([A-Fa-f0-9]{6})$";
REG_IP = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$";

RACK_CAP = 250;

// Order status
ORDER_STATUS = {
    ONGOING: 0,
    UPCOMING: 1,
    FINISHED: 2
};

UPCOMING_ORDERS_CONSUMPTION_INTERVAL = 1000 * 60; // 1 Min

//
// GFX
//
GRID_CELL_LENGTH = 50;
MAX_ZOOM_VAL = 8;
MIN_ZOOM_VAL = 0.06;
KEYBOARD_DRAG_SPEED = 4;

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

//
// Events
//

// Server Msgs
MSG_TO_SERVER = {
    CONFIG: 0,
    ORDER: 1,
    PAUSE: 2,
    STOP: 3,
    RESUME: 4,
    ACK: 5,
    ERROR: 6
};

MSG_FROM_SERVER = {
    ACK_CONFIG: 0,
    ACK_RESUME: 1,
    ACK_ORDER: 2,
    UPDATE: 3,
    MSG: 4
};

CONFIG_MODE = {
    SIMULATE: 0,
    DEPLOY: 1
};

ACK_CONFIG_STATUS = {
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
    LOAD: 1,
    OFFLOAD: 2,
    BIND: 3,
    UNBIND: 4
};

SERVER_LOGS = {
    TASK_ASSIGNED: 0,
    ITEM_DELIVERED: 1,
    ORDER_FULFILLED: 2,
    RACK_ADJUSTED: 3
};

// GFX Events
EVENT_FROM_GFX = {
    CELL_CLICK: 0,
    CELL_DRAG: 1,
    CELL_DELETE: 2,
    ACK_ACTION: 3,
    ESC: 4
};

EVENT_TO_GFX = {
    INIT: 0,
    OBJECT_HOVER: 1,
    OBJECT_ADD: 2,
    OBJECT_DELETE: 3,
    OBJECT_DRAG: 4,
    OBJECT_MOVE: 5,
    OBJECT_HIGHLIGHT: 6,
    OBJECT_COLORIZE: 7,
    OBJECT_DISCOLORIZE: 8,
    OBJECT_BIND: 9,
    OBJECT_UNBIND: 10,
    OBJECT_LOAD: 11,
    OBJECT_OFFLOAD: 12,
    SIMULATION_START: 13,
    SIMULATION_PAUSE: 14,
    SIMULATION_RESUME: 15,
    SIMULATION_STOP: 16,
    ESC: 18
};

// GFX Svg models
GFX_SVG_MODEL = {
    ROBOT: '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>robot_80</title><path d="M25,5A20,20,0,1,0,45,25,20,20,0,0,0,25,5Zm0,32.5A12.5,12.5,0,1,1,37.5,25,12.5,12.5,0,0,1,25,37.5Z" fill="#df9626"/><path d="M25,12.5A12.5,12.5,0,1,0,37.5,25,12.5,12.5,0,0,0,25,12.5ZM25,37A12,12,0,1,1,37,25,12,12,0,0,1,25,37Z" fill="#0277bd"/><path d="M25,13V12.5a12.5,12.5,0,0,0-11.89,8.64l0.48,0.16A12,12,0,0,1,25,13Z" fill="#263238"/><path d="M25.2,45c-0.26,0-.69,0-1.22,0s-1.12-.07-1.87-0.17c-0.23-3,1.5-5.22,2.84-5.21,1.56,0,3,2.24,3.22,5.11l-0.22,0c-0.48.08-1.05,0.18-1.67,0.23C26,45,25.72,45,25.2,45Z" fill="#bababa"/><circle cx="25" cy="42" r="0.5" fill="#1d1d1e"/></svg>',
    GATE: '<svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>entry</title><line x1="5.15" y1="22.23" x2="44.85" y2="22.23" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="44.85" y1="22.23" x2="35.31" y2="12.69" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="44.85" y1="27.77" x2="5.15" y2="27.77" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="5.15" y1="27.77" x2="14.69" y2="37.31" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/></svg>',
    STATION: '<svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>park 2_small</title><polygon points="30 24.17 25.42 24.17 27.25 15 20 25.83 24.58 25.83 22.75 35 30 24.17" fill="#feea3a"/></svg>',
    OBSTACLE: '<svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>Obstacle 4</title><path d="M0,0H23a0,0,0,0,1,0,0V9.5a1,1,0,0,1-1,1H0a0,0,0,0,1,0,0V0A0,0,0,0,1,0,0Z" fill="#bababa"/><path d="M25,0H48a0,0,0,0,1,0,0V9.5a1,1,0,0,1-1,1H26a1,1,0,0,1-1-1V0A0,0,0,0,1,25,0Z" fill="#bababa"/><path d="M0,25H22a1,1,0,0,1,1,1v8.5a1,1,0,0,1-1,1H0a0,0,0,0,1,0,0V25A0,0,0,0,1,0,25Z" fill="#bababa"/><rect x="25" y="25" width="23" height="10.5" rx="1" ry="1" fill="#bababa"/><rect x="13.5" y="12.5" width="23" height="10.5" rx="1" ry="1" fill="#bababa"/><path d="M0,12.5H10.5a1,1,0,0,1,1,1V22a1,1,0,0,1-1,1H0a0,0,0,0,1,0,0V12.5A0,0,0,0,1,0,12.5Z" fill="#bababa"/><path d="M39.5,12.5H50a0,0,0,0,1,0,0V23a0,0,0,0,1,0,0H39.5a1,1,0,0,1-1-1V13.5A1,1,0,0,1,39.5,12.5Z" fill="#bababa"/><rect x="13.5" y="37.5" width="23" height="10.5" rx="1" ry="1" fill="#bababa"/><path d="M0,37.5H10.5a1,1,0,0,1,1,1V47a1,1,0,0,1-1,1H0a0,0,0,0,1,0,0V37.5A0,0,0,0,1,0,37.5Z" fill="#bababa"/><path d="M39.5,37.5H50a0,0,0,0,1,0,0V48a0,0,0,0,1,0,0H39.5a1,1,0,0,1-1-1V38.5A1,1,0,0,1,39.5,37.5Z" fill="#bababa"/></svg>',
    RACK: '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><title>Rack</title><line x1="25" y1="34.84" x2="40" y2="26.18" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="34.84" x2="10" y2="26.18" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="32.59" x2="40" y2="23.93" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="32.59" x2="10" y2="23.93" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="37.09" x2="40" y2="28.43" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="37.09" x2="10" y2="28.43" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><polygon points="40 21.57 40 21.68 25 30.34 10 21.68 10 21.57 25 12.91 40 21.57" fill="#bababa"/><line x1="25" y1="30.34" x2="40" y2="21.68" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="30.34" x2="10" y2="21.68" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="12.91" x2="40" y2="21.57" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/><line x1="25" y1="12.91" x2="10" y2="21.57" fill="none" stroke="#bababa" stroke-linecap="round" stroke-miterlimit="10"/></svg>'
};