/**
 * Javascript Code für Application-Website KannMotion auf dem WoT-Gateway
 * 
 * @author: Thierry Durot, thierry.durot@ntb.ch
 * @author: Joël Lutz, joel.lutz@ntb.ch
 */

var td = top.document;
var sequenceCommands = [];      // Array for sequence commands (JSON)
var sequenceButtons = [];       // Array for sequence commands (radio buttons)
var i = 0;                      // position in sequenceCommands and sequenceButtons
var buttonIndex = 0;
var selectedCommandIndex = -1;
var sequenceCommandSelected = false;
var serverLocation = window.location;
var postActionStatus = 204;
var wsURL = '';
var webSocket;

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
 * Displays a message with the specified name.
 * Runs the callback (if defined) with success = true if the desired answer from the WoT-Gateway (204)
 * is received, along with the request object.
 * @param {*} command   The command to send as a string
 * @param {*} name      The name of the command to display in answerStatus
 * @param {*} callback  If defined: Gets called after an answer is received
 */
function postSendCommand(command, name, callback) {
    var request = new XMLHttpRequest();
    request.open("POST", '/actions/sendCommand');
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (callback) callback(request.status === postActionStatus, request);
            if (request.status === postActionStatus) {
                $('#answerStatus').html(name + ' erfolgreich gesendet\n');
            } else {
                $('#answerStatus').html(name + ' fehlgeschlagen! Status: ' + request.status + ' ' + request.statusText);
            }
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
    var command;
    var selectedOption = td.getElementById('configOptions').options[document.getElementById('configOptions').selectedIndex].value;
    if (selectedOption == 'c17') {
        command = JSON.stringify(configKM17);
    } else if (selectedOption == 'c24') {
        command = JSON.stringify(configKM24);
    }
    postSendCommand(command, 'Konfiguration');
});

// --------------------- Befehle ---------------------

// send the command to delete the current sequence on the motor
$("#buttonDelSeq").on("click", function () {
    var command = JSON.stringify(deleteSequence);
    postSendCommand(command, 'Lösche-Sequenz-Befehl');
});

// sends a command to update the infos of the KannMotion control
$("#buttonUpdateInfo").on("click", function () {
    var command = JSON.stringify(infoCommand);
    postSendCommand(command, 'Aktualisiere-Infos-Befehl');
});

// sends the JSON command in plainJSONSeq
$("#buttonSendJSONCommand").on("click", function () {
    var command;
    if (td.getElementById('plainJSONSeq')) {
        var plainJSONSeq = td.getElementById('plainJSONSeq').value;
        if (plainJSONSeq !== '') {
            command = plainJSONSeq;
        }
    }
    postSendCommand(command, 'JSON-Befehl ' + command);
});

// sends a command to start the sequenz which is currently on the motor
$("#buttonReset").on("click", function () {
    var command = JSON.stringify(resetCommand);
    postSendCommand(command, 'Reset-Befehl');
});

// --------------------- Sequenzen ---------------------
// adds a command to your sequence and displays it in curSeq
$("#buttonAddSeq").on("click", function () {
    createSequenceCommand(i, buttonIndex);
    i++;
    buttonIndex++;
});

/**
 * Creates a sequenceCommand and a sequenceButton according to the chosen option in seqCom,
 * the value in valueSeq and with the specified buttonIndex. Adds it to the sequenceCommands
 * and the sequenceButtons array at the speciefied position indexInArray.
 * @param {*} indexInArray 
 * @param {*} buttonIndex 
 */
