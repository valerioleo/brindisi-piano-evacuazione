import React, {useState} from 'react';
import {
  LoadScript,
  GoogleMap,
  Circle,
  Marker
} from '@react-google-maps/api';
import Autocomplete from './Autocomplete';
import Response from './Response';
import {Rifugi} from './POI';
import BombIcon from '../../../../../../assets/icons/bomb.png';
import {rifugi} from './markers';

const HomePage = () => {
  const [circle, setCircle] = useState(null);
  const [center] = useState({lat: 40.6270412, lng: 17.939837});
  const [marker, setMarker] = useState(null);
  const [distance, setDistance] = useState(null);
  const [closestShelters, setClosestShelters] = useState([]);

  const findClosestPOIs = (position, POIs) => {
    const closestPOIs = POIs.map(POI => {
      const newDistance = window.google
        .maps
        .geometry
        .spherical
        .computeDistanceBetween(
          new window.google.maps.LatLng(position),
          new window.google.maps.LatLng(POI.coordinates)
        );

      return {
        ...POI,
        distance: Math.floor(newDistance)
      };
    }).sort((a, b) => a.distance - b.distance);

    return closestPOIs;
  };

  const onPlaceChanged = latLngObj => {
    const position = {
      lat: latLngObj.lat(),
      lng: latLngObj.lng()
    };
    setMarker(position);

    const newDistance = window.google
      .maps
      .geometry
      .spherical
      .computeDistanceBetween(
        latLngObj,
        circle.getCenter()
      );

    setDistance(newDistance);
    if(newDistance < 1600) {
      setClosestShelters(findClosestPOIs(position, rifugi));
    }
  };

  return (
    <LoadScript
      googleMapsApiKey='AIzaSyBvGm7crab9a19iT0cYs1PsovrKZ8GYcYU'
      libraries={['places']}
    >
      <Response
        distance={distance}
        closestShelters={closestShelters}
      />
      <Autocomplete
        onPlaceChanged={onPlaceChanged}
      />
      <GoogleMap
        id="searchbox-example"
        center={center}
        zoom={14}
        mapContainerStyle={{height: '500px'}}
      >
        <Rifugi/>
        <Marker position={marker}/>
        <Marker position={center} icon={BombIcon}/>
        <Circle
          onLoad={setCircle}
          center={center}
          radius={1600}
          options={{
            geodesic: true,
            strokeColor: '#FFd000',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            fillColor: '#FFd000',
            fillOpacity: 0.35
          }}
        />
      </GoogleMap>
    </LoadScript>
  );
};

export default HomePage;
