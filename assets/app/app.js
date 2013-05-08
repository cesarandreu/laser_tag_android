
var app = angular.module('LaserTag', []);


//PhoneGap factory
app.factory('phonegapReady', function ($rootScope) {

    $rootScope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };


    return function (fn) {
      var queue = [];

      var impl = function () {
        queue.push(Array.prototype.slice.call(arguments));
      };

      document.addEventListener('deviceready', function () {
        queue.forEach(function (args) {
          fn.apply(this, args);
        });
        impl = fn;
      }, false);
      return function () {
        return impl.apply(this, arguments);
      };
    };
  });

//Bluetooth factory
app.factory('bluetooth', function ($rootScope, phonegapReady) {

  var bluetoothPlugin = cordova.require('cordova/plugin/bluetooth');
  return {
    disable: phonegapReady(function (onSuccess, onError) {
      bluetoothPlugin.disable(function () {
        var that = this,
          args = arguments;

        if (onSuccess) {
          $rootScope.safeApply(function () {
            onSuccess.apply(that, args);
          });
        }
      }, function () {
        var that = this,
          args = arguments;

        if (onError) {
          $rootScope.safeApply(function () {
            onError.apply(that, args);
          });
        }
      });
    }),
    enable: phonegapReady(function (onSuccess, onError) {
      bluetoothPlugin.enable(function () {
        var that = this,
          args = arguments;

        if (onSuccess) {
          $rootScope.safeApply(function () {
            onSuccess.apply(that, args);
          });
        }
      }, function () {
        var that = this,
          args = arguments;

        if (onError) {
          $rootScope.safeApply(function () {
            onError.apply(that, args);
          });
        }
      });
    }),
    getBondedDevices: phonegapReady(function (onSuccess, onError) {
      bluetoothPlugin.getBondedDevices(function () {
        var that = this,
          args = arguments;

        if (onSuccess) {
          $rootScope.safeApply(function () {
            onSuccess.apply(that, args);
          });
        }
      }, function () {
        var that = this,
          args = arguments;

        if (onError) {
          $rootScope.safeApply(function () {
            onError.apply(that, args);
          });
        }
      });
    }),
    fetchUUIDs: phonegapReady(function (onSuccess, onError, address) {
      bluetoothPlugin.fetchUUIDs(function () {
        var that = this,
          args = arguments;

        if (onSuccess) {
          $rootScope.safeApply(function () {
            onSuccess.apply(that, args);
          });
        }
      }, function () {
        var that = this,
          args = arguments;

        if (onError) {
          $rootScope.safeApply(function () {
            onError.apply(that, args);
          });
        }
      }, address);
    }),
    connect: phonegapReady(function (onSuccess, onError, address, uuid) {
      bluetoothPlugin.connect(function () {
        var that = this,
          args = arguments;

        if (onSuccess) {
          $rootScope.safeApply(function () {
            onSuccess.apply(that, args);
          });
        }
      }, function () {
        var that = this,
          args = arguments;

        if (onError) {
          $rootScope.safeApply(function () {
            onError.apply(that, args);
          });
        }
      }, address, uuid, true);
    }),
    read: phonegapReady(function (onSuccess, onError, socketParam) {
      bluetoothPlugin.read(function () {
        var that = this,
          args = arguments;

        if (onSuccess) {
          $rootScope.safeApply(function () {
            onSuccess.apply(that, args);
          });
        }
      }, function () {
        var that = this,
          args = arguments;

        if (onError) {
          $rootScope.safeApply(function () {
            onError.apply(that, args);
          });
        }
      }, socketParam);
    }),
    write: phonegapReady(function (onSuccess, onError, socketParam, message) {
      bluetoothPlugin.write(function () {
        var that = this,
          args = arguments;

        if (onSuccess) {
          $rootScope.safeApply(function () {
            onSuccess.apply(that, args);
          });
        }
      }, function () {
        var that = this,
          args = arguments;

        if (onError) {
          $rootScope.safeApply(function () {
            onError.apply(that, args);
          });
        }
      }, socketParam, message);
    })
  };
});

