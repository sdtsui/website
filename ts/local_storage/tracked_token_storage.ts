import * as _ from 'lodash';
import {Token, TrackedTokensByNetworkId} from 'ts/types';
import {localStorage} from 'ts/local_storage/local_storage';

const TRACKED_TOKENS_KEY = 'trackedTokens';

export const trackedTokenStorage = {
    addTrackedToken(networkId: number, token: Token) {
        const trackedTokensByNetworkId = this.getTrackedTokensByNetworkId();
        const trackedTokens = !_.isUndefined(trackedTokensByNetworkId[networkId]) ?
                             trackedTokensByNetworkId[networkId] : [];
        trackedTokens.push(token);
        trackedTokensByNetworkId[networkId] = trackedTokens;
        const trackedTokensByNetworkIdJSONString = JSON.stringify(trackedTokensByNetworkId);
        localStorage.setItem(TRACKED_TOKENS_KEY, trackedTokensByNetworkIdJSONString);
    },
    getTrackedTokensByNetworkId(): TrackedTokensByNetworkId {
        const trackedTokensJSONString = localStorage.getItemIfExists(TRACKED_TOKENS_KEY);
        if (_.isEmpty(trackedTokensJSONString)) {
            return {};
        }
        const trackedTokensByNetworkId = JSON.parse(trackedTokensJSONString);
        return trackedTokensByNetworkId;
    },
    getTrackedTokensIfExists(networkId: number): Token[] {
        const trackedTokensJSONString = localStorage.getItemIfExists(TRACKED_TOKENS_KEY);
        if (_.isEmpty(trackedTokensJSONString)) {
            return undefined;
        }
        const trackedTokensByNetworkId = JSON.parse(trackedTokensJSONString);
        const trackedTokens = trackedTokensByNetworkId[networkId];
        return trackedTokens;
    },
};
