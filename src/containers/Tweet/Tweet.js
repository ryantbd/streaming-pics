import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import ga from 'react-ga';
import config from '../../config';
import Helmet from 'react-helmet';
import {
  load as loadTweetInformation,
  reset as resetTweetInformation,
  displayPreviousMedium,
  displayNextMedium
} from 'redux/modules/tweetInformation';
import moment from 'moment';
import { SVGIcon, LoadingIcon } from 'components';

@connect(
  state => ({
    tweetInformation: state.tweetInformation,
    location: state.routing.location
  }),
  {
    loadTweetInformation,
    resetTweetInformation,
    displayPreviousMedium,
    displayNextMedium
  }
)

export default class Medium extends Component {

  static propTypes = {
    tweetInformation: PropTypes.object,
    location: PropTypes.object,
    params: PropTypes.object,
    loadTweetInformation: PropTypes.func,
    resetTweetInformation: PropTypes.func,
    displayPreviousMedium: PropTypes.func,
    displayNextMedium: PropTypes.func
  }

  componentDidMount = () => {
    const { tweetIdStr, mediumIdStr } = this.props.params;
    this.props.loadTweetInformation({
      tweetIdStr,
      mediumIdStr
    });
    global.addEventListener('keydown', this.handleKeydownEvent);

    ga.initialize(config.gaTrackId);
    ga.pageview(`${ this.props.location.pathname }${ this.props.location.search }`);
  }

  componentWillReceiveProps = (nextProps) => {
    const currentParams = this.props.params;
    const upcomingParams = nextProps.params;

    if (currentParams.userScreenName === upcomingParams.userScreenName &&
        currentParams.tweetIdStr === upcomingParams.tweetIdStr &&
        currentParams.mediumIdStr === upcomingParams.mediumIdStr) {
      return;
    }

    this.props.loadTweetInformation({
      tweetIdStr: upcomingParams.tweetIdStr,
      mediumIdStr: upcomingParams.mediumIdStr
    });
  }

  // shouldComponentUpdate = (nextProps) => {
  //   const userScreenNameChanged = (nextProps.tweetInformation.userScreenName !== this.props.tweetInformation.userScreenName);
  //   const tweetIdStrChanged = (nextProps.tweetInformation.tweetIdStr !== this.props.tweetInformation.tweetIdStr);
  //   return (userScreenNameChanged || tweetIdStrChanged);
  // }

  componentWillUnmount = () => {
    this.props.resetTweetInformation();
    global.removeEventListener('keydown', this.handleKeydownEvent);
  }

  handleDisplayPreviousMedia = (event) => {
    event.stopPropagation();
    const params = this.props.params;
    const tweet = this.props.tweetInformation.tweet;
    const currentMediumIndex = tweet.currentMediumIndex;

    if (currentMediumIndex > 0) {
      const previousMedium = tweet.mediaArr[currentMediumIndex - 1];
      this.props.displayPreviousMedium();

      if (global.history) {
        global.history.pushState(
          null,
          `Tweet of @${ params.userScreenName }`,
          `/${ params.userScreenName }/status/${ params.tweetIdStr }/photo/${ previousMedium.mediumIdStr }`
        );
      }
    }
  }

  handleDisplayNextMedia = (event) => {
    event.stopPropagation();
    const params = this.props.params;
    const tweet = this.props.tweetInformation.tweet;
    const currentMediumIndex = tweet.currentMediumIndex;

    if (currentMediumIndex > -1 && currentMediumIndex < tweet.mediaArr.length - 1) {
      const nextMedium = tweet.mediaArr[currentMediumIndex + 1];
      this.props.displayNextMedium();

      if (global.history) {
        global.history.pushState(
          null,
          `Tweet of @${ params.userScreenName }`,
          `/${ params.userScreenName }/status/${ params.tweetIdStr }/photo/${ nextMedium.mediumIdStr }`
        );
      }
    }
  }

  handleKeydownEvent = (event) => {
    const { keyCode } = event;

    switch (keyCode) {
      case 37:
        this.handleDisplayPreviousMedia(event);
        return;
      case 39:
        this.handleDisplayNextMedia(event);
        return;
      default:
        return;
    }
  }

  render() {
    const styles = require('./Tweet.scss');
    const { tweetInformation, params } = this.props; // eslint-disable-line no-unused-vars
    const { loading, tweet, error } = tweetInformation; // eslint-disable-line no-unused-vars
    const { mediaArr, currentMedium, currentMediumIndex } = tweet; // eslint-disable-line no-unused-vars
    let tweetPrevClassName = '';
    let tweetNextClassName = '';
    let tweetCreatedTime;

    if (mediaArr && mediaArr.length > 1 && currentMediumIndex > -1) {
      if (currentMediumIndex > 0) {
        tweetPrevClassName = styles.tweetMediumPrevEnabled;
      }

      if (currentMediumIndex < mediaArr.length - 1) {
        tweetNextClassName = styles.tweetMediumNextEnabled;
      }
    }

    if (tweet.tweetCreatedTime) {
      tweetCreatedTime = moment(tweet.tweetCreatedTime);
    }

    return (
      <div className={ styles.tweetWrapper }>
        <Helmet title={ `Tweet of @${ params.userScreenName }` } />
        <div className="container">
        { tweet.tweetIdStr &&
          <div className={ styles.tweetContentWrapper }>
            <div className={ styles.tweetUserInfoWrapper }>
              <p className={ styles.tweetUserAvatarWrapper }>
                <img src={ tweet.userProfileImageURL } />
              </p>
              <p className={ styles.tweetUserNameWrapper }>
                <Link to={ `/${ tweet.userScreenName }` } onClick={ this.handleOpenUserRoute }>
                  <span className={ styles.tweetUserName }>{ tweet.userName }</span>
                </Link>
                <span className={ styles.tweetUserScreenName }>@{ tweet.userScreenName }</span>
              </p>
            </div>
            <p className={ styles.tweetTweetText }>
              { tweet.tweetText }
            </p>
            <p className={ styles.tweetTweetMeta }>
              <span className={ styles.tweetFavoriteCount }>
                <SVGIcon iconName="like-dark" iconClass="iconLikeDark" />
                { tweet.favoriteCount }
              </span>
              <a
                className={ styles.tweetCreatedTime }
                href={ tweet.tweetURL }
                target="_blank"
                title={ tweetCreatedTime.format('LL LTS') }
              >
                { tweetCreatedTime.fromNow() }
              </a>
            </p>
          </div>
        }
        </div>
        { currentMedium &&
          <div className={ styles.tweetCurrentMediumWrapper }>
            <div className={ `${ styles.tweetCurrentMediumContentWrapper } container` }>
              <div className={ styles.tweetCurrentMediumContainer }>
                <img src={ currentMedium.mediumURL } />
              </div>
               <div className={ `${ styles.tweetMediumPrev } ${ tweetPrevClassName }` } onClick={ this.handleDisplayPreviousMedia }>
                <SVGIcon iconName="previous" iconClass="iconPrevious" />
              </div>
              <div className={ `${ styles.tweetMediumNext } ${ tweetNextClassName }` } onClick={ this.handleDisplayNextMedia }>
                <SVGIcon iconName="next" iconClass="iconNext" />
              </div>
            </div>
          </div>
        }
        <div className="container">
        { loading &&
          <div className={ styles.tweetLoadingWrapper }>
            <LoadingIcon />
          </div>
        }
        </div>
      </div>
    );
  }
}