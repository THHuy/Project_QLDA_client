import React from 'react';
import classNames from 'classnames/bind';
import styles from './ProjectCard.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function ProjectCard({ project }) {
    const { title, type, icon, quickLinks } = project;

    return (
        <div className={cx('project-card')}>
            <div className={cx('project-header')}>
                <img src={icon} alt={title} className={cx('project-icon')} />
                <div className={cx('project-info')}>
                    <h3>{title}</h3>
                    <div className={cx('project-type')}>{type}</div>
                </div>
            </div>

            <div className={cx('quick-links')}>
                <h4>Quick links</h4>
                <ul className={cx('links-list')}>
                    {quickLinks.map((link, index) => (
                        <li key={index}>
                            <span>{link.title}</span>
                            {link.count && <span className={cx('count')}>{link.count}</span>}
                        </li>
                    ))}
                </ul>
            </div>

            <div className={cx('project-footer')}>
                <FontAwesomeIcon icon={faLayerGroup} className={cx('footer-icon')} />
                <span>1 board</span>
            </div>
        </div>
    );
}

export default ProjectCard; 