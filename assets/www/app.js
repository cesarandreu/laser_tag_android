"use strict mode";
var storage = window.sessionStorage;

//Handles loading jquerymobile and phonegap.
var jqmReady = $.Deferred();
var pgReady = $.Deferred();

// jqm ready
$(document).bind("mobileinit", jqmReady.resolve);

// phonegap ready
document.addEventListener("deviceready", pgReady.resolve, false);

// all ready :)
$.when(jqmReady, pgReady).then(function () {
  $.support.cors = true;
  $.mobile.allowCrossDomainpages = true;

  socket = io.connect('http://192.168.1.106:3000/');

  /*
  socket.on('news', function(data) {
    socket.emit('my other event', {my: 'data'});
    alert('Data: ' + data);
  });
  */
  
  bluetoothPlugin = cordova.require('cordova/plugin/bluetooth');
  bluetoothPlugin.isSupported(function (supported) {
    if (!supported) {
      //Something should be done if the device is not supported.
      //TO-DO Later.
      alert('Not supported!');
    } else {

      //We define an event handler for when something is received.
      $('#event_handler').on('new_item', function (event, item) {
        //Now we handle events here!
        //alert('Item received! - ' + item);
        handleItems(item);
      });

      //This runs.
      socket.on('game_setup', function (response) {
        if (gameName == response.gameName) {
          for(var i=0; i<playerList.length; i++){
            if(playerList[i].name == 'Cesar'){
              playerNumber=playerList[i].number;
              break;
            }
          }
          socket.emit('game_is_ready', {room: gameName, gameType: 'A', limit: response.limit, enemyCount: (playerList.length - 1), list: playerList, player: playerName, number: playerNumber});
        }

      });

      socket.on('game_begin', function(response){
        hitData = [];
        gameLimit = response.limit;
        game_information(response.player, response.number, response.limit, response.enemyNumber, response.playerList);
        game_start();

      });

      socket.on('game_over', function(response) {
        game_over(0);
      });

      //Checks if it's enabled or not.
      //Depending on the state it sets the slider.
      bluetoothPlugin.isEnabled(function (enabled) {
        var bluetooth_state = $('#bluetooth_state');
        if (enabled) {
          bluetooth_state.val('on');
          storage.setItem('bluetooth_state', 'on');
        } else {
          bluetooth_state.val('off');
          storage.setItem('bluetooth_state', 'off');
        }
        //bluetooth_state.slider('refresh');

      }, function () {
        //Something should be done if the device fails here.
        //TO-DO Later.
        alert('Error checking bluetooth support!');
      });

      //Gets the bluetooth address.
      bluetoothPlugin.getAddress(function (address) {
        storage.setItem('bluetooth_address', address);
        //alert('Storage get: ' + storage.getItem('bluetooth_address'));
      }, function (error) {
        alert('Error getting address: ' + error);
      });

      //Gets the bluetooth name.
      bluetoothPlugin.getName(function (name) {
        storage.setItem('bluetooth_name', name);
        //alert('Storage get name: ' + storage.getItem('bluetooth_name'));
      }, function (error) {
        alert('Error getting name: ' + error);
      });

      //When the slider changes, it toggles the state.
      $('#bluetooth_state').on('change', function () {
        var bluetooth_state = $('#bluetooth_state');
        var currentValue = bluetooth_state.val();
        if (currentValue === 'on') {
          bluetoothPlugin.enable(function () {
            var bluetooth_state = $('#bluetooth_state');
            storage.setItem('bluetooth_state', 'on');
            bluetooth_state.val('on');
            bluetooth_state.slider('refresh');
          }, function () {
            //What should be done here?
            alert('Enabling failed!');
          });
        } else {
          bluetoothPlugin.disable(function () {
            var bluetooth_state = $('#bluetooth_state');
            storage.setItem('bluetooth_state', 'off');
            bluetooth_state.val('off');
            bluetooth_state.slider('refresh');
          }, function () {
            //What should be done here?
            alert('Disabling failed!');
          });
        }
      });

      //When the user taps the bluetooth devices button in the bluetooth page.
      $('#bluetooth_devices_button').on('tap', function () {

        //Clear all the elements below #bluetooth_device_list
        $('#bluetooth_device_list').empty();

        //If the bluetooth is on, get bonded devices.
        //Otherwise something must be done.
        if ($('#bluetooth_state').val() === 'on') {
            bluetoothPlugin.getBondedDevices(function (deviceArray) {
            var deviceTemplate = _.template('<li><a id="<%=idAddress%>"><%=deviceName%></a></li>');
            var itemCount = 0;
            var deviceList = $('#bluetooth_device_list');

            for (var i = 0; i < deviceArray.length; i++) {
              //Adds paired and available devices to the list.
              if (deviceArray[i].isBonded) {
                deviceList.append(deviceTemplate({deviceName: deviceArray[i].name, idAddress: deviceArray[i].address}));
                itemCount++;
              }
            }
            //If the device count is zero, then no devices were found.
            if (itemCount === 0) {
              deviceList.append(deviceTemplate({deviceName: 'No device found.', idAddress: 'no_device'}));
            }

            //Adds a tap event to all the items.
            $('#bluetooth_device_list li a').on('tap', function() {
              //alert('ID is: ' + $(this).attr('id'));
              bluetoothAddress = $(this).attr('id');

              //If the UUID is no_device then no device was found.
              if (bluetoothAddress === 'no_device'){
                alert('No devices were found!');
              } else {


                //First we fetch the UUID
                bluetoothPlugin.fetchUUIDs(function(uuidArray) {
                  if (uuidArray.length === 0) {
                    alert('No UUID found.');
                  } else {
                    //alert('uuidArray.length : ' + uuidArray.length);
                    bluetoothUUID = uuidArray[0];

                    //Then we connect.
                    bluetoothPlugin.connect(function(BTsocket) {
                      bluetoothSocket = BTsocket;
                      
                      //This is how we handle data from the bluetooth BTsocket
                      bluetoothPlugin.read(function (readItem) {
                        $('#event_handler').trigger('new_item', [readItem]);
                      }, function(error) {
                        alert('Error reading from BTsocket: ' + error);
                      }, bluetoothSocket);
                      
                      //This prepares the message which we'll send to the MCU.
                      var message = [];
                      var checkString = '#C,# ';
                      for (var i=0; i < checkString.length; i++) {
                        message[i] = checkString.charCodeAt(i);
                      }

                      //This then sends #C,# which the MCU should reply to. 
                      bluetoothPlugin.write(function() {
                        console.log('Connection check sent to MCU.');
                        //At this point we might wanna give the users a button
                        //so they can keep trying to get a response.
                      }, function(error) {
                        alert('Error found while attemping to write to MCU: ' + error);
                      }, bluetoothSocket, message);

                    }, function(error) {
                      alert('Error connecting: ' + error);
                    }, bluetoothAddress, bluetoothUUID, true);

                  }
                }, function(error) {
                  alert('Error fetching UUIDs: ' + error);
                }, bluetoothAddress);

              }

            });

            $.mobile.changePage('#bluetooth_devices');

          }, function (error) {
            alert('Error getting bonded devices: ' + error);
          });
        

        } else {
          alert('Bluetooth is off!');
        }

      });
      

      //This is the login page.
      $('#login_button').on('tap', function() {
        playerName = $('#username_login').val();
        socket.emit('set_name', playerName);
      });


      socket.on('set_name_response', function(response) {
        $.mobile.changePage('#bluetooth_page');
      });


      //This is done when you create a new game.
      $('#game_create_button').on('tap', function () {
        gameName = $('#game_name_input').val();
        gameType = $('#create_game_type :radio:checked').val();
        gameLimit = $('#game_limit_value').val();

        socket.emit('create_game', {name: gameName, type: gameType, limit: gameLimit, player: playerName});

        playerList.push({name: playerName, number: 16});

      });

      socket.on('create_game_response', function(response) {
        var lobby = $('#game_created_information');
        var peopleList = $('#game_created_player_list');
        peopleList.find('li').remove();
        lobby.find('h3').remove();
        var name = _.template('<h3>Room name: <%=roomName%></h3>');
        var type = _.template('<h3>Game type: <%=roomType%></h3>');
        var limit = _.template('<h3>Limit: <%=roomLimit%></h3>');

        lobby.append(name({roomName: response.name}));
        lobby.append(type({roomType: response.type}));
        lobby.append(limit({roomLimit: response.limit}));
        peopleList.append('<li>'+playerName+'</li>');
 
        socket.on('asking_for_information', function(room) {
          socket.emit('send_room_information', {list: playerList, room: gameName, type: gameType, limit: gameLimit});
        });

        socket.on('creator_user_joined', function(response) {
            if (response.room === gameName) {
              var biggestNumberInArray = 16;
              var sameAtPosition = 0;
              for(var i=0; i<playerList.length; i++){
                if(playerList[i].number >= biggestNumberInArray){
                  biggestNumberInArray = playerList[i].number;
                }
                if(response.player === playerList[i]){
                  sameAtPosition = i;
                  break;
                }
              }
              if (playerList[sameAtPosition].name != response.player) {
                playerList.push({name: response.player, number: (biggestNumberInArray+4)});  
              }
              socket.emit('send_room_information', {list: playerList, room: gameName, type: gameType, limit: gameLimit});

              var enemyList = $('#game_created_player_list');
              enemyList.find('li').remove();
              for(var j=0; j<playerList.length; j++){
                enemyList.apprend(_.template('<li><%= name%></li>', {name: playerList[j].name}));
              }
              //var textList = "<% _.each(list, function(name: list.name) { %> <li><%= name %></li> <% }); %>";
              //enemyList.append(_.template(textList, {list: playerList}));


            }

        });

        $.mobile.changePage('#game_creator');
        peopleList.listview('refresh');

      });


      //This is done when you wanna get the game list.
      $('#join_game_button').on('tap', function() {
        socket.emit('game_list');
      });

      socket.on('game_list_response', function(list) {
        var lobby = $('#join_game_list');
        lobby.find('li').remove();
        var peopleList = '<% _.each(list, function(name){ %> <li><a id="<%= name %>"><%= name %></a></li> <% }); %>';
        var people = _.template(peopleList, {list: list});
        lobby.append(people);
        $.mobile.changePage('#join_game');
        lobby.listview('refresh');

        $('#join_game_list li a').on('tap', function () {
          var roomName = $(this).attr('id');
          socket.emit('join_game', {room: roomName, player: playerName});
        });

      });

      //This is done when you join a room.
      socket.on('join_game_response', function (response) {        

        socket.on('updated_room_information', function (response) {

          playerList = response.list;
          gameName = response.room;
          gameType = response.type;
          gameLimit = response.limit;

          var gameInformation = $('#game_joined_information');
          gameInformation.find('h3').remove();
          var name = _.template('<h3>Room name: <%=roomName%></h3>');
          var type = _.template('<h3>Game type: <%=roomType%></h3>');
          var limit = _.template('<h3>Limit: <%=roomLimit%></h3>');
          gameInformation.append(name({roomName: response.room}));
          gameInformation.append(type({roomType: response.type}));
          gameInformation.append(limit({roomLimit: response.limit}));

          var enemyList = $('#game_joined_playerlist');
          enemyList.find('li').remove();
          //var textList = "<% _.each(list, function(name: list.name) { %> <li><%= name%></li> <% }); %>";
          //enemyList.append(_.template(textList, {list: response.list}));
          for(var j=0; j<playerList.length; j++){
            enemyList.append(_.template('<li><%= name%></li>', {name: playerList[j].name}));
          }
          enemyList.listview('refresh');
        });

        socket.emit('get_updated_information');


        $.mobile.changePage('#game_joined');
        $('#game_joined_playerlist').listview('refresh');
      });


      //This button is available if you're the game creator.
      $('#start_game').on('tap', function () {
        alert('You pressed start!');
        socket.emit('server_prepare_everyone', {room: gameName, type: gameType, limit: gameLimit, enemyCount: (playerList.length - 1), list: playerList});
      });


    }

  });

});

