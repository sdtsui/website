import * as _ from 'lodash';
import {Token, TrackedTokensByNetworkId} from 'ts/types';
import {localStorage} from 'ts/local_storage/local_storage';

// This value is `customTokens` because of legacy reasons. This used to only hold
// custom tokens, and now holds all tokens the user wishes to track in his wallet
const TRACKED_TOKENS_KEY = 'customTokens';

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
    getTrackedTokens(networkId: number): Token[] {
        const trackedTokensJSONString = localStorage.getItemIfExists(TRACKED_TOKENS_KEY);
        if (_.isEmpty(trackedTokensJSONString)) {
            return [];
        }
        const trackedTokensByNetworkId = JSON.parse(trackedTokensJSONString);
        const trackedTokens = trackedTokensByNetworkId[networkId];
        if (_.isUndefined(trackedTokens)) {
            return [];
        }
        return trackedTokens;
    },
};
