import React from 'react';
import Typography from '@material-ui/core/Typography';

const Footer = () => (
    <>
      <Typography gutterBottom variant='body2'>
        Google Maps è un servizio a pagamento. Se i costi dovessero diventare proibitivi, il sito entrerà in blocco automatico.
        Per fare in modo che tutti usufruiscano del servizio, effettua solo le ricerche strettamente necessarie 🙏🏻
      </Typography>
      <Typography variant='caption'>
        Per ogni correzione, invito cittadini e autorità a contattarmi a <a href='mailto:brindisi@valerioleo.me'>brindisi@valerioleo.me</a>.
        <br/><br/>
        Questo sito web è offerto a puro scopo
        indicativo e non si sostituisce in alcun modo alle comunicazioni ufficiali
        che rimangono la sola e unica fonte da tenere
        in considerazione per prendere decisioni corrette. <a href='https://github.com/valerioleo/brindisi-piano-evacuazione'>Il sito è distributio in open-source</a>.
      </Typography>
    </>
);

export default Footer;
