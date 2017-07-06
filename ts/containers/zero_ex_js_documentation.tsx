import * as _ from 'lodash';
import * as React from 'react';
import {connect} from 'react-redux';
import {Store as ReduxStore, Dispatch} from 'redux';
import {Dispatcher} from 'ts/redux/dispatcher';
import {State} from 'ts/redux/reducer';
import {Blockchain} from 'ts/blockchain';
import {
    ZeroExJSDocumentation as ZeroExJSDocumentationComponent,
    ZeroExJSDocumentationAllProps,
} from 'ts/pages/documentation/zero_ex_js_documentation';
import * as BigNumber from 'bignumber.js';

interface ConnectedState {
    zeroExJSversion: string;
    availableZeroExJSVersions: string[];
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, ownProps: ZeroExJSDocumentationAllProps): ConnectedState => ({
    zeroExJSversion: state.zeroExJSversion,
    availableZeroExJSVersions: state.availableZeroExJSVersions,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const ZeroExJSDocumentation: React.ComponentClass<ZeroExJSDocumentationAllProps> =
  connect(mapStateToProps, mapDispatchToProps)(ZeroExJSDocumentationComponent);
