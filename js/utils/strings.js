/*
 * Here the first digit represents the category that this message belongs to:
 * 1: Normal message.
 * 2: Error message.
 * 3: Normal log.
 * 4: Error log.
 */

STR = {
    // Normal messages
    1000: (args) => `${args[0]} placed successfully!`,
    1001: (args) => `${args[0]} updated successfully!`,
    1002: (args) => `Item added successfully!`,
    1003: (args) => `Map size has been updated!`,
    1004: (args) => `Connected to server!`,
    1005: (args) => `Order scheduled successfully!`,

    // Error messages
    2000: (args) => `(${args[0]}, ${args[1]}) is occupied!`,
    2001: (args) => `${args[0]} is mandatory!`,
    2002: (args) => `${args[0]} must be unique!`,
    2003: (args) => `${args[0]} doesn't exist!`,
    2004: (args) => `Item ID #${args[0]} doesn't exist!`,
    2005: (args) => `No ${args[0]} with this ID!`,
    2006: (args) => `Invalid ${args[0]}!`,
    2007: (args) => `Robot at (${args[0]}, ${args[1]}) doesn't have an IP!`,
    2008: (args) => `Rack (#${args[0]}) at (${args[1]}, ${args[2]}) uses item #${args[3]}!`,
    2009: (args) => `Rack load is ${args[0]} which exceeds the capacity`,
    2010: (args) => `Use only +ve values!`,
    2011: (args) => `Order must contain items!`,
    2012: (args) => `This action is allowed in design mode only!`,
    2013: (args) => `Connect to a server first!`,
    2014: (args) => `Connection is allowed only in design mode!`,
    2015: (args) => `Couldn't connect to the server!`,
    2016: (args) => `Server disconnected!`,

    // Normal logs
    3000: (args) => `Simulation Started`,
    3001: (args) => `Simulation Paused`,
    3002: (args) => `Simulation Stopped`,
    3003: (args) => `Simulation Resumed`,
    3004: (args) => `Order <b>(#${args[0]})</b> has been issued.`,
    3005: (args) => `Order <b>(#${args[0]})</b> has been fulfilled.`,
    3006: (args) => `Rack <b>(#${args[0]})</b> has been ${args[1] > 0 ? "filled" : "discharged"} by <b>${Math.abs(parseInt(args[1]))}</b> unit(s) of Item<b> (#${args[2]})</b>.`,
    3007: (args) => `Robot <b>(#${args[0]})</b> is bound to Gate<b> (#${args[1]})</b>.`,
    3008: (args) => `Robot <b>(#${args[0]})</b> is released from Gate <b>(#${args[1]})</b>.`,
    3009: (args) => `Robot <b>(#${args[0]})</b> is charging at Station<b> (#${args[1]})</b>.`,
    3010: (args) => `Robot <b>(#${args[0]})</b> is leaving Station <b>(#${args[1]})</b>.`,
    3011: (args) => `Robot <b>(#${args[0]})</b> loaded Rack <b>(#${args[1]})</b>.`,
    3012: (args) => `Robot <b>(#${args[0]})</b> offloaded Rack <b>(#${args[1]})</b>.`,
    3013: (args) => `Robot <b>(#${args[0]})</b> is assigned to Rack <b>(#${args[1]})</b>.`,
    3014: (args) => `Robot <b>(#${args[0]})</b> is back</b>.`,

    // Error logs
    4000: (args) => `Robot <b>(#${args[0]})</b> has failed</b>.`,
    4001: (args) => `Robot <b>(#${args[0]})</b> cannot move</b>.`,

    // Server
    5000: (args) => `Internal server error!`,
    5001: (args) => `Server has received an ill formed message!`,
    5002: (args) => `Server has received unexpected message!`,
    5003: (args) => `Server has received invalid arguments!`,
    5004: (args) => `Rack (#${args[0]}) load exceed its capacity by (${args[1]}) Kg!`,
    5005: (args) => `Collect Order (#${args[0]}) is infeasible due to shortage in items (${args[1].join(", ")})!`,
    5006: (args) => `Refill Order (#${args[0]}) items weight exceed Rack (#${args[1]}) capacity by (${args[2]}) Kg!`,
};