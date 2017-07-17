import 'whatwg-fetch';
import {utils} from 'ts/utils/utils';

export const fetchWrapper = {
    fetchAsync: async (endpoint: string): Promise<any> => {
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
