import * as React from 'react';
import * as _ from 'lodash';
import {ZeroEx} from '0x.js';
import {Token} from 'ts/types';

interface TokenTransferCompletedProps {
    etherScanLinkIfExists?: string;
    token: Token;
    toAddress: string;
    amountInBaseUnits: BigNumber.BigNumber;
}

interface TokenTransferCompletedState {}

export class TokenTransferCompleted extends React.Component<TokenTransferCompletedProps, TokenTransferCompletedState> {
    public render() {
        const etherScanLink = _.isUndefined(this.props.etherScanLinkIfExists) ?
            null :
            (
                <a
                    style={{color: 'white'}}
                    href={`${this.props.etherScanLinkIfExists}`}
                    target="_blank"
                >
                    Verify on Etherscan
                </a>
            );
        const amountInUnits = ZeroEx.toUnitAmount(this.props.amountInBaseUnits, this.props.token.decimals);
        return (
            <div>
                {`Sent ${amountInUnits} ${this.props.token.symbol} to ${this.props.toAddress}: `}
                {etherScanLink}
            </div>
        );
    }
}