function handleHitData (received_item) {
  //First we acknowledge the data by sending it out online.
  socket.emit('got_hit', received_item);

  //Then we send the acknowledge to the MCU, so it can get deleted there.
  game_dataAcknowledge(received_item.hitNumber);


}

function game_dataAcknowledge (hitNumber) {
  var message = [];
  var checkString = '#A,'+hitNumber+',# ';
  for (var i=0; i < checkString.length; i++) {
    message[i] = checkString.charCodeAt(i);
  }
  bluetoothPlugin.write(function () {
    console.log('game_new() ran fine.');
  }, function (error) {
    console.log('Error writing game start: ' + error);
  }, bluetoothSocket, message);
}

//This is currently hardcoded for only Deathmatch.
function game_information (playerName, playerNumber, gameLimit, enemyNumber, playerList) {
  var message = [];
  var arrayToSend = [];

  for(var k=0; k < enemyNumber; k++){
    if (enemyArray[k].name == playerName) { 
      playerNumber = enemyArray[k].number;
    } else {
      arrayToSend.push(enemyArray[k]);
    }
  }
  if (playerNumber === 0) {
    console.log('Your playerNumber is zero! Something might be wrong.');
  }

  var helpString = '';
  for(var j=0; j < arrayToSend.length; j++){
    helpString = (helpString + enemyArray[j].number + ',');
  }

  //Currently hardcoded with Deathmatch.
  var checkString = '#I,A,'+playerNumber+','+gameLimit+','+enemyNumber+','+helpString+'# ';
  console.log('Checked string is: ' + checkString);
  for (var i=0; i < checkString.length; i++) {
    message[i] = checkString.charCodeAt(i);
  }

  bluetoothPlugin.write(function () {
    console.log('New game written correctly!');
  }, function (error) {
    console.log('Error writing game information: ' + error);
  }, bluetoothSocket, message);
}


