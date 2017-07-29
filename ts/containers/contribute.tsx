import {connect} from 'react-redux';
import {Store as ReduxStore, Dispatch} from 'redux';
import {Dispatcher} from 'ts/redux/dispatcher';
import {State} from 'ts/redux/reducer';
import {Contribute as ContributeComponent} from 'ts/pages/token_distribution/contribute';
import {BlockchainErrs, ProviderType} from 'ts/types';

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}
interface ContributeComponentPassedProps {};

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

interface ConnectedState {
    flashMessage?: string|React.ReactNode;
    blockchainIsLoaded: boolean;
    networkId: number;
    nodeVersion: string;
    providerType: ProviderType;
    injectedProviderName: string;
    userAddress: string;
    userEtherBalance: BigNumber.BigNumber;
    blockchainErr: BlockchainErrs;
    shouldBlockchainErrDialogBeOpen: boolean;
};

const mapStateToProps = (state: State): ConnectedState => ({
    flashMessage: state.flashMessage,
    blockchainIsLoaded: state.blockchainIsLoaded,
    networkId: state.networkId,
    nodeVersion: state.nodeVersion,
    providerType: state.providerType,
    injectedProviderName: state.injectedProviderName,
    userAddress: state.userAddress,
    userEtherBalance: state.userEtherBalance,
    blockchainErr: state.blockchainErr,
    shouldBlockchainErrDialogBeOpen: state.shouldBlockchainErrDialogBeOpen,
});

export const Contribute: React.ComponentClass<ContributeComponentPassedProps> =
  connect(mapStateToProps, mapDispatchToProps)(ContributeComponent);