//Socket.IO factory
app.factory('socket', function ($rootScope) {
  var socket = io.connect('http://192.168.1.106:3000/');
  //var socket = io.connect('http://micro2.aws.af.cm/');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});

//LaserTag MEGA controller
app.controller('LaserTag', function ($scope, bluetooth, socket, $location) {
    var bluetoothSocket = -1;
    var uuid = '';
    var address = '';
    $scope.devices = [{name: 'No devices', address: ''}];

    $scope.gameState = 'Not connected';

    $scope.game = {};

    //Default game values
    $scope.game.type = 'A';
    $scope.game.typeText = 'Deathmatch';
    $scope.game.limit = 15;
    //$scope.game.playerNumber = 96;

    //$scope.game.enemyList = [];

    //Default EnemyNumber
    //$scope.game.selectedEnemyNumber = 32;

    //Hits received
    $scope.hits = [];

    //Default shots fired
    $scope.shotsFired = 0;

    //Limit name and type
    $scope.game.limitName = 'kills';
    $scope.game.limitType = 'Kill';

  //Bluetooth Control Function

    //Turns bluetooth off
    $scope.bluetoothOff = function () {
        bluetooth.disable(function () {
            alert('OFF!');
        }, function (error) {
            alert('Error going on: ' + error);
        });
    };

    //Turns bluetooth on
    $scope.bluetoothOn = function () {
        bluetooth.enable(function () {
            alert('ON!');
        }, function (error) {
            alert('Error going on: ' + error);
        });
    };

    //Gets list of paired devices
    $scope.bluetoothGetDevices = function () {
        bluetooth.getBondedDevices(function (devices) {
            if (devices.length === 0) {
              $scope.devices = [{name: 'No devices', address: ''}];
            } else {
              $scope.devices = devices;
            }
        }, function (error) {
            alert('Error: ' + error);
        });
    };

    //Connects to the selected device
    $scope.bluetoothConnect = function (addr) {
      if (addr) {
        address = addr;
        bluetooth.fetchUUIDs(function (UUIDs) {
          //alert('UUIDs: ' + UUIDs[0]);
          uuid = UUIDs[0];
          bluetooth.connect(function (sock) {
            //alert('Connected!  Socket is: ' + socket + ', Sock is: ' + sock);
            bluetoothSocket = sock;

            //Sets up the reader.
            ReadHandler(bluetooth, bluetoothSocket);

            //After connecting it moves on to the configuration page
            WriteConnect(bluetooth, bluetoothSocket);
          }, function (error) {
            alert('Error connecting: ' + error);
          }, address, uuid);
        }, function (error) {
          alert('Error fetching UUIDs: ' + error);
        }, address);
      } else {
        alert('That is not a valid device!');
      }
    };

  //Functions for handling information

    //Function that creates the reading thread.
    function ReadHandler (bluetoothObject, socketNumber) {
      bluetoothObject.read(function (response) {
        MessageHandler(response);
      }, function (error) {
        alert('Error setting up read: ' + error);
      }, socketNumber);
    }

    //Function that handles the messages as they arrive.
    function MessageHandler (received_item) {
      switch (received_item.type) {
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
      }
    }

    //Function that handles message responses
    function handleResponse (message) {
      switch(message.response) {
        case 'connected':
              handleConnected(message);
              break;
        case 'new':
              handleNew(message);
              break;
        case 'information':
              handleInformation(message);
              break;
        case 'start':
              handleStart(message);
              break;
        case 'end':
              handleEnd(message);
              break;
        case 'hitAcknowledged':
              handleHitAcknowledge(message);
              break;
        default:
          alert('It received a response that is not in the list.');
      }
    }

    //When the response is 'connected'
    function handleConnected (message) {
      $scope.gameState = 'Connected';
      alert('Game state is: ' + $scope.gameState);
      //$.mobile.changePage('#main');
      $location.hash('main');
    }

    //When the response is 'new'
    function handleNew (message) {
      $scope.gameState = 'Awaiting game info';
      alert('Game state is: ' + $scope.gameState);
      //$.mobile.changePage('#setupGame');
    }

    //When the response is 'information'
    function handleInformation (message) {
      $scope.gameState = 'Game ready to start';
      alert('Game state is: ' + $scope.gameState);

      //Sets self ready in the server
      setSelfReady();

    }

    //When the response is 'start'
    function handleStart (message) {
      $scope.gameState = 'Game running';
      alert('Game state is: ' + $scope.gameState);

      //$.mobile.changePage('#runningGame');
    }

    //When the response is 'end'
    function handleEnd (message) {
      $scope.gameState = 'Game ended';
      alert('Game state is: ' + $scope.gameState);

      //$.mobile.changePage('#endGame');
    }

    //When the response is 'hitAcknowledge'
    function handleHitAcknowledge (message) {
      //$scope.acknowledgedShots.push(message.hitNumber);
      console.log('Hit acknowledged: ' + message.hitNumber);
    }

    //When the message is hit information
    function handleHit (message) {
      $scope.hits.push({enemy: message.id, hitNumber: message.hitNumber, location: message.gps});
      WriteAcknowledge(bluetooth, bluetoothSocket, message.hitNumber);
      message.receiver = $scope.player.number;
      transmitHitData(message);
    }

    //When the message is player information
    function handlePlayer (message) {
      $scope.shotsFired = message.shotsFired;
    }

  //Game Flow Functions

    //Starts a new game
    $scope.gameNew = function () {
      WriteNew(bluetooth, bluetoothSocket);
    };

    //Sends game information 
    $scope.gameInformation = function (playerNumber, gameType, gameLimit, enemyList) {
      //WriteInformation(bluetooth, bluetoothSocket, $scope.game.playerNumber, $scope.game.type, $scope.game.limit, $scope.game.enemyList);
      WriteInformation(bluetooth, bluetoothSocket, playerNumber, gameType, gameLimit, enemyList);
    };

    //Starts a game
    $scope.gameStart = function () {
        WriteStart(bluetooth, bluetoothSocket);
    };

    //Ends the game
    $scope.gameEnd = function () {
      WriteEnd(bluetooth, bluetoothSocket);
    };

    //Resets the variables and starts a new game
    $scope.gameReset = function () {
      //Starts a new game
      //$scope.gameNew();

      //Sets game as an empty object
      $scope.game = {};

      $scope.game.name = '';

      //Default game values
      $scope.game.type = 'A';
      $scope.game.limit = 15;
      //$scope.game.playerNumber = 96;
      //$scope.game.enemyList = [];

      //Limit name and type
      $scope.game.limitName = 'kills';
      $scope.game.limitType = 'Kill';
      $scope.game.typeText = 'Deathmatch';

      //Default selected enemy number
      //$scope.game.selectedEnemyNumber = 32;

      //Resets hits received to none
      $scope.hits = [];

      //Resets shots fired to zero
      $scope.shotsFired = 0;

    };

  //Write Functions

    //Writes CONNECT message
    function WriteConnect (bluetoothObject, socketNumber) {
      var message = [];
      var messageString = '#C,# ';
      for(var i = 0 ; i < messageString.length ; i++){
        message[i] = messageString.charCodeAt(i);
      }

      bluetoothObject.write(function () {
        console.log('WriteConnect was a success.');
      }, function (error) {
        alert('Error writing connect: ' + error);
      }, socketNumber, message);
    }

    //Writes NEW GAME message
    function WriteNew (bluetoothObject, socketNumber) {
      var message = [];
      var messageString = '#N,# ';
      for(var i = 0 ; i < messageString.length ; i++){
        message[i] = messageString.charCodeAt(i);
      }

      bluetoothObject.write(function () {
        console.log('WriteNew was a success.');
      }, function (error) {
        alert('Error writing connect: ' + error);
      }, socketNumber, message);
    }

    //Writes GAME INFORMATION message
    function WriteInformation (bluetoothObject, socketNumber, playerNumber, gameType, gameLimit, enemyList) {
      var message = [];

      var enemyString = ''+enemyList.length+',';
      for(var i = 0 ; i < enemyList.length ; i++){
        enemyString = enemyString + '' + enemyList[i] + ',';
      }

      var messageString = '#I,'+gameType+','+playerNumber+','+gameLimit+','+enemyString+'# ';
      //alert('Message to send: ' + messageString);

      for (var j = 0 ; j < messageString.length; j++) {
        message[j] = messageString.charCodeAt(j);
      }

      bluetoothObject.write(function () {
        console.log('Information write was a success');
      }, function (error) {
        alert('Error writing game information: ' + error);
      }, socketNumber, message);
    }

    //Writes NEW GAME message
    function WriteStart (bluetoothObject, socketNumber) {
      var message = [];
      var messageString = '#S,# ';
      for(var i = 0 ; i < messageString.length ; i++){
        message[i] = messageString.charCodeAt(i);
      }

      bluetoothObject.write(function () {
        console.log('Game start write was a success');
      }, function (error) {
        alert('Error writing connect: ' + error);
      }, socketNumber, message);
    }

    //Writes DATA ACKNOWLEDGE message
    function WriteAcknowledge (bluetoothObject, socketNumber, hitNumber) {
      var message = [];
      var messageString = '#A,'+hitNumber+',# ';
      for(var i = 0 ; i < messageString.length ; i++){
        message[i] = messageString.charCodeAt(i);
      }

      bluetoothObject.write(function () {
        console.log('Data acknowledge write was a success');
      }, function (error) {
        alert('Error writing connect: ' + error);
      }, socketNumber, message);
    }

    //Writes DATA ACKNOWLEDGE message
    function WriteEnd (bluetoothObject, socketNumber) {
      var message = [];
      var messageString = '#O,0,# ';
      for(var i = 0 ; i < messageString.length ; i++){
        message[i] = messageString.charCodeAt(i);
      }

      bluetoothObject.write(function () {
        console.log('Game over write was a success');
      }, function (error) {
        alert('Error writing connect: ' + error);
      }, socketNumber, message);
    }

  //Game info related functions

    //Adds an enemy to the array
    $scope.addEnemy = function(enemyNumber) {
      $scope.game.enemyList.push(enemyNumber);
      $scope.game.selectedEnemyNumber++;
      console.log('Enemy number added: ' + enemyNumber);
    };

  //When game.type changes
    //Sets the value of 
    $scope.updateTypeText = function (gameType) {
      //$scope.game.type = 'A';
      //$scope.game.typeText = 'Deathmatch';
      //Limit name
      //$scope.limitName = 'kills';
      if($scope.game.type==='A'){
        $scope.game.typeText = 'Deathmatch';
        $scope.game.limitName = 'kills';
        $scope.game.limitType = 'Kill';
      } else {
        $scope.game.typeText = 'Timed Deathmatch';
        $scope.game.limitName = 'minutes';
        $scope.game.limitType = 'Time';
      }

    };

  //Socket.IO Magic here

    //Socket.IO variables
    $scope.newName = '';

    //All other users that are not the player
    $scope.users = [];

    //Player information
    $scope.player = {};
    $scope.player.name = '';
    $scope.player.channel = '';

    socket.on('init', function (data) {
      $scope.player.name = data.name;
      $scope.users = data.users;
    });

    socket.on('user:join', function (data) {
      $scope.users.push(data.name);
    });

    socket.on('user:left', function (data) {
      var i, user;
      for (i = 0; i < $scope.users.length; i++) {
        user = $scope.users[i];
        if (user === data.name) {
          $scope.users.splice(i, 1);
          break;
        }
      }
    });

    //Updates the person's username
    socket.on('change:name', function (data) {
      changeName(data.oldName, data.newName);
    });

    //Private helper
    var changeName = function (oldName, newName) {
      // rename user in list of users
      var i;
      for (i = 0; i < $scope.users.length; i++) {
        if ($scope.users[i] === oldName) {
          $scope.users[i] = newName;
        }
      }
    };

    //Changes the user's name
    $scope.changeName = function () {
      socket.emit('change:name', {
        name: $scope.newName
      }, function (result) {
        if (!result) {
          alert('That name is already taken! Try another.');
        } else {

          changeName($scope.player.name, $scope.newName);

          $scope.player.name = $scope.newName;
          $scope.newName = '';

          //$.mobile.changePage('#bluetooth');
          $location.hash('bluetooth');
        }
      });
    };


    //Socket.IO Lobby

    //Creates a room
    $scope.createRoom = function (game) {
      socket.emit('lobby:create', {
        name: game.name,
        type: game.type,
        limit: game.limit,
        host: game.host,
        typeText: game.typeText,
        limitType: game.limitType
      }, function (result, playerList) {
        if(!result){
          alert('That room name is already taken! Try another.');
        } else {
          $scope.gameNew();
          $scope.lobby = playerList;
          //$.mobile.changePage('#hostLobby');
          $location.hash('hostLobby');
        }
      });
    };

    //Gets the game list
    $scope.getGameList = function () {
      socket.emit('lobby:getList', {list: true}, function (gameList) {
        if (gameList.length===0) {
          $scope.gameList = ['No games found'];
        } else {
          $scope.gameList = gameList;
        }

      });
    };

    //Refreshes the game list
    $scope.refreshGameList = function () {
      $scope.getGameList();
    };

    //Tells the user the host left the lobby, forces the person out.
    socket.on('lobby:abandon', function() {
      $scope.gameReset();
      //Should do something fancier later.
      alert('Host has left the lobby.');
      //$.mobile.changePage('#main');
      $location.hash('main');
    });

    //When there is a playerChange in the lobby, update the playerList.
    socket.on('lobby:playerChange', function (playerList) {
      $scope.lobby = playerList;
    });


  //Lobby logic
    $scope.lobby = [];
    $scope.gameList = ['No games found'];

    //Changes the user's name on submit, this is the login page.
    $scope.submitButton = function(name) {
      $scope.newName = name;
      $scope.changeName();
    };

    //Creates a game
    $scope.createGame = function (game) {
      $scope.game = game;
      $scope.game.host = $scope.player.name;
      $scope.createRoom(game);
    };

    //When the host leaves do this
    $scope.hostLeave = function (roomName) {
      socket.emit('lobby:hostLeft', roomName);
      $scope.gameReset();
    };

    //When a player leaves do this
    $scope.leaveLobby = function () {
      $scope.gameReset();
      socket.emit('lobby:leave');
    };

    $scope.joinGame = function (roomName) {
      if (roomName == 'No games found') {
        alert('Try refreshing the list and joining another room!');
      } else {
        socket.emit('lobby:join', roomName, function (gameInfo) {
          if (!gameInfo.name) {
            alert('Something failed! Try refreshing the list and joining another room.');
          } else {
            $scope.game = {
              started: false,
              name: gameInfo.name,
              type: gameInfo.type,
              limit: gameInfo.limit,
              host: gameInfo.host,
              typeText: gameInfo.typeText,
              limitType: gameInfo.limitType
            };

            $scope.lobby = gameInfo.players;
            $scope.gameNew();
            //$.mobile.changePage('#joinLobby');
            $location.hash('joinLobby');
          }
        });
      }

    };

    //Sends information to phone.
    $scope.sendInformation = function (game, lobby) {
      //$.mobile.changePage('#gameReadyHost');
      $location.hash('gameReadyHost');
      socket.emit('lobby:informationReady');
    };

    socket.on('lobby:sendInformation', function() {
      if ($scope.game.host != $scope.player.name) {
        //$.mobile.changePage('#gameReady');
        $location.hash('gameReady');
      }

      var enemyArray = [];

      for (var i=0; i<$scope.lobby.length; i++) {
        if ($scope.player.name == $scope.lobby[i].name) {
          $scope.player.number = $scope.lobby[i].number;
        } else {
          enemyArray.push($scope.lobby[i].number);
        }
      }

      $scope.gameInformation($scope.player.number, $scope.game.type, $scope.game.limit, enemyArray);

    });

    function setSelfReady () {
      socket.emit('lobby:setReady');
    }

  //Handles game logic
    $scope.scoreList = [];

    $scope.startGame = function () {
      socket.emit('game:sendStart', {game: $scope.game, players: $scope.lobby});
    };

    socket.on('game:start', function () {
      $scope.gameStart();

      $scope.scoreList = [];

      for (var i = 0; i < $scope.lobby.length; i++) {
          $scope.scoreList.push({name: $scope.lobby[i].name, score: 0});
      }

      //$.mobile.changePage('#gameRunning');
      $location.hash('gameRunning');

    });

    socket.on('game:score', function (playerList) {
      console.log(playerList);
      $scope.scoreList = playerList;
    });

    function transmitHitData (hitData) {
      socket.emit('game:hit', {hitData: hitData, limit:$scope.game.limit, type:$scope.game.type});
    }

    socket.on('game:over', function(winner) {
      $scope.gameEnd();
      $scope.winner = winner;
      //alert(winner.name + ' is the winner with ' + winner.score + ' points!');
      //$.mobile.changePage('#gameEnd');
      $location.hash('gameEnd');
    });

    $scope.winner = {name: '', score: 0};

});



















