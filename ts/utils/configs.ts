import * as _ from 'lodash';
import {Environments} from 'ts/types';

const BASE_URL = window.location.origin;

const isDevelopment = _.includes(BASE_URL, 'http://0xproject.dev:3572') ||
                      _.includes(BASE_URL, 'http://localhost:3572') ||
                      _.includes(BASE_URL, 'http://127.0.0.1');

export const configs = {
    BASE_URL,
    ENVIRONMENT: isDevelopment ? Environments.DEVELOPMENT : Environments.PRODUCTION,
    BACKEND_BASE_URL: isDevelopment ? 'https://localhost:3001' : 'https://api.0xproject.com',
    RECAPTCHA_SITE_KEY: '6LcXHicUAAAAAOmRl4ZpDf2MxLEiHolYp1vpdOII',
    CIVIC_APP_ID: 'H1dfQuJEb',
    symbolsOfMintableTokens: ['MKR', 'MLN', 'GNT', 'DGD', 'REP', 'ZRX'],
    mostPopularTradingPairSymbols: ['WETH', 'GNT'],
    lastLocalStorageFillClearanceDate: '2017-07-07',
};