function createSequenceCommand(indexInArray, buttonIndex) {
    // extract the information in the current present fields of abschnGrauSeq
    var inputElements = document.getElementById("abschnGrauSeq").elements;
    var commandValues = [];
    for (var i = 0; i < inputElements.length; i++) {
        var elementID = inputElements[i].id;
        console.log(elementID);
        if (elementID.startsWith('valueSeq')) {
            var elementValue = $(elementID).value();
            console.log(elementValue);
        }
    } // for
    // console.log(inputFields);
    // for (var i = 0; i < inputFields.length; i++) {
    //     console.log('checking inputField Nr. ' + i);
    //     var commandValue;
    //     if ($('#valueSeq' + i + ' :selected')) {         // inputField is a dropdown menu
    //         console.log('inputField is a dropdown menu');
    //         commandValue = $('#valueSeq' + i + ' :selected').val();
    //     } else if (td.getElementById('valueSeq' + i)) {  // inputField is a text input
    //         console.log('inputField is a text input');
    //         commandValue = td.getElementById('valueSeq' + i).value;
    //     } else {
    //         console.error('unknown input field!');
    //     }
    //     console.log('command value: ' + commandValue);
    //     if (commandValue && commandValue != '') {
    //         commandValues[i] = commandValue;
    //     } else {
    //         console.error('commandValue Nr. ' + i + ' is empty!');
    //         commandValues = [];
    //         break;
    //     }
    // } // for
    // creates a sequenceCommand (JSON) and a sequenceButton (HTML radio button)
    if (commandValues != []) {
        var sequenceCommand;
        var sequenceButton = '<label><input type="radio" id="seqComm' + buttonIndex + '" name="sequence" value="' + buttonIndex + '"><i> ';
        var selectedCommand = $('#seqCom :selected').val();
        switch (selectedCommand) {
            case 's1':      // GEHE ZU POSITION
                var optionShortest = commandValues.shift();
                var position = commandValues.shift();
                sequenceCommand = 'g:[' + position + ',' + optionShortest + ']';
                sequenceButton += 'GEHE ZU POSITION (' + optionShortest + ', ' + optionShortest + ')';
                break;
            case 's4':      // DREHEN
                var optionConstant = commandValues.shift();
                var speed = commandValues.shift();
                var min = commandValues.shift();
                var max = commandValues.shift();
                sequenceCommand = 'r:[' + optionConstant + ',' + speed + ',' + min + ',' + max + ']';
                sequenceButton += 'DREHEN (' + optionConstant + ',' + speed + ',' + min + ',' + max + ')';
                break;
            case 's12':     // WARTE
                var time = commandValues.shift();
                sequenceCommand = 'wt:' + time;
                sequenceButton += 'WARTE (' + time + 'ms)';
                break;
            default:
                console.error('Unknown sequence command option: ' + selectedCommand);
                sequenceCommand = '';
                sequenceButton += 'NO OPTION SELECTED!'
                break;
        } // switch
        var comment = commandValues.shift();
        sequenceButton += comment + '</i></label><br>';
        sequenceButtons[indexInArray] = sequenceButton;
        sequenceCommands[indexInArray] = sequenceCommand;
        updateSequenceHTML();
    }
} // createSequenceCommand

var inputFields = [];
var oldSelectedCommand = 's1';

/**
 * Creates a string which contains a HTML div with a dropdown list.
 * @param {*} id            the id of the div
 * @param {*} optionNames   an array of the elements in the dropdown menu
 */
function getDropdownDiv(id, optionNames) {
    var result = '<div class="col-md-4">' +
        '<select class="form-control" id="' + id + '" style="margin:10px;margin-top:10px;width=500px">';
    for (var i = 0; i < optionNames.length; i++) {
        result = result.concat('<option value="option' + i + '">' + optionNames[i] + '</option>');
    }
    return result.concat('</select></div >');
} // getDropdownDiv

// displays input fields according to the chosen command and detects which sequence command in curSeq is selected
$('#abschnGrauSeq').on('change', function () {
    console.log('change!');
    // displays input fields according to the chosen command
    var selectedCommand = $('#seqCom :selected').val();
    if (selectedCommand !== oldSelectedCommand) {
        oldSelectedCommand = selectedCommand;
        $('#seqInputFields').empty();
        inputFields = [];
        switch (selectedCommand) {
            case 's1':      // GEHE ZU POSITION
                inputFields[0] = $(getDropdownDiv('valueSeq0', ['Shortest']));
                inputFields[1] = $('<input class="form-control" type="text" placeholder="Position [-3600000,3600000]" id="valueSeq1" style="margin:10px;">');
                break;
            case 's4':      // DREHEN
                inputFields[0] = $(getDropdownDiv('valueSeq0', ['Konstant', 'Analoger Eingang']));
                inputFields[1] = $('<input class="form-control" type="text" placeholder="Wert [-100,100]" id="valueSeq1" style="margin:10px;">');
                inputFields[2] = $('<input class="form-control" type="text" placeholder="Min" id="valueSeq2" style="margin:10px;">');
                inputFields[3] = $('<input class="form-control" type="text" placeholder="Max" id="valueSeq3" style="margin:10px;">');
                break;
            case 's12':     // WARTE
                inputFields[0] = $('<input class="form-control" type="text" placeholder="Zeit in ms [0,3600000]" id="valueSeq1" style="margin:10px;">');
                break;
            default:
                inputFields[0] = $('<input class="form-control" type="text" placeholder="Wert" id="valueSeq1" style="margin:10px;">');
                break;
        } // switch
        inputFields.push($('<input class="form-control" type="text" placeholder="Kommentar" id="valueSeqComment" style="margin:10px;">'));
        inputFields.forEach(function (inputField, index) {
            inputField.appendTo('#seqInputFields');
        });
    } // if

    // detects which sequence command in curSeq is selected
    var radioButtons = $("#abschnGrauSeq input:radio[name='sequence']");
    var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
    // console.log('selected index: ' + selectedIndex);
    if (selectedIndex >= 0) {
        selectedCommandIndex = selectedIndex;
        sequenceCommandSelected = true;
        disableButtons(false);
    } else {
        selectedCommandIndex = -1;
        sequenceCommandSelected = false;
        disableButtons(true);
    }
});