function game_confirm () {
  var message = [];
  var checkString = '#C,# ';
  for (var i=0; i < checkString.length; i++) {
    message[i] = checkString.charCodeAt(i);
  }
  bluetoothPlugin.write(function() {
    console.log('game_confirm() ran fine.');
  }, function(error) {
    alert('Error writing game confirm: ' + error);
  }, bluetoothSocket, message);
}

function game_new () {
  var message = [];
  var checkString = '#N,# ';
  for (var i=0; i < checkString.length; i++) {
    message[i] = checkString.charCodeAt(i);
  }
  bluetoothPlugin.write(function () {
    console.log('game_new() ran fine.');
  }, function (error) {
    console.log('Error writing game start: ' + error);
  }, bluetoothSocket, message);
}

function game_start () {
  var message = [];
  var checkString = '#S,# ';
  for (var i=0; i < checkString.length; i++) {
    message[i] = checkString.charCodeAt(i);
  }
  bluetoothPlugin.write(function () {
    console.log('Start game written correctly!');
  }, function (error) {
    console.log('Error writing game start: ' + error);
  }, bluetoothSocket, message);
}

function game_end (gameOverNumber) {
  var message = [];
  var checkString = '#O,'+gameOverNumber+',# ';
  for (var i=0; i < checkString.length; i++) {
    message[i] = checkString.charCodeAt(i);
  }
  bluetoothPlugin.write(function () {
    console.log('End game written correctly!');
  }, function (error) {
    console.log('Error writing game end: ' + error);
  }, bluetoothSocket, message);
}




