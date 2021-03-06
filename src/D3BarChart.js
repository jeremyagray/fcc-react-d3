import {
  useEffect,
  useRef,
  useState
} from 'react';
import axios from 'axios';
import * as d3 from 'd3';

function BarChart() {
  return (
    <div className="BarChart">
      <BarChartSVG />
    </div>
  );
}

function BarChartSVG() {
  // Refs.
  const ref = useRef();

  // Data state.
  const [data, setData] = useState({'id': ''});
  const [loadingData, setLoadingData] = useState(true);
  const [loadingDataError, setLoadingDataError] = useState(null);

  useEffect(() => {
    // const dataURL = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
    const dataURL = process.env.PUBLIC_URL + '/data/GDP-data.json';
    let isMounted = true;
    setLoadingData(true);

    async function fetchData() {
      try {
        const response = await axios.get(dataURL);
        if (isMounted) {
          setData(response.data);
          setLoadingData(false);
          generateBarChart(data, ref.current);
        }
      } catch (error) {
        if (isMounted) {
          setLoadingDataError(error.message);
          setLoadingData(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data['id']]);

  if (loadingData) {
    return (
      <div>
        <p>
          Loading GDP data...
        </p>
      </div>
    );
  } else if (loadingDataError) {
    return (
      <div>
        <p>
          Error loading data:  {loadingDataError}
        </p>
      </div>
    );
  } else {
    return (
      <div
        ref={ref}
      />
    );
  }
}

export default BarChart;

function quarterize(firstDay)
{
  let times = firstDay.split('-');

  return `Q${Math.floor((parseInt(times[1]) - 1) / 3) + 1} ${parseInt(times[0])}`;
}

function billions(amt)
{
  return '$' + amt + 'B';
}

function generateBarChart(raw, element) {
  let data = [];
  const parseTime = d3.timeParse("%Y-%m-%d");
  for (let i = 0; i < raw['data'].length; i++)
  {
    data.push({
      'date': raw.data[i][0],
      'gdp': raw.data[i][1],
      'dateObj': parseTime(raw.data[i][0])
    });
  }
  
  // Visualization dimensions.
  const palletteDimensions = {
    'height': 800,
    'width': 1200
  };

  const padding = {
    'top': 50,
    'right': 50,
    'bottom': 80,
    'left': 80
  };

  const graphDimensions = {
    // Overall.
    'height': palletteDimensions.height - padding.top - padding.bottom,
    'width': palletteDimensions.width - padding.right - padding.left,

    // Side positions.
    'top': padding.top,
    'right': palletteDimensions.width - padding.right,
    'bottom': palletteDimensions.height - padding.bottom,
    'left': padding.left
  };

  const barWidth = graphDimensions.width / data.length;
  const gdpMax = d3.max(data, (d) => d.gdp);
  const maxBarHeight = palletteDimensions.height - (padding.top + padding.bottom);

  // Tooltip.
  const tooltip = d3.select(element)
	.append('div')
	.attr('id', 'tooltip')
	.style('opacity', '0')
	.style('display', 'none')
	.style('visibility', 'hidden');

  // SVG canvas.
  const svg = d3.select(element)
	.append("svg")
	.attr("id", "canvas")
	.attr("width", palletteDimensions.width)
	.attr("height", palletteDimensions.height);
  
  // Bars.
  svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('data-date', (d, i) => {return d.date;})
    .attr('data-gdp', (d, i) => {return d.gdp;})
    .attr('fill', '#005900')
    .attr('x', (d, i) =>
      {
        return (padding.left + (i * barWidth));
      })
    .attr('y', (d, i) =>
      {
        return ((graphDimensions.bottom) - ((d.gdp / gdpMax) * maxBarHeight));
      })
    .attr('width', barWidth)
    .attr('height', (d, i) =>
      {
        return (d.gdp / gdpMax) * maxBarHeight;
      })
    .on('mouseenter mouseover', function(event, datum) {
        d3.select(this).attr('fill', '#ffffff');

        tooltip
	  .attr('id', 'tooltip')
	  .style('display', 'inline')
          .style('position', 'absolute')
          .style('width', '250px')
          .style('height', '50px')
	  .style('visibility', 'visible')
	  .style('opacity', '0.75')
	  .attr('data-date', datum.date)
	  .attr('data-gdp', datum.gdp)
	  .html(`<p>${quarterize(datum.date)}:  ${billions(datum.gdp)}</p>`);
      })
    .on('mousemove', function(event, datum) {
        tooltip
          .style('left', (event.pageX + 20) + 'px')
          .style('top', (event.pageY + 20) + 'px');
      })
    .on('mouseout mouseleave', function(event, datum) {
        d3.select(this).attr('fill', '#005900');

        tooltip
          .style('opacity', '0')
	  .style('display', 'none')
	  .style('visibility', 'hidden');
      });
  
  // Scales and axes.
  
  // Get the latest date and add three months to go through the end
  // of the quarter.
  let dateMin = d3.min(data, (d) => d.dateObj);
  let dateMax = d3.max(data, (d) => d.dateObj);
  dateMax.setMonth(dateMax.getMonth() + 3);

  const xScale = d3.scaleTime()
        .domain([dateMin, dateMax])
        .range([graphDimensions.left, graphDimensions.right]);
  const yScale = d3.scaleLinear()
        .domain([0, gdpMax])
        .range([graphDimensions.bottom, graphDimensions.top]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  svg.append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${graphDimensions.bottom})`)
    .call(xAxis);

  svg.append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(${graphDimensions.left})`)
    .call(yAxis);
  
  svg.append('text')
    .attr('id', 'title')
    .attr('x', palletteDimensions.width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .style('font-size', '2em')
    .text('United States GDP');

  svg.append('text')
    .attr('id', 'x-axis-label')
    .attr('x', palletteDimensions.width / 2)
    .attr('y', palletteDimensions.height - 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.5em')
    .text('Quarter');

  const xCoord = 20;
  const yCoord = palletteDimensions.height / 2;
  const xCoordPreRot = -yCoord;
  const yCoordPreRot = xCoord;

  svg.append('text')
    .attr('id', 'y-axis-label')
    .attr("transform", "rotate(-90)")
    .attr('x', xCoordPreRot)
    .attr('y', yCoordPreRot)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.5em')
    .text('Billions (USD)');
}
