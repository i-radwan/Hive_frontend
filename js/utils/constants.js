// Menu tiles
LEFT_MENU = {
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

RIGHT_MENU = {
    EMPTY: 0,
    LOGS: 1,
    STATS: 2,
    ITEMS: 3
};

// Running modes
RUNNING_MODE = {
    DESIGN: 0,
    SIMULATE: 1,
    DEPLOY: 2
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

// Shouting codes
SHOUT_STATE_UPDATED = 0;
SHOUT_MSG = 1;

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

// Logic Events
LOGIC_EVENT_TYPE = {
    CELL_CLICK: 0,
    CELL_DRAG: 1,
    CELL_DELETE: 2,
    OBJECT_MOVE: 3,
    ESC: 4
};

// Server
SERVER_IP = 0;
SERVER_PORT = 12346;

// Server Events
SERVER_EVENT_TYPE = {
    OBJECT_UPDATE: 0,
    LOG: 1,
    STATS: 2,
    MSG: 3,
    INIT: 4,
    ORDER_NEW: 5,
    ACK: 6,
    FILL_RACK: 7
};

// GFX
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

// GFX Events
GFX_EVENT_TYPE = {
    INIT: 0,
    OBJECT_HOVER: 1,
    OBJECT_ADD: 2,
    OBJECT_DELETE: 3,
    OBJECT_DRAG: 4,
    OBJECT_MOVE: 5,
    OBJECT_HIGHLIGHT: 6,
    ESC: 7
};

// Logic
RACK_CAP = 250;

