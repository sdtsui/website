import * as React from 'react';
import {colors} from 'material-ui/styles';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import {constants} from 'ts/utils/constants';
import {utils} from 'ts/utils/utils';
import {Token, EtherscanLinkSuffixes} from 'ts/types';
import {CopyIcon} from 'ts/components/ui/copy_icon';

interface AllowanceConfirmationDialogProps {
    isOpen: boolean;
    onToggleDialog: (isConfirmed: boolean) => void;
    token: Token;
    networkId: number;
}

export function AllowanceConfirmationDialog(props: AllowanceConfirmationDialogProps) {
    const isConfirmed = true;
    const etherscanLink = utils.getEtherScanLinkIfExists(
        props.token.address, props.networkId, EtherscanLinkSuffixes.address,
    );
    const title = (
        <div>
            <i className="zmdi zmdi-alert-triangle" />
            {' '}Setting allowance for unverified token{' '}
            <i className="zmdi zmdi-alert-triangle" />
        </div>
    );
    return (
        <Dialog
            title={title}
            titleStyle={{fontWeight: 100}}
            actions={[
                <FlatButton
                    label="Yes"
                    onTouchTap={props.onToggleDialog.bind(this, isConfirmed)}
                />,
                <FlatButton
                    label="No"
                    onTouchTap={props.onToggleDialog.bind(this, !isConfirmed)}
                />,
            ]}
            open={props.isOpen}
            onRequestClose={props.onToggleDialog.bind(this, !isConfirmed)}
            autoScrollBodyContent={true}
        >
            <div className="pt2" style={{color: colors.grey700}}>
                <div>
                    You are about to set an allowance to a custom token not verified
                    by the 0x Token Registry.{' '}
                    <b>
                        Please be sure to verify that the token address points to the
                        official token you think you are trading
                    </b>:
                </div>
                <div className="py1">
                    <div className="py2">
                        {renderHex(props.token.address)}
                    </div>
                    <div className="center pb2">
                        <a href={etherscanLink} target="_blank">
                            <RaisedButton
                                label="Verify on Etherscan"
                            />
                        </a>
                    </div>
                </div>
                <div className="py1" style={{color: '#b51f1f'}}>
                    Warning: setting an allowance to a malicious tokens can result in the loss of funds
                </div>
                <div>
                    Are you sure you want to set an allowance for this token?
                </div>
            </div>
        </Dialog>
    );
}

function renderHex(hex: string) {
     const hexStyle: React.CSSProperties = {
         borderBottom: '2px solid lightgray',
         overflow: 'hidden',
         textOverflow: 'ellipsis',
         whiteSpace: 'nowrap',
     };
     return (
         <div className="mx-auto mt1 flex" style={{fontSize: 19, width: 462}}>
             <div className="pr1">
                 <CopyIcon data={hex}/>
             </div>
             <div
                 style={hexStyle}
             >
                 {hex}
             </div>
         </div>
     );
 }
