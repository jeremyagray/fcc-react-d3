import {
  useState
} from 'react';

import './D3Selector.css';
import HeatMap from './D3HeatMap.js'
import BarChart from './D3BarChart.js'

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
  }

}

function SelectorDropDown(props) {
  function changer(e) {
    props.setGraph(e.target.value);
  }
  
  return (
    <div id='SelectorDropDown'>
      <label for="graph-select">Select a Graph:</label>
      <br />
      <select
        name="graphs"
        id="graph-select"
        value={props.graph}
        onChange={changer}
      >
        <option value="bar">Bar Chart</option>
        <option value="heat">Heat Map</option>
      </select>
    </div>
  );
}

export default Selector;
