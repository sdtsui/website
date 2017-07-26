import * as _ from 'lodash';
import * as React from 'react';
import {colors} from 'material-ui/styles';
import {utils} from 'ts/utils/utils';
import {Element as ScrollElement} from 'react-scroll';
import {Styles, ProfileInfo} from 'ts/types';
import {Profile} from 'ts/pages/home/profile';

const teamRow1: ProfileInfo[] = [
    {
        name: 'Will Warren',
        title: 'Co-founder & CEO',
        description: `Smart contract R&D. Previously applied physics research at Los Alamos National
                      Laboratory. Mechanical engineering at UC San Diego. PhD dropout.`,
        image: '/images/team/will.jpg',
        linkedIn: 'https://www.linkedin.com/in/will-warren-92aab62b/',
        github: 'https://github.com/willwarren89',
        medium: 'https://medium.com/@willwarren89',
    },
    {
        name: 'Amir Bandeali',
        title: 'Co-founder & CTO',
        description: `Smart contract R&D. Former fixed income trader at DRW.
                      Finance at University of Illinois, Urbana-Champaign.`,
        image: '/images/team/amir.jpeg',
        linkedIn: 'https://www.linkedin.com/in/abandeali1/',
        github: 'https://github.com/abandeali1',
        medium: 'https://medium.com/@abandeali1',
    },
    {
        name: 'Fabio Berger',
        title: 'Senior Engineer',
        description: `Blockchain engineer with extensive full-stack and DevOps experience. Previously
                      software engineer at Airtable and founder of WealthLift. Computer science at Duke.`,
        image: '/images/team/fabio.jpg',
        linkedIn: 'https://www.linkedin.com/in/fabio-berger-03ab261a/',
        github: 'https://github.com/fabioberger',
        medium: 'https://medium.com/@fabioberger',
    },
];

const teamRow2: ProfileInfo[] = [
    {
        name: 'Leonid Logvinov',
        title: 'Engineer',
        description: `Full-stack & blockchain engineer. Previously blockchain engineer at Neufund,
                      software engineer intern at Quora and competitive programmer. Computer science
                      at University of Warsaw.`,
        image: '/images/team/leonid.png',
        linkedIn: 'https://www.linkedin.com/in/leonidlogvinov/',
        github: 'https://github.com/LogvinovLeon',
        medium: '',
    },
    {
        name: 'Alex Xu',
        title: 'Director of Operations',
        description: `End-to-end business operations & strategy. Previously digital marketing consultant at
                      Google and vendor management at Amazon. Economics at UC San Diego.`,
        image: '/images/team/alex.jpg',
        linkedIn: 'https://www.linkedin.com/in/alex-xu/',
        github: '',
        medium: '',
    },
    {
        name: 'Ben Burns',
        title: 'Designer',
        description: `Product, motion, and graphic designer. Previously designer at Airtable and Apple.
                      Digital Design at University of Cincinnati.`,
        image: '/images/team/ben.jpg',
        linkedIn: 'https://www.linkedin.com/in/ben-burns-30170478/',
        github: '',
        medium: '',
    },
];

const advisors: ProfileInfo[] = [
    {
        name: 'Fred Ehrsam',
        title: 'Advisor',
        description: 'Co-founder of Coinbase. Previously FX trader at Goldman Sachs. Computer Science at Duke.',
        image: '/images/advisors/fred.jpg',
        linkedIn: 'https://www.linkedin.com/in/fredehrsam/',
        medium: 'https://medium.com/@FEhrsam',
        twitter: 'https://twitter.com/FEhrsam',
    },
    {
        name: 'Olaf Carlson-Wee',
        title: 'Advisor',
        image: '/images/advisors/olaf.png',
        description: 'Founder of Polychain Capital. First employee at Coinbase. Angel investor.',
        linkedIn: 'https://www.linkedin.com/in/olafcw/',
        angellist: 'https://angel.co/olafcw',
    },
    {
        name: 'Joey Krug',
        title: 'Advisor',
        description: `Co-CIO at Pantera Capital. Founder of Augur.
                      Thiel Fellowship 20 Under 20 Fellow.`,
        image: '/images/advisors/joey.jpg',
        linkedIn: 'https://www.linkedin.com/in/joeykrug/',
        github: 'https://github.com/joeykrug',
        angellist: 'https://angel.co/joeykrug',
    },
    {
        name: 'Linda Xie',
        title: 'Advisor',
        description: 'Product Manager at Coinbase. Previously Portfolio Risk at AIG.',
        image: '/images/advisors/linda.jpg',
        linkedIn: 'https://www.linkedin.com/in/lindaxie/',
        medium: 'https://medium.com/@linda.xie',
        twitter: 'https://twitter.com/ljxie',
    },
];

const styles: Styles = {
    subheader: {
        textTransform: 'uppercase',
        fontSize: 32,
        margin: 0,
    },
};

interface TeamAndAdvisorsProps {}

export function TeamAndAdvisors(props: TeamAndAdvisorsProps) {
    return (
        <div>
            <div
                className="relative"
                style={{backgroundColor: '#272727'}}
            >
                <ScrollElement name="team">
                    <div className="mx-auto max-width-4 pb4" style={{color: colors.grey50}}>
                        <h1
                            id="team"
                            className="pt4 sm-center md-pl3 lg-pl0 thin"
                            style={{...styles.subheader, color: 'white'}}
                        >
                            Team
                        </h1>
                        <div className="clearfix pt3 mx-auto" style={{maxWidth: 1022}}>
                            {renderProfiles(teamRow1)}
                        </div>
                        <div className="clearfix pt3 mx-auto" style={{maxWidth: 1022}}>
                            {renderProfiles(teamRow2)}
                        </div>
                    </div>
                </ScrollElement>
            </div>
            <div className="relative" style={{backgroundColor: '#eaeaea'}}>
                <ScrollElement name="advisors">
                    <div className="mx-auto max-width-4 pb4" style={{color: colors.grey800}}>
                        <h1
                            id="advisors"
                            className="pt4 sm-center md-pl3 lg-pl0 thin"
                            style={{...styles.subheader, color: colors.grey800}}
                        >
                            Advisors
                        </h1>
                        <div className="pt3 mx-auto clearfix">
                            {renderProfiles(advisors)}
                        </div>
                    </div>
                </ScrollElement>
            </div>
        </div>
    );
}

function renderProfiles(profiles: ProfileInfo[]) {
    const numIndiv = profiles.length;
    const colSize = utils.getColSize(profiles.length);
    return _.map(profiles, profile => {
        return (
            <div
                key={profile.name}
            >
                <Profile
                    colSize={colSize}
                    profileInfo={profile}
                />
            </div>
        );
    });
}
