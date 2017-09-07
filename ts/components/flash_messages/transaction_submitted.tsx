import * as React from 'react';
import * as _ from 'lodash';

interface TransactionSubmittedProps {
    etherScanLinkIfExists?: string;
}

interface TransactionSubmittedState {}

export class TransactionSubmitted extends React.Component<TransactionSubmittedProps, TransactionSubmittedState> {
    public render() {
        if (_.isUndefined(this.props.etherScanLinkIfExists)) {
            return <p>Transaction submitted to the network</p>;
        } else {
            return (
                <p>
                    Transaction submitted to the network:{' '}
                    <a
                        style={{color: 'white'}}
                        href={`${this.props.etherScanLinkIfExists}`}
                        target="_blank"
                    >
                        etherscan
                    </a>
                </p>
            );
        }
    }
}
