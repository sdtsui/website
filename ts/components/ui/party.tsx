import * as _ from 'lodash';
import * as React from 'react';
import {CopyIcon} from 'ts/components/ui/copy_icon';
import ReactTooltip = require('react-tooltip');
import {colors} from 'material-ui/styles';
import {Identicon} from 'ts/components/ui/identicon';
import {Styles, EtherscanLinkSuffixes} from 'ts/types';
import {utils} from 'ts/utils/utils';
import {EthereumAddress} from 'ts/components/ui/ethereum_address';

const MIN_ADDRESS_WIDTH = 60;
const ALTERNATIVE_IMAGE_DIMENSION = 80;
const IDENTICON_DIAMETER = 100;
const DEFAULT_ALTERNATIVE_IMAGE = '/images/team/anyone.png';
const CHECK_MARK_GREEN = 'rgb(0, 195, 62)';

interface PartyProps {
    label: string;
    address: string;
    networkId: number;
    alternativeImage?: string;
    identiconDiameter?: number;
    identiconStyle?: React.CSSProperties;
    isInTokenRegistry?: boolean;
}

interface PartyState {}

export class Party extends React.Component<PartyProps, PartyState> {
    public static defaultProps: Partial<PartyProps> = {
        identiconStyle: {},
        identiconDiameter: IDENTICON_DIAMETER,
        alternativeImage: DEFAULT_ALTERNATIVE_IMAGE,
    };
    public render() {
        const label = this.props.label;
        const address = this.props.address;
        const tooltipId = `${label}-${address}-tooltip`;
        const identiconDiameter = this.props.identiconDiameter;
        const addressWidth = identiconDiameter > MIN_ADDRESS_WIDTH ?
                             identiconDiameter : MIN_ADDRESS_WIDTH;
        const emptyIdenticonStyles = {
            width: identiconDiameter,
            height: identiconDiameter,
            backgroundColor: 'lightgray',
            marginTop: 13,
            marginBottom: 10,
        };
        const tokenCircleStyle = {
            width: 120,
            height: 120,
            border: '1px solid #bdbdbd',
            backgroundColor: 'white',
        };
        const tokenImageStyle = {
            width: ALTERNATIVE_IMAGE_DIMENSION,
            height: ALTERNATIVE_IMAGE_DIMENSION,
        };
        const etherscanLinkIfExists = utils.getEtherScanLinkIfExists(
            this.props.address, this.props.networkId, EtherscanLinkSuffixes.address,
        );
        const isRegistered = this.props.isInTokenRegistry;
        const registeredTooltipId = `${this.props.address}-${isRegistered}-registeredTooltip`;
        return (
            <div style={{overflow: 'hidden'}}>
                <div className="pb1 center">{label}</div>
                {_.isEmpty(address) ?
                    <div
                        className="circle mx-auto"
                        style={emptyIdenticonStyles}
                    /> :
                        <a
                            href={etherscanLinkIfExists}
                            target="_blank"
                        >
                            {this.props.alternativeImage !== DEFAULT_ALTERNATIVE_IMAGE ?
                                <div
                                    className="mx-auto circle relative"
                                    style={tokenCircleStyle}
                                >
                                    <div className="absolute" style={{top: 20, left: 20}}>
                                        <img
                                            style={tokenImageStyle}
                                            src={this.props.alternativeImage}
                                        />
                                    </div>
                                </div> :
                                <Identicon
                                    address={this.props.address}
                                    diameter={identiconDiameter}
                                    style={this.props.identiconStyle}
                                />
                            }
                        </a>
                    }
                <div
                    className="mx-auto center pt1"
                >
                    <div style={{height: 25}}>
                        <EthereumAddress address={address} networkId={this.props.networkId} />
                    </div>
                    {!_.isUndefined(this.props.isInTokenRegistry) &&
                        <div
                            data-tip={true}
                            data-for={registeredTooltipId}
                            style={{fontSize: 13}}
                        >
                            <span style={{color: isRegistered ? CHECK_MARK_GREEN : colors.red500}}>
                                <i
                                    className={`zmdi ${isRegistered ? 'zmdi-check-circle' : 'zmdi-alert-triangle'}`}
                                />
                            </span>{' '}
                            <span>{isRegistered ? 'Registered' : 'Unregistered'} token</span>
                            <ReactTooltip id={registeredTooltipId}>
                                {isRegistered ?
                                    <div>
                                        This token address was found in the token registry<br />
                                        smart contract and is therefore believed to be a<br />
                                        legitimate token.
                                    </div> :
                                    <div>
                                        This token is not included in the token registry<br />
                                        smart contract. We cannot guarentee the legitimacy<br />
                                        of this token. Make sure to verify it's address on Etherscan.
                                    </div>
                                }
                            </ReactTooltip>
                        </div>
                    }
                </div>
            </div>
        );
    }
}
