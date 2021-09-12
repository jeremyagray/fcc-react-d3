import {
  useEffect,
  useRef,
  useState
} from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

function AlabamaMap() {
  return (
      <div className="AlabamaMap">
      <AlabamaMapSVG />
      </div>
  );
}

function AlabamaMapSVG() {
  // Refs.
  const ref = useRef();

  // Data state.
  const [mapData, setMapData] = useState({'type': ''});
  const [loadingData, setLoadingData] = useState(true);
  const [loadingDataError, setLoadingDataError] = useState(null);

  useEffect(() => {
    const mapDataURL = process.env.PUBLIC_URL + '/data/census/al-topo.json';
    let isMounted = true;
    setLoadingData(true);

    async function fetchData() {
      try {
        const response = await axios.get(mapDataURL);

        if (isMounted) {
          setMapData(response.data);
          setLoadingData(false);
          generateMap(mapData, ref.current);
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
  }, [mapData['type']]);

  if (loadingData) {
    return (
        <div>
        <p>
        Loading map data...
        </p>
        </div>
    );
  } else if (loadingDataError) {
    return (
        <div>
        <p>
        Error loading map data:  {loadingDataError}
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

export default AlabamaMap;

function generateMap(mapData, element) {
  let counties = topojson.feature(mapData, mapData.objects.counties);

  // Visualization properties.
  const palletteDimensions = {
    'height': 800,
    'width': 1200
  };

  const padding = {
    'top': 80,
    'right': 50,
    'bottom': 50,
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
    'left': padding.left,

    // Center.
    'hCenter': (palletteDimensions.width - padding.right + padding.left) / 2,
    'vCenter': (padding.top + palletteDimensions.height - padding.bottom) / 2
  };

  // Map projection.
  // Alabama's geographic center: [ 32*50'5'', 86*38'50'']
  // const projection = d3.geoAlbersUsa()
  const projection = d3.geoAlbers()
        .parallels([30, 35])
        .center([0, (32 + (50/60) + (5/3600))])
        .rotate([(86 + (38/60) + (50/3600)), 0])
        .fitSize([graphDimensions.width, graphDimensions.height], counties)

  // Path generator.
  const path = d3.geoPath()
        .projection(projection);

  // Visualization SVG.
  const svg = d3.select(element)
        .append("svg")
        .attr("id", "mapSVG")
        .attr("height", palletteDimensions.height)
        .attr("width", palletteDimensions.width)
        .style('background-color', '#ffffff')
        .style('border', '2px solid black');

  // svg.append('rect')
  //   .attr('x', graphDimensions.left)
  //   .attr('y', graphDimensions.top)
  //   .attr('width', graphDimensions.width)
  //   .attr('height', graphDimensions.height)
  //   .attr('stroke', '#ff0000')
  //   .attr('fill', '#ffffff');

  // Graph title.
  svg.append('text')
    .attr('id', 'title')
    .attr('x', (palletteDimensions.width / 2))
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '24px')
    .style('text-decoration', 'underline')
    .text('State of Alabama');

  // Graph description.
  svg.append('text')
    .attr('id', 'description')
    .attr('x', (palletteDimensions.width / 2))
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('County Map');

  let cg = svg.append('g')
      .selectAll('path')
      .data(counties.features)
      .enter()
      .append('path')
      .attr('class', 'county')
      .attr('id', (d, i) => {
        return d.properties.GEOID;
      })
      .style('fill', '#ffffff')
      .attr('stroke', '#000000')
      .attr('stroke-linejoin', 'round')
      .attr('d', path)
      .attr('transform',
            `translate(${graphDimensions.left}, ${graphDimensions.top})`)
      .on('click', (event, datum) => {
        return click(datum);
      });

  // Display state borders.
  // svg.append('g')
  //   .append('path')
  //   .datum(topojson.mesh(mapData, mapData.objects.states), (a, b) =>
  //     {
  //       return a !== b;
  //     })
  //   .attr('fill', 'none')
  //   .attr('stroke', '#000000')
  //   .attr('stroke-linejoin', 'round')
  //   .attr('d', path)
  //   .attr('transform', `translate(${graphDimensions.left}, ${graphDimensions.top})`);

  // Display national border.
  // svg.append('g')
  //   .append('path')
  //   .datum(topojson.mesh(mapData, mapData.objects.nation), (a, b) =>
  //     {
  //       return a !== b;
  //     })
  //   .attr('fill', 'none')
  //   .attr('stroke', '#000000')
  //   .attr('stroke-linejoin', 'round')
  //   .attr('d', path)
  //   .attr('transform', `translate(${graphDimensions.left}, ${graphDimensions.top})`);

  // Click and zoom functions.  Originally from
  // http://bl.ocks.org/phil-pedruco/7557092 and undoubtedly modelled
  // on https://bl.ocks.org/mbostock/2206590
  let active;
  function click(d) {
    console.log(d);
    if (active === d) return reset();
    cg.selectAll(".active").classed("active", false);
    // changed selection to id
    d3.select("#"+d.properties.name).classed("active", active = d);
    
    var b = path.bounds(d);

    // `translate(${graphDimensions.left}, ${graphDimensions.top})`
    cg.transition()
      .duration(750)
      .attr("transform",
            `translate(${graphDimensions.left}, ${graphDimensions.top})`
            + `translate(${projection.translate()})`
            + "scale(" + .95 / Math.max((b[1][0] - b[0][0]) / graphDimensions.width, (b[1][1] - b[0][1]) / graphDimensions.height) + ")"
            + "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");
  }

  function reset() {
    cg
      .selectAll(".active")
      .classed("active", active = false);
    cg
      .transition()
      .duration(750)
      .attr("transform", `translate(${graphDimensions.left}, ${graphDimensions.top})`);
  }
}