//Global variables
var bluetoothSocket = -1;
var bluetoothPlugin = null;
var bluetoothAddress = '';
var bluetoothUUID = '';

var playerName = '';

var playerList = [];

var socket = null;

//Game variables
var gameState = '';
var gameName = '';
var gameType = '';
var gameLimit = '';

var damageTaken = 0;

var hitData = [];

function handleItems (received_item) {
  switch(received_item.type) {
    case 'response':
          handleResponse(received_item);
          break;
    case 'hit':
          handleHit(received_item);
          break;
    case 'player':
          handlePlayer(received_item);
          break;
    default:
          alert('Received an item that is not response, hit, or player.');
          break;
  }
}

function handleResponse (received_item) {
  switch(received_item.response) {
    case 'connected':
          handleConnected(received_item);
          break;
    case 'start':
          handleStart(received_item);
          break;
    case 'new':
          handleNew(received_item);
          break;
    case 'end':
          handleEnd(received_item);
          break;
    case 'hitAcknowledged':
          handleHitAcknowledged(received_item);
          break;
    case 'information':
          handleInformation(received_item);
          break;
    default:
          alert('It received a response that is not in the list.');
          break;
  }
}

function handleConnected (received_item) {
  if (gameState === '') {
    gameState = received_item.response;
    $.mobile.changePage('#menu_page');
  }
}

function handleStart (received_item) {
  gameState = received_item.response;
}

function handleNew (received_item) {
  gameState = received_item.response;
}

function handleEnd (receive_item) {
  gameState = received_item.response;
}

function handleHit (received_item) {
  if(gameState === 'start'){
    hitData.push(received_item);
    handleHitData(received_item);
  } else {
    alert('Received hit but game isn\'t in running mode.');
  }
}

function handleHitAcknowledged (received_item) {
  //At this point we should erase received_item.hitNumber.
  //To-do.
}

function handleInformation (received_item) {
  //What do we do with this?

}

function handlePlayer (received_item) {
  //You set your score to whatever is here.
  var text = _.template('<p>Shots fired = <%= shots %> </p>');
  $('#block_a_game_running').append(text(received_item.shotsFired));
}




















