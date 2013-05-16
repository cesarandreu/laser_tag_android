#Laser Tag Reloaded - Android application

---

##What is this

This is a laser tag system which connects to your android smartphone using bluetooth. Your smartphone then connects to a remote server which handles tracking the lobby and game data. 

The program flow is simple: You pair the smartphone with the gun/vest, you join or create a lobby, and then you play! 

Each player is assigned a number, which gets transmitted by the infrared laser. When another player receives a valid enemy number it transmits this to the smartphone, and then the smartphone transmits it to the server.

When the end game conditions are met, the server nofies every player. At the end of each game you can see a map with markers showing the places where you got shot. 

---

###Project Links

The project has three components: 

* [__System__ (Gun + Vest)](https://github.com/cesarandreu/laser_tag_reloaded)

* [__Server__ (Node.js) ](https://github.com/cesarandreu/laser_tag_nodejs)

* [ __Smartphone application__ (Android)](https://github.com/cesarandreu/laser_tag_android)

---

###Smartphone application

This is the smartphone application. It handles linking you between the system and the server. We made an Android version, but it should be relatively simple to port it to iOS or other smartphones.

When you open the applicatin you select a username, and then you connect to the system through bluetooth. After this you can create or join a lobby. Once enough people are in a lobby, you can start a game. When the game starts the application handles sending the correct commands to the system through bluetooth in order to set everything up. 

Finally, when the Game End command is received from the server, it transmits it to the system. At this point it shows you the Game Over screen, and you can see a map of the locations where you got shot. 

The system has a GPS module, but if the system does not send valid GPS data it falls back to using the smartphone's GPS location. 

---

####Running the android application

If you want to compile the app yourself you're required to use Eclipse. Import the Android Project. Afterwards, you'll have to update `/assets/app/app.js` (Line 236) and `/assets/index.html` (Line 15) with the correct address for the server. You are __required__ to have a server running for it to work. You are also __required__ to have an internet connection for it to work. Afterward, you run the android application like you would any other, and install it on your phone. 

You must be paired with the system before running the application. 

This was tested on Android 4.0, so it doesn't have support for websockets. This falls back to using polling with socket.io. If you lose internet connectivity, the system breaks. This is a _prototype_. I'd suggest using a socket.io plugin for PhoneGap instead of just using the socket.io.js file. 