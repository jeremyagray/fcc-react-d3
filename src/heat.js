// Grab dataset via JSON.
// D3 v5, v6 uses .then().
d3.json('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json')
  .then((data) =>
        {

          // Data and data properties.
          const baseline = data.baseTemperature;
          const series = data.monthlyVariance;
          const items = series.length;
          const months = 12;
          const years = Math.ceil(items / 12);
          
          const parseYear = d3.timeParse('%Y');
          const parseMonth = d3.timeParse('%m');

          // Dimensions of graph.
          const pallette = {height: 800, width: 1500};
          const padding = {top: 80, right: 80, bottom: 80, left: 80};
          const graphSize = {height: pallette.height - padding.top - padding.bottom, width: pallette.width - padding.left - padding.right};
          const graphPositions = {top: padding.top, right: pallette.width - padding.right, bottom: pallette.height - padding.bottom, left: padding.left, center: ((pallette.width - padding.right) + padding.left) / 2};
          const cell = {height: graphSize.height / months, width: graphSize.width / years};
          
          // Dimensions of tooltip.
          const tooltipSize = {height: 50, width: 200};

          // Scales.

          // X scales.
          const xMin = d3.min(series, (d) => 
                              {
                                return parseYear(d.year);
                                // return d.year;
                              });
          const xMax = d3.max(series, (d) => 
                              {
                                return parseYear(d.year);
                                // return d.year;
                              });
          xMax.setYear(xMax.getFullYear() + 1);
          const xScale = d3.scaleTime()
                .domain([xMin, xMax])
                .range([graphPositions.left, graphPositions.right]);

          // Y scales.
          const yMin = d3.min(series, (d) =>
			      {
			        return parseMonth(d.month);
			      });
          const yMax = d3.max(series, (d) =>
			      {
			        return parseMonth(d.month);
			      });

          let yScaleDomain = [];
          // for (let i = 11; i >= 0; i--)
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

          // Description container and description.
          const descriptionContainer = d3.select('body')
                .append('div')
                .attr('id', 'description-container')

          const description = d3.select('div#description-container')
                .append('div')
                .attr('id', 'description')
                .html('<p>Monthly Global Land Temperature, 1753-2015<\/p>');

          // SVG container and canvas.
          const svgContainer = d3.select('body')
                .append('div')
                .attr('id', 'svg-container')

          const svg = d3.select("div#svg-container")
                .append("svg")
                .attr("id", "title")
                .attr("height", pallette.height)
                .attr("width", pallette.width);

          // Legend.
          let legendDomain = [];
          let legendSteps = legendColorScale.domain()[1] - legendColorScale.domain()[0];
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
                .html('<p>Variance (Celsius)<\/p>');

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
	        .ticks(legendSteps);

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
                .attr('data-year', '')
                .attr('data-month', '')
                .attr('data-variance', '')
                .style('height', tooltipSize.height)
                .style('width', tooltipSize.width)
                .style('opacity', '0')
                // .style('display', 'none')
                .style('visibility', 'visible');

          svg.selectAll('rect')
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
	    // .style('fill', 'yellow')
	    .style('fill', (d, i) =>
                   {
                     // console.log(getGraphScaleColor(d.variance));
                     return getGraphScaleColor(d.variance);
                   })
          // D3 v6 mouse events.
            .on('mouseenter mouseover', (event, datum) =>
                {
                  const tooltip = d3.select('div#tooltip')
                        .attr('id', 'tooltip')
                        .style('display', 'flex')
                        .style('visibility', 'visible')
                        .style('opacity', '0.50')
                        .attr('data-year', datum.year)
                        .attr('data-month', parseMonth(datum.month))
                        .attr('data-temp', baseline + datum.variance)
                        .attr('data-variance', datum.variance)
                        // .style('background-color', getGraphScaleColor(datum.variance))
                        // .style('background-color', '#ff0000')
                        .html('<p>' + parseMonth(datum.month).toLocaleString('default', {month: 'long'}) + ' ' + parseYear(datum.year).getFullYear() + ':  ' + datum.variance + '&#176;C<\/p>');
                })
            .on('mouseout mouseleave', (event, datum) =>
                {
                  d3.select('div#tooltip')
                    .style('opacity', '0')
                    .style('display', 'none')
                    .style('visibility', 'hidden');
                });
          
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

          svg.append("g")
            .attr("id", "x-axis")
            .attr("transform", "translate(0, " + (graphPositions.bottom) + ")")
            .call(xAxis);

          svg.append("g")
            .attr("id", "y-axis")
            .attr("transform", "translate(" + graphPositions.left + ")")
            .call(yAxis);
        })
  .catch((error) =>
         {
           console.log(error);
         })
  .finally(() =>
           {
             console.log('finally finished...');
           });
