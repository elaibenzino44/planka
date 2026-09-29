/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import isEmail from 'validator/lib/isEmail';
import React, { useCallback, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { Form, Grid, Header, Message } from 'semantic-ui-react';
import { useDidUpdate, usePrevious, useToggle } from '../../../lib/hooks';
import { Input } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import actions from '../../../actions';
import { useForm, useNestedRef } from '../../../hooks';
import { isPassword, isUsername } from '../../../utils/validator';
import AccessTokenSteps from '../../../constants/AccessTokenSteps';
import TermsModal from './TermsModal';
import TotpChallengeModal from './TotpChallengeModal';

import logo from '../../../assets/images/logo.png';

import styles from './Content.module.scss';

const createLoginMessage = (error) => {
  if (!error) {
    return error;
  }

  switch (error.message) {
    case 'Invalid credentials':
      return {
        type: 'error',
        content: 'common.invalidCredentials',
      };
    case 'Invalid email or username':
      return {
        type: 'error',
        content: 'common.invalidEmailOrUsername',
      };
    case 'Invalid password':
      return {
        type: 'error',
        content: 'common.invalidPassword',
      };
    case 'Admin login required to initialize instance':
      return {
        type: 'error',
        content: 'common.adminLoginRequiredToInitializeInstance',
      };
    case 'Email already in use':
      return {
        type: 'error',
        content: 'common.emailAlreadyInUse',
      };
    case 'Username already in use':
      return {
        type: 'error',
        content: 'common.usernameAlreadyInUse',
      };
    case 'Active users limit reached':
      return {
        type: 'error',
        content: 'common.activeUsersLimitReached',
      };
    case 'Failed to fetch':
      return {
        type: 'warning',
        content: 'common.noInternetConnection',
      };
    case 'Network request failed':
      return {
        type: 'warning',
        content: 'common.serverConnectionFailed',
      };
    default:
      return {
        type: 'warning',
        content: 'common.unknownError',
      };
  }
};

const createSignUpMessage = (error) => {
  if (!error) {
    return error;
  }

  switch (error.message) {
    case 'Email already in use':
      return {
        type: 'error',
        content: 'common.emailAlreadyInUse',
      };
    case 'Username already in use':
      return {
        type: 'error',
        content: 'common.usernameAlreadyInUse',
      };
    case 'Active users limit reached':
      return {
        type: 'error',
        content: 'common.activeUsersLimitReached',
      };
    case 'Failed to fetch':
      return {
        type: 'warning',
        content: 'common.noInternetConnection',
      };
    case 'Network request failed':
      return {
        type: 'warning',
        content: 'common.serverConnectionFailed',
      };
    default:
      return {
        type: 'warning',
        content: 'common.unknownError',
      };
  }
};

const Content = React.memo(() => {
  const bootstrap = useSelector(selectors.selectBootstrap);

  const {
    data: defaultData,
    isSubmitting,
    error,
    step,
  } = useSelector(selectors.selectAuthenticateForm);

  const {
    data: defaultSignUpData,
    isSubmitting: isSignUpSubmitting,
    error: signUpError,
  } = useSelector(selectors.selectSignUpForm);

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const wasSubmitting = usePrevious(isSubmitting);
  const wasSignUpSubmitting = usePrevious(isSignUpSubmitting);

  const [isSignUpMode, toggleSignUpMode] = useToggle();

  const [data, handleFieldChange, setData] = useForm(() => {
    const initialData = {
      emailOrUsername: '',
      password: '',
      ...defaultData,
    };

    if (bootstrap.isDemoMode) {
      const params = new URLSearchParams(window.location.hash.slice(1));

      Object.keys(initialData).forEach((fieldName) => {
        const value = params.get(fieldName);

        if (value !== null) {
          initialData[fieldName] = value;
        }
      });
    }

    return initialData;
  });

  const [signUpData, handleSignUpFieldChange, setSignUpData] = useForm(() => ({
    email: '',
    password: '',
    name: '',
    username: '',
    ...defaultSignUpData,
  }));

  const message = useMemo(() => createLoginMessage(error), [error]);
  const signUpMessage = useMemo(() => createSignUpMessage(signUpError), [signUpError]);
  const [focusPasswordFieldState, focusPasswordField] = useToggle();

  const [emailOrUsernameFieldRef, handleEmailOrUsernameFieldRef] = useNestedRef('inputRef');
  const [passwordFieldRef, handlePasswordFieldRef] = useNestedRef('inputRef');

  const [signUpEmailFieldRef, handleSignUpEmailFieldRef] = useNestedRef('inputRef');
  const [signUpPasswordFieldRef, handleSignUpPasswordFieldRef] = useNestedRef('inputRef');
  const [signUpNameFieldRef, handleSignUpNameFieldRef] = useNestedRef('inputRef');
  const [signUpUsernameFieldRef, handleSignUpUsernameFieldRef] = useNestedRef('inputRef');

  const handleSubmit = useCallback(() => {
    const cleanData = {
      ...data,
      emailOrUsername: data.emailOrUsername.trim(),
    };

    if (!isEmail(cleanData.emailOrUsername) && !isUsername(cleanData.emailOrUsername)) {
      emailOrUsernameFieldRef.current.select();
      dispatch(actions.authenticate.failure(new Error('Invalid email or username')));
      return;
    }

    if (!cleanData.password) {
      passwordFieldRef.current.focus();
      dispatch(actions.authenticate.failure(new Error('Invalid password')));
      return;
    }

    dispatch(entryActions.authenticate(cleanData));
  }, [dispatch, data, emailOrUsernameFieldRef, passwordFieldRef]);

  const handleSignUpSubmit = useCallback(() => {
    const cleanData = {
      ...signUpData,
      email: signUpData.email.trim(),
      name: signUpData.name.trim(),
      username: signUpData.username.trim() || null,
    };

    if (!isEmail(cleanData.email)) {
      signUpEmailFieldRef.current.select();
      dispatch(actions.signUp.failure(new Error('Invalid email or username')));
      return;
    }

    if (!cleanData.password || !isPassword(cleanData.password)) {
      signUpPasswordFieldRef.current.focus();
      return;
    }

    if (!cleanData.name) {
      signUpNameFieldRef.current.select();
      return;
    }

    if (cleanData.username && !isUsername(cleanData.username)) {
      signUpUsernameFieldRef.current.select();
      dispatch(actions.signUp.failure(new Error('Invalid email or username')));
      return;
    }

    dispatch(entryActions.signUp(cleanData));
  }, [
    dispatch,
    signUpData,
    signUpEmailFieldRef,
    signUpPasswordFieldRef,
    signUpNameFieldRef,
    signUpUsernameFieldRef,
  ]);

  const handleMessageDismiss = useCallback(() => {
    dispatch(entryActions.clearAuthenticateError());
  }, [dispatch]);

  const handleSignUpMessageDismiss = useCallback(() => {
    dispatch(entryActions.clearSignUpError());
  }, [dispatch]);

  const handleModeToggleClick = useCallback(() => {
    toggleSignUpMode();
  }, [toggleSignUpMode]);

  useEffect(() => {
    if (isSignUpMode) {
      signUpEmailFieldRef.current.focus();
    } else {
      emailOrUsernameFieldRef.current.focus();
    }
  }, [isSignUpMode, emailOrUsernameFieldRef, signUpEmailFieldRef]);

  useDidUpdate(() => {
    if (wasSubmitting && !isSubmitting && error) {
      switch (error.message) {
        case 'Invalid credentials':
        case 'Invalid email or username':
          emailOrUsernameFieldRef.current.select();

          break;
        case 'Invalid password':
          setData((prevData) => ({
            ...prevData,
            password: '',
          }));
          focusPasswordField();

          break;
        default:
      }
    }
  }, [isSubmitting, wasSubmitting, error]);

  useDidUpdate(() => {
    if (wasSignUpSubmitting && !isSignUpSubmitting && signUpError) {
      switch (signUpError.message) {
        case 'Email already in use':
          signUpEmailFieldRef.current.select();

          break;
        case 'Username already in use':
          signUpUsernameFieldRef.current.select();

          break;
        default:
      }
    }
  }, [isSignUpSubmitting, wasSignUpSubmitting, signUpError]);

  useDidUpdate(() => {
    passwordFieldRef.current.focus();
  }, [focusPasswordFieldState]);

  return (
    <div className={classNames(styles.wrapper, styles.fullHeight)}>
      <Grid verticalAlign="middle" className={styles.grid}>
        <Grid.Column computer={6} tablet={16} mobile={16} className={styles.gridItem}>
          <div className={styles.login}>
            <div className={styles.form}>
              <div className={styles.logoWrapper}>
                <img src={logo} alt="" className={styles.logo} />
              </div>
              <Header
                as="h1"
                textAlign="center"
                content={bootstrap.instanceName || 'PLANKA'}
                className={styles.formTitle}
              />
              <Header
                as="h2"
                textAlign="center"
                content={t(isSignUpMode ? 'common.signUp_title' : 'common.logIn_title')}
                className={styles.formSubtitle}
              />
              {isSignUpMode ? (
                <>
                  {signUpMessage && (
                    <Message
                      {...{
                        [signUpMessage.type]: true,
                      }}
                      visible
                      content={t(signUpMessage.content)}
                      onDismiss={handleSignUpMessageDismiss}
                    />
                  )}
                  <Form size="large" onSubmit={handleSignUpSubmit}>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputLabel}>{t('common.email')}</div>
                      <Input
                        fluid
                        ref={handleSignUpEmailFieldRef}
                        name="email"
                        value={signUpData.email}
                        maxLength={256}
                        readOnly={isSignUpSubmitting}
                        className={styles.input}
                        onChange={handleSignUpFieldChange}
                      />
                    </div>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputLabel}>{t('common.password')}</div>
                      <Input.Password
                        withStrengthBar
                        fluid
                        ref={handleSignUpPasswordFieldRef}
                        name="password"
                        value={signUpData.password}
                        maxLength={256}
                        readOnly={isSignUpSubmitting}
                        className={styles.input}
                        onChange={handleSignUpFieldChange}
                      />
                    </div>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputLabel}>{t('common.name')}</div>
                      <Input
                        fluid
                        ref={handleSignUpNameFieldRef}
                        name="name"
                        value={signUpData.name}
                        maxLength={128}
                        readOnly={isSignUpSubmitting}
                        className={styles.input}
                        onChange={handleSignUpFieldChange}
                      />
                    </div>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputLabel}>
                        {t('common.username')} (
                        {t('common.optional', {
                          context: 'inline',
                        })}
                        )
                      </div>
                      <Input
                        fluid
                        ref={handleSignUpUsernameFieldRef}
                        name="username"
                        value={signUpData.username}
                        maxLength={32}
                        readOnly={isSignUpSubmitting}
                        className={styles.input}
                        onChange={handleSignUpFieldChange}
                      />
                    </div>
                    <Form.Button
                      fluid
                      primary
                      icon="right arrow"
                      labelPosition="right"
                      content={t('action.signUp')}
                      loading={isSignUpSubmitting}
                      disabled={isSignUpSubmitting}
                    />
                  </Form>
                </>
              ) : (
                <>
                  {message && (
                    <Message
                      {...{
                        [message.type]: true,
                      }}
                      visible
                      content={t(message.content)}
                      onDismiss={handleMessageDismiss}
                    />
                  )}
                  <Form size="large" onSubmit={handleSubmit}>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputLabel}>{t('common.emailOrUsername')}</div>
                      <Input
                        fluid
                        ref={handleEmailOrUsernameFieldRef}
                        name="emailOrUsername"
                        value={data.emailOrUsername}
                        maxLength={256}
                        readOnly={isSubmitting}
                        className={styles.input}
                        onChange={handleFieldChange}
                      />
                    </div>
                    <div className={styles.inputWrapper}>
                      <div className={styles.inputLabel}>{t('common.password')}</div>
                      <Input.Password
                        fluid
                        ref={handlePasswordFieldRef}
                        name="password"
                        value={data.password}
                        maxLength={256}
                        readOnly={isSubmitting}
                        className={styles.input}
                        onChange={handleFieldChange}
                      />
                    </div>
                    <Form.Button
                      fluid
                      primary
                      icon="right arrow"
                      labelPosition="right"
                      content={t('action.logIn')}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    />
                  </Form>
                </>
              )}
              <div className={styles.modeToggle}>
                <span>
                  {t(isSignUpMode ? 'common.alreadyHaveAnAccount' : 'common.dontHaveAnAccount')}
                </span>{' '}
                <a role="button" tabIndex={0} onClick={handleModeToggleClick}>
                  {t(isSignUpMode ? 'action.logIn' : 'action.signUp')}
                </a>
              </div>
            </div>
            <div className={styles.poweredBy}>
              <p className={styles.poweredByText}>
                <Trans i18nKey="common.poweredByPlanka">
                  {'Powered by '}
                  <a href="https://github.com/plankanban/planka" target="_blank" rel="noreferrer">
                    PLANKA
                  </a>
                </Trans>
              </p>
            </div>
          </div>
        </Grid.Column>
        <Grid.Column
          computer={10}
          only="computer"
          className={classNames(styles.gridItem, styles.cover)}
        >
          <div className={styles.coverOverlay} />
        </Grid.Column>
      </Grid>
      {step === AccessTokenSteps.ACCEPT_TERMS && <TermsModal />}
      {step === AccessTokenSteps.VERIFY_TOTP && <TotpChallengeModal />}
    </div>
  );
});

export default Content;
