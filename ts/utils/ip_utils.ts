import * as _ from 'lodash';
import {constants} from 'ts/utils/constants';

const NEW_YORK_CITY_NAME = 'New York';

export const ipUtils = {
    async isNewYorkIPAsync() {
        const cityIfAvailable = await this.fetchIPAPICityIfAvailableAsync();
        if (_.isUndefined(cityIfAvailable)) {
            return false; // We default to them not being from NY if the IP lookup fails
        }
        return cityIfAvailable === NEW_YORK_CITY_NAME;
    },
    async fetchIPAPICityIfAvailableAsync(): Promise<string> {
        const endpoint = `${constants.IP_API_ENDPOINT}/?key=${constants.IP_API_KEY}`;
        const response = await fetch(endpoint);
        if (response.status !== 200) {
            return undefined;
        }
        const responseBody = await response.json();
        return responseBody.city;
    },
};
