import {utils} from 'ts/utils/utils';
import {Direction, Side, AssetToken} from 'ts/types';

export interface Action {
    type: actionTypes;
    data?: any;
}

export const actionTypes = utils.strEnum([
  'UPDATE_GENERATE_ORDER_STEP',
  'UPDATE_CHOSEN_ASSET_TOKEN',
  'SWAP_ASSET_TOKENS',
]);
export type actionTypes = keyof typeof actionTypes;

export function updateGenerateOrderStep(direction: Direction): Action {
    return {
        data: direction,
        type: actionTypes.UPDATE_GENERATE_ORDER_STEP,
    };
};

export function updateChosenAssetToken(side: Side, token: AssetToken): Action {
    return {
        data: {
            side,
            token,
        },
        type: actionTypes.UPDATE_CHOSEN_ASSET_TOKEN,
    };
};

export function swapAssetTokenSymbols(): Action {
    return {
        type: actionTypes.SWAP_ASSET_TOKENS,
    };
};
