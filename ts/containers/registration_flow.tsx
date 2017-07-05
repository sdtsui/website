import {connect} from 'react-redux';
import {Store as ReduxStore, Dispatch} from 'redux';
import {Dispatcher} from 'ts/redux/dispatcher';
import {State} from 'ts/redux/reducer';
import {RegistrationFlow as RegistrationFlowComponent} from 'ts/pages/token_distribution/registration_flow';

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}
interface RegistrationFlowComponentPassedProps {};

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

interface ConnectedState {
    flashMessage?: string;
};

const mapStateToProps = (state: State): ConnectedState => ({flashMessage: state.flashMessage});

export const RegistrationFlow: React.ComponentClass<RegistrationFlowComponentPassedProps> =
  connect(mapStateToProps, mapDispatchToProps)(RegistrationFlowComponent);
