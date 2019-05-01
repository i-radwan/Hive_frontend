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