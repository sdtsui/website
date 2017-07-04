import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';
import {utils} from 'ts/utils/utils';
import {Element as ScrollElement} from 'react-scroll';
import {Styles, ProfileInfo} from 'ts/types';

const styles: Styles = {
    subheader: {
        textTransform: 'uppercase',
        fontSize: 32,
        margin: 0,
    },
};

interface ProfileProps {
    colSize: number;
    profileInfo: ProfileInfo;
}

export function Profile(props: ProfileProps) {
    return (
        <div
            className={`sm-col sm-col-${props.colSize}`}
        >
            <div className="mx-auto" style={{width: 200}}>
                <div>
                    <img src={props.profileInfo.image} />
                </div>
                <div
                    className="pt1"
                    style={{fontSize: 18, fontWeight: 'bold'}}
                >
                    {props.profileInfo.name}
                </div>
                <div
                    className="pb2 pt1 thin"
                    style={{fontSize: 16}}
                >
                    {props.profileInfo.title}
                </div>
                <div
                    style={{fontSize: 13, minHeight: 60}}
                    className="pb2 thin"
                >
                    {props.profileInfo.description}
                </div>
                <div className="flex pb3">
                    {renderSocialMediaIcons(props.profileInfo)}
                </div>
            </div>
        </div>
    );
}

function renderSocialMediaIcons(profileInfo: ProfileInfo) {
    const icons = [];
    if (!_.isEmpty(profileInfo.github)) {
        const icon = renderSocialMediaIcon('zmdi-github-box', profileInfo.github);
        icons.push(icon);
    }
    if (!_.isEmpty(profileInfo.linkedIn)) {
        const icon = renderSocialMediaIcon('zmdi-linkedin-box', profileInfo.linkedIn);
        icons.push(icon);
    }
    if (!_.isEmpty(profileInfo.twitter)) {
        const icon = renderSocialMediaIcon('zmdi-twitter-box', profileInfo.twitter);
        icons.push(icon);
    }
    return icons;
}

function renderSocialMediaIcon(iconName: string, url: string) {
    return (
        <div key={url} className="pr2">
            <a
                href={url}
                style={{color: 'inherit'}}
                target="_blank"
                className="text-decoration-none"
            >
                <i className={`zmdi ${iconName}`} style={{...styles.socalIcon}} />
            </a>
        </div>
    );
}
