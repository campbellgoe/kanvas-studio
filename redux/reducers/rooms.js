const initialState = {
  namespace: "ahey",
  liveNamespaces: []
};

const roomsReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_NAMESPACE": {
      return {
        ...state,
        namespace: action.payload
      };
    }
    default: {
      return state;
    }
  }
};

export default roomsReducer;