/**
 * Disables the changeSequence and removeSequence button according to the parameter.
 * @param {*} disabled 
 */
function disableButtons(disabled) {
    $('#buttonChangeSequence').prop('disabled', disabled);
    $('#buttonRemoveSequence').prop('disabled', disabled);
} // disableButtons

// changes the selected sequence command according the currently chosen options and values
$("#buttonChangeSequence").on("click", function () {
    if (sequenceCommandSelected && selectedCommandIndex >= 0) {
        var selectedButtonNumber = $('input:radio[name=sequence]:checked').val();
        createSequenceCommand(selectedCommandIndex, selectedButtonNumber);
        disableButtons(true);
    }
});

// removes the selected sequence command in curSeq
$("#buttonRemoveSequence").on("click", function () {
    if (sequenceCommandSelected && selectedCommandIndex >= 0) {
        sequenceButtons.splice(selectedCommandIndex, 1);
        sequenceCommands.splice(selectedCommandIndex, 1);
        i--;
        updateSequenceHTML();
        selectedCommandIndex = -1;
        sequenceCommandSelected = false;
        disableButtons(true);
    }
});

// clears the curSeq
$("#buttonClearSequence").on("click", function () {
    clearSequenceArrays();
    updateSequenceHTML();
    disableButtons(true);
});

/**
 * Deletes the sequenceCommands and the sequenceButtons array
 */
function clearSequenceArrays() {
    sequenceCommands = [];
    sequenceButtons = [];
    i = 0;
    buttonIndex = 0;
} // clearSequenceArrays

/**
 * Displays the sequenceButtons array in curSeq
 */
function updateSequenceHTML() {
    $('#curSeq').html(sequenceButtons.join('\n'));
} // updateSequenceHTML

// sends a whole sequence to the motor
$("#buttonSendSeq").on("click", function () {
    var command;
    if (document.getElementById('curSeq')) {
        if (document.getElementById('curSeq').innerHTML.trim() !== '' && sequenceCommands.length > 0) {
            command = '{"rom":{"frm":[1,1],"val":"{' + sequenceCommands.toString() + '}"}}';
            sequenceButtons[i] = ' - GESENDET';
            updateSequenceHTML();
            clearSequenceArrays();
        }
    }
    postSendCommand(command, 'Sequenz');
});

// sends a command to start the sequenz which is currently on the motor
$("#buttonRun").on("click", function () {
    var command = JSON.stringify(resetCommand);
    postSendCommand(command, 'Ausführen-Befehl');
});

// --------------------- Logging ---------------------

/**
 * Adds a command to the command log
 * @param {*} command   the command to log
 */
function logCommand(command) {
    if (command) {
        command = '<p>' + command + '</p>';
        $(command).appendTo('#sentCommands');
        var elem = document.getElementById('sentCommands');
        elem.scrollTop = elem.scrollHeight;
    }
} // logCommand



// --------------------- Eigenschaften (mit WebSockets) ---------------------
$(document).ready(function () {
    var request = new XMLHttpRequest();
    request.open("GET", '/properties/motor', true);
    request.setRequestHeader("Accept", "application/json; charset=utf-8");
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            properties = JSON.parse(request.responseText)[0];
            updateProperties(properties);
        }
    }
    request.send(null);
}); // document ready


wsURL = 'wss://' + serverLocation.host + '/properties/motor';
webSocket = new WebSocket(wsURL);

webSocket.onmessage = function (event) {
    var result = JSON.parse(event.data);
    updateProperties(result);
}

webSocket.onerror = function (error) {
    console.error('WebSocket error!');
    console.error(error);
}

/**
 * Updates the data table "properties" with the keys and values in the properties object
 * @param {*} properties    the most recent properties
 */
function updateProperties(properties) {
    var htmlString = '';
    Object.keys(properties).forEach(function (propName, index) {
        var propValue = properties[propName];
        htmlString = htmlString.concat('<dt>' + propName + '</dt><dd>' + propValue + '</dd>');
        $('#properties').html(htmlString);
    });
} // updateProperties