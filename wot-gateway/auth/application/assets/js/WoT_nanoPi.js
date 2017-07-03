/**
 * Javascript Code für Application-Website KannMotion auf dem WoT-Gateway
 */

var td = top.document;
var comArray = new Array;       // Array for sequence
var i = 0;                      // position in comArray
var logMessage;
var logArray = new Array('Log');       // Array for logs
var logString;
var j = 0;                      // position in logArray
var answArray = new Array;      // Array with answers
var postActionStatus = 204;

// ------------------------------------------ MOTOR ------------------------------------------
var configKM17 = [{}];

var configKM24 = [{ "par": { "cmd": 1, "id": 0, "val": 2500 } },
{ "par": { "cmd": 1, "id": 1, "val": 10000 } },
{ "par": { "cmd": 1, "id": 2, "val": 10000 } },
{ "par": { "cmd": 1, "id": 3, "val": 152000 } },
{ "par": { "cmd": 1, "id": 4, "val": 162 } },
{ "par": { "cmd": 1, "id": 5, "val": 389 } },
{ "par": { "cmd": 1, "id": 6, "val": 45000 } }];

var deleteSequence = [{ "rom": { "frm": [1, 1], "val": " " } }, { "sys": 1 }];
var resetCommand = { "sys": 1 };
var infoCommand = [{ "sys": 2 }, { "par": { "cmd": 2 } }];

/**
 * Sends a HTTP-POST to /actions/sendCommand if the command isn't undefined.
 * Runs the callback with success = true if the desired answer from the WoT-Gateway (204)
 * is received, along with the request object.
 * @param {*} command   The command to send as a string
 * @param {*} callback  Gets called after an answer is received
 */
function postSendCommand(command, callback) {
    var request = new XMLHttpRequest();
    request.open("POST", '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE && callback) {
            callback(request.status === postActionStatus, request);
        }
    }
    if (command) {
        request.send(command);
        logCommand(command);
    }
} // postSendCommand

