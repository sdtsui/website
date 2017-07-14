import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';
import {utils} from 'ts/utils/utils';
import {Element as ScrollElement} from 'react-scroll';
import {Styles, Partner} from 'ts/types';

const partnershipsRow1: Partner[] = [
    {
        name: 'Augur',
        logo: '/images/logos/augur.png',
        url: 'https://augur.net/',
    },
    {
        name: 'Maker',
        logo: '/images/logos/maker.png',
        url: 'http://makerdao.com/',
    },
    {
        name: 'Aragon',
        logo: '/images/logos/aragon.png',
        url: 'https://aragon.one/',
    },
    {
        name: 'Chronobank.io',
        logo: '/images/logos/chronobank.png',
        url: 'https://chronobank.io/',
    },
];

const partnershipsRow2: Partner[] = [
    {
        name: 'Melonport',
        logo: '/images/logos/melonport.png',
        url: 'https://melonport.com/',
    },
    {
        name: 'District0x',
        logo: '/images/logos/district0x.png',
        url: 'https://district0x.io/',
    },
    {
        name: 'Dharma',
        logo: '/images/logos/dharma.png',
        url: 'https://dharma.io/',
    },
    {
        name: 'OpenANX',
        logo: '/images/logos/openANX.png',
        url: 'https://anxintl.com/',
    },
];

interface PartnershipsProps {
    shouldCenterAlignTitle?: boolean;
}

const styles: Styles = {
    subheader: {
        textTransform: 'uppercase',
        fontSize: 32,
        margin: 0,
    },
};

export function Partnerships(props: PartnershipsProps) {
    const subheaderStyle = {
        ...styles.subheader,
        textAlign: props.shouldCenterAlignTitle ? 'center' : 'left',
    };
    return (
        <div style={{backgroundColor: 'white'}}>
            <div className="mx-auto max-width-4 pb4">
                <h1
                    id="partners"
                    className="pt4 sm-center md-pl3 lg-pl0 thin sm-px4"
                    style={subheaderStyle}
                >
                    Projects Building on 0x
                </h1>
                <div className="clearfix pt4 mx-auto md-pl3 lg-pl0">
                    {renderPartners(partnershipsRow1)}
                </div>
                <div className="clearfix lg-pt3 md-pt3 mx-auto md-pl3 lg-pl0">
                    {renderPartners(partnershipsRow2)}
                </div>
            </div>
        </div>
    );
}

function renderPartners(partners: Partner[]) {
    const colSize = utils.getColSize(partners.length);
    return _.map(partners, (partner: Partner, i: number) => {
        return (
            <div
                key={!_.isUndefined(partner) ? partner.name : `anonymous-partner-${i}`}
                className={`col lg-col-${colSize} md-col-${colSize} col-6 center sm-pb3`}
            >
                {_.isUndefined(partner) ?
                    null :
                    <a href={partner.url} target="_blank">
                        <img src={partner.logo} style={{maxWidth: 170, maxHeight: 102}} />
                    </a>
                }
            </div>
        );
    });
}
