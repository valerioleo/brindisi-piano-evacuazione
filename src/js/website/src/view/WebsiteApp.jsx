import configureStore from 'Website/data/core/store';
import reducer from 'Website/data/core/reducer';
import WebsiteRouter from 'Website/view/core/WebsiteRouter';
import bootstrap from 'Website/view/AppRoot';

const store = configureStore(reducer);

bootstrap(store, WebsiteRouter, 'root');
