import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";

import { createGlobalStyle } from "styled-components";
import globalStyles from "../globalStyles";

const GlobalStyles = createGlobalStyle`${globalStyles}`;

// const PolyfillScript = ({ deviceType }) => {
//   return <script>{`alert('${deviceType}');`}</script>;
// };
export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: App => props =>
            sheet.collectStyles(
              <>
                <GlobalStyles />
                <App {...props} />
              </>
            )
        });

      const initialProps = await Document.getInitialProps(ctx);
      const styleElements = sheet.getStyleElement();

      //const styleTags = sheet.getStyleTags();
      //TODO: set hash on styleTags
      //console.log('styles (a)', initialProps.styles);
      //console.log('styles (b1)', styleElements);
      //console.log('styles (b2)', styleTags);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {styleElements}
          </>
        ),
        ...ctx.query.pageProps
      };
    } finally {
      sheet.seal();
    }
  }
  render() {
    return (
      <Html lang="en">
        <Head>
          {/*<script nonce="testnonce" dangerouslySetInnerHTML={{ __html: `window.__webpack_nonce__ = "testnonce";window.NONCE_ID = "testnonce";console.log('client nonce', __webpack_nonce__);`}}/>*/}
          {/*process.env.NODE_ENV === 'production' && <meta httpEquiv="Content-Security-Policy" content={csp} />*/}
          {/*<link
            rel='preload'
            href='https://fonts.googleapis.com/css?family=Poppins:400&display=swap'
            as='font'
          />*/}
          {/*<link rel='preload' href='/static/fonts/GeosansLight.ttf' as='font' />*/}
          <link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
          <link rel="apple-touch-icon" href="/static/apple-touch-icon.png" />
          <meta
            name="Description"
            content="Kanvas is a tool designed for real-time co-operative project planning."
          ></meta>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
