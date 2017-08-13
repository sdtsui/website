import * as _ from 'lodash';
import {Environments} from 'ts/types';

const BASE_URL = window.location.origin;
const isDevelopment = _.includes(BASE_URL, 'https://0xproject.dev:3572') ||
                      _.includes(BASE_URL, 'https://localhost:3572') ||
                      _.includes(BASE_URL, 'https://127.0.0.1');
const QUEUE_IT_CUSTOMER_ID = 'zeroex';
const QUEUE_IT_TEST_EVENT_ID = 'test01';
const QUEUE_IT_LIVE_EVENT_ID = '0xtokensale2';
const queueItEventId = isDevelopment ? QUEUE_IT_TEST_EVENT_ID : QUEUE_IT_LIVE_EVENT_ID;

export const configs = {
    BASE_URL,
    ENVIRONMENT: isDevelopment ? Environments.DEVELOPMENT : Environments.PRODUCTION,
    BACKEND_BASE_URL: isDevelopment ? 'https://localhost:3001' : 'https://api.0xproject.com',
    IS_REGISTRATION_OPEN: false,
    IS_CONTRIBUTE_OPEN: false,
    IS_OTC_MAINNET_DEPLOYED: false,
    RECAPTCHA_SITE_KEY: '6LcXHicUAAAAAOmRl4ZpDf2MxLEiHolYp1vpdOII',
    CIVIC_APP_ID: 'H1dfQuJEb',
    QUEUE_IT_URL: `https://zeroex.queue-it.net/?c=${QUEUE_IT_CUSTOMER_ID}&e=${queueItEventId}`,
    symbolsOfMintableTokens: ['MKR', 'MLN', 'GNT', 'DGD', 'REP'],
    mostPopularTradingPairSymbols: ['WETH', 'ZRX'],
    lastLocalStorageFillClearanceDate: '2017-07-07',
};
