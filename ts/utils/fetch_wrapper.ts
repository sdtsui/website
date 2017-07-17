import 'whatwg-fetch';
import {utils} from 'ts/utils/utils';
import {FetchResponse} from 'ts/types';

export const fetchWrapper = {
    fetchAsync: async (endpoint: string): Promise<FetchResponse> => {
        let result;
        try {
            result = await fetch(endpoint);
        } catch (err) {
            utils.consoleLog(`fetch() threw err: ${err}`);
            throw err;
        }
        return result;
    },
};
