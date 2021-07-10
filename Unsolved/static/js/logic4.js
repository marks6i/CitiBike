// Perform an API call to the Citi Bike Station Information endpoint
// Initialize an object containing icons for each layer group
var icons = {
  COMING_SOON: L.ExtraMarkers.icon({
    icon: "fa-calendar-plus",
    iconColor: "white",
    markerColor: "yellow",
    shape: "star",
    prefix: "fa"
  }),
  EMPTY: L.ExtraMarkers.icon({
    icon: "fa-bicycle",
    iconColor: "white",
    markerColor: "red",
    shape: "circle",
    prefix: "fa"
  }),
  OUT_OF_ORDER: L.ExtraMarkers.icon({
    icon: "fa-minus-circle",
    iconColor: "white",
    markerColor: "blue-dark",
    shape: "penta",
    prefix: "fa"
  }),
  LOW: L.ExtraMarkers.icon({
    icon: "fa-bicycle",
    iconColor: "white",
    markerColor: "orange",
    shape: "circle",
    prefix: "fa"
  }),
  NORMAL: L.ExtraMarkers.icon({
    icon: "fa-bicycle",
    iconColor: "white",
    markerColor: "green",
    shape: "circle",
    prefix: "fa"
  })
};

d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_information.json").then(function(infoRes) {

  // When the first API call is complete, perform another call to the Citi Bike Station Status endpoint
  d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_status.json").then(function(statusRes) {

    var updatedAt = infoRes.last_updated;
    var stationStatus = statusRes.data.stations;
    var stationInfo = infoRes.data.stations;

    // Create an object to keep of the number of markers in each layer
    var stationCount = {
      COMING_SOON: 0,
      EMPTY: 0,
      LOW: 0,
      NORMAL: 0,
      OUT_OF_ORDER: 0
    };

    // Initialize a stationStatusCode, which will be used as a key to access the appropriate layers, icons, and station count for layer group
    var stationStatusCode;

    var bikeMarkers = [];

    // Loop through the stations (they're the same size and have partially matching data)
    for (var i = 0; i < stationInfo.length; i++) {

      // Create a new station object with properties of both station objects
      var station = Object.assign({}, stationInfo[i], stationStatus[i]);
      // If a station is listed but not installed, it's coming soon
      if (!station.is_installed) {
        stationStatusCode = "COMING_SOON";
      }
      // If a station has no bikes available, it's empty
      else if (!station.num_bikes_available) {
        stationStatusCode = "EMPTY";
      }
      // If a station is installed but isn't renting, it's out of order
      else if (station.is_installed && !station.is_renting) {
        stationStatusCode = "OUT_OF_ORDER";
      }
      // If a station has less than 5 bikes, it's status is low
      else if (station.num_bikes_available < 5) {
        stationStatusCode = "LOW";
      }
      // Otherwise the station is normal
      else {
        stationStatusCode = "NORMAL";
      }

      // Update the station count
      stationCount[stationStatusCode]++;

      // Create a new marker with the appropriate icon and coordinates
      var newMarker = L.marker([station.lat, station.lon], {
        icon: icons[stationStatusCode]
      });

      // Bind a popup to the marker that will  display on click. This will be rendered as HTML
      newMarker.bindPopup(station.name + "<br> Capacity: " + station.capacity + "<br>" + station.num_bikes_available + " Bikes Available");

      // Add the marker to the bikeMarkers array
      bikeMarkers.push(newMarker);
    }

    var bikeStations = L.layerGroup(bikeMarkers)

    // Create the tile layer that will be the background of our map
    var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
      maxZoom: 18,
      id: "light-v10",
      accessToken: API_KEY
    });

    // Create a baseMaps object to hold the lightmap layer
    var baseMaps = {
      "Light Map": lightmap
    };

    // Create an overlayMaps object to hold the bikeStations layer
    var overlayMaps = {
      "Bike Stations": bikeStations
    };

    var map = L.map("map-id", {
      center: [40.73, -74.0059],
      zoom: 12,
      layers: [lightmap, bikeStations]
    });

    // Create a layer control, pass in the baseMaps and overlayMaps. Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(map);
  });
});