import * as _ from 'lodash';
import * as React from 'react';

const CUSTOM_GRAY = '#4A4A4A';

interface DistributionProps {}

const distributionEntities = [
    {
        percentage: '50%',
        recipient: 'Token sale',
        color: '#00ba1e',
    },
    {
        percentage: '15%',
        recipient: 'Retained by 0x',
        color: '#2377df',
    },
    {
        percentage: '15%',
        recipient: 'External development fund',
        color: '#00aef3',
    },
    {
        percentage: '10%',
        recipient: 'Founding team',
        color: '#00c7e5',
    },
    {
        percentage: '10%',
        recipient: 'Early backers & advisors',
        color: '#00953f',
    },
];

export function Distribution(props: DistributionProps) {
    return (
        <div className="pb4" style={{backgroundColor: '#eaeaea'}}>
            <div className="mx-auto max-width-4 center pt2">
                <h1 className="thin pt2">
                    TOKEN ALLOCATIONS
                </h1>
                <div className="clearfix pt2">
                    <div className="col lg-col-6 md-col-6 sm-col-12 col-12">
                        <div
                            className="pb2"
                            style={{textAlign: 'center', fontSize: 20, color: CUSTOM_GRAY}}
                        >
                            ZRX Allocations
                        </div>
                        <div className="center" style={{width: '100%'}}>
                            <img
                                style={{width: 300}}
                                src="/images/zrx_pie_chart.png"
                            />
                        </div>
                    </div>
                    <div
                        className="col lg-col-6 md-col-6 sm-col-12 col-12 sm-px3 sm-pt3 lg-h3 md-h3 sm-h4"
                        style={{textAlign: 'left', fontSize: 16}}
                    >
                        <div className="pb2">
                            <span style={{color: CUSTOM_GRAY}}>
                                Contribution cap:{' '}
                            </span>
                            <span className="bold">
                                $24 million
                            </span>
                        </div>
                        <div>
                            <span style={{color: CUSTOM_GRAY}}>
                                Total supply:{' '}
                            </span>
                            <span className="bold">
                                1 billion ZRX
                            </span>
                            {renderBreakdownList()}
                            <div style={{color: CUSTOM_GRAY}}>
                                <div className="pb1">Token type: <span className="bold">Ethereum ERC20</span></div>
                                <div>Accepted purchase method: <span className="bold">ETH</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function renderBreakdownList() {
    const listItems = _.map(distributionEntities, distributionEntity => {
        return (
            <div key={distributionEntity.recipient} className="flex pb1 relative">
                <div
                    className="circle absolute"
                    style={{backgroundColor: distributionEntity.color, width: 16, height: 16, top: 5}}
                />
                <div className="pl3">
                    <span className="bold">{distributionEntity.percentage}</span>{' '}
                    <span className="pl1" style={{color: CUSTOM_GRAY}}>
                        {distributionEntity.recipient}
                    </span>
                </div>
            </div>
        );
    });
    return (
        <div className="py2">
            {listItems}
        </div>
    );
}
