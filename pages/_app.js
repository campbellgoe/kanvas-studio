import App from "next/app";
import Head from "next/head";
import React from "react";
import { ThemeProvider } from "styled-components";
//import { StateProvider } from "../utils/useStateValue";
import theme from "../theme";

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <ThemeProvider theme={theme}>
        <div>
          <Head>
            <title>Kanvas real-time project planning software</title>
          </Head>
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    );
  }
}

export default MyApp;
