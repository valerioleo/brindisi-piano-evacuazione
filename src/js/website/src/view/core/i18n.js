import initTranslations from 'CommonUI/view/core/i18n';

import ru from '../../../locales/ru/translation.json';
import gb from '../../../locales/gb/translation.json';
import cn from '../../../locales/cn/translation.json';
import de from '../../../locales/de/translation.json';
import fr from '../../../locales/fr/translation.json';
import gr from '../../../locales/gr/translation.json';
import ind from '../../../locales/in/translation.json';
import sa from '../../../locales/sa/translation.json';
import es from '../../../locales/es/translation.json';
import jp from '../../../locales/jp/translation.json';
import kr from '../../../locales/kr/translation.json';
import pt from '../../../locales/pt/translation.json';

export const languagesList = [
  {
    value: 'gb',
    label: 'English'
  },
  {
    value: 'ru',
    label: 'Russian'
  },
  {
    value: 'cn',
    label: 'Chinese'
  },
  {
    value: 'de',
    label: 'German'
  },
  {
    value: 'fr',
    label: 'French'
  },
  {
    value: 'gr',
    label: 'Greek'
  },
  {
    value: 'in',
    label: 'Hindi'
  },
  {
    value: 'sa',
    label: 'Arabic'
  },
  {
    value: 'es',
    label: 'Spanish'
  },
  {
    value: 'jp',
    label: 'Japanese'
  },
  {
    value: 'kr',
    label: 'Korean'
  },
  {
    value: 'pt',
    label: 'Portuguese'
  }
];

const resources = {
  gb,
  ru,
  cn,
  de,
  fr,
  gr,
  in: ind,
  sa,
  es,
  jp,
  kr,
  pt
};

export default initTranslations(resources, 'App');
