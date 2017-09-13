import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import {Party} from 'ts/components/ui/party';
import {Token} from 'ts/types';

interface TrackTokenConfirmationProps {
    tokens: Token[];
    networkId: number;
    isAddingTokenToTracked: boolean;
}

export function TrackTokenConfirmation(props: TrackTokenConfirmationProps) {
    const isMultipleTokens = props.tokens.length > 1;
    return (
        <div style={{color: colors.grey700}}>
            {props.isAddingTokenToTracked ?
                <div className="py4 my4 center">
                    <span className="pr1">
                        <i className="zmdi zmdi-spinner zmdi-hc-spin" />
                    </span>
                    <span>Adding token{isMultipleTokens && 's'}...</span>
                </div> :
                <div>
                    <div>
                        You do not currently track the following token{isMultipleTokens && 's'}:
                    </div>
                    <div className="py2 clearfix mx-auto center" style={{width: 355}}>
                        {_.map(props.tokens, (token: Token) => (
                            <div
                                key={`token-profile-${token.name}`}
                                className={`col col-${isMultipleTokens ? '6' : '12'} px2`}
                            >
                                <Party
                                    label={token.name}
                                    address={token.address}
                                    networkId={props.networkId}
                                    alternativeImage={token.iconUrl}
                                    isInTokenRegistry={token.isRegistered}
                                />
                            </div>
                        ))}
                    </div>
                    <div>
                        Tracking a token adds it to the balances section of 0x Portal and
                        allows you to generate/fill orders involving the token
                        {isMultipleTokens && 's'}. Would you like to start tracking this token?
                    </div>
                </div>
            }
        </div>
    );
}
