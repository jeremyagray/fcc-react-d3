import {
  useEffect,
  useRef,
  useState
} from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

function Choropleth() {
  return (
    <div className="Choropleth">
      <ChoroplethSVG />
    </div>
  );
}

function ChoroplethSVG() {
  // Refs.
  const ref = useRef();

  // Data state.
  const [educationData, setEducationData] = useState([{'fips': ''}]);
  const [geoData, setGeoData] = useState({'type': ''});
  const [loadingData, setLoadingData] = useState(true);
  const [loadingDataError, setLoadingDataError] = useState(null);

  useEffect(() => {
    // const educationDataURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
    // const geoDataURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';
    const educationDataURL = process.env.PUBLIC_URL + '/data/education.json';
    const geoDataURL = process.env.PUBLIC_URL + '/data/counties.json';
    let isMounted = true;
    setLoadingData(true);

    async function fetchData() {
      try {
        const educationResponse = await axios.get(educationDataURL);
        const geoResponse = await axios.get(geoDataURL);
        if (isMounted) {
          setEducationData(educationResponse.data);
          setGeoData(geoResponse.data);
          setLoadingData(false);
          generateChoropleth(educationData, geoData, ref.current);
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
  }, [educationData[0]['fips'], geoData['type']]);

  if (loadingData) {
    return (
      <div>
        <p>
          Loading choropleth data...
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

export default Choropleth;

function generateChoropleth(edu, geo, element) {
  const states = {
    'AK': 'Alaska',
    'AL': 'Alabama',
    'AR': 'Arkansas',
    'AZ': 'Arizona',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DC': 'Washington, DC',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'IA': 'Iowa',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'MA': 'Massachusetts',
    'MD': 'Maryland',
    'ME': 'Maine',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MO': 'Missouri',
    'MS': 'Mississippi',
    'MT': 'Montana',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'NE': 'Nebraska',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NV': 'Nevada',
    'NY': 'New York',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VA': 'Virginia',
    'VT': 'Vermont',
    'WA': 'Washington',
    'WI': 'Wisconsin',
    'WV': 'West Virginia',
    'WY': 'Wyoming'
  };
  
  // Data processing.
  // Let's place the education data in the properties object
  // of each feature, like
  // https://bl.ocks.org/JulienAssouline/1ae3480c5277e2eecd34b71515783d6f
  let json = topojson.feature(geo, geo.objects.counties);
  // Find a fips match and add the county, state, and education data.
  for (let i = 0; i < json.features.length; i++)
  {
    // Find the correct county data for the feature.
    for (let j = 0; j < edu.length; j++) {
      if (edu[j].fips === json.features[i].id) {
        json.features[i].properties.postal_code = edu[j].state || '';
        json.features[i].properties.state = states[edu[j].state] || '';
        json.features[i].properties.name = edu[j].area_name || '';
        json.features[i].properties.percent = edu[j].bachelorsOrHigher;

        break;
      }
    }
  }

  // Visualization properties.

  const graphSize = {height: 800, width: 1000};
  const graphPadding = {top: 50, right: 50, bottom: 50, left: 50};
  const palletteSize = {height: graphSize.height + graphPadding.top + graphPadding.bottom, width: graphSize.width + graphPadding.left + graphPadding.right};
  const graphPositions = {top: graphPadding.top, right: palletteSize - graphPadding.right, bottom: palletteSize.height - graphPadding.bottom, left: graphPadding.left, hCenter: palletteSize.width / 2, vCenter: palletteSize.height / 2};

  const tooltipSize = {
    height: 50,
    width: 200
  };

  // Color scales.
  const graphColorScale = d3.scaleSequential().domain([0, 10]);
  const getGraphScaleColor = graphColorScale.interpolator(d3.interpolateBlues);

  const legendColorScale = d3.scaleSequential().domain([0, 10]);
  const getLegendScaleColor = graphColorScale.interpolator(d3.interpolateBlues);

  // Map projection.
  d3.geoAlbersUsa()
    .translate([graphPositions.hCenter, graphPositions.vCenter]);

  // Path generator.
  const path = d3.geoPath()

  // Visualization SVG.
  const svg = d3.select(element)
        .append("svg")
        .attr("id", "choropleth")
        .attr("height", palletteSize.height)
        .attr("width", palletteSize.width)
        .style('background-color', '#ffffff')

  // Graph description.
  svg.append('text')
    .attr('id', 'title')
    .attr('x', (palletteSize.width / 2))
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '24px')
    .style('text-decoration', 'underline')
    .text('US Education Levels');

  // Graph description.
  svg.append('text')
    .attr('id', 'description')
    .attr('x', (palletteSize.width / 2))
    .attr('y', 40)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('College Education Percentage by County');

  // Legend.
  let legendDomain = [];
  let legendSteps = 10
  let legendStart = (2 * legendColorScale.domain()[0] + 1) / 2;
  for (let i = 0; i < legendSteps; i++)
  {
    legendDomain.push(legendStart + i);
  }

  const legendSquare = 30;
  const legendPallette = {height: 1 * legendSquare, width: (legendSteps + 2) * legendSquare};
  const legendPadding = {top: legendSquare, right: legendSquare, bottom: legendSquare, left: legendSquare};
  const legendSize = {height: legendPallette.height + legendPadding.top + legendPadding.bottom, width: legendPallette.width + legendPadding.left + legendPadding.right};
  const legendPositions = {top: legendPadding.top, right: legendSize.width - legendPadding.right, bottom: legendSize.height - legendPadding.bottom, left: legendPadding.left};

  const legend = svg
        .append('g')
        .attr('id', 'legend')
        .attr('height', legendSize.height)
        .attr('width', legendSize.width)
        .attr('transform', `translate(600, 650)`);

  legend
    .selectAll('rect')
    .data(legendDomain)
    .enter()
    .append('rect')
    .attr('class', 'colorLegend')
    .attr('height', legendSquare)
    .attr('width', legendSquare)
    .attr('x', (d, i) => {return legendPositions.left + legendSquare * (i + 1);})
    .attr('y', legendPositions.bottom - legendSquare)
    .style('fill', (d, i) => {return getLegendScaleColor(d);});

  const legendXAxis = d3.axisBottom(legendColorScale.range([legendPositions.left + legendSquare, legendPositions.right - legendSquare]))
	.ticks(legendSteps)
        .tickFormat((t) => {return t * 10;});

  legend
    .append("g")
    .attr("id", "legend-x-axis")
    .attr("transform", `translate(0, 60)`)
    .call(legendXAxis);

  // Legend description.
  legend.append('text')
    .attr('id', 'description')
    .attr('x', (legendSize.width / 2))
    .attr('y', 90)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Earned Bachelor\'s (Percent)');

  const tooltip = d3.select(element)
        .append('div')
        .attr('id', 'tooltip')
        .attr('data-education', '')
        .style('height', tooltipSize.height)
        .style('width', tooltipSize.width)
        .style('opacity', '0')
        .style('visibility', 'hidden');

  svg.append('g')
    .attr('transform', 'translate(' + graphPositions.top + ', ' + graphPositions.left + ')')
    .attr('class', 'counties')
    .selectAll('path')
    .data(json.features)
    .enter()
    .append('path')
    .attr('class', 'county')
    .attr('county', (d, i) =>
      {
        return d.properties.name;
      })
    .attr('state', (d, i) =>
      {
        return d.properties.state;
      })
    .attr('postal-code', (d, i) =>
      {
        return d.properties.postal_code;
      })
    .attr('data-fips', (d, i) =>
      {
        return d.id;
      })
    .attr('data-education', (d, i) =>
      {
        return d.properties.percent;
      })
    .style('fill', (d, i) =>
      {
        return getGraphScaleColor(d.properties.percent / 10);
      })
    .attr('stroke', '#ffffff')
    .attr('stroke-linejoin', 'round')
    .attr('d', (d, i) =>
      {
        return path(d);
      })
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
          .style('background-color',
                 getGraphScaleColor(datum.properties.percent / 10))
          .attr('data-education', datum.properties.percent)
          .html(`<p>${datum.properties.name}, ${datum.properties.state}:  ${datum.properties.percent}%</p>`);
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

  svg.append('g')
    .attr('transform', 'translate(' + graphPositions.top + ', ' + graphPositions.left + ')')
    .append('path')
    .datum(topojson.mesh(geo, geo.objects.states), (a, b) =>
      {
        return a !== b;
      })
    .attr('fill', 'none')
    .attr('stroke', '#ffffff')
    .attr('stroke-linejoin', 'round')
    .attr('d', d3.geoPath());
}
