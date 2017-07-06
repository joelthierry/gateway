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
var inputFields = [];

// ------------------------------------------ MOTOR ------------------------------------------
var configKM17_11H2045X4_095_001 = [{ "par": { "cmd": 1, "id": 0, "val": 10000 } },
{ "par": { "cmd": 1, "id": 1, "val": 295000 } },
{ "par": { "cmd": 1, "id": 2, "val": 295000 } },
{ "par": { "cmd": 1, "id": 3, "val": 750000 } },
{ "par": { "cmd": 1, "id": 4, "val": 32 } },
{ "par": { "cmd": 1, "id": 5, "val": 50 } },
{ "par": { "cmd": 1, "id": 6, "val": 25000 } },
{ "par": { "cmd": 1, "id": 7, "val": 0 } }];
var configKM17_24H2085_200_4A = [{ "par": { "cmd": 1, "id": 0, "val": 20000 } },
{ "par": { "cmd": 1, "id": 1, "val": 200000 } },
{ "par": { "cmd": 1, "id": 2, "val": 200000 } },
{ "par": { "cmd": 1, "id": 3, "val": 290000 } },
{ "par": { "cmd": 1, "id": 4, "val": 40 } },
{ "par": { "cmd": 1, "id": 5, "val": 70 } },
{ "par": { "cmd": 1, "id": 6, "val": 18000 } },
{ "par": { "cmd": 1, "id": 7, "val": 0 } }];
var configKM24_11H2045X4_095_001 = [{ "par": { "cmd": 1, "id": 0, "val": 10000 } },
{ "par": { "cmd": 1, "id": 1, "val": 295000 } },
{ "par": { "cmd": 1, "id": 2, "val": 295000 } },
{ "par": { "cmd": 1, "id": 3, "val": 750000 } },
{ "par": { "cmd": 1, "id": 4, "val": 32 } },
{ "par": { "cmd": 1, "id": 5, "val": 50 } },
{ "par": { "cmd": 1, "id": 6, "val": 25000 } }];
var configKM24_24H2085_200_4A = [{ "par": { "cmd": 1, "id": 0, "val": 2500 } },
{ "par": { "cmd": 1, "id": 1, "val": 10000 } },
{ "par": { "cmd": 1, "id": 2, "val": 10000 } },
{ "par": { "cmd": 1, "id": 3, "val": 152000 } },
{ "par": { "cmd": 1, "id": 4, "val": 162 } },
{ "par": { "cmd": 1, "id": 5, "val": 389 } },
{ "par": { "cmd": 1, "id": 6, "val": 45000 } }];
var deleteSequence = [{ "rom": { "frm": [1, 1], "val": " " } }, { "sys": 1 }];
var resetCommand = { "sys": 1 };
var infoCommand = [{ "sys": 2 }, { "par": { "cmd": 2 } }];

var oldSelectedCommand = 's1';

// value of the input option field in seqCom
var gehezuPosValue = 's1';
// options of the dropdown menu
var geheZuPosOptionen = ['Shortest', 'Longest'];
// input fields for this command (array = dropdown menu, string = text input with string as placeholder)
var geheZuPosInputFelder = [geheZuPosOptionen, 'Position [-3\'600\'000,3\'600\'000]'];

var drehenValue = 's4';
var drehenOptionen = ['Konstant', 'Analoger Eingang'];
var drehenInputFelder = [drehenOptionen, 'Wert [-100, 100]', 'Min', 'Max'];

var wartenValue = 's12';
var wartenInputFelder = ['Zeit in ms [0,3\'600\'000]'];

