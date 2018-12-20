import axios from "axios"

import { SERVER_URI } from "../../config"
import {
  LOADING_TRIPS,
  LOADING_TRIPS_SUCCESS,
  LOADING_TRIPS_ERROR,
  CREATING_TRIP,
  CREATING_TRIP_SUCCESS,
  CREATING_TRIP_ERROR
} from "./types"

export const getTrips = () => dispatch => {
  dispatch({ type: LOADING_TRIPS })
  return axios
    .get(`${SERVER_URI}/trips`)
    .then(res => {
      dispatch({ type: LOADING_TRIPS_SUCCESS, payload: res.data })
    })
    .catch(err => {
      dispatch({ type: LOADING_TRIPS_ERROR, payload: err })
      //errorHandler(err)
      console.error("GET TRIPS ERROR!", err)
    })
}

export const createTrip = trip => dispatch => {
  dispatch({ type: CREATING_TRIP })
  return axios
    .post(`${SERVER_URI}/trips`, trip)
    .then(res => {
      console.log("CREATE TRIP RESPONSE:", res)

      dispatch({ type: CREATING_TRIP_SUCCESS, payload: res.data })
    })
    .catch(err => {
      dispatch({ type: CREATING_TRIP_ERROR, payload: err })
      //errorHandler(err)
      console.error("CREATE TRIP ERROR!", err)
    })
}