// --------------------- Konfiguration ---------------------
// sends the command to config the motor either Kann Motion 17 or 24
$("#buttonConfig").on("click", function () {
    // $('#textArea').html('');        // nötig?
    var command;
    var selectedOption = td.getElementById('configOptions').options[document.getElementById('configOptions').selectedIndex].value;
    if (selectedOption == 'c17') {
        command = JSON.stringify(configKM17);
    } else if (selectedOption == 'c24') {
        command = JSON.stringify(configKM24);
    }
    postSendCommand(command, function (success, request) {
        console.log('CONFIG status: ' + request.status);
        if (success) {
            $('#answerStatus').html('Konfiguration erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Konfiguration fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// --------------------- Sequenzen ---------------------
// adds a command to your sequence and displays it in curSeq
$("#buttonAddSeq").on("click", function () {
    var actVal = td.getElementById('valueSeq').value;
    if (actVal != '') {
        var comSeq;
        if ($('#seqCom :selected').val() == 's1') {  // GEHE ZU POSITION
            comSeq = 'g:[' + actVal + ',0]';
        } else if ($('#seqCom :selected').val() == 's4') {    // DREHEN
            comSeq = 'r:[0,' + actVal + ',0,0]';
        } else if ($('#seqCom :selected').val() == 's12') {    // WARTE
            comSeq = 'wt:' + actVal;
        }
        comArray[i] = comSeq;
        i++;
        $('#curSeq').html(comArray.join(', '));
    } else {
        // console.log('actVal ist leer!')
    }
});

$("#buttonClearSequence").on("click", function () {
    comArray = [];
    i = 0;
    $('#curSeq').html(comArray.join(', '));
});

// --------------------- Sequenzen & Befehle ---------------------
// sends a whole sequence to the motor
$("#buttonSendSeq").on("click", function () {
    var command;
    if (document.getElementById('curSeq')) {
        // Tab Sequenzen
        // console.log('buttonSendSeq in Tab Sequenzen');
        if (document.getElementById('curSeq').innerHTML.trim() !== '' && comArray.length > 0) {
            console.log('curSeq innerHTML: ' + document.getElementById('curSeq').innerHTML);
            command = '{"rom":{"frm":[1,1],"val":"{' + comArray.toString() + '}"}}';
            comArray[i] = ' - GESENDET';
            $('#curSeq').html(comArray.join(', '));
            comArray = [];
            i = 0;
        }
    } else if (td.getElementById('plainJSONSeq')) {
        // Tab Befehle
        // console.log('buttonSendSeq in Tab Befehle');
        var plainJSONSeq = td.getElementById('plainJSONSeq').value;
        if (plainJSONSeq !== '') {
            command = plainJSONSeq;
        }
    }
    // else {
    //     console.log('buttonSendSeq in Tab ????');
    //     $('#AnswerReceived pre').html('No sequence existing');
    // }
    postSendCommand(command, function (success, request) {
        console.log('SENDSEQ status: ' + request.status);
        if (success) {
            // $('#CommandSent pre').html(command);    // ???
            $('#answerStatus').html('Sequenz erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Sequenz senden fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// send the command to delete the current sequence on the motor
$("#buttonDelSeq").on("click", function () {
    var command = JSON.stringify(deleteSequence);
    postSendCommand(command, function (success, request) {
        console.log('DELSEQ status: ' + request.status);
        if (success) {
            $('#answerStatus').html('Lösche-Sequenz-Befehl erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Lösche-Sequenz-Befehl fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// sends a command to start the sequenz which is currently on the motor
$("#buttonReset").on("click", function () {
    var command = JSON.stringify(resetCommand);
    postSendCommand(command, function (success, request) {
        console.log('RESET status: ' + request.status);
        if (success) {
            $('#answerStatus').html('Reset-Befehl erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Reset-Befehl fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// sends a command to update the infos of the KannMotion control
$("#buttonUpdateInfo").on("click", function () {
    var command = JSON.stringify(infoCommand);
    postSendCommand(command, function (success, request) {
        console.log('INFO status: ' + request.status);
        if (success) {
            $('#answerStatus').html('Aktualisiere-Infos-Befehl erfolgreich gesendet\n');
        } else {
            $('#answerStatus').html('Aktualisiere-Infos-Befehl fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
        }
    });
});

// --------------------- Logging ---------------------

/**
 * Adds a command to the command log
 * @param {*} command   the command to log
 */
function logCommand(command) {
    if (command) {
        command += '\n<br/>';
        var previousCommands = $('#sentCommands').text();
        console.log('Previous commands: ' + previousCommands);
        previousCommands += command;
        console.log('Logging commands: ' + previousCommands);
        $('#sentCommands').html(previousCommands);
    }


    // logMessage = command;
    // console.log('logMessage: ' + logMessage);
    // var logArrayString = sessionStorage.getItem('logArray');
    // console.log('logArrayString: ' + logArrayString);
    // logArray.length = 0;
    // logArray.push(logArrayString);
    // console.log('logArray: ' + logArray);
    // logArray.push(logMessage);
    // for (a = 0; a <= logArray.length; a++) {
    //     console.log("logArray ausgeben: " + logArray[a]);
    // }
    // sessionStorage.setItem('logArray', JSON.stringify(logArray));
    // if (logArray.length > 10) {
    //     logArray.shift();
    // }
    // $('#communicationCommand').html(logArray.join(', '));
} // logCommand

// function logCommand(mes) {
//     logMessage = mes;
//     console.log('logMessage: ' + logMessage);
//     logArray = sessionStorage.getObject('logArray');
//     logArray.push(logMessage);
//     console.log('logArray: ' + logArray);
//     for (a = 0; a <= logArray.length; a++) {
//         console.log("logArray ausgeben: " + logArray[a]);
//     }
//     sessionStorage.setObject('logArray', logArray);
//     if (logArray.length > 10) {
//         logArray.shift();
//     }

//     $('#communicationCommand').html(logArray.join(', '));
// }

// function logCommand(mes) {
//     logMessage = mes;
//     console.log(logMessage);
//     logString = sessionStorage.getItem('logString');
//     console.log('logArray: ' + logString);
//     logString = logString + ', ' + logMessage;
//     console.log('logArray: ' + logString);
//     sessionStorage.setItem('logString', logString);
//     $('#communicationCommand').html(logString);
// }