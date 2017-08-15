import * as _ from 'lodash';
import * as React from 'react';
import Paper from 'material-ui/Paper';
import Dialog from 'material-ui/Dialog';
import {utils} from 'ts/utils/utils';
import {EtherscanLinkSuffixes} from 'ts/types';
import 'react-html5video/dist/styles.css';

interface PurchaseLoadingDialogProps {
    isOpen: boolean;
    networkId: number;
    transactionHash: string;
}

interface PurchaseLoadingDialogState {}

export class PurchaseLoadingDialog extends React.Component<PurchaseLoadingDialogProps, PurchaseLoadingDialogState> {
    public render() {
        const etherscanLink = utils.getEtherScanLinkIfExists(this.props.transactionHash, this.props.networkId,
                                                             EtherscanLinkSuffixes.tx);
        return (
            <Dialog
                modal={true}
                open={this.props.isOpen}
            >
                <div className="sm-px2 sm-pt2 sm-m1" style={{height: 500}}>
                    <img className="p1" src="/gifs/genesis.gif" style={{maxWidth: 702}} />
                    <div className="center pt2" style={{paddingBottom: 11, color: 'gray'}}>
                        <div>
                            Your transaction has been submitted to the network.
                        </div>
                        <div>
                            Please wait for the transaction to be successfully mined.
                        </div>
                        <div className="pt1" style={{fontSize: 13}}>
                            <a
                                href={etherscanLink}
                                target="_blank"
                                className="underline"
                                style={{color: 'lightgray'}}
                            >
                                View pending transaction on Etherscan
                            </a>
                        </div>
                    </div>
                </div>
            </Dialog>
        );
    }
}
