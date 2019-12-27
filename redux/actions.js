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
export const DELETE_OBJECT = "DELETE_OBJECT";
export const MOVE_OBJECT = "MOVE_OBJECT";

export const setNamespace = namespace => ({ type: SET_NAMESPACE, namespace });

export const setObject = (key, payload) => ({ type: SET_OBJECT, key, payload });

export const deleteObject = key => ({ type: DELETE_OBJECT, key });

export const moveObject = (key, position) => ({
  type: MOVE_OBJECT,
  key,
  position
});
