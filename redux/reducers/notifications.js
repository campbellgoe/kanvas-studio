import {
  CREATE_NOTIFICATION,
  REMOVE_NOTIFICATION,
  KEEP_NOTIFICATION_ALIVE
} from "../actions";
const uuid = require("uuid/v4");
const initialState = { cards: new Map(), maxCards: 6 };

export default function(state = initialState, { type, payload }) {
  const cards = state.cards;
  switch (type) {
    case "CREATE_NOTIFICATION": {
      const maxCards = state.maxCards;
      const key = payload.key;
      if (cards.size >= maxCards) {
        let oldestCard = { createdAt: Infinity, key };
        cards.forEach(({ createdAt }, key) => {
          if (createdAt < oldestCard.createdAt) {
            oldestCard = {
              createdAt,
              key
            };
          }
        });
        console.log(
          "deleting oldest card due to a maximum of",
          maxCards,
          "cards..."
        );
        cards.delete(oldestCard.key);
      }
      console.log("creating toast, key:", key);
      return {
        ...state,
        cards: cards.set(key || uuid(), {
          allowAutoHide: true,
          ...payload,
          createdAt: Date.now()
        })
      };
    }
    case "REMOVE_NOTIFICATION": {
      const { key, removeType = "auto" } = payload;
      const { allowAutoHide } = cards.get(key) || {};
      //if auto remove is allowed or this is a manual remove action e.g. click close button, delete the card.
      if (
        (removeType === "auto" && allowAutoHide === true) ||
        removeType === "manual"
      ) {
        cards.delete(key);
      }
      return { ...state, cards };
    }
    case "KEEP_NOTIFICATION_ALIVE": {
      const { key } = payload;
      if (!cards.get(key)) {
        console.warn("key", key, "not found in toast cards data");
        return state;
      }
      return {
        ...state,
        cards: cards.set(key || uuid(), {
          ...cards.get(key),
          allowAutoHide: false
        })
      };
    }
    default: {
      return state;
    }
  }
}
