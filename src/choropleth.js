function getStateName(code)
{
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
  }

  return states[code];
}
    
// Grab datasets via JSON.
// Education and geographic data
Promise.all([
  d3.json('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json'),
  d3.json('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json')
])
  .then(([edu, geo]) =>
        {
          // Data massage.
          // This builds a good data structure, but d3.geoPath() expects the geojson data as items in the .data() argument array.
          // const features = topojson.feature(geo, geo.objects.counties).features;
          // let data = [];
          // for (let i = 0; i < edu.length; i++)
          // {
          //   let obj = {fips: edu[i].fips, postal_code: edu[i].state, state: getStateName(edu[i].state), name: edu[i].area_name, percent: edu[i].bachelorsOrHigher, features: features.filter((item) => {if (item.id == edu[i].fips){return item;}})};
          //   data.push(obj);
          // }
          // Let's place the education data in the properties object
          // of each feature, like
          // https://bl.ocks.org/JulienAssouline/1ae3480c5277e2eecd34b71515783d6f
          // It would really help to understand the geoJSON format better.
          // let features = topojson.feature(geo, geo.objects.counties).features;
          let json = topojson.feature(geo, geo.objects.counties);
          // Find a fips match and add the county, state, and education data.
          for (let i = 0; i < json.features.length; i++)
          {
            // Filter the education data to find the correct county.
            let counties = edu.filter((item) =>
                                      {
                                        if (item.fips == json.features[i].id)
                                        {
                                          return item;
                                        }
                                      });
            if (counties.length > 1)
            {
              throw `There is more than one entry in the education data for county ${features[i].id}.`;
            }
            let county = counties[0];
            // Assign the county data to the properties object of the
            // corresponding county object in the geoJSON feature
            // array.
            json.features[i].properties.postal_code = county.state || '';
            json.features[i].properties.state = getStateName(county.state) || '';
            json.features[i].properties.name = county.area_name || '';
            json.features[i].properties.percent = county.bachelorsOrHigher;
          }

          // Visualization properties.

          const graphSize = {height: 600, width: 1000};
          const graphPadding = {top: 50, right: 50, bottom: 50, left: 50};
          const palletteSize = {height: graphSize.height + graphPadding.top + graphPadding.bottom, width: graphSize.width + graphPadding.left + graphPadding.right};
          const graphPositions = {top: graphPadding.top, right: palletteSize - graphPadding.right, bottom: palletteSize.height - graphPadding.bottom, left: graphPadding.left, hCenter: palletteSize.width / 2, vCenter: palletteSize.height / 2};

          // Dimensions of tooltip.
          const tooltipSize = {height: 50, width: 200};

          // Color scale.
          let graphColorScale = d3.scaleSequential()
              .domain([0, 10]);
          let legendColorScale = d3.scaleSequential()
              .domain([0, 10]);
          // let getGraphScaleColor = graphColorScale.interpolator(d3.interpolateYlOrRd);
          // let getLegendScaleColor = graphColorScale.interpolator(d3.interpolateYlOrRd);
          let getGraphScaleColor = graphColorScale.interpolator(d3.interpolateBlues);
          let getLegendScaleColor = graphColorScale.interpolator(d3.interpolateBlues);
          // console.log(getGraphScaleColor(65));

          // Map projection.
          const projection = d3.geoAlbersUsa()
                .translate([graphPositions.hCenter, graphPositions.vCenter]);
          // .scale([]);

          // Path generator.
          const path = d3.geoPath()
                // .projection(projection);

          // Description container and description.
          const descriptionContainer = d3.select('body')
                .append('div')
                .attr('id', 'description-container')

          const description = d3.select('div#description-container')
                .append('div')
                .attr('id', 'description')
                .html('<p>US Education Levels<\/p>');

          // SVG container and canvas.
          const svgContainer = d3.select('body')
                .append('div')
                .attr('id', 'svg-container');

          const svg = d3.select("div#svg-container")
                .append("svg")
                .attr("id", "title")
                .attr("height", palletteSize.height)
                .attr("width", palletteSize.width)
                .style('background-color', '#ffffff')

          // Legend.
          let legendDomain = [];
          // let legendSteps = legendColorScale.domain()[1] - legendColorScale.domain()[0];
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

          const legendContainer = d3.select('body')
	        .append('div')
	        .attr('id', 'legend-container');

          const legendDescriptionContainer = d3.select('div#legend-container')
	        .append('div')
	        .attr('id', 'legend-description-container');

          const legendDescription = d3.select('div#legend-description-container')
                .html('<p>Earned Bachelor\'s (Percent)<\/p>');

          const legendSvgContainer = d3.select('div#legend-container')
	        .append('div')
	        .attr('id', 'legend-svg-container');

          const legendSvg = d3.select('div#legend-svg-container')
                .append('svg')
                .attr('id', 'legend')
                .attr('height', legendSize.height)
                .attr('width', legendSize.width)

          const legendRects = legendSvg.selectAll('rect')
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

          legendSvg.append("g")
            .attr("id", "legend-x-axis")
            .attr("transform", "translate(0, " + (legendPositions.bottom) + ")")
            .call(legendXAxis);

          // Tooltip.
          const legendTooltipContainer = d3.select('div#legend-container')
	        .append('div')
	        .attr('id', 'legend-tooltip-container');

          const legendTooltip = d3.select('div#legend-tooltip-container')
                .append('div')
                .attr('id', 'tooltip')
                .attr('data-education', '')
                .style('height', tooltipSize.height)
                .style('width', tooltipSize.width)
                .style('opacity', '0')
                .style('visibility', 'visible');

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
          // D3 v6 mouse events.
            .on('mouseenter mouseover', (event, datum) =>
                {
                  const tooltip = d3.select('div#tooltip')
                        .attr('id', 'tooltip')
                        .style('display', 'flex')
                        .style('visibility', 'visible')
                        .style('opacity', '0.50')
                        .attr('data-education', datum.properties.percent)
                        .html('<p>' + datum.properties.name + ', ' + datum.properties.state + ':  ' + datum.properties.percent + '%<\/p>');
                        // .html((d) =>
                        //       {
                        //         d3.select('div#tooltip')
                        //           .style('background-color', getGraphScaleColor(d.properties.education));
                        //         return '<p>' + d.properties.name + ', ' + d.properties.state + ':  ' + d.properties.percent + '%<\/p>';
                        //       });
                  // tooltip.style('background-color', getGraphScaleColor(datum.properties.education));
                })
            .on('mouseout mouseleave', (event, datum) =>
                {
                  d3.select('div#tooltip')
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
        })
  .catch((error) =>
         {
           console.log('caught error ' + error);
         })
  .finally(() =>
           {
             console.log('Visualization completed.');
           });
