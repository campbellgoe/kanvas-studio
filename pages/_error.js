import React from 'react';
import Error from 'next/error';
import styled from 'styled-components';
import Link from 'next/link';
const ErrorPage = styled(({ statusCode, message, className = '' }) => {
  className += ' ErrorPage';
  return (
    <div className={className}>
      <Error/>
      <div>
        {statusCode && <h1>{statusCode}</h1>}
        <h2>{message}</h2>
      </div>
      <Link href='/'>
        <a title='Home' className={statusCode ? 'has-status-code' : ''}>Take me home</a>
      </Link>
    </div>
  );
})`
  text-align: center;
  margin: 48px;
  h1,
  h2 {
    display: inline-block;
    vertical-align: middle;
    font-weight: 200;
    margin: 0;
    margin-bottom: 16px;
  }
  h1 {
    margin-right: 24px;
    padding-right: 24.5px;
    border-right: 1px solid #c1c1c1;
  }
  a {
    font-size: 24px;
    padding: 10.5px;
    margin-left: -6px;
  }
  a.has-status-code {
    margin-left: 4px;
  }
  h1,
  h2,
  a {
    font-family: 'GeosansLight', 'Arial', sans-serif;
  }
`;

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : null;
  let message;
  if (statusCode >= 400 && statusCode < 500) {
    message = 'Client error';
  } else if (statusCode >= 500) {
    message = 'Server error';
  }
  switch (statusCode) {
    case 404: {
      message = 'Page not found';
      break;
    }
    case 503: {
      message = 'Internal server error';
      break;
    }
    default: {
      message = 'An unknown error occurred';
      break;
    }
  }
  return { statusCode, message };
};
export default ErrorPage;
