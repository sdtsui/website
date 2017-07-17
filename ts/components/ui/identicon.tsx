import * as _ from 'lodash';
import * as React from 'react';
import {constants} from 'ts/utils/constants';
import blockies = require('blockies');

interface IdenticonProps {
    address: string;
    diameter: number;
}

interface IdenticonState {}

export class Identicon extends React.Component<IdenticonProps, IdenticonState> {
    public render() {
        let address = this.props.address;
        if (_.isEmpty(address)) {
            address = constants.NULL_ADDRESS;
        }
        const diameter = this.props.diameter;
        const icon = blockies({
            seed: address.toLowerCase(),
        });
        return (
            <div
                className="circle mx-auto relative transitionFix"
                style={{width: diameter, height: diameter, overflow: 'hidden'}}
            >
                <img src={icon.toDataURL()} style={{width: diameter, height: diameter, imageRendering: 'pixelated'}}/>
            </div>
        );
    }
}