createInputFields(geheZuPosInputFelder);


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
    switch (selectedOption) {
        case 'c17_11H':
            command = JSON.stringify(configKM17_11H2045X4_095_001);
            break;
        case 'c17_24H':
            command = JSON.stringify(configKM17_24H2085_200_4A);
            break;
        case 'c24_11H':
            command = JSON.stringify(configKM24_11H2045X4_095_001);
            break;
        case 'c24_24H':
            command = JSON.stringify(configKM24_24H2085_200_4A);
            break;
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
    // console.log(inputElements);
    var commandValues = {};
    for (var i = 0; i < inputElements.length; i++) {
        var elementID = inputElements[i].id;
        if (elementID.startsWith('valueSeq')) {
            var elementValue = inputElements[i].value;
            // console.log(elementID + ': ' + elementValue);
            if (elementValue != '') {
                commandValues[elementID] = elementValue;
            }
        }
    } // for
    // creates a sequenceCommand (JSON) and a sequenceButton (HTML radio button)
    if (commandValues != {}) {
        var sequenceCommand;
        var sequenceButton = '<label><input type="radio" id="seqComm' + buttonIndex + '" name="sequence" value="' + buttonIndex + '"><i> ';
        var selectedCommand = $('#seqCom :selected').val();
        switch (selectedCommand) {
            case gehezuPosValue:      // GEHE ZU POSITION
                var option = commandValues.valueSeq0 || '0';
                option = option.replace(/^\D+/g, '');  // replace all leading non-digits with nothing
                var optionName = geheZuPosOptionen[option];
                var position = commandValues.valueSeq1 || '0';
                sequenceCommand = 'g:[' + position + ',' + option + ']';
                sequenceButton += 'GEHE ZU POSITION (' + position + ', ' + optionName + ')';
                break;
            case drehenValue:      // DREHEN
                var option = commandValues.valueSeq0 || '0';
                option = option.replace(/^\D+/g, '');
                var optionName = drehenOptionen[option];
                var speed = commandValues.valueSeq1 || '0';
                var min = commandValues.valueSeq2 || '0';
                var max = commandValues.valueSeq3 || '0';
                sequenceCommand = 'r:[' + option + ',' + speed + ',' + min + ',' + max + ']';
                sequenceButton += 'DREHEN (' + optionName + ', ' + speed + '%, ' + min + '%, ' + max + '%)';
                break;
            case wartenValue:     // WARTE
                var time = commandValues.valueSeq0 || '0';
                sequenceCommand = 'wt:' + time;
                sequenceButton += 'WARTE (' + time + 'ms)';
                break;
            default:
                console.error('Unknown sequence command option: ' + selectedCommand);
                sequenceCommand = '';
                sequenceButton += 'NO OPTION SELECTED!'
                break;
        } // switch
        var comment = commandValues.valueSeqComment || '';
        sequenceButton += '<font color="green"> ' + comment + '</font></i></label><br>';
        sequenceButtons[indexInArray] = sequenceButton;
        sequenceCommands[indexInArray] = sequenceCommand;
        updateSequenceHTML();
    }
} // createSequenceCommand

/**
 * Creates a string which contains a HTML div with a dropdown list.
 * @param {*} id            the id of the div
 * @param {*} optionNames   an array of the elements in the dropdown menu
 */
function getDropdownDiv(id, optionNames) {
    var result = '<div class="col-md-4">' +
        '<select class="form-control" id="' + id + '" style="margin:10px;width=500px;">';
    for (var i = 0; i < optionNames.length; i++) {
        result = result.concat('<option value="option' + i + '">' + optionNames[i] + '</option>');
    }
    return result.concat('</select></div>');
} // getDropdownDiv

// detects which sequence command in curSeq is selected
$('#curSeq').on('change', function () {
    var radioButtons = $("#curSeq input:radio[name='sequence']");
    var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
    console.log('selected index: ' + selectedIndex);
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

// displays input fields according to the chosen command
$('#abschnGrauSeq').on('change', function () {
    // displays input fields according to the chosen command
    var selectedCommand = $('#seqCom :selected').val();
    if (selectedCommand !== oldSelectedCommand) {
        oldSelectedCommand = selectedCommand;
        $('#seqInputFields').empty();
        var commandInputFields;
        switch (selectedCommand) {
            case gehezuPosValue:    // GEHE ZU POSITION
                commandInputFields = geheZuPosInputFelder;
                break;
            case drehenValue:       // DREHEN
                commandInputFields = drehenInputFelder;
                break;
            case wartenValue:       // WARTE
                commandInputFields = wartenInputFelder;
                break;
            default:
                console.error('Unknown selected sequence command: ' + selectedCommand);
                commandInputFields = [];
                break;
        } // switch
        createInputFields(commandInputFields);
    } // if

});

/**
 * Creates input fields according to the array in the parameter. If an entry in the array is
 * an array itself, it creates a dropdown menu with the specified labels. If an entry in the array
 * is a string, it creates a text input field with the string as a placeholder.
 * @param {*} commandInputFields 
 */
function createInputFields(commandInputFields) {
    inputFields = [];
    for (var j = 0; j < commandInputFields.length; j++) {
        if (commandInputFields[j].constructor === Array) {   // input field is a dropdown menu
            inputFields[j] = $(getDropdownDiv('valueSeq' + j, commandInputFields[j]));
        } else {    // input field is a text input field
            inputFields[j] = $('<input class="form-control" type="text" placeholder="' + commandInputFields[j] + '" id="valueSeq' + j + '" style="margin:10px;">');
        }
    } // for
    inputFields.push($('<input class="form-control" type="text" placeholder="Kommentar" id="valueSeqComment" style="margin:10px;">'));
    inputFields.forEach(function (inputField, index) {
        inputField.appendTo('#seqInputFields');
    });
} // createInputFields

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

// clears the sentCommands log
$("#buttonClearLog").on("click", function () {
    $('#sentCommands').empty();
    $('#answerStatus').empty();
});



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