import * as _ from 'lodash';
import {constants} from 'ts/utils/constants';

const NEW_YORK_CITY_NAME = 'New York';
const DISALLOWED_COUNTRIES = [
    'Cuba',
    'Syria',
    'Iran',
    'Sudan',
    'North Korea',
    'Crimea',
];

export const ipUtils = {
    async isDisallowedIPAsync() {
        let locationIfAvailable;
        try {
            locationIfAvailable = await this.fetchIPAPILocationIfAvailableAsync();
        } catch (err) {
            return false; // We default to them not being from NY if the IP lookup fails
        }
        if (_.isUndefined(locationIfAvailable)) {
            return false;
        }
        const isNYResident = locationIfAvailable.city === NEW_YORK_CITY_NAME;
        const isDisallowedCountry = _.includes(DISALLOWED_COUNTRIES, locationIfAvailable.country);
        const isDisallowedIp = isNYResident || isDisallowedCountry;
        return isDisallowedIp;
    },
    async fetchIPAPILocationIfAvailableAsync(): Promise<{[granularity: string]: string}> {
        const endpoint = `${constants.IP_API_ENDPOINT}/?key=${constants.IP_API_KEY}`;
        const response = await fetch(endpoint);
        if (response.status !== 200) {
            return undefined;
        }
        const responseBody = await response.json();
        return responseBody;
    },
};
