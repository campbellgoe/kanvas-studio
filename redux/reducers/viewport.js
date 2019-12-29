import { SET_VIEWPORT } from "../actions.js";
const initialState = { width: 1440, height: 900 };

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_VIEWPORT: {
      return {
        ...state,
        ...action.size
      };
    }
    default: {
      return state;
    }
  }
}
