let data = [];

function quarterize(firstDay)
{
  let times = firstDay.split('-');
  let year = parseInt(times[0]);
  let month = parseInt(times[1]);
  switch (month)
  {
    case 1:
    return 'Q1 ' + year;
    case 4:
    return 'Q2 ' + year;
    case 7:
    return 'Q3 ' + year;
    case 10:
    return 'Q4 ' + year;
  }
}

function billions(amt)
{
  return '$' + amt + 'B';
}

// Grab dataset via JSON.
// D3 v5, v6 uses .then().
d3.json('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json').then((fred) =>
  // D3 v4 uses a callback.
  // d3.json('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json', (error, fred) =>
  {
    const parseTime = d3.timeParse("%Y-%m-%d");
    for (let i = 0; i < fred['data'].length; i++)
    {
      let dateObj = parseTime(fred.data[i][0]);
      data.push({'date': fred.data[i][0], 'gdp': fred.data[i][1], 'dateObj': dateObj});
    }
    
    // Padding.
    const padding = {
      top: 50,
      right: 50,
      bottom: 80,
      left: 80,
    };

    // Dimensions of graph.
    const barWidth = 4;
    const width = padding.left + (data.length * barWidth) + padding.right;
    const height = Math.floor(width * 2 / 3);
    const gdpMax = d3.max(data, (d) => d.gdp);
    const maxBarHeight = height - (padding.top + padding.bottom);

    // Tooltip.
    const div = d3.select('body')
	  .append('div')
	  .attr('id', 'tooltip')
	  .style('opacity', '0')
	  .style('display', 'none')
	  .style('visibility', 'hidden');

    // SVG canvas.
    const svg = d3.select("div#svg-container")
	  .append("svg")
	  .attr("id", "canvas")
	  .attr("width", width)
	  .attr("height", height);
    
    // Bars.
    const bars = svg.selectAll('rect')
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
              return ((height - padding.bottom) - ((d.gdp / gdpMax) * maxBarHeight));
            })
          .attr('width', barWidth)
          .attr('height', (d, i) =>
            {
              return (d.gdp / gdpMax) * maxBarHeight;
            })
          .on('mouseenter mouseover', (event, datum) =>
            {
              const tooltip = d3.select('div#tooltip')
	            .attr('id', 'tooltip')
	            .style('display', 'inline')
                    .style('position', 'absolute')
                    .style('width', '250px')
                    .style('height', '50px')
	            .style('visibility', 'visible')
	            .style('opacity', '0.75')
	            .attr('data-date', datum.date)
	            .attr('data-gdp', datum.gdp)
	            .html('<p>' + quarterize(datum.date) + ':  ' + billions(datum.gdp) + '<\/p>');
            })
          .on('mousemove', (event, datum) =>
            {
              const tooltip = d3.select('div#tooltip')
                    .style('left', (event.pageX + 20) + 'px')
                    .style('top', (event.pageY + 20) + 'px');
            })
          .on('mouseout mouseleave', (event, datum) =>
            {
              d3.select('div#tooltip')
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
          .range([padding.left, width - padding.right]);
    const yScale = d3.scaleLinear()
          .domain([0, gdpMax])
          .range([height - padding.bottom, padding.top]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
      .attr("id", "x-axis")
      .attr("transform", "translate(0, " + (height - padding.bottom) + ")")
      .call(xAxis);

    svg.append("g")
      .attr("id", "y-axis")
      .attr("transform", `translate(${padding.left})`)
      .call(yAxis);
    
    svg.append('text')
      .attr('id', 'title')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '2em')
      .text('United States GDP');

    svg.append('text')
      .attr('id', 'x-axis-label')
      .attr('x', width / 2)
      .attr('y', height - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.5em')
      .text('Quarter');

    const xCoord = 20
    const yCoord = height / 2
    const xCoordPreRot = -yCoord
    const yCoordPreRot = xCoord

    svg.append('text')
      .attr('id', 'y-axis-label')
      .attr("transform", "rotate(-90)")
      .attr('x', xCoordPreRot)
      .attr('y', yCoordPreRot)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.5em')
      .text('Billions (USD)');
  });
