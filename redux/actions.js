//notifications
export const CREATE_NOTIFICATION = "CREATE_NOTIFICATION";
export const REMOVE_NOTIFICATION = "REMOVE_NOTIFICATION";
export const KEEP_NOTIFICATION_ALIVE = "KEEP_NOTIFICATION_ALIVE";

export const createNotification = payload => ({
  type: CREATE_NOTIFICATION,
  payload
});

export const keepNotificationAlive = key => ({
  type: KEEP_NOTIFICATION_ALIVE,
  payload: { key }
});

export const removeNotification = key => ({
  type: REMOVE_NOTIFICATION,
  payload: { key, removeType: "manual" }
});

//project
export const SET_NAMESPACE = "SET_NAMESPACE";
export const SET_OBJECT = "SET_OBJECT";
export const SET_OBJECTS = "SET_OBJECTS";
export const DELETE_OBJECT = "DELETE_OBJECT";
export const MOVE_OBJECT = "MOVE_OBJECT";

export const setNamespace = namespace => ({ type: SET_NAMESPACE, namespace });

export const setObject = (key, payload) => ({ type: SET_OBJECT, key, payload });

export const setObjects = (objects, config) => {
  return {
    type: SET_OBJECTS,
    objects: objects.map(object => {
      if (object instanceof Error) {
        return console.error(object);
      }
      return object;
    }),
    config
  };
};

export const deleteObject = key => ({ type: DELETE_OBJECT, key });

export const moveObject = (key, position) => ({
  type: MOVE_OBJECT,
  key,
  position
});

//viewport
export const SET_VIEWPORT = "SET_VIEWPORT";

export const setViewport = size => ({ type: SET_VIEWPORT, size });

//pointer
export const SET_POINTER_MODIFIER = "SET_POINTER_MODIFIER";

export const setPointerModifier = modifier => ({
  type: SET_POINTER_MODIFIER,
  modifier
});

export const SET_POINTER = "SET_POINTER";

export const setPointer = pointer => ({
  type: SET_POINTER,
  pointer
});
