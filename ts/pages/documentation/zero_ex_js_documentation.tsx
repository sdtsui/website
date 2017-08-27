import * as _ from 'lodash';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import DocumentTitle = require('react-document-title');
import convert = require('xml-js');
import findVersions = require('find-versions');
import semverSort = require('semver-sort');
import {colors} from 'material-ui/styles';
import MenuItem from 'material-ui/MenuItem';
import CircularProgress from 'material-ui/CircularProgress';
import Paper from 'material-ui/Paper';
import {
    Link as ScrollLink,
    Element as ScrollElement,
    scroller,
} from 'react-scroll';
import {Dispatcher} from 'ts/redux/dispatcher';
import {KindString, TypeDocNode, ZeroExJsDocSections, Styles, ScreenWidths, S3FileObject} from 'ts/types';
import {TopBar} from 'ts/components/top_bar';
import {utils} from 'ts/utils/utils';
import {constants} from 'ts/utils/constants';
import {Loading} from 'ts/components/ui/loading';
import {MethodBlock} from 'ts/pages/documentation/method_block';
import {SourceLink} from 'ts/pages/documentation/source_link';
import {Type} from 'ts/pages/documentation/type';
import {TypeDefinition} from 'ts/pages/documentation/type_definition';
import {MarkdownSection} from 'ts/pages/documentation/markdown_section';
import {Comment} from 'ts/pages/documentation/comment';
import {AnchorTitle} from 'ts/pages/documentation/anchor_title';
import {SectionHeader} from 'ts/pages/documentation/section_header';
import {Docs0xjsMenu, menu} from 'ts/pages/documentation/docs_0xjs_menu';
import {typeDocUtils} from 'ts/utils/typedoc_utils';
/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/0xjs/introduction');
const InstallationMarkdown = require('md/docs/0xjs/installation');
const AsyncMarkdown = require('md/docs/0xjs/async');
const TestRPCMarkdown = require('md/docs/0xjs/testrpc');
const ErrorsMarkdown = require('md/docs/0xjs/errors');
const versioningMarkdown = require('md/docs/0xjs/versioning');
/* tslint:enable:no-var-requires */

const SCROLL_TO_TIMEOUT = 500;

const sectionNameToMarkdown = {
    [ZeroExJsDocSections.introduction]: IntroMarkdown,
    [ZeroExJsDocSections.installation]: InstallationMarkdown,
    [ZeroExJsDocSections.testrpc]: TestRPCMarkdown,
    [ZeroExJsDocSections.async]: AsyncMarkdown,
    [ZeroExJsDocSections.errors]: ErrorsMarkdown,
    [ZeroExJsDocSections.versioning]: versioningMarkdown,
};

export interface ZeroExJSDocumentationPassedProps {
    source: string;
    location: Location;
}

export interface ZeroExJSDocumentationAllProps {
    source: string;
    location: Location;
    dispatcher: Dispatcher;
    zeroExJSversion: string;
    availableZeroExJSVersions: string[];
}

interface ZeroExJSDocumentationState {
    versionDocObj?: TypeDocNode;
}

const styles: Styles = {
    mainContainers: {
        position: 'absolute',
        top: 43,
        left: 0,
        bottom: 0,
        right: 0,
        overflowZ: 'hidden',
        overflowY: 'scroll',
        minHeight: 'calc(100vh - 43px)',
        WebkitOverflowScrolling: 'touch',
    },
    menuContainer: {
        borderColor: colors.grey300,
        maxWidth: 330,
        marginLeft: 20,
    },
};

