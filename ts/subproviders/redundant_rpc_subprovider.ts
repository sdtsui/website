import * as _ from 'lodash';
import Subprovider = require('web3-provider-engine/subproviders/subprovider');

export class RedundantRPCSubprovider extends Subprovider {
    private RPCs: any[];
    constructor(endpoints: string[], RpcSubprovider: any) {
        super();
        this.RPCs = _.map(endpoints, endpoint => {
            return new RpcSubprovider({
                rpcUrl: endpoint,
            });
        });
        this.handleRequest = this.handleRequest.bind(this);
    }
    public handleRequest(payload: any, next: any, end: any): void {
        this.firstSuccess(this.RPCs.slice(), payload, next, end);
    }
    private firstSuccess(RPCs: any[], payload: any, next: any, end: (err?: Error, data?: any) => void): void {
        const RPC = RPCs.shift();
        RPC.handleRequest(payload, next, (err?: Error, data?: any) => {
            if (err) {
                if (RPCs.length !== 0) {
                    // Try next RPC
                    this.firstSuccess(RPCs, payload, next, end);
                } else {
                    // All RPCs failed
                    end(err);
                }
            } else {
                // Success
                end(undefined, data);
            }
        });
    }
}
