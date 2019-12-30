import { SET_POINTER_MODIFIER, SET_POINTER } from "../actions";

const initialState = {
  modifier: {
    dragItem: ""
  },
  x: null,
  y: null,
  isDown: false,
  isMove: false,
  isDrag: false,
  controlType: "left?",
  eventType: "mouse?",
  downControlType: "left?",
  downPos: { x: null, y: null }
};

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_POINTER_MODIFIER: {
      return {
        ...state,
        modifier: action.modifier
      };
    }
    case SET_POINTER: {
      return {
        ...state,
        ...action.pointer,
        modifier: state.modifier
      };
    }
    default: {
      return state;
    }
  }
}
