import * as _ from 'lodash';
import * as React from 'react';
import ethUtil = require('ethereumjs-util');
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import {CopyIcon} from 'ts/components/ui/copy_icon';

const CUSTOM_GRAY = '#635F5E';
const CUSTOM_LIGHT_BLUE = '#e9f1f8';
const CUSTOM_DARK_BLUE = '#03044c';
const ETH_SIGN_DOCS_LINK = 'https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign';

export interface MsgSigningExplanationDialogProps {
    getPersonalMessageHashHex: (message: string) => string;
    isOpen: boolean;
    handleClose: () => void;
    message: string;
    isUsingLedger: boolean;
    isInjectedWeb3ParitySigner: boolean;
}

interface MsgSigningExplanationDialogState {}

export class MsgSigningExplanationDialog
    extends React.Component<MsgSigningExplanationDialogProps, MsgSigningExplanationDialogState> {
    public render() {
        const actions = [
            <FlatButton
                label="OK"
                primary={true}
                onTouchTap={this.props.handleClose.bind(this)}
            />,
        ];

        return (
            <Dialog
                title="Verify the message you are signing"
                actions={actions}
                modal={false}
                open={this.props.isOpen}
                onRequestClose={this.props.handleClose.bind(this)}
            >
              {this.renderExplanation()}
            </Dialog>
        );
    }
    private renderExplanation() {
        const personalMessageHashHex = this.props.getPersonalMessageHashHex(this.props.message);
        const codeStyle = {
            fontSize: 16,
            backgroundColor: CUSTOM_LIGHT_BLUE,
            color: CUSTOM_DARK_BLUE,
        };
        const messageBuff = ethUtil.toBuffer(this.props.message);
        const messageSha256Buff = ethUtil.sha256(messageBuff);
        const messageSha256Hex = ethUtil.bufferToHex(messageSha256Buff);
        const messageSha3Buff = ethUtil.sha3(messageBuff);
        const messageSha3Hex = ethUtil.bufferToHex(messageSha3Buff);
        return (
            <div style={{color: CUSTOM_GRAY}}>
                <div className="h4 pb1">
                    Your unique message:
                </div>
                <div>
                    {this.renderHex(this.props.message)}
                </div>
                <div className="pt4 relative">
                    {this.renderChevron()}
                    {this.props.isUsingLedger ?
                        <div>
                            <div className="h4">
                                Hash using SHA256:
                            </div>
                            <div
                                className="px1 py2 mt1"
                                style={codeStyle}
                            >
                                sha256(message)
                            </div>
                        </div> :
                        this.props.isInjectedWeb3ParitySigner ?
                        <div>
                            <div className="h4">
                                Hash using SHA3:
                            </div>
                            <div
                                className="px1 py2 mt1"
                                style={codeStyle}
                            >
                                sha3(message)
                            </div>
                        </div> :
                        <div>
                            <div className="h4">
                                Sign method:
                            </div>
                            <div
                                className="px1 py2 mt1"
                                style={codeStyle}
                            >
                                keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))
                            </div>
                            <div style={{paddingTop: 3}}>
                                <a
                                    className="underline"
                                    href={ETH_SIGN_DOCS_LINK}
                                    target="_blank"
                                >
                                    source
                                </a>
                            </div>
                        </div>
                    }
                </div>
                <div className="pt4 relative">
                    {this.renderChevron()}
                    <div className="pb1 h4">
                        {this.props.isUsingLedger ?
                            'The resulting hash you can confirm on-device:' :
                            'The resulting hash you are about to sign:'
                        }
                    </div>
                    {this.renderHex(this.props.isUsingLedger ?
                        messageSha256Hex :
                        this.props.isInjectedWeb3ParitySigner ? messageSha3Hex : personalMessageHashHex)
                    }
                </div>
            </div>
        );
    }
    private renderChevron() {
        return (
            <div
                className="absolute"
                style={{top: 5, left: '50%'}}
            >
                <i
                    className="zmdi zmdi-chevron-down"
                    style={{fontSize: 60, color: 'lightgray'}}
                />
            </div>
        );
    }
    private renderHex(hex: string) {
        const hexStyle: React.CSSProperties = {
            borderBottom: '2px solid lightgray',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        };
        return (
            <div className="mt1 flex" style={{fontSize: 19}}>
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
}
