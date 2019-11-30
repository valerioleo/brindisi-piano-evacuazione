import React from 'react';
import {Marker} from '@react-google-maps/api';
import {rifugi, areeAttesa} from './markers';

export const Rifugi = () => rifugi.map(r => (
  <Marker
    key={r.name}
    position={r.coordinates}
    title={r.name}
    icon='https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png'
  />
));

export const AreeAttesa = () => areeAttesa.map(r => (
  <Marker
    key={r.name}
    position={r.coordinates}
    title={r.name}
  />
));

