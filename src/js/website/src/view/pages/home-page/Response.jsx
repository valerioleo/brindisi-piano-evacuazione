import React from 'react';
import Typography from '@material-ui/core/Typography';

const renderResponse = distance => {
  let answer;

  switch(true) {
    case distance < 100:
      answer = (
        <Typography variant='subtitle1'>
          💩 Sei distante solo <strong>{distance}</strong>
          metri dalla bomba. Segui le procedure di sicurezza.
        </Typography>
      );
      break;
    case distance < 500:
      answer = (
        <Typography variant='subtitle1'>
          ☠️♂️ Sei distante solo <strong>{distance}</strong>
          metri dalla bomba. Segui le procedure di sicurezza.
        </Typography>
      );
      break;
    case distance < 1600:
      answer = (
        <Typography variant='subtitle1'>
          🏃‍ Sei distante <strong>{distance}</strong> metri
          dalla bomba.<br/>Segui le procedure di sicurezza per l'evacuazione.
        </Typography>
      );
      break;
    default:
      answer = (
        <Typography variant='subtitle1'>
          ‍🍾 Sei distante <strong>{distance}</strong> metri dalla bomba.
          Stai scuscitato.
        </Typography>
      );
  }

  const dangerBox = () => (
    <div style={{
      maxWidth: '300px',
      border: '1px solid red',
      background: '#fce6e5',
      padding: '10px',
      borderRadius: '5px'
    }}>
      <Typography variant='h5'>❌ il tuo indirizzo risulta all'interno dell'area interessata.</Typography>
    </div>
  );

  const safeBox = () => (
    <div style={{
      maxWidth: '300px',
      border: '1px solid green',
      background: '#d1e7b9',
      padding: '10px',
      borderRadius: '5px'
    }}>
      <Typography variant='h5'>✅ il tuo indirizzo risulta al di fuori dell'area interessata.</Typography>
    </div>
  );

  return (
    <>
      {
        distance > 1600
          ? safeBox()
          : dangerBox()
      }
      {answer}
    </>
  );
};

const renderClosestShelters = shelters => (
    <>
      <Typography variant='h5'>
        Se non hai un posto sicuro dove evacuare,
        questi sono i 5 rifugi più vicini a te in linea d'aria:
      </Typography>
      {
        shelters.map((cs, i) => (
          <div key={i}>
            <Typography>
              {i + 1}. {cs.name} - distante <strong>
                {cs.distance}
              </strong> metri.
            </Typography>
          </div>
        ))
      }
    </>
);

const Response = props => {
  const {distance, closestShelters = []} = props;

  return (
    <>
      <Typography variant='h3'>
        Evacuazione Brindisi
      </Typography>
      <Typography gutterBottom variant='subtitle1'>
        15 dicembre 2019.
      </Typography>
      <Typography gutterBottom variant='h5'>
        {
          distance
            ? renderResponse(Math.floor(distance))
            : '🔍 Cerca il tuo indirizzo per verificare se rientri nel piano di evacuazione.'
        }
      </Typography>
      {
        closestShelters.length > 0
        && renderClosestShelters(closestShelters.slice(0, 5))
      }
    </>
  );
};

export default Response;
