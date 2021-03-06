import {
  useEffect,
  useRef,
  useState
} from 'react';
import axios from 'axios';
import * as d3 from 'd3';

function TreeMap() {
  const [type, setType] = useState('games');

  return (
    <div className="TreeMap">
      <TreeMapSelector
        type={type}
        setType={setType}
      />
      <TreeMapSVG
        type={type}
      />
    </div>
  );
}

function TreeMapSelector(props) {
  function changer(e) {
    props.setType(e.target.value);
  }

  return (
    <div
      id='TreeMapSelector'
    >
      <label htmlFor="treemap-select">Select the Data:</label>
      <br />
      <select
        name="treemap-types"
        id="treemap-select"
        value={props.type}
        onChange={changer}
      >
        <option value="pledges">Tree Map:  Kickstarter Pledges</option>
        <option value="movies">Tree Map:  Movies</option>
        <option value="games">Tree Map:  Video Game Sales</option>
      </select>
    </div>
  );
}

function TreeMapSVG(props) {
  // Refs.
  const ref = useRef();

  // Data state.
  const [data, setData] = useState({'name': ''});
  const [loadingData, setLoadingData] = useState(true);
  const [loadingDataError, setLoadingDataError] = useState(null);
  const [dataURL, setDataURL] = useState('');

  useEffect(() => {
    // let dataURL = '';

    if (props.type === 'pledges') {
      // dataURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json';
      // dataURL = process.env.PUBLIC_URL + '/data/kickstarter-funding-data.json';
      setDataURL(process.env.PUBLIC_URL + '/data/kickstarter-funding-data.json');
    } else if (props.type === 'movies') {
      // dataURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json';
      // dataURL = process.env.PUBLIC_URL + '/data/movie-data.json';
      setDataURL(process.env.PUBLIC_URL + '/data/movie-data.json');
    } else if (props.type === 'games') {
      // dataURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json';
      // dataURL = process.env.PUBLIC_URL + '/data/video-game-sales-data.json';
      setDataURL(process.env.PUBLIC_URL + '/data/video-game-sales-data.json');
    }

    let isMounted = true;
    setLoadingData(true);

    async function fetchData() {
      try {
        const response = await axios.get(dataURL);
        if (isMounted) {
          setData(response.data);
          setLoadingData(false);
          generateTreeMap(data, ref.current);
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
  }, [data['name'], dataURL, props.type]);

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

export default TreeMap;

function generateTreeMap(games, element) {
  // Visualization dimensions.
  const palletteDimensions = {
    'height': 1100,
    'width': 1200
  };

  const padding = {
    'top': 50,
    'right': 50,
    'bottom': 350,
    'left': 50
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

  const legendDimensions = {
    'height': 250,
    'width': 800,
    'squareSize': 30,
    'columns': 6,
  };

  const legendPadding = {
    'top': 10,
    'right': 10,
    'bottom': 10,
    'left': 10
  };

  const legendPositions = {
    'top': legendPadding.top,
    'right': legendDimensions.width - legendPadding.right,
    'bottom': legendDimensions.height - legendPadding.bottom,
    'left': legendPadding.left,
    'columnWidth': (legendDimensions.width - legendPadding.left -legendPadding.right) / legendDimensions.columns
  };

  const tooltipDimensions = {
    'height': 50,
    'width': 200
  };

  // Hierarchy and treemap.
  const root = d3.hierarchy(games);
  root.sum((d) =>
    {
      return d.value;
    });

  const treemap = d3.treemap()
        .size([graphDimensions.width, graphDimensions.height])
        .paddingOuter(0)
        .paddingInner(0)
        .tile(d3.treemapSquarify);
  treemap(root);

  // Color scale.
  let getGraphScaleColor = d3.scaleOrdinal(d3.schemeCategory10);

  // Visualization SVG.
  d3.selectAll('svg').remove();
  const svg = d3.select(element)
        .append('svg')
        .attr('id', 'TreeMapSVG')
        .attr('height', palletteDimensions.height)
        .attr('width', palletteDimensions.width)
        .style('background-color', '#ffffff')

  // Graph title.
  svg.append('text')
    .attr('id', 'title')
    .attr('x', (palletteDimensions.width / 2))
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '24px')
    .style('text-decoration', 'underline')
    .text('Top 100 Best Selling Video Game');

  // Graph description.
  svg.append('text')
    .attr('id', 'description')
    .attr('x', (palletteDimensions.width / 2))
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Video Game Sales (millions) by Console');

  // Legend.
  const legend = svg
        .append('g')
        .attr('id', 'legend')
        .attr('height', legendDimensions.height)
        .attr('width', legendDimensions.width)
        .attr('transform', `translate(${(palletteDimensions.width - legendDimensions.width) / 2}, ${graphDimensions.bottom + 20})`);

  legend.selectAll('rect')
    .data(root.children)
    .enter()
    .append('rect')
    .attr('class', 'legend-item')
    .attr('height', legendDimensions.squareSize)
    .attr('width', legendDimensions.squareSize)
    .attr('x', (d, i) =>
      {
        return legendPositions.left + (Math.floor(i / 3) * legendPositions.columnWidth);
      })
    .attr('y', (d, i) =>
      {
        return legendPositions.top + ((i + 1) % 3) * 40;
      })
    .style('opacity', '0.3')
    .style('fill', (d, i) => {return getGraphScaleColor(d.data.name);});

  legend.selectAll('text')
    .data(root.children)
    .enter()
    .append('text')
    .attr('x', (d, i) =>
      {
        return legendPositions.left + legendDimensions.squareSize + (Math.floor(i / 3) * legendPositions.columnWidth + 5);
      })
    .attr('y', (d, i) =>
      {
        return legendPositions.top + ((i + 1) % 3) * 40 + 20;
      })
    .text((d, i) =>
      {
        return d.data.name;
      });

  d3.selectAll('div#tooltip').remove();
  const tooltip = d3.select(element)
        .append('div')
        .attr('id', 'tooltip')
        .attr('data-value', '')
        .style('height', tooltipDimensions.height)
        .style('width', tooltipDimensions.width)
        .style('opacity', '0')
        .style('visibility', 'visible');

  const treemapTiles = svg
        .append('g')
        .attr('id', 'treemapTiles')
        .attr('transform', `translate(${graphDimensions.left}, ${graphDimensions.top})`);

  treemapTiles
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
          .style('opacity', '1.00')
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

  const treemapTileLabels = svg
        .append('g')
        .attr('id', 'treemapTileLabels')
        .attr('transform', `translate(${graphDimensions.left}, ${graphDimensions.top})`);

  treemapTileLabels
    .selectAll('text')
    .data(root.leaves())
    .enter()
    .append('text')
    .attr('x', (d, i) => {return d.x0})
    .attr('y', (d, i) => {return d.y0})
    .attr('dx', 4)
    .attr('dy', 14)
    .text((d, i) =>
      {
        return d.data.name;
      });
}
