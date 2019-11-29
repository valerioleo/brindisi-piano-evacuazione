import ccStyles from 'CommonUI/view/core/ccStyles'
import {createMuiTheme} from '@material-ui/core/styles';

const DEFAULT_MUI_THEME = createMuiTheme({typography: {useNextVariants: true}});

export default {
  ...ccStyles,
  typography: {
    ...ccStyles.typography
  }
};
