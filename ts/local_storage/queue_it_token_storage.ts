import {localStorage} from 'ts/local_storage/local_storage';

const CUSTOM_QUEUE_IT_TOKEN_KEY = 'queueItToken';

export const queueItTokenStorage = {
    addToken(queueItToken: string) {
        localStorage.setItem(CUSTOM_QUEUE_IT_TOKEN_KEY, queueItToken);
    },
    getToken() {
        return localStorage.getItemIfExists(CUSTOM_QUEUE_IT_TOKEN_KEY);
    },
};
