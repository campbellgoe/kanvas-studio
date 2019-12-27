import {
  SET_NAMESPACE,
  SET_OBJECT,
  DELETE_OBJECT,
  MOVE_OBJECT
} from "../actions.js";
const initialState = {
  namespace: "ahey",
  updatedAt: "Never",
  objects: new Map([["infinity.png", { x: 100, y: 200 }]])
};
const mustHave = (action, property, mustBeOfType, suffix) => {
  if (typeof action[property] != mustBeOfType) {
    throw new TypeError(
      `${action.type}: must have ${property} ${mustBeOfType}${suffix}.`
    );
  }
};
const mustHaveOfShape = (action, property, ofShape) => {
  const input = action[property];
  for (let requiredProperty in ofShape) {
    const mustBeOfType = ofShape[requiredProperty];
    if (typeof mustBeOfType == "object") {
      mustHaveOfShape(input, requiredProperty, mustBeOfType);
    } else {
      mustHave(
        action[property],
        requiredProperty,
        mustBeOfType,
        " in " + property
      );
    }
  }
};
const projectReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_NAMESPACE: {
      mustHave(action.type, "namespace", "string");
      return {
        //new namespace, so reset project state to initial state (until can cache data)
        ...initialState,
        namespace: action.namespace
      };
    }
    case SET_OBJECT: {
      const key = action.key;
      const payload = action.payload;
      mustHave(action.type, "key", "string");
      mustHave(action.type, "payload", "object");
      const objects = state.objects;
      return {
        ...state,
        objects: objects.set(key, {
          ...payload,
          //for the specific object
          updatedAt: Date.now()
        }),
        //for the project data in general
        updatedAt: Date.now()
      };
    }
    case DELETE_OBJECT: {
      const key = action.key;
      const objects = state.objects;
      mustHave(action.type, "key", "string");
      const isDeleted = objects.delete(key);
      if (!isDeleted) {
        throw new Error(
          `${DELETE_OBJECT}: key '${key}' not found in objects, cannot delete.`
        );
      }
      return {
        ...state,
        objects,
        updatedAt: Date.now()
      };
    }
    case MOVE_OBJECT: {
      const key = action.key;
      const position = action.position;
      const objects = state.objects;
      mustHave(action.type, "key", "string");
      mustHaveOfShape(action.type, "position", { x: "number", y: "number" });
      const objectToMove = objects.get(key);
      return {
        ...state,
        objects: objects.set(key, {
          ...objectToMove,
          ...position
        }),
        updatedAt: Date.now()
      };
    }
    default: {
      return state;
    }
  }
};

export default projectReducer;
