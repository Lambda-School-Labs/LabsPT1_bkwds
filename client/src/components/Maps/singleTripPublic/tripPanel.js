import React from "react"
import { connect } from "react-redux"
import PropTypes from "prop-types"
import { toast } from "react-toastify"

import { openModal, closeModal } from "../../../redux/actions/modal"

import { TripPropTypes } from "../../propTypes"
import DistanceIcon from "../../icons/DistanceSvg"
import ElevationIcon from "../../icons/ElevationSvg"
import AddIcon from "../../icons/AddSvg"
import * as util from "./mapUtil"
import * as s from "./components"
import Waypoint from "./Waypoint"
import marker from "../../icons/orange-marker.svg"
import startMarker from "../../icons/green-marker.svg"
import endMarker from "../../icons/black-marker.svg"

class TripPanel extends React.Component {
  state = {
    isEditing: false,
    saveToggle: false,
    trip: {},
    markers: [],
    elevation: null,
    tripDistance: null,
    disableSafety: false,
    hours: ""
  }

  componentDidMount() {
    this.setState({ trip: this.props.trip })
    this.props.closeModal()
    setTimeout(() => {
      this.renderWaypoints()
    }, 500)
  }

  //Use Andrews Elevation Implementation
  componentDidUpdate(_, prevState) {
    if (prevState.markers !== this.state.markers) {
      // this.getPathElevation()
      this.getPathDistance()
    }
  }

  addWaypoint = () => {
    const index = this.state.markers.length
    const marker = new window.google.maps.Marker({
      position: window.map.getCenter(),
      map: window.map,
      draggable: false,
      title: (index + 1).toString(),
      label: (index + 1).toString(),
      index: index
    })
    marker.addListener("dragend", ev => {
      const waypoints = this.state.trip.waypoints.map((item, i) => {
        if (index === i)
          return { ...item, lat: ev.latLng.lat(), lon: ev.latLng.lng() }
        else return item
      })
      this.setState({ trip: { ...this.state.trip, waypoints } })
      this.getPathDistance()
    })
    const waypoint = {
      name: `Checkpoint ${index}`,
      tripId: this.props.trip.id,
      order: index + 1,
      lat: marker.getPosition().lat(),
      lon: marker.getPosition().lng(),
      start: new Date(),
      end: new Date()
    }
    const waypoints = this.state.trip.waypoints.concat(waypoint)
    const markers = this.state.markers.concat(marker)
    this.setState({ markers, trip: { ...this.state.trip, waypoints } })
  }

  renderWaypoints = () => {
    console.log("rw called")
    const { maps } = window.google
    const { waypoints } = this.state.trip
    const markers = []
    const baseIcon = {
      anchor: new maps.Point(15, 30),
      scaledSize: new maps.Size(30, 30),
      labelOrigin: new maps.Point(15, 13)
    }
    const icons = {
      start: {
        url: startMarker,
        ...baseIcon
      },
      end: {
        url: endMarker,
        ...baseIcon
      },
      marker: {
        url: marker,
        ...baseIcon
      }
    }

    waypoints.forEach((waypoint, i) => {
      const position = {
        lat: waypoint.lat,
        lng: waypoint.lon
      }
      const icon =
        i === 0
          ? icons.start
          : i === waypoints.length - 1
          ? icons.end
          : icons.marker
      const label = {
        text: `${waypoint.order}`,
        color: "white",
        fontFamily: "Wals",
        fontWeight: "bold"
      }
      const marker = new maps.Marker({
        icon,
        position,
        map: window.map,
        title: waypoint.name,
        label
      })
      marker.setMap(window.map)
      marker.addListener("dragend", ({ latLng }) => {
        const updatedWaypoints = waypoints.map((item, index) =>
          index === i ? { ...item, lat: latLng.lat(), lon: latLng.lng() } : item
        )
        this.setState({
          trip: { ...this.state.trip, waypoints: updatedWaypoints }
        })
        this.getPathDistance()
      })
      markers.push(marker)
    })

    this.setState({ markers })
  }

  handleEditToggle = () => {
    this.setState({ isEditing: true, saveToggle: true }, () => {
      this.toggleDraggable()
    })
  }

  handleTitle = e => {
    this.setState({ trip: { ...this.state.trip, name: e.target.value } })
  }

  updateOrder = waypoints => {
    return waypoints.map((item, i) => {
      return { ...item, order: i }
    })
  }

  handleEdit = (e, i) => {
    const mapped = this.state.trip.waypoints.map((item, index) => {
      if (index === i) {
        return { ...item, name: e.target.value }
      }
      return item
    })
    this.setState({ trip: { ...this.state.trip, waypoints: mapped } })
  }

  deleteMapMarkers = i => {
    this.state.markers.forEach((item, index) => {
      if (i === index && item) {
        item.setMap(null)
      }
    })
    const updatedMarkers = this.state.markers.filter((_, index) => i !== index)
    updatedMarkers.forEach((item, index) => item.setLabel(`${index + 1}`))

    this.setState({ markers: updatedMarkers })
  }

  getPathDistance = () => {
    if (this.state.markers.length > 1) {
      let latlngs = this.state.markers.map(marker => ({
        lat: marker.getPosition().lat(),
        lng: marker.getPosition().lng()
      }))
      util.calcTotalDistance(latlngs).then(res => {
        this.setState({ tripDistance: res.toFixed(2) })
      })
    }
  }

  handleHoursInput = e => {
    this.setState({ [e.target.name]: e.target.value })
  }

  validateSafetyModalInput = () => {
    let { hours } = this.state

    if (hours === "") {
      toast("Please enter a number")
      return false
    } else {
      hours = Number(hours)
    }

    if (isNaN(hours)) {
      toast("Please enter a number")
      this.setState({ hours: "" })
      return false
    }
    this.setState({ hours })
    return true
  }

  render() {
    const { elevation, trip, tripDistance } = this.state

    return (
      <s.Panel>
        <s.PanelHeader>
          <s.TripTitleInput
            type="text"
            edit={isEditing}
            value={trip.name || ""}
            onChange={this.handleTitle}
            disabled={isEditing === false}
          />
        </s.PanelHeader>
        <s.PanelSubheader>
          <s.TripDetail>
            <DistanceIcon width="25px" height="25px" />
            {tripDistance}m
          </s.TripDetail>
          <s.TripDetail>
            <ElevationIcon width="25px" height="25px" />
            {elevation}m
          </s.TripDetail>
        </s.PanelSubheader>
        <s.WaypointsHeader>
          <h4>Waypoints</h4>
          <s.AddButton
            disabled={isEditing === false}
            edit={isEditing}
            onClick={() => this.addWaypoint()}
          >
            <AddIcon height="18px" width="18px" />
          </s.AddButton>
        </s.WaypointsHeader>
        <s.WaypointList>
          {trip.waypoints !== undefined &&
            trip.waypoints.map(({ name }, i) => (
              <Waypoint key={name} i={i} name={name} />
            ))}
        </s.WaypointList>
      </s.Panel>
    )
  }
}

const mapStateToProps = state => ({
  trip: state.trips.activeTrip,
  modalIsOpen: state.modal.isOpen
})

const mapDispatchToProps = {
  editTrip,
  startTrip,
  openModal,
  closeModal,
  addTripSafetyTimeLimit
}

TripPanel.propTypes = {
  editTrip: PropTypes.func.isRequired,
  startTrip: PropTypes.func.isRequired,
  trip: TripPropTypes,
  modalIsOpen: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  addTripSafetyTimeLimit: PropTypes.func.isRequired
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TripPanel)