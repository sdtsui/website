// Polyfills
import 'whatwg-fetch';

import * as React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, Store as ReduxStore} from 'redux';
import * as BigNumber from 'bignumber.js';
import {configs} from 'ts/utils/configs';
import {constants} from 'ts/utils/constants';
import {Home} from 'ts/pages/home/home';
import {FAQ} from 'ts/pages/faq/faq';
import {RegistrationFlow} from 'ts/containers/registration_flow';
import {Contribute} from 'ts/containers/contribute';
import {TokenLaunch} from 'ts/pages/token_launch/token_launch';
import {RegistrationCheck} from 'ts/pages/token_distribution/registration_check';
import {NotFound} from 'ts/pages/not_found';
import {LazyComponent, createLazyComponent} from 'ts/lazy_component';
import {State, reducer} from 'ts/redux/reducer';
import {colors, getMuiTheme, MuiThemeProvider} from 'material-ui/styles';
import {Switch, BrowserRouter as Router, Route, Link} from 'react-router-dom';
import {tradeHistoryStorage} from 'ts/local_storage/trade_history_storage';
import * as injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

// By default BigNumber's `toString` method converts to exponential notation if the value has
// more then 20 digits. We want to avoid this behavior, so we set EXPONENTIAL_AT to a high number
BigNumber.config({
    EXPONENTIAL_AT: 1000,
});

// Check if we've introduced an update that requires us to clear the tradeHistory local storage entries
tradeHistoryStorage.clearIfRequired();

const CUSTOM_GREY = 'rgb(39, 39, 39)';
const CUSTOM_GREEN = 'rgb(102, 222, 117)';
const CUSTOM_DARKER_GREEN = 'rgb(77, 197, 92)';

import 'basscss/css/basscss.css';
import 'less/all.less';

const muiTheme = getMuiTheme({
    appBar: {
        height: 45,
        color: 'white',
        textColor: 'black',
    },
    palette: {
        pickerHeaderColor: constants.CUSTOM_BLUE,
        primary1Color: constants.CUSTOM_BLUE,
        primary2Color: constants.CUSTOM_BLUE,
        textColor: colors.grey700,
    },
    datePicker: {
        color: colors.grey700,
        textColor: 'white',
        calendarTextColor: 'white',
        selectColor: CUSTOM_GREY,
        selectTextColor: 'white',
    },
    timePicker: {
        color: colors.grey700,
        textColor: 'white',
        accentColor: 'white',
        headerColor: CUSTOM_GREY,
        selectColor: CUSTOM_GREY,
        selectTextColor: CUSTOM_GREY,
    },
    toggle: {
        thumbOnColor: CUSTOM_GREEN,
        trackOnColor: CUSTOM_DARKER_GREEN,
    },
});

// We pass modulePromise returning lambda instead of module promise,
// cause we only want to import the module when the user navigates to the page.
// At the same time webpack statically parses for System.import() to determine bundle chunk split points
// so each lazy import needs it's own `System.import()` declaration.
const LazyOTC = createLazyComponent('OTC', () => System.import<any>(/* webpackChunkName: "otc" */'ts/containers/otc'));
const LazyZeroExJSDocumentation = createLazyComponent(
    'ZeroExJSDocumentation',
    () => System.import<any>(/* webpackChunkName: "docs" */'ts/containers/zero_ex_js_documentation'),
);

const store: ReduxStore<State> = createStore(reducer);
render(
    <Router>
        <div>
            <MuiThemeProvider muiTheme={muiTheme}>
                <Provider store={store}>
                    <div>
                        <Switch>
                            <Route exact={true} path="/" component={Home as any} />
                            <Route path="/otc" component={LazyOTC} />
                            <Route path="/token" component={TokenLaunch as any} />
                            <Route path="/faq" component={FAQ as any} />
                            <Route path="/registration" component={RegistrationFlow as any} />
                            <Route path="/contribute" component={Contribute as any} />
                            <Route path="/registration_check" component={RegistrationCheck as any} />
                            <Route path="/docs/0xjs/:version?" component={LazyZeroExJSDocumentation} />
                            <Route component={NotFound as any} />
                        </Switch>
                    </div>
                </Provider>
            </MuiThemeProvider>
        </div>
  </Router>,
    document.getElementById('app'),
);
