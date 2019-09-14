

/**
 * Main decoder function
 * @param bytes
 * @param port
 * @constructor
 */
function Decoder(bytes, port) {
    if(bytes === null || bytes === 0){
        //obj.port = port;
        obj.status_dedcoded = false;
        obj.status_info = "payload_raw: " + payloadRawHexToString(bytes);
    } else {
        // Definition of head line daily value.
        /* let S_SMOKE_CHAMBER_POLLUTION_PREWARNING = 0x0800;
         let S_SMOKE_CHAMBER_POLLUTION_WARNING = 0x1000;
         let S_TEST_BUTTON_FAILUER = 0x2000;
         let S_ACCUSTIC_ALARM_FAILUER = 0x4000;
         let S_REMOVAL_DETECTION = 0x8000;
         let S_TEST_ALARM = 0x0001;
         let S_SMOKE_ALARM = 0x0002;
         let S_OBSTRUCTION_DETECTION = 0x0004;
         let S_SURROUNDING_AREA_MONITORING = 0x0008;
         let S_LED_FAILURE = 0x0010;*/

        // Definition of the different packet types and subtypes.
        var TYPE_SP1 = 0x1; //sent daily -> packet, max. 2 retransmissions
        var TYPE_SP9 = 0x9; // Sent immediately after first  activation and from then on every 6 months -> No retransmissions
        var SUBTYPE_SP9_1 = 0x01; // sent every month except the month of first activation -> No retransmissions
        var SUBTYPE_SP9_2 = 0x02; // sent immediately after first activation and from then on every 6 months -> No retransmissions
        var TYPE_AP1 = 0xA; //  (status code, status data): event based -> Max 5 AP packets per month, no retransmissions

        // Device specific status summery definition
        var A_REMOVAL = 0x02;
        var A_BATTERY_END_OF_LIFE = 0x0C;
        var A_HORN_DRIVE_LEVEL_FAILURE = 0x16;
        var A_OBSTRUCTION_DETECTION = 0x1A;
        var A_OBJECT_IN_THE_SURROUNDING_AREA = 0x1C;
        var AP_VALUES = ["removal", "battery end of life",
            "horn drive level failure", "obstruction detection", "object in the surrounding area"];
        var S_STATUS_SUMMERY_VALUES = ["removal", "0",
            "battery end of life", "acoustic alarm failure",
            "obstruction detection", "surrounding area monitoring"];

        var obj = {};
        obj.port = port;

        switch (bytes[0] >> 4) {
            case TYPE_SP1:
                //const casePosition = "SP1";
                obj.packet_type = 1;
                obj.packet_subtype = 0;
                obj.packet_type_info = "synchronous";
                //obj.status_interpretation = null;
                obj.status_dedcoded = false;
                obj.status_info = "payload_raw: " + payloadRawHexToString(bytes);
                //obj.decodingTree = [casePosition];
                break;
            case TYPE_SP9:
                obj.packet_type = 9;
                obj.packet_type_info = "synchronous";
                obj.status_dedcoded = false;
                // check for packet subtype SP9.1 and SP9.2
                switch (bytes[0] & 0x0F) {
                    case SUBTYPE_SP9_1:
                        obj.packet_subtype = 1;
                        obj.dateTime = decodeDateAndTime(((bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | (bytes[4])));
                        //TODO make a function to check is the device in correct dateAndTime
                        obj.status_interpretation = buildStatusSummery(bytes[5], bytes[6], S_STATUS_SUMMERY_VALUES);
                        obj.status_dedcoded = true;
                        obj.status_info = "payload_raw: " + payloadRawHexToString(bytes);
                        break;
                    case SUBTYPE_SP9_2:
                        obj.packet_subtype = 2;
                        obj.status_interpretation = [
                            "firmware version: " + (
                                ((bytes[1] << 24) + (bytes[2] << 16) + (bytes[3] << 8) + (bytes[4]))
                                    .toString(16)).toUpperCase(),
                            "LoRa WAN version: " + (bytes[5]).toString(16) + "." + (bytes[6])
                                .toString(16) + "." + (bytes[7]).toString(16),
                            "LoRa command version: " + (bytes[9]).toString(16) + "." + (bytes[8]).toString(16),
                            "device type: " + (bytes[10]).toString(16),
                            "meter ID: " + (((bytes[11] << 24) + (bytes[12] << 16) + (bytes[13] << 8) + (bytes[14]))
                                .toString(16)).toUpperCase()
                        ];
                        obj.status_dedcoded = true;
                        obj.status_info = "payload_raw: " + payloadRawHexToString(bytes);
                        break;
                    default:
                        obj.status_dedcoded = false;
                        obj.status_info = "payload_raw: " + payloadRawHexToString(bytes);
                        break;
                }
                break;
            case TYPE_AP1:
                obj.packet_type = 1;
                obj.packet_subtype = 0;
                obj.packet_type_info = "asynchronous";
                obj.date = (decodeDate(bytes [3] << 8 | bytes[4]));
                obj.status_interpretation = null;
                obj.status_dedcoded = false;
                obj.status_info = null;
                obj.status_info = "payload_raw: " + payloadRawHexToString(bytes);

                switch (bytes[1]) {
                    case A_REMOVAL:
                        obj.status_interpretation = AP_VALUES[0];
                        obj.status_dedcoded = true;
                        break;
                    case A_BATTERY_END_OF_LIFE:
                        obj.status_interpretation = AP_VALUES[1];
                        obj.status_dedcoded = true;
                        break;
                    case A_HORN_DRIVE_LEVEL_FAILURE:
                        obj.status_interpretation = AP_VALUES[2];
                        obj.status_dedcoded = true;
                        break;
                    case A_OBSTRUCTION_DETECTION:
                        obj.status_interpretation = AP_VALUES[3];
                        obj.status_dedcoded = true;
                        break;
                    case A_OBJECT_IN_THE_SURROUNDING_AREA:
                        obj.status_interpretation = AP_VALUES[4];
                        obj.status_dedcoded = true;
                        break;
                    default:
                        obj.status_info = "payload_raw: " + payloadRawHexToString(bytes);
                        break;
                }
                break;
            default:
                obj.status_dedcoded = false;
                obj.status_info = "payload_raw: " + payloadRawHexToString(bytes);
                break;
        }
    }
    return obj;
}

/**
 * decodes date (EN13757-3:2013, Annex A, data type G).
 * input: int, lower two bytes interpreted.
 * output: date string YYYY-MM-DD.
 * @param bytes
 * @returns {string}
 */
function decodeDate(bytes) {
    //TODO Handling errors with 0xFF see LoRa radio packet definitions page 15
    var day = (bytes & 0x1F00) >> 8;
    var month = (bytes & 0x000F);
    var year = ((bytes & 0xE000) >> 10) | ((bytes & 0x00F0) >> 4);
    return "20" + year.toString() + "-" + month.toString() + "-" + day.toString();
}

/**
 * Date and time format.
 * Date&Time stamp coding according to EN13757-3:2013, Annex A, data type F
 * @param bytes
 * @returns {string}
 */
function decodeDateAndTime(bytes) {
    var minute = (bytes & 0x3F000000) >> 24;
    var hour = (bytes & 0x001F0000) >> 16;
    var day = (bytes & 0x00001F00) >> 8;
    var month = (bytes & 0x0000000F);
    var year = ((bytes & 0x0000E000) >> 10) | ((bytes & 0x000000F0) >> 4);
    return "20" + year.toString() + "-"
        + month.toString() + "-"
        + day.toString() + "T"
        + hour.toString() + ":"
        + minute.toString()
        + ":00Z";
}

/**
 *
 * @param byteArray
 * @returns {string}
 */
function payloadRawHexToString(byteArray) {
    var str;
    if(byteArray === null){
        return "00";
    }else {
        str = byteArray.map(function (byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
        var strArray = str.match(/.{2}/g);
        str = strArray.map(function (value, index, array) {
            return array[index];
        });
        var x = str.join();
        return x.replace(/([,])/g, " ").toLocaleUpperCase();
    }
}

/**
 * Build the summary for package 9.1.
 * @param a
 * @param b
 * @param S_STATUS_SUMMERY_VALUES
 * @returns {[]}
 */
function buildStatusSummery(a, b,S_STATUS_SUMMERY_VALUES) {

    var bin1 = parseInt(a.toString(), 16).toString(2);
    var bin2 = parseInt(b.toString(), 16).toString(2);
    var result = [];

    for (var i = 0; i < bin1.length; i++) {
        console.log(bin1.length);
        if (bin1[i] === "1") {
            result.push(S_STATUS_SUMMERY_VALUES[i]);
        }
    }

    for (var j = 0; j < bin2.length; j++) {
        if (bin2[i] === "1") {
            result.push(S_STATUS_SUMMERY_VALUES[j]);
        }
    }

    return result;
}