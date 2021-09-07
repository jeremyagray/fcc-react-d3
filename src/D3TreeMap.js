import {
  useEffect,
  useRef,
  useState
} from 'react';
import axios from 'axios';
import * as d3 from 'd3';

function TreeMapGames() {
  return (
    <div className="TreeMapGames">
      <TreeMapGamesContainer />
    </div>
  );
}

function TreeMapGamesContainer() {
  return (
    <div className="TreeMapGamesContainer">
      <TreeMapGamesSVG />
    </div>
  );
}

function TreeMapGamesSVG() {
  // Refs.
  const ref = useRef();

  // Data state.
  const [data, setData] = useState({'name': ''});
  const [loadingData, setLoadingData] = useState(true);
  const [loadingDataError, setLoadingDataError] = useState(null);

  useEffect(() => {
    // const dataURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json';
    const dataURL = process.env.PUBLIC_URL + '/data/video-game-sales-data.json';
    let isMounted = true;
    setLoadingData(true);

    async function fetchData() {
      try {
        const response = await axios.get(dataURL);
        if (isMounted) {
          console.log(response.data);
          setData(response.data);
          setLoadingData(false);
          generateTreeMapGames(data, ref.current);
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
  }, [data['name']]);

  if (loadingData) {
    return (
      <div>
        <p>
          Loading cycling data...
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

export default TreeMapGames;

function generateTreeMapGames(games, element) {
  // Kickstarter pledges.
  // https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json
  // Movie sales.
  // https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json
  // Video games sales.
  // https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json

  // Visualization properties.

  const graphSize = {height: 600, width: 1000};
  const graphPadding = {top: 0, right: 0, bottom: 0, left: 0};
  const palletteSize = {height: graphSize.height + graphPadding.top + graphPadding.bottom, width: graphSize.width + graphPadding.left + graphPadding.right};
  const graphPositions = {top: graphPadding.top, right: palletteSize - graphPadding.right, bottom: palletteSize.height - graphPadding.bottom, left: graphPadding.left, hCenter: palletteSize.width / 2, vCenter: palletteSize.height / 2};

  // Dimensions of tooltip.
  const tooltipSize = {height: 50, width: 200};

  // Hierarchy and treemap.
  const root = d3.hierarchy(games);
  root.sum((d) =>
    {
      return d.value;
    });

  const treemap = d3.treemap()
        .size([graphSize.width, graphSize.height])
        .paddingOuter(0)
        .paddingInner(1)
        .tile(d3.treemapSquarify);
  treemap(root);

  const catMax = d3.max(root, (d) =>
    {
      if (d.depth === 1)
      {
        return d.value;
      }
    });
  const catMin = d3.min(root, (d) =>
    {
      if (d.depth === 1)
      {
        return d.value;
      }
    });
  console.log(catMax);
  console.log(catMin);

  // Color scale.
  let getGraphScaleColor = d3.scaleOrdinal(d3.schemeCategory10);
  // let getGraphScaleColor = d3.scaleOrdinal(d3.schemeBlues);
  // let getGraphScaleColor = graphColorScale.interpolator(d3.interpolateBlues);
  // let graphColorScale = d3.scaleSequentialLog()
  //     .domain([0, 10]);
  // let graphColorScale = d3.scaleLinear()
  //     .domain([catMin, catMax]);
  let legendColorScale = d3.scaleSequential()
      .domain([0, 10]);
  // let getGraphScaleColor = graphColorScale.interpolator(d3.interpolateBlues);
  let getLegendScaleColor = legendColorScale.interpolator(d3.interpolateBlues);

  // Visualization SVG.
  const svg = d3.select(element)
        .append("svg")
        .attr("id", "title")
        .attr("height", palletteSize.height)
        .attr("width", palletteSize.width)
        .style('background-color', '#ffffff')

  // Graph description.
  svg.append('text')
    .attr('id', 'description')
    .attr('x', (graphSize.width / 2))
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Video Game Sales');

  // Legend.
  let legendDomain = [];
  let legendSteps = 10
  let legendStart = (2 * legendColorScale.domain()[0] + 1) / 2;
  for (let i = 0; i < legendSteps; i++)
  {
    legendDomain.push(legendStart + i);
  }

  const legendSquare = 30;
  const legendPallette = {height: 250, width: 600};
  const legendPadding = {top: 10, right: 10, bottom: 10, left: 10};
  // const legendPallette = {height: 1 * legendSquare, width: (legendSteps + 2) * legendSquare};
  // const legendPadding = {top: legendSquare, right: legendSquare, bottom: legendSquare, left: legendSquare};
  const legendSize = {height: legendPallette.height + legendPadding.top + legendPadding.bottom, width: legendPallette.width + legendPadding.left + legendPadding.right};
  const legendPositions = {top: legendPadding.top, right: legendSize.width - legendPadding.right, bottom: legendSize.height - legendPadding.bottom, left: legendPadding.left};

  const legendContainer = d3.select('body')
	.append('div')
	.attr('id', 'legend-container');

  const legendDescriptionContainer = d3.select('div#legend-container')
	.append('div')
	.attr('id', 'legend-description-container');

  const legendDescription = d3.select('div#legend-description-container')
        .html('');

  const legendSvgContainer = d3.select('div#legend-container')
	.append('div')
	.attr('id', 'legend-svg-container');

  const legendSvg = d3.select('div#legend-svg-container')
        .append('svg')
        .attr('id', 'legend')
        .attr('height', legendSize.height)
        .attr('width', legendSize.width)

  const legendRects = legendSvg.selectAll('rect')
        .data(root.children)
        .enter()
        .append('rect')
        .attr('class', 'legend-item')
        .attr('height', legendSquare)
        .attr('width', legendSquare)
        .attr('x', (d, i) =>
          {
            return legendPositions.left + (Math.floor(i / 6) * 200);
          })
        .attr('y', (d, i) =>
          {
            return legendPositions.top + ((i + 1) % 6) * 40;
          })
        .style('opacity', '0.3')
        .style('fill', (d, i) => {return getGraphScaleColor(d.data.name);});

  legendSvg.selectAll('text')
    .data(root.children)
    .enter()
    .append('text')
    .attr('x', (d, i) =>
      {
        return legendPositions.left + legendSquare + (Math.floor(i / 6) * 200 + 5);
      })
    .attr('y', (d, i) =>
      {
        return legendPositions.top + ((i + 1) % 6) * 40 + 20;
      })
    .text((d, i) =>
      {
        console.log(d);
        return d.data.name;
      });

  // const legendXAxis = d3.axisBottom(legendColorScale.range([legendPositions.left + legendSquare, legendPositions.right - legendSquare]))
  //       .ticks(legendSteps)
  //       .tickFormat((t) => {return t * 10;});

  // legendSvg.append("g")
  //   .attr("id", "legend-x-axis")
  //   .attr("transform", "translate(0, " + (legendPositions.bottom) + ")")
  //   .call(legendXAxis);

  const tooltip = d3.select(element)
        .append('div')
        .attr('id', 'tooltip')
        .attr('data-value', '')
        .style('height', tooltipSize.height)
        .style('width', tooltipSize.width)
        .style('opacity', '0')
        .style('visibility', 'visible');

  svg
    .selectAll('rect')
    .data(root.leaves())
    .enter()
    .append('rect')
    .attr('class', 'tile')
    .attr('data-name', (d, i) =>
      {
        return d.data.name;
      })
    .attr('data-category', (d, i) =>
      {
        return d.data.category || '';
      })
    .attr('data-value', (d, i) =>
      {
        return d.value;
      })
    .attr('x', (d, i) => {return d.x0;})
    .attr('y', (d, i) => {return d.y0;})
    .attr('height', (d, i) => {return d.y1 - d.y0;})
    .attr('width', (d, i) => {return d.x1 - d.x0;})
    .style('fill', (d, i) =>
      {
        return getGraphScaleColor(d.parent.data.name);
      })
    .style('stroke', 'white')
    .style('opacity', '0.3')
    .on('mouseenter mouseover', (event, datum) =>
      {
        tooltip
          .attr('id', 'tooltip')
          .style('display', 'inline')
          .style('position', 'absolute')
          .style('visibility', 'visible')
          .style('opacity', '0.50')
          .style('left', (event.pageX + 20) + 'px')
          .style('top', (event.pageY + 20) + 'px')
          .attr('data-value', datum.value)
          .style('background', getGraphScaleColor(datum.parent.data.name))
          .html('<p>' + datum.data.name + ' (' + datum.data.category + '):  ' + datum.value + '</p>');
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

  let labels = svg.selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', (d, i) =>
        {
          return 'translate(' + [d.x0, d.y0] + ')';
        });

  labels.append('text')
    .attr('dx', 4)
    .attr('dy', 14)
    .text((d, i) =>
      {
        return d.data.name;
      });
}
