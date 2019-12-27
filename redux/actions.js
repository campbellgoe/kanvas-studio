//notifications
export const CREATE_TOAST_CARD = "CREATE_TOAST_CARD";
export const REMOVE_TOAST_CARD = "REMOVE_TOAST_CARD";
export const DONT_AUTOCLOSE_TOAST_CARD = "DONT_AUTOCLOSE_TOAST_CARD";

export const createToastCard = payload => ({
  type: CREATE_TOAST_CARD,
  payload
});

//project
export const SET_NAMESPACE = "SET_NAMESPACE";
export const SET_OBJECT = "SET_OBJECT";
export const DELETE_OBJECT = "DELETE_OBJECT";
export const MOVE_OBJECT = "MOVE_OBJECT";

export const setNamespace = namespace => ({ type: SET_NAMESPACE, namespace });
