import {connect} from 'react-redux';
import {Store as ReduxStore, Dispatch} from 'redux';
import {Dispatcher} from 'ts/redux/dispatcher';
import {State} from 'ts/redux/reducer';
import {RegistrationFlow as RegistrationFlowComponent} from 'ts/pages/token_distribution/registration_flow';
import {BlockchainErrs, ProviderType} from 'ts/types';

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}
interface RegistrationFlowComponentPassedProps {};

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

interface ConnectedState {
    flashMessage?: string;
    blockchainIsLoaded: boolean;
    networkId: number;
    nodeVersion: string;
    providerType: ProviderType;
    injectedProviderName: string;
    userAddress: string;
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
    blockchainErr: state.blockchainErr,
    shouldBlockchainErrDialogBeOpen: state.shouldBlockchainErrDialogBeOpen,
});

export const RegistrationFlow: React.ComponentClass<RegistrationFlowComponentPassedProps> =
  connect(mapStateToProps, mapDispatchToProps)(RegistrationFlowComponent);
