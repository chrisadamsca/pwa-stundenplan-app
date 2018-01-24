(function() {
  'use strict';

  var request = new XMLHttpRequest();

  request.open("GET","https://chrisadamsca.github.io/pwa-stundenplan-app/stundenplan.json");
  request.addEventListener('load', function(event) {
     if (request.status >= 200 && request.status < 300) {
        var days = JSON.parse(request.responseText);
        var timetable = document.getElementById("Timetable");
        for(var i = 0; i < 7; i++){
          var courses = days[i].vorlesungen;
          var newH = document.createElement("h2");
          var newHContent = document.createTextNode(days[i].name);
          newH.appendChild(newHContent);
          timetable.appendChild(newH);

          for(var j = 0; j < courses.length; j++){
            var name = courses[j].name;
            var time = courses[j].zeit;
            var room = courses[j].raum;

            var newH = document.createElement("h3");
            var newHContent = document.createTextNode(name);
            newH.appendChild(newHContent);
            timetable.appendChild(newH);

            var newTime = document.createElement("p");
            var newTimeContent = document.createTextNode(time + " Uhr");
            newTime.appendChild(newTimeContent);
            timetable.appendChild(newTime);

            var newRoom = document.createElement("p");
            var newRoomContent = document.createTextNode("Raum " + room);
            newRoom.appendChild(newRoomContent);
            timetable.appendChild(newRoom);

          }

        }
     } else {
        console.warn(request.statusText, request.responseText);
     }
  });
  request.send();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('sw-v1.js').then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch(function(err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }

})();