export class ZeroExJSDocumentation extends React.Component<ZeroExJSDocumentationAllProps, ZeroExJSDocumentationState> {
    constructor(props: ZeroExJSDocumentationAllProps) {
        super(props);
        this.state = {
            versionDocObj: undefined,
        };
    }
    public componentWillMount() {
        const pathName = this.props.location.pathname;
        const lastSegment = pathName.substr(pathName.lastIndexOf('/') + 1);
        const versions = findVersions(lastSegment);
        const preferredVersionIfExists = versions.length > 0 ? versions[0] : undefined;
        this.fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists);
    }
    public render() {
        const menuSubsectionsBySection = _.isUndefined(this.state.versionDocObj)
                                         ? {}
                                         : typeDocUtils.getMenuSubsectionsBySection(this.state.versionDocObj);
        return (
            <div>
                <DocumentTitle title="0x.js Documentation"/>
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    zeroExJSversion={this.props.zeroExJSversion}
                    availableZeroExJSVersions={this.props.availableZeroExJSVersions}
                    menuSubsectionsBySection={menuSubsectionsBySection}
                    shouldFullWidth={true}
                />
                {_.isUndefined(this.state.versionDocObj) ?
                    <div
                        className="col col-12"
                        style={styles.mainContainers}
                    >
                        <div
                            className="relative sm-px2 sm-pt2 sm-m1"
                            style={{height: 122, top: '50%', transform: 'translateY(-50%)'}}
                        >
                            <div className="center pb2">
                                <CircularProgress size={40} thickness={5} />
                            </div>
                            <div className="center pt2" style={{paddingBottom: 11}}>Loading documentation...</div>
                        </div>
                    </div> :
                    <div
                        className="mx-auto flex"
                        style={{color: colors.grey800, height: 43}}
                    >
                        <div className="relative col md-col-3 lg-col-3 lg-pl0 md-pl1 sm-hide xs-hide">
                            <div
                                className="border-right absolute"
                                style={{...styles.menuContainer, ...styles.mainContainers}}
                            >
                                <Docs0xjsMenu
                                    selectedVersion={this.props.zeroExJSversion}
                                    versions={this.props.availableZeroExJSVersions}
                                    menuSubsectionsBySection={menuSubsectionsBySection}
                                />
                            </div>
                        </div>
                        <div className="relative col lg-col-9 md-col-9 sm-col-12 col-12">
                            <div
                                id="documentation"
                                style={styles.mainContainers}
                                className="absolute"
                            >
                                <div id="zeroExJSDocs" />
                                <h1 className="md-pl2 sm-pl3">
                                    <a href={constants.GITHUB_0X_JS_URL} target="_blank">
                                        0x.js
                                    </a>
                                </h1>
                                {this.renderDocumentation()}
                            </div>
                        </div>
                    </div>
                }
            </div>
        );
    }
    private renderDocumentation(): React.ReactNode {
        const subMenus = _.values(menu);
        const orderedSectionNames = _.flatten(subMenus);
        const sections = _.map(orderedSectionNames, sectionName => {
            const packageDefinitionIfExists = typeDocUtils.getModuleDefinitionBySectionNameIfExists(
                this.state.versionDocObj, sectionName,
            );

            const markdownFileIfExists = sectionNameToMarkdown[sectionName];
            if (!_.isUndefined(markdownFileIfExists)) {
                return (
                    <MarkdownSection
                        key={`markdown-section-${sectionName}`}
                        sectionName={sectionName}
                        markdownContent={markdownFileIfExists}
                    />
                );
            }

            if (_.isUndefined(packageDefinitionIfExists)) {
                return null;
            }

            // Since the `types.ts` file is the only file that does not export a module/class but
            // instead has each type export itself, we do not need to go down two levels of nesting
            // for it.
            let entities;
            let packageComment = '';
            if (sectionName === 'types') {
                entities = packageDefinitionIfExists.children;
            } else {
                entities = packageDefinitionIfExists.children[0].children;
                const commentObj = packageDefinitionIfExists.children[0].comment;
                packageComment = !_.isUndefined(commentObj) ? commentObj.shortText : packageComment;
            }

            const constructors = _.filter(entities, typeDocUtils.isConstructor);

            const publicProperties = _.filter(entities, entity => {
                return typeDocUtils.isProperty(entity) && !typeDocUtils.isPrivateOrProtectedProperty(entity.name);
            });
            const publicPropertyDefs = _.map(publicProperties, property => this.renderProperty(property));

            const methods = _.filter(entities, typeDocUtils.isMethod);
            const isConstructor = false;
            const methodDefs = _.map(methods, method => {
                return this.renderMethodBlocks(method, sectionName, isConstructor);
            });

            const types = _.filter(entities, typeDocUtils.isType);
            const typeDefs = _.map(types, type => {
                return (
                    <TypeDefinition
                        key={`type-${type.name}`}
                        type={type}
                    />
                );
            });
            return (
                <div
                    key={`section-${sectionName}`}
                    className="py2 pr3 md-pl2 sm-pl3"
                >
                    <SectionHeader sectionName={sectionName} />
                    <Comment
                        comment={packageComment}
                    />
                    {sectionName === ZeroExJsDocSections.zeroEx && constructors.length > 0 &&
                        <div>
                            <h2 className="thin">Constructor</h2>
                            {this.renderZeroExConstructors(constructors)}
                        </div>
                    }
                    {publicPropertyDefs.length > 0 &&
                        <div>
                            <h2 className="thin">Properties</h2>
                            <div>{publicPropertyDefs}</div>
                        </div>
                    }
                    {methodDefs.length > 0 &&
                        <div>
                            <h2 className="thin">Methods</h2>
                            <div>{methodDefs}</div>
                        </div>
                    }
                    {typeDefs.length > 0 &&
                        <div>
                            <div>{typeDefs}</div>
                        </div>
                    }
                </div>
            );
        });

        return sections;
    }
    private renderZeroExConstructors(constructors: TypeDocNode[]): React.ReactNode {
        const isConstructor = true;
        const constructorDefs = _.map(constructors, constructor => {
            return this.renderMethodBlocks(constructor, ZeroExJsDocSections.zeroEx, isConstructor);
        });
        return (
            <div>
                {constructorDefs}
            </div>
        );
    }
    private renderProperty(property: TypeDocNode): React.ReactNode {
        const source = property.sources[0];
        return (
            <div
                key={`property-${property.name}-${property.type.name}`}
                className="pb3"
            >
                <code className="hljs">
                    {property.name}: <Type type={property.type} />
                </code>
                <SourceLink
                    version={this.props.zeroExJSversion}
                    source={source}
                />
                {property.comment &&
                    <Comment
                        comment={property.comment.shortText}
                        className="py2"
                    />
                }
            </div>
        );
    }
    private renderMethodBlocks(method: TypeDocNode, sectionName: string, isConstructor: boolean): React.ReactNode {
        const signatures = method.signatures;
        const renderedSignatures = _.map(signatures, (signature: TypeDocNode, i: number) => {
            const source = method.sources[i];
            let entity = method.flags.isStatic ? 'ZeroEx.' : 'zeroEx.';
            // Hack: currently the section names are identical as the property names on the ZeroEx class
            // For now we reply on this mapping to construct the method entity. In the future, we should
            // do this differently.
            entity = (sectionName !== ZeroExJsDocSections.zeroEx) ? `${entity}${sectionName}.` : entity;
            entity = isConstructor ? '' : entity;
            return (
                <MethodBlock
                    key={`method-${source.name}-${source.line}`}
                    isConstructor={isConstructor}
                    isStatic={method.flags.isStatic}
                    methodSignature={signature}
                    source={source}
                    entity={entity}
                    libraryVersion={this.props.zeroExJSversion}
                />
            );
        });
        return renderedSignatures;
    }
    private scrollToHash(): void {
        const hashWithPrefix = this.props.location.hash;
        let hash = hashWithPrefix.slice(1);
        if (_.isEmpty(hash)) {
            hash = 'zeroExJSDocs'; // scroll to the top
        }

        scroller.scrollTo(hash, {duration: 0, offset: 0, containerId: 'documentation'});
    }
    private async fetchJSONDocsFireAndForgetAsync(preferredVersionIfExists?: string): Promise<void> {
        const versionFileNames = await this.getVersionFileNamesAsync();
        const versionToFileName: {[version: string]: string} = {};
        _.each(versionFileNames, fileName => {
            const [version] = findVersions(fileName);
            versionToFileName[version] = fileName;
        });

        const versions = _.keys(versionToFileName);
        this.props.dispatcher.updateAvailable0xjsVersions(versions);
        const sortedVersions = semverSort.desc(versions);
        const latestVersion = sortedVersions[0];

        let versionToFetch = latestVersion;
        if (!_.isUndefined(preferredVersionIfExists)) {
            const preferredVersionFileNameIfExists = versionToFileName[preferredVersionIfExists];
            if (!_.isUndefined(preferredVersionFileNameIfExists)) {
                versionToFetch = preferredVersionIfExists;
            }
        }
        this.props.dispatcher.updateCurrent0xjsVersion(versionToFetch);

        const versionFileNameToFetch = versionToFileName[versionToFetch];
        const versionDocObj = await this.getJSONDocFileAsync(versionFileNameToFetch);

        this.setState({
            versionDocObj,
        }, () => {
            this.scrollToHash();
        });
    }
    private async getVersionFileNamesAsync(): Promise<string[]> {
        const response = await fetch(constants.S3_DOCUMENTATION_JSON_ROOT);
        if (response.status !== 200) {
            // TODO: Show the user an error message when the docs fail to load
            const errMsg = await response.text();
            utils.consoleLog(`Failed to load JSON file list: ${response.status} ${errMsg}`);
            return;
        }
        const responseXML = await response.text();
        const responseJSONString = convert.xml2json(responseXML, {
            compact: true,
        });
        const responseObj = JSON.parse(responseJSONString);
        const fileObjs = responseObj.ListBucketResult.Contents as S3FileObject[];
        const versionFileNames = _.map(fileObjs, fileObj => {
            return fileObj.Key._text;
        });
        return versionFileNames;
    }
    private async getJSONDocFileAsync(fileName: string): Promise<TypeDocNode> {
        const endpoint = `${constants.S3_DOCUMENTATION_JSON_ROOT}/${fileName}`;
        const response = await fetch(endpoint);
        if (response.status !== 200) {
            // TODO: Show the user an error message when the docs fail to load
            const errMsg = await response.text();
            utils.consoleLog(`Failed to load Doc JSON: ${response.status} ${errMsg}`);
            return;
        }
        const jsonDocObj = await response.json();
        return jsonDocObj;
    }
}
