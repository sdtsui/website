import * as _ from 'lodash';
import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import {Blockchain} from 'ts/blockchain';

const ETH_SIGN_DOCS_LINK = 'https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign';

export interface MsgSigningExplanationProps {
    blockchain: Blockchain;
    civicUserId: string;
    civicUserIdHashHex: string;
}

interface MsgSigningExplanationState {
    isOpened: boolean;
}

export class MsgSigningExplanation extends React.Component<MsgSigningExplanationProps, MsgSigningExplanationState> {
    constructor(props: MsgSigningExplanationProps) {
        super(props);
        this.state = {
            isOpened: false,
        };
    }
    public render() {
        const actions = [
            <FlatButton
                label="OK"
                primary={true}
                onTouchTap={this.handleClose.bind(this)}
            />,
        ];

        return (
          <div className="inline-block">
            <div className="underline inline-block" onClick={this.handleOpen.bind(this)}>
                {this.props.children}
            </div>
            <Dialog
              title="Message signing explanation"
              actions={actions}
              modal={false}
              open={this.state.isOpened}
              onRequestClose={this.handleClose.bind(this)}
            >
              {this.renderExplanation()}
            </Dialog>
          </div>
        );
    }
    private renderExplanation() {
        const personalMessageHashHex = this.props.blockchain.getPersonalMessageHashHex(this.props.civicUserIdHashHex);
        const signMessageDetailsStyles = {
            backgroundColor: 'whitesmoke',
            fontSize: 14,
            height: 20,
            paddingTop: 5,
        };
        return (
            <div className="pt2" style={{color: 'black'}}>
                <div className="my1 pt1 left-align" style={{fontSize: 20}}>
                    This is the message you're signing:
                </div>
                <div className="center inline-block px1" style={signMessageDetailsStyles}>
                    {this.props.civicUserId}
                </div>
                <div className="my1 pt1 left-align" style={{fontSize: 20}}>
                This is the hash of the message:
                </div>
                <div className="center inline-block px1" style={signMessageDetailsStyles}>
                    {this.props.civicUserIdHashHex}
                </div>
                <div className="my1 pt1 left-align" style={{fontSize: 20}}>
                <a className="underline" href={ETH_SIGN_DOCS_LINK} target="_blanc">Ethereum specific</a> message hash:
                </div>
                <div className="center inline-block px1" style={signMessageDetailsStyles}>
                    {personalMessageHashHex}
                </div>
            </div>
        );
    }
    private handleOpen(): void {
        this.setState({
            isOpened: true,
        });
    }
    private handleClose(): void {
        this.setState({
            isOpened: false,
        });
    }
}
