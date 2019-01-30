import React, { Component } from "react"
import PropTypes from "prop-types"
import styled from "styled-components"
import * as d3 from "d3"

const metersToMiles = m => (m * 0.000621371).toFixed(1)
const metersToFeet = m => (m * 3.28084).toFixed(0)

const margin = { top: 50, right: 50, bottom: 50, left: 50 }
const width = 749 - margin.left - margin.right
const height = 250 - margin.top - margin.bottom

const ElevationChartStyles = styled.div`
  /* DELETE */
  .crossBar,
  .infoBox {
    display: inherit !important;
  }

  position: absolute;
  right: ${margin.right}px;
  z-index: 1000;

  text {
    font-size: 11px;
    stroke: none;
    fill: #999;
  }

  text.crossBarText {
    fill: #666;
    width: 200px;
  }

  path.domain {
    fill: none;
    stroke: #aaa;
  }

  g.tick {
    line {
      color: #999;
    }
  }

  .crossBar line {
    stroke: #333;
    stroke-width: 1px;
    pointer-events: none;
    /* shape-rendering: crispEdges; */
  }

  .chartOverlay {
    fill: none;
    pointer-events: all;
  }

  .infoBox rect {
    stroke: #ccccd1;
    pointer-events: none;
    stroke-width: 1px;
    shape-rendering: crispEdges;
    font-size: 11px;
    fill: #fff;
    fill-opacity: 0.9;
  }

  tspan,
  text.crossBarText {
    font-size: 13px;
  }

  tspan {
    fill: #2d2d32;
  }

  .infoBoxElevationValue,
  .infoBoxGradeValue {
    font-weight: 600;
  }
`

class ElevationChart extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: []
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { data } = this.state
    const { distances, elevations } = this.props
    const startDistance = 0
    const endDistance = distances.reduce(
      (acc, curr) => acc + curr,
      startDistance
    )

    const elevationsWithGrades = elevations.reduce((acc, curr, i, arr) => {
      if (i === arr.length - 1) {
        return acc.concat({ ...curr, grade: 0 })
      }
      return acc.concat({
        ...curr,
        grade: (
          ((arr[i + 1].elevation - curr.elevation) / curr.elevation) *
          100
        ).toFixed(2)
      })
    }, [])

    console.log("GRADES!", elevationsWithGrades)

    // endDistance divided by the number of elevation samples
    const sampleUnit = endDistance / 100
    console.log("END DISTNACE:", endDistance)

    if (distances.length && !prevProps.distances.length) {
      const newData = elevationsWithGrades.reduce((acc, curr, i) => {
        const dist = sampleUnit * (i + 1)
        return acc.concat({ x: dist, y: curr.elevation, ...curr })
      }, [])
      this.setState({ data: newData })
    }

    if (data.length && !prevState.data.length) {
      this.drawChart()
    }
  }

  drawChart = () => {
    const { data } = this.state
    console.log("DRAWING CHART, DATA:", data)

    const bisect = d3.bisector(function(d) {
      return d.x
    }).left

    const svg = d3
      .select("#elevationChart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      // MOVE 2 ATTRS INTO RESPONSIFY FUNCTION!
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("preserveAspectRatio", "xMinYMid")
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)

    const xScale = d3
      .scaleLinear()
      .domain([d3.min(data, co => co.x), d3.max(data, co => co.x)])
      .range([0, width])

    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).ticks(6))

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(data, co => co.y), d3.max(data, co => co.y)])
      .range([height, 0])

    svg.append("g").call(d3.axisLeft(yScale).ticks(7))

    const area = d3
      .area()
      .x(d => xScale(d.x))
      .y0(yScale(yScale.domain()[0]))
      .y1(d => yScale(d.y))
      .curve(d3.curveCatmullRom.alpha(0.005))

    svg
      .append("path")
      .attr("d", area(data))
      .attr("class", "elevationChartLine")
      .style("stroke", "#787979")
      .style("stroke-opacity", 0.2)
      .style("stroke-width", 1)
      .style("fill", "#787979")
      .style("fill-opacity", 0.2)

    const crossBar = svg
      .append("g")
      .attr("class", "crossBar")
      .style("display", "none")

    crossBar
      .append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", height)
      .attr("y2", 0)

    crossBar
      .append("text")
      .attr("x", 10)
      .attr("y", 17.5)
      .attr("class", "crossBarText")

    const infoBox = svg
      .append("g")
      .attr("class", "infoBox")
      .style("display", "none")

    infoBox
      .append("rect")
      .attr("x", 0)
      .attr("y", 10)
      .style("height", 45)
      .style("width", 125)

    const infoBoxElevation = infoBox
      .append("text")
      .attr("x", 8)
      .attr("y", 30)
      .attr("class", "infoBoxElevation")
    // .attr("class", "crossBarText")

    infoBoxElevation
      .append("tspan")
      .attr("class", "infoBoxElevationTitle")
      .text("Elev: ")

    infoBoxElevation.append("tspan").attr("class", "infoBoxElevationValue")

    const infoBoxGrade = infoBox
      .append("text")
      .attr("x", 8)
      .attr("y", 44)
      .attr("class", "infoBoxGrade")

    infoBoxGrade
      .append("tspan")
      .attr("class", "infoBoxGradeTitle")
      .text("Grade: ")

    infoBoxGrade.append("tspan").attr("class", "infoBoxGradeValue")

    // MOUSE IN / OUT EVENTS
    svg
      .append("rect")
      .attr("class", "chartOverlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function() {
        crossBar.style("display", null)
        infoBox.style("display", null)
      })
      .on("mouseout", function() {
        crossBar.style("display", "none")
        infoBox.style("display", "none")
      })
      .on("mousemove", mousemove)

    // NEEDS TO BE A FUNCTION FOR ACCESS TO THIS!
    function mousemove() {
      const x0 = xScale.invert(d3.mouse(this)[0])
      const i = bisect(data, x0, 1)
      const d0 = data[i - 1]
      const d1 = data[i]
      const d = x0 - d0.x > d1.x - x0 ? d1 : d0
      crossBar.attr("transform", `translate(${xScale(d.x)}, 0)`)
      crossBar.select("text").text(metersToMiles(d.x) + " mi")
      infoBox.attr("transform", `translate(${xScale(d.x) + 10}, 12.5)`)
      infoBox.select(".infoBoxElevationValue").text(metersToFeet(d.y) + " ft")
      infoBox.select(".infoBoxGradeValue").text(d.grade + "%")
    }
  }

  render() {
    const { data } = this.state
    console.log("DATA!", data)

    return (
      <ElevationChartStyles>
        <div>
          Elevation Chart:
          {data.length > 0 && <div id="elevationChart" />}
        </div>
      </ElevationChartStyles>
    )
  }
}

// ElevationChart.defaultProps = {}

ElevationChart.propTypes = {
  elevations: PropTypes.array.isRequired,
  distances: PropTypes.array.isRequired
}

export default ElevationChart