import {
  useState
} from 'react';

import './D3Selector.css';
import BarChart from './D3BarChart.js';
import ScatterChart from './D3ScatterChart.js';
import HeatMap from './D3HeatMap.js';
import Choropleth from './D3Choropleth.js';

function Selector() {
  const [graph, setGraph] = useState('bar');

  if (graph === 'bar') {
    return (
      <div className="root">
        <SelectorDropDown
          graph={graph}
          setGraph={setGraph}
        />
        <BarChart />
      </div>
    );
  } else if (graph === 'scatter') {
    return (
      <div className="root">
        <SelectorDropDown
          graph={graph}
          setGraph={setGraph}
        />
        <ScatterChart />
      </div>
    );
  } else if (graph === 'heat') {
    return (
      <div className="root">
        <SelectorDropDown
          graph={graph}
          setGraph={setGraph}
        />
        <HeatMap />
      </div>
    );
  } else if (graph === 'choro') {
    return (
      <div className="root">
        <SelectorDropDown
          graph={graph}
          setGraph={setGraph}
        />
        <Choropleth />
      </div>
    );
  }
  // } else if (graph === 'games') {
  //   return (
  //     <div className="root">
  //       <SelectorDropDown
  //         graph={graph}
  //         setGraph={setGraph}
  //       />
  //       <HeatMap />
  //     </div>
  //   );
  // }

}

function SelectorDropDown(props) {
  function changer(e) {
    props.setGraph(e.target.value);
  }
  
  return (
    <div id='SelectorDropDown'>
      <label htmlFor="graph-select">Select a Graph:</label>
      <br />
      <select
        name="graphs"
        id="graph-select"
        value={props.graph}
        onChange={changer}
      >
        <option value="bar">Bar Chart</option>
        <option value="scatter">Scatter Chart</option>
        <option value="heat">Heat Map</option>
        <option value="choro">Choropleth Map</option>
      </select>
    </div>
  );
}

export default Selector;
