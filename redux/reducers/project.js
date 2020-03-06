import {
  SET_NAMESPACE,
  SET_OBJECT,
  SET_OBJECTS,
  DELETE_OBJECT,
  MOVE_OBJECT
} from "../actions.js";
const getLocalNamespace = () => {
  if (typeof window == "object") {
    return window.localStorage.getItem("kanvas-studio_project.namespace");
  }
  return "";
};
const setLocalNamespace = namespace => {
  if (typeof window == "object") {
    window.localStorage.setItem("kanvas-studio_project.namespace", namespace);
  }
};
const initialState = {
  namespace: getLocalNamespace(),
  updatedAt: "Never",
  objects: new Map([])
};
const mustHave = (action, property, mustBeOfType, suffix = "") => {
  if (typeof action[property] != mustBeOfType) {
    throw new TypeError(
      `${action.type}: must have property '${property}' of type '${mustBeOfType}'${suffix}.`
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
      mustHave(action, "namespace", "string");
      const namespace = action.namespace;
      if (namespace === state.namespace) {
        return state;
      }
      //new namespace, clear objects data.
      const objects = state.objects;
      objects.clear();
      setLocalNamespace(namespace);
      return {
        ...state,
        namespace,
        objects
      };
    }
    case SET_OBJECT: {
      const key = action.key;
      const payload = action.payload;
      console.log("typeof action.key?", typeof action.key);
      mustHave(action, "key", "string");
      mustHave(action, "payload", "object");
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
    //NOTE: should this overwrite objects, or merge objects in ?
    case SET_OBJECTS: {
      mustHave(action, "objects", "object");
      const config = action.config;
      const overwrite = config.overwrite;
      const objects = state.objects;
      if (overwrite) {
        //overwrite the entire objects already in state with these objects.
        objects.clear();
      }
      action.objects.forEach(object => {
        if (!object || object instanceof Error) {
          //TODO: handle error at source, instead of pass it here to handle.
          console.error(object || "No object... must be buggy. fix this.");
          console.log("skipping");
        } else {
          console.log("object:", object);
          const { key, ...payload } = object;
          objects.set(key, { ...payload, updatedAt: Date.now() });
        }
      });
      return {
        ...state,
        objects,
        //for the project data in general
        updatedAt: Date.now()
      };
    }
    case DELETE_OBJECT: {
      const key = action.key;
      const objects = state.objects;
      mustHave(action, "key", "string");
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
      mustHave(action, "key", "string");
      mustHaveOfShape(action, "position", { x: "number", y: "number", z: "number" });
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
