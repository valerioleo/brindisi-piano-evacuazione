import React, {useState} from 'react';
import {Autocomplete} from '@react-google-maps/api';

const MyMapWithAutocomplete = props => {
  const {onPlaceChanged: onPlaceChangedProp} = props;

  const [autocomplete, setAutocomplete] = useState(null);

  const onLoad = ac => {
    setAutocomplete(ac);
  };

  const onPlaceChanged = () => {
    if(autocomplete !== null) {
      onPlaceChangedProp(autocomplete.getPlace().geometry.location);
    }
  };

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        strictBounds: true
      }}
      restrictions={{country: 'it'}}
      types={['address']}
    >
      <input
        type="text"
        placeholder="📍Inserisci indirizzo da cercare"
        style={{
          boxSizing: 'border-box',
          border: '1px solid transparent',
          width: '240px',
          height: '32px',
          padding: '0 12px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
          fontSize: '14px',
          outline: 'none',
          textOverflow: 'ellipses',
          marginTop: '20px',
          marginBottom: '20px'
        }}
      />
    </Autocomplete>
  );
};

export default MyMapWithAutocomplete;
