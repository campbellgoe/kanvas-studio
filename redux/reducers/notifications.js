import {
  CREATE_TOAST_CARD,
  REMOVE_TOAST_CARD,
  KEEP_NOTIFICATION_ALIVE
} from "../actions";
const initialState = { notifications: new Map(), maxNotifications: 6 };

export default function(state = initialState, action) {
  const cards = state.notifications;
  switch (action.type) {
    case "CREATE_TOAST_CARD": {
      const maxCards = state.maxNotifications;
      const key = action.key;
      if (cards.size >= maxNotifications) {
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
          maxNotifications,
          "cards..."
        );
        cards.delete(oldestCard.key);
      }
      console.log("creating toast, key:", key);
      return {
        ...state,
        cards: cards.set(key || uuid(), {
          ...action.payload,
          createdAt: Date.now()
        })
      };
    }
    case "REMOVE_TOAST_CARD": {
      const { key, removeType = "auto" } = payload;
      const { allowAutoHide = true } = cards.get(key) || {};
      //if auto remove is allowed or this is a manual remove action e.g. click close button, delete the card.
      if (
        (removeType === "auto" && allowAutoHide === true) ||
        removeType === "manual"
      ) {
        cards.delete(key);
      }
      return { ...state, cards };
    }
    case "DONT_AUTOCLOSE_TOAST_CARD": {
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
