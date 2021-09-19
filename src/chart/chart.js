import { useEffect } from 'react';
import * as d3 from 'd3';
import dataJson from '../vietnam-province-data/datavn.geojson';
import './chart.css';

Chart.propTypes = {};

const ID_CONTAINER = 'map-vietnam'; 
 
function Chart(props) {
  useEffect(() => {
    const margin = { top: 10, right: 60, bottom: 40, left: 60 };
    const width =
      +d3.select(`#${ID_CONTAINER}`).style('width').replace('px', '') - margin.left - margin.right;
    const height =
      +d3.select(`#${ID_CONTAINER}`).style('height').replace('px', '') - margin.top - margin.bottom;

    d3.select(`#${ID_CONTAINER}`).selectAll('*').remove();
    // The svg
    const svg = d3
      .select(`#${ID_CONTAINER}`)
      .append('svg')
      .attr('class', 'svg-main')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Map and projection
    const projection = d3
      .geoMercator()
      .center([108, 21]) // GPS of location to zoom on
      .scale(3500) // This is like the zoom
      .translate([width / 2, height / 4]);

    // Data and color scale
    let data = new Map();

    // Load external data and boot
    Promise.all([
      d3.json(dataJson),
      d3.tsv('./data/covid19-provinces.tsv', function (d) {
        console.log('covid 19 = ', d);
        data.set(d.Province, +d.Infected);
      }),
    ]).then(function (res) {
      // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
      // Its opacity is set to 0: we don't see it by default.
      const tooltip = d3
        .select(`#${ID_CONTAINER}`)
        .append('div')
        .style('opacity', 0)
        .attr('class', 'tooltip')
        .style('background-color', 'navy')
        .style('color', 'white')
        .style('border-radius', '5px')
        .style('padding', '10px')
        .style('position', 'absolute');

      const showTooltip = function (event, d) {
        console.log(data);
        tooltip.style('opacity', 1);
        tooltip
          .html(`${d.properties.Name}: ${data.get(d.properties.Name)}`)
          .style('left', event.x / 2 - 100 + 'px')
          .style('top', event.y / 2 + 'px');
      };
      const moveTooltip = function (event, d) {
        tooltip.style('left', event.x / 2 - 100 + 'px').style('top', event.y / 2 + 'px');
      };
      // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
      const hideTooltip = function (event, d) {
        tooltip.transition().style('opacity', 0);
      };

      const mouseLeave = (event, d) => {
        d3.selectAll('.province').style('opacity', 1);
        d3.selectAll('.province').style('stroke', 'grey').style('stroke-width', 0.1); //reset style

        // hideTooltip(event, d);
      };

      const mouseEnter = (event, d) => {
        d3.selectAll('.province').style('opacity', 0.5);
        d3.select(event.target)
          .style('opacity', 1)
          .style('stroke', 'navy')
          .style('stroke-width', 1);

        showTooltip(event, d);
      };

      const colorScale = d3
        .scaleThreshold()
        .domain([10, 50, 100, 1000, 2000, 3000])
        .range(d3.schemeGreens[6]);
      // Draw the map
      svg
        .append('g')
        .attr('class','map-all')
        .on('mouseleave', hideTooltip)
        .selectAll('path')
        .data(res[0].features)
        .join('path')
        .attr('d', d3.geoPath().projection(projection))
        .attr('fill', function (d) {
          d.total = data.get(d.properties.Name) || 0;
          return colorScale(d.total);
        })
        .style('stroke', 'grey')
        .style('stroke-width', 0.1)
        .attr('class', 'province')
        .style('opacity', 1)
        .on('mouseenter', mouseEnter)
        .on('mouseleave', mouseLeave)
        .on('mousemove', moveTooltip);

      // title
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', margin.top * 4)
        .attr('text-anchor', 'middle')
        .attr('class', 'title')
        .text('EN-Coronavirus (COVID-19) cases in Vietnam by provinces');

      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height + 5)
        .attr('text-anchor', 'middle')
        .attr('class', 'footer')
        .text('Last updated: August 9, 2021 ');


    });
  }, []);

  return <div id={ID_CONTAINER}></div>;
}

export default Chart;
