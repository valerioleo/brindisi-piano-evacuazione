import React, {useState} from 'react';
import {
  LoadScript,
  GoogleMap,
  Circle,
  Marker
} from '@react-google-maps/api';
import Typography from '@material-ui/core/Typography';
import Autocomplete from './Autocomplete';
import Response from './Response';
import Footer from './Footer';
import {Rifugi} from './POI';
import BombIcon from '../../../../../../assets/icons/bomb.png';
import {rifugi} from './markers';

const HomePage = () => {
  const [circle, setCircle] = useState(null);
  const [center] = useState({lat: 40.628618, lng: 17.941565});
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
    if(newDistance < 1617) {
      setClosestShelters(findClosestPOIs(position, rifugi));
    }
  };

  return (
    <LoadScript
      googleMapsApiKey='AIzaSyBvGm7crab9a19iT0cYs1PsovrKZ8GYcYU'
      libraries={['places']}
      language='it'
      region='IT'
    >
      <Response
        distance={distance}
        closestShelters={closestShelters}
      />
      <Autocomplete
        onPlaceChanged={onPlaceChanged}
      />
      <Typography>
        <img
          style={{height: '26px', marginRight: '10px'}}
          src='http://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png'
        />Aree di accoglienza</Typography>
      <GoogleMap
        id="searchbox-example"
        center={center}
        zoom={14}
        mapContainerStyle={{height: '500px'}}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false
        }}
      >
        <Rifugi/>
        <Marker position={marker}/>
        <Marker position={center} icon={BombIcon}/>
        <Circle
          onLoad={setCircle}
          center={center}
          radius={1617}
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
      <Footer/>
    </LoadScript>
  );
};

export default HomePage;
