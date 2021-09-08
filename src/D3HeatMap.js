import {
  useEffect,
  useRef,
  useState
} from 'react';
import axios from 'axios';
import * as d3 from 'd3';

function HeatMap() {
  return (
    <div className="HeatMap">
      <HeatMapContainer />
    </div>
  );
}

function HeatMapContainer() {
  return (
    <div className="HeatMapContainer">
      <HeatMapSVG />
    </div>
  );
}

function HeatMapSVG() {
  // Refs.
  const ref = useRef();

  // Data state.
  const [data, setData] = useState({'baseTemperature': ''});
  const [loadingData, setLoadingData] = useState(true);
  const [loadingDataError, setLoadingDataError] = useState(null);

  useEffect(() => {
    // const dataURL = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
    const dataURL = process.env.PUBLIC_URL + '/data/global-temperature.json';
    let isMounted = true;
    setLoadingData(true);

    async function fetchData() {
      try {
        const response = await axios.get(dataURL);
        console.log(response);
        if (isMounted) {
          setData(response.data);
          setLoadingData(false);
          console.log(`before: ${data.baseTemperature}`);
          generateHeatMap(data, ref.current);
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
  }, [data.baseTemperature]);

  if (loadingData) {
    return (
      <div>
        <p>
          Loading data...
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

export default HeatMap;

function generateHeatMap(data, element='div') {
  // Data and data properties.
  const baseline = data.baseTemperature;
  const series = data.monthlyVariance;
  const items = series.length;
  const months = 12;
  const years = Math.ceil(items / 12);
  
  const parseYear = d3.timeParse('%Y');
  const parseMonth = d3.timeParse('%m');

  // Dimensions of graph.
  const pallette = {
    height: 800,
    width: 1200
  };
  const padding = {
    top: 60,
    right: 40,
    bottom: 120,
    left: 100
  };
  const graphSize = {
    height: pallette.height - padding.top - padding.bottom,
    width: pallette.width - padding.left - padding.right
  };
  const graphPositions = {
    top: padding.top,
    right: pallette.width - padding.right,
    bottom: pallette.height - padding.bottom,
    left: padding.left, center: ((pallette.width - padding.right) + padding.left) / 2
  };
  const cell = {
    height: graphSize.height / months,
    width: graphSize.width / years
  };
  
  // Dimensions of tooltip.
  const tooltipSize = {
    height: 50,
    width: 200
  };

  // Scales.

  // X scales.
  const xMin = d3.min(series, (d) => 
    {
      return parseYear(d.year);
    });
  const xMax = d3.max(series, (d) => 
    {
      return parseYear(d.year);
    });
  xMax.setYear(xMax.getFullYear() + 1);
  const xScale = d3.scaleTime()
        .domain([xMin, xMax])
        .range([graphPositions.left, graphPositions.right]);

  // Y scales.
  let yScaleDomain = [];
  for (let i = 0; i <= 11; i++)
  {
    yScaleDomain.push(i);
  }

  const yScale = d3.scaleBand()
	.domain(yScaleDomain)
	.range([graphPositions.top, graphPositions.bottom]);
  
  // Color scale.
  let graphColorScale = d3.scaleSequential()
      .domain([-7, 7]);
  let legendColorScale = d3.scaleSequential()
      .domain([-7, 7]);
  let getGraphScaleColor = graphColorScale.interpolator(d3.interpolateYlOrRd);
  let getLegendScaleColor = graphColorScale.interpolator(d3.interpolateYlOrRd);

  const svg = d3.select(element)
        .append("svg")
        .attr("id", "title")
        .attr("height", pallette.height)
        .attr("width", pallette.width);

  // Graph title.
  svg.append("text")
    .attr('id', 'title')
    .attr("x", (pallette.width / 2))
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("text-decoration", "underline")
    .text('Monthly Average Temperatures');

  // Graph description.
  svg.append("text")
    .attr('id', 'description')
    .attr("x", (pallette.width / 2))
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text('Monthly Global Land Temperature, 1753-2015');

  // Legend.
  let legendDomain = [];
  let legendSteps = legendColorScale.domain()[1] - legendColorScale.domain()[0];
  let legendStart = (2 * legendColorScale.domain()[0] + 1) / 2;
  for (let i = 0; i < legendSteps; i++)
  {
    legendDomain.push(legendStart + i);
  }

  const legendSquare = 30;
  const legendPallette = {
    height: 1 * legendSquare,
    width: (legendSteps + 2) * legendSquare
  };
  const legendPadding = {
    top: legendSquare,
    right: legendSquare,
    bottom: legendSquare,
    left: legendSquare
  };
  const legendSize = {
    height: legendPallette.height + legendPadding.top + legendPadding.bottom,
    width: legendPallette.width + legendPadding.left + legendPadding.right
  };
  const legendPositions = {
    top: legendPadding.top,
    right: legendSize.width - legendPadding.right,
    bottom: legendSize.height - legendPadding.bottom,
    left: legendPadding.left
  };

  svg
    .append('g')
    .attr('id', 'legend')
    .selectAll('rect.colorLegend')
    .data(legendDomain)
    .enter()
    .append('rect')
    .attr('class', 'colorLegend')
    .attr('height', legendSquare)
    .attr('width', legendSquare)
    .attr('x', (d, i) => {return legendPositions.left + ((graphSize.width / 2) - 210) + legendSquare * (i + 1);})
    .attr('y', pallette.height - 90)
    .style('fill', (d, i) => {return getLegendScaleColor(d);});

  const legendXAxis = d3
        .axisBottom(legendColorScale.range([legendPositions.left + legendSquare, legendPositions.right - legendSquare]))
        .ticks(legendSteps);

  svg
    .append('text')
    .attr('id', 'legendDescription')
    .attr('x', pallette.width / 2)
    .attr('y', pallette.height - 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Variance (Celsius)');

  svg.append("g")
    .attr("id", "legend-x-axis")
    .attr("transform", `translate(${(graphSize.width / 2) - 210}, ${pallette.height - 60})`)
    .call(legendXAxis);

  // Set the font-size of the legend ticks.
  svg.selectAll('g#legend-x-axis>g.tick>text').style('font-size', '16px')

  const legendTooltip =
        d3.select('body')
        .append('div')
        .attr('id', 'tooltip')
        .attr('data-year', '')
        .attr('data-month', '')
        .attr('data-variance', '')
        .style('height', tooltipSize.height)
        .style('width', tooltipSize.width)
        .style('opacity', '0')
        .style('visibility', 'hidden');

  // Axes.
  const xAxis = d3.axisBottom(xScale)
	.ticks(Math.floor(years/10))
	.tickFormat(d3.timeFormat('%Y'));

  const yAxis = d3.axisLeft(yScale)
	.tickFormat((month) =>
	  {
	    let m = new Date(2020, month, 1);
	    return m.toLocaleString('default', {month: 'long'});
	  })

  svg.selectAll('rect.cell')
    .data(series)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('data-year', (d, i) =>
      {
	return d.year;
      })
    .attr('data-month', (d, i) =>
      {
        return d.month - 1;
      })
    .attr('data-temp', (d, i) => {return baseline + d.variance;})
    .attr('data-variance', (d, i) => {return d.variance;})
    .attr('x', (d, i) =>
      {
        return xScale(parseYear(d.year));
      })
    .attr('y', (d, i) =>
      {
        return yScale(d.month - 1);
      })
    .attr('height', yScale.bandwidth())
    .attr('width', cell.width)
    .style('fill', (d, i) =>
      {
        return getGraphScaleColor(d.variance);
      })
  // D3 v6 mouse events.
    .on('mouseenter mouseover', (event, datum) =>
      {
        legendTooltip
          .attr('id', 'tooltip')
          .style('display', 'inline')
          .style('position', 'absolute')
          .style('visibility', 'visible')
          .style('opacity', '0.50')
          .style('left', `${event.pageX + 20}px`)
          .style('top', `${event.pageY + 20}px`)
          .style('border', '2px solid white')
          .attr('data-year', datum.year)
          .attr('data-month', parseMonth(datum.month))
          .attr('data-temp', baseline + datum.variance)
          .attr('data-variance', datum.variance)
          .style('background-color', getGraphScaleColor(datum.variance))
          .html(`<p>${parseMonth(datum.month).toLocaleString('default', {month: 'long'})} ${parseYear(datum.year).getFullYear()}:  ${datum.variance}&#176;C</p>`);
      })
    .on('mousemove', (event, datum) =>
      {
        // const tooltip = d3.select('div#tooltip')
        legendTooltip
          .style('left', (event.pageX + 20) + 'px')
          .style('top', (event.pageY + 20) + 'px');
      })
    .on('mouseout mouseleave', (event, datum) =>
      {
        legendTooltip
          .style('opacity', '0')
          .style('display', 'none')
          .style('visibility', 'hidden');
      });
  
  svg.append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${graphPositions.bottom})`)
    .call(xAxis);

  svg.append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(${graphPositions.left})`)
    .call(yAxis);

  // Set x/y axis tick font-size.
  svg.selectAll('g#x-axis>g.tick>text').style('font-size', '16px')
  svg.selectAll('g#y-axis>g.tick>text').style('font-size', '16px')
}
