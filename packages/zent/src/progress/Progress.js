import React, { Component, PureComponent } from 'react';
import Icon from 'icon';
import cx from 'classnames';
import PropTypes from 'prop-types';

export default class Progress extends (PureComponent || Component) {
  static propTypes = {
    className: PropTypes.string,
    prefix: PropTypes.string,
    type: PropTypes.string,
    percent: PropTypes.number,
    showInfo: PropTypes.bool,
    status: PropTypes.string
  };

  static defaultProps = {
    type: 'line',
    percent: 0,
    showInfo: true,
    className: '',
    prefix: 'zent'
  };

  render() {
    const { type, percent, showInfo, status, className, prefix } = this.props;

    const containerCls = cx(
      `${prefix}-progress`,
      `${prefix}-progress-${type}`,
      {
        [className]: !!className
      }
    );

    const statusCls = cx({
      [`${prefix}-progress-inprogress`]: percent < 100 &&
        status !== 'exception',
      [`${prefix}-progress-exception`]: percent < 100 && status === 'exception',
      [`${prefix}-progress-success`]: percent >= 100
    });

    const renderInfoCont = () => {
      let infoCont = `${percent}%`;
      if (percent >= 100) {
        infoCont = <Icon type={type === 'circle' ? 'check' : 'check-circle'} />;
      } else if (status === 'exception') {
        infoCont = <Icon type={type === 'circle' ? 'close' : 'close-circle'} />;
      }
      return infoCont;
    };

    const renderProgressCont = () => {
      let progressCont;
      switch (type) {
        case 'circle':
          progressCont = (
            <div className={statusCls}>
              <div className={`${prefix}-progress-wrapper`} />
              <svg className={`${prefix}-progress-inner`}>
                <circle
                  className={`${prefix}-progress-inner-path`}
                  cx="38"
                  cy="38"
                  r="36"
                  style={{
                    strokeDashoffset: 2 * Math.PI * 36 * (100 - percent) / 100
                  }}
                />
              </svg>
              {showInfo
                ? <div className={`${prefix}-progress-info`}>
                    {renderInfoCont()}
                  </div>
                : null}
            </div>
          );
          break;
        case 'line':
        default:
          progressCont = (
            <div className={statusCls}>
              <div className={`${prefix}-progress-wrapper`}>
                <div
                  className={`${prefix}-progress-inner`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {showInfo
                ? <div className={`${prefix}-progress-info`}>
                    {renderInfoCont()}
                  </div>
                : null}
            </div>
          );
          break;
      }
      return progressCont;
    };

    return (
      <div className={containerCls}>
        {renderProgressCont()}
      </div>
    );
  }
}
