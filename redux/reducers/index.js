import { combineReducers } from "redux";
import notifications from "./notifications";
import rooms from "./rooms";

export default combineReducers({ rooms, notifications });
