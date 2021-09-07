import {
  useEffect,
  useRef,
  useState
} from 'react';
import axios from 'axios';
import * as d3 from 'd3';

function ScatterChart() {
  return (
    <div className="ScatterChart">
      <ScatterChartContainer />
    </div>
  );
}

function ScatterChartContainer() {
  return (
    <div className="ScatterChartContainer">
      <ScatterChartSVG />
    </div>
  );
}

function ScatterChartSVG() {
  // Refs.
  const ref = useRef();

  // Data state.
  const [scatterData, setScatterData] = useState([{'Seconds': 0}]);
  const [loadingScatterData, setLoadingScatterData] = useState(true);
  const [loadingScatterDataError, setLoadingScatterDataError] = useState(null);

  useEffect(() => {
    // const dataURL = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json';
    const dataURL = process.env.PUBLIC_URL + '/data/cyclist-data.json';
    let isMounted = true;
    setLoadingScatterData(true);

    async function fetchData() {
      try {
        const response = await axios.get(dataURL);
        if (isMounted) {
          console.log(response.data);
          setScatterData(response.data);
          setLoadingScatterData(false);
          generateScatterChart(scatterData, ref.current);
        }
      } catch (error) {
        if (isMounted) {
          setLoadingScatterDataError(error.message);
          setLoadingScatterData(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [scatterData[0]['Seconds']]);

  if (loadingScatterData) {
    return (
      <div>
        <p>
          Loading cycling data...
        </p>
      </div>
    );
  } else if (loadingScatterDataError) {
    return (
      <div>
        <p>
          Error loading data:  {loadingScatterDataError}
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

export default ScatterChart;

function generateScatterChart(data, element) {
  // {
  //   "Time": "36:50",
  //   "Place": 1,
  //   "Seconds": 2210,
  //   "Name": "Marco Pantani",
  //   "Year": 1995,
  //   "Nationality": "ITA",
  //   "Doping": "Alleged drug use during 1995 due to high hematocrit levels",
  //   "URL": "https://en.wikipedia.org/wiki/Marco_Pantani#Alleged_drug_use"
  // }

  const parseYear = d3.timeParse('%Y');
  const parseTimes = d3.timeParse('%M:%S');

  // Padding.
  const padding = 50;

  // Dimensions of graph.
  const width = 900;
  const height = Math.floor(width * 2 / 3);
  const radius = 2
  
  // Scales.
  const xMin = d3.min(data, (d) => 
    {
      let year = parseYear(d.Year);
      return year.setYear(year.getFullYear() - 1);
    });
  const xMax = d3.max(data, (d) => 
    {
      let year = parseYear(d.Year);
      return year.setYear(year.getFullYear() + 1);
    });
  const xScale = d3.scaleTime()
        .domain([xMin, xMax])
        .range([padding, width - padding]);
  const yMin = d3.min(data, (d) =>
    {
      return parseTimes(d.Time);
    });
  const yMax = d3.max(data, (d) =>
    {
      return parseTimes(d.Time);
    });
  const yScale = d3.scaleTime()
        .domain([yMax, yMin])
        .range([height - padding, padding]);

  // Visualization SVG.
  const svg = d3.select(element)
        .append("svg")
        .attr("id", "scatterChartSVG")
        .attr("width", width)
        .attr("height", height)
        .style('background-color', '#ccccdf');

  // Visualization title.
  svg.append('text')
    .attr('id', 'title')
    .attr('x', (width / 2))
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '24px')
    .style('text-decoration', 'underline')
    .text('Tour de France Doping');

  // Graph description.
  svg.append('text')
    .attr('id', 'description')
    .attr('x', (width / 2))
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Alp de Huez Times (mm:ss)');

  // Tooltip.
  const tooltip = d3.select(element)
        .append('div')
        .attr('id', 'tooltip')
        .attr('data-xvalue', '')
        .attr('data-yvalue', '')
        .style('opacity', '0')
        .style('display', 'none')
        .style('visibility', 'hidden');
  
  // Legend.
  const legend = d3.select(element)
        .append('div')
        .attr('id', 'legend')
        .style('border', '2px solid #00000')
        .style('top', '200px')
        .style('left', '900px')
        .style('opacity', '0.8')
        .style('visibility', 'visible')
        .style('width', '250px')
        .style('height', '150px')
        .style('background-color', '#ccccff')
        .style('position', 'absolute')
        .html('<ul><li>suspected doping</li><li>presumed clean</li></ul>');

  svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('data-xvalue', (d, i) => {return parseYear(d.Year);})
    .attr('data-yvalue', (d, i) => {return parseTimes(d.Time);})
    .attr('fill', (d, i) => 
      {
        if (d.Doping === '')
        {
          return '#666600';
        }
        else
        {
          return '#006666';
        }
      })
    .attr('r', '5')
    .attr('cx', (d, i) =>
      {
        return xScale(parseYear(d.Year));
      })
    .attr('cy', (d, i) =>
      {
        return yScale(parseTimes(d.Time));
      })
    .on('mouseenter mouseover', (event, datum) =>
      {
        tooltip
          .attr('id', 'tooltip')
          .style('display', 'inline')
          .style('position', 'absolute')
          .style('visibility', 'visible')
          .style('opacity', '0.75')
          .style('left', (event.pageX + 20) + 'px')
          .style('top', (event.pageY + 20) + 'px')
          .attr('data-year', parseYear(datum.Year))
          .attr('data-time', parseTimes(datum.Time))
          .html(`<p>${datum.Name}, ${datum.Time} (${datum.Year})</p>`);
      })
    .on('mousemove', (event, datum) =>
      {
        tooltip
          .style('left', (event.pageX + 20) + 'px')
          .style('top', (event.pageY + 20) + 'px');
      })
    .on('mouseout mouseleave', (event, datum) =>
      {
        tooltip
          .style('opacity', '0')
          .style('display', 'none')
          .style('visibility', 'hidden');
      });
  
  // Axes.
  
  const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%Y'));
  const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.timeFormat('%M:%S'));

  svg.append("g")
    .attr("id", "x-axis")
    .attr("transform", "translate(0, " + (height - padding) + ")")
    .call(xAxis);

  svg.append("g")
    .attr("id", "y-axis")
    .attr("transform", "translate(" + padding + ")")
    .call(yAxis);
}
