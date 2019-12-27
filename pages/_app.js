import App from "next/app";
import Head from "next/head";
import React from "react";
import { ThemeProvider } from "styled-components";
//import { StateProvider } from "../utils/useStateValue";
import theme from "../theme";
import { Provider } from "react-redux";
import store from "../redux/store";

//const uuid = require("uuid/v4");

// const StateContainer = ({ children }) => {
//   const state = { cards: new Map(), maxCards: 6 };
//   const reducer = (state, { type, payload }) => {
//     const cards = state.cards;
//     switch (type) {
//       case "CREATE_NOTIFICATION": {
//         const maxCards = state.maxCards;
//         const { key } = payload;
//         if (cards.size >= maxCards) {
//           let oldestCard = { createdAt: Infinity, key };
//           cards.forEach(({ createdAt }, key) => {
//             if (createdAt < oldestCard.createdAt) {
//               oldestCard = {
//                 createdAt,
//                 key
//               };
//             }
//           });
//           console.log(
//             "deleting oldest card due to a maximum of",
//             maxCards,
//             "cards..."
//           );
//           cards.delete(oldestCard.key);
//         }
//         console.log("creating toast, key:", key, "payload:", payload);
//         return {
//           ...state,
//           cards: cards.set(key || uuid(), { ...payload, createdAt: Date.now() })
//         };
//       }
//       case "REMOVE_NOTIFICATION": {
//         const { key, removeType = "auto" } = payload;
//         const { allowAutoHide = true } = cards.get(key) || {};
//         //if auto remove is allowed or this is a manual remove action e.g. click close button, delete the card.
//         if (
//           (removeType === "auto" && allowAutoHide === true) ||
//           removeType === "manual"
//         ) {
//           cards.delete(key);
//         }
//         return { ...state, cards };
//       }
//       case "KEEP_NOTIFICATION_ALIVE": {
//         const { key } = payload;
//         if (!cards.get(key)) {
//           console.warn("key", key, "not found in toast cards data");
//           return state;
//         }
//         return {
//           ...state,
//           cards: cards.set(key || uuid(), {
//             ...cards.get(key),
//             allowAutoHide: false
//           })
//         };
//       }
//       default: {
//         return state;
//       }
//     }
//   };
//   return (
//     <StateProvider initialState={state} reducer={reducer}>
//       {children}
//     </StateProvider>
//   );
// };
//example
// const rootElement = document.getElementById("root");
// ReactDOM.render(
//   <Provider store={store}>
//     <TodoApp />
//   </Provider>,
//   rootElement
// );

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <ThemeProvider theme={theme}>
        <div>
          <Head>
            <title>Kanvas real-time project planning software</title>
          </Head>
          <Provider store={store}>
            <Component {...pageProps} />
          </Provider>
        </div>
      </ThemeProvider>
    );
  }
}
