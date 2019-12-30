import { combineReducers } from "redux";
import notifications from "./notifications";
import project from "./project";
import viewport from "./viewport";
import pointer from "./pointer";

export default combineReducers({ project, notifications, viewport, pointer });
