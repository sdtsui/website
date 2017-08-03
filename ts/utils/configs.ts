import * as _ from 'lodash';
import {Environments} from 'ts/types';

const BASE_URL = window.location.origin;
const QUEUE_IT_CUSTOMER_ID = 'zeroex';
const QUEUE_IT_EVENT_ID = 'test01';

const isDevelopment = _.includes(BASE_URL, 'https://0xproject.dev:3572') ||
                      _.includes(BASE_URL, 'https://localhost:3572') ||
                      _.includes(BASE_URL, 'https://127.0.0.1');

export const configs = {
    BASE_URL,
    ENVIRONMENT: isDevelopment ? Environments.DEVELOPMENT : Environments.PRODUCTION,
    BACKEND_BASE_URL: isDevelopment ? 'https://localhost:3001' : 'https://api.0xproject.com',
    IS_REGISTRATION_OPEN: true,
    RECAPTCHA_SITE_KEY: '6LcXHicUAAAAAOmRl4ZpDf2MxLEiHolYp1vpdOII',
    CIVIC_APP_ID: 'H1dfQuJEb',
    QUEUE_IT_URL: `https://zeroex.queue-it.net/?c=${QUEUE_IT_CUSTOMER_ID}&e=${QUEUE_IT_EVENT_ID}`,
    symbolsOfMintableTokens: ['MKR', 'MLN', 'GNT', 'DGD', 'REP', 'ZRX'],
    mostPopularTradingPairSymbols: ['WETH', 'ZRX'],
    lastLocalStorageFillClearanceDate: '2017-07-07',
};
