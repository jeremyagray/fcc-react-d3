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

// function doYear(year)
// {
//   return new Date(year, 6, 1);
// }

// console.log(doYear(1994).getFullYear());

// function doTime(time)
// {
//   const splitTime = time.split(':');
//   return newDate(0, 0, 0, 0, splitTime[0], splitTime[1]);
// }

// Grab dataset via JSON.
// D3 v5, v6 uses .then().
d3.json('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json')
  .then((data) =>
{
  const parseYear = d3.timeParse('%Y');
  const parseTimes = d3.timeParse('%M:%S');

  // console.log(parseYear('1994'));
  // console.log(parseTimes('39:30'));
  
  // Padding.
  const padding = 50;

  // Dimensions of graph.
  const barWidth = 4;
  // const width = (2 * padding) + (data.length * barWidth);
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

  // Tooltip.
  const div = d3.select('body')
  .append('div')
  .attr('id', 'tooltip')
  .attr('data-year', '')
  .attr('data-xvalue', '')
  .style('opacity', '0')
  .style('display', 'none')
  .style('visibility', 'hidden');
  
  // Legend.
  const legend = d3.select('body')
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

  // SVG canvas.
  const svg = d3.select("body")
  .append("svg")
  .attr("id", "title")
  .attr("width", width)
  .attr("height", height)
  .style('background-color', '#ccccdf');
  
  svg.selectAll('circle')
  .data(data)
  .enter()
  .append('circle')
  .attr('class', 'dot')
  .attr('data-xvalue', (d, i) => {return parseYear(d.Year);})
  .attr('data-yvalue', (d, i) => {return parseTimes(d.Time);})
  .attr('fill', (d, i) => 
       {
    if (d.Doping == '')
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
  // D3 v6.
  .on('mouseenter mouseover', (event, datum) =>
  // // D3 v5 and earlier.
  // // .on('mouseenter mouseover', (datum, index) =>
  {
    const tooltip = d3.select('div#tooltip')
    .attr('id', 'tooltip')
    .style('display', 'block')
    .style('visibility', 'visible')
    .style('opacity', '0.75')
//    .style('left', '900px')
//    .style('top', '100px')
    .attr('data-year', parseYear(datum.Year))
    .attr('data-time', parseTimes(datum.Time))
    .html('<p>' + datum.Name + ', ' + datum.Time + ' (' + datum.Year + ')<\/p>');
  })
  .on('mousemove', (event, datum) =>
  {
    const tooltip = d3.select('div#tooltip')
    .style('left', (event.pageX + 20) + 'px')
    .style('top', (event.pageY + 20) + 'px');
  })
  // D3 v6.
  .on('mouseout mouseleave', (event, datum) =>
  // D3 v5 and earlier.
  // .on('mouseout mouseleave', (datum, index) =>
  {
    d3.select('div#tooltip')
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
})
  .catch((error) =>
{
  console.log(error);
})
  .finally(() =>
{
  console.log('finally finished...');
});
