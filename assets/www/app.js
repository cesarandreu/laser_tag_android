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
  bluetoothPlugin = cordova.require('cordova/plugin/bluetooth');
  bluetoothPlugin.isSupported(function (supported) {
    if (!supported) {
      //Something should be done if the device is not supported.
      //TO-DO Later.
      alert('Not supported!');
    } else {

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
        bluetooth_state.slider('refresh');

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
        var currentValue = $(this).val();
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
            storage.setItem('bluetooth_state', 'off');
            var bluetooth_state = $('#bluetooth_state');
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

        //If the bluetooth is on, get bonded devices.
        //Otherwise something must be done.
        if (storage.getItem('bluetooth_state') === 'on') {
            bluetoothPlugin.getBondedDevices(function (deviceArray) {
            var deviceTemplate = _.template('<li><a id="<%= idName %>"><%= deviceName %></a></li>');
            var itemCount = 0;
            var deviceList = $('#bluetooth_device_list');

            for (var i = 0; i < deviceArray.length; i++) {
              //Adds paired and available devices to the list.
              if (deviceArray[i].isBonded) {
                deviceList.append(deviceTemplate({deviceName: deviceArray[i].name, idName: deviceArray[i].name}));
                storage.setItem(deviceArray[i].name, deviceArray[i].address);
                itemCount++;
              }
            }
            //If the device count is zero, then no devices were found.
            if (itemCount === 0) {
              deviceList.append(deviceTemplate({deviceName: 'No device found.', idName: 'no_device'}));
            }

            //Adds a tap event to all the items.
            $('#bluetooth_device_list li a').on('tap', function() {
              //alert('ID is: ' + $(this).attr('id'));

              //If the UUID is no_device then no device was found.
              if ($(this).attr('id') === 'no_device'){
                alert('No devices were found!');
              } else {

                bluetoothDevice = $(this).attr('id');

                //First we fetch the UUID
                bluetoothPlugin.fetchUUIDs(function(uuidArray) {
                  if (uuidArray.length === 0) {
                    alert('No UUID found.');
                  } else {
                    //alert('uuidArray.length : ' + uuidArray.length);
                    bluetoothUUID = uuidArray[0];

                    //Then we connect.
                    bluetoothPlugin.connect(function(socket) {
                      bluetoothSocket = socket;
                      storage.setItem('socket', ''+socket);
                      //alert('You connected! Socket: ' + socket);

                      //This is how we handle data from the bluetooth socket
                      bluetoothPlugin.read(function(readItem) {
                        $('body').trigger('new_item', readItem);
                      }, function(error) {
                        alert('Error reading from socket: ' + error);
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
                    }, storage.getItem(bluetoothDevice), bluetoothUUID, false);

                  }
                }, function(error) {
                  alert('Error fetching UUIDs: ' + error);
                }, storage.getItem(bluetoothDevice));

              }

            });

            $.mobile.changePage('#bluetooth_devices');

          }, function (error) {
            alert('Error getting bonded devices: ' + error);
          });

          //We define an event handler for when something is received.
          $('body').on('new_item', function(event, item) {
            //Now we handle events here!

            //If we get a connect, we move the player to the Game Screen.

          });

        } else {
          alert('Bluetooth is off!');
        }

      });


    }

  });

});

//Global variables
var bluetoothSocket = -1;
var bluetoothPlugin = null;
var bluetoothDevice = "";
var bluetoothUUID = "";

