import { useRef, useState } from 'react'
// import './App.css'
import '@aws-amplify/ui-react/styles.css';
import { Button, SliderField } from "@aws-amplify/ui-react";
import Plot from 'react-plotly.js';

function App() {
  let [location, setLocation] = useState("");
  let [trees, setTrees] = useState([]);
  let [gridSize, setGridSize] = useState(20);
  let [simSpeed, setSimSpeed] = useState(1);
  let [density, setDensity] = useState(0.4); // Nuevo estado para densidad
  const running = useRef(null);
  const simTime = useRef([]);
  const burntPerc = useRef([]);
  const vizdata = useRef(
          {
            x: [],
            y: [],
            type: 'scatter',
            mode: 'lines+markers',
            marker: {color: 'red'},
          },
        );

  let setup = () => {
    console.log("Hola");
    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      body: JSON.stringify({ dim: [gridSize, gridSize], density: density }), // Enviar densidad
      headers: { 'Content-Type': 'application/json' },
    }).then(resp => resp.json())
    .then(data => {
      console.log(data);
      setLocation(data["Location"]);
      setTrees(data["trees"]);
    });
  };

  const handleStart = () => {
    console.log("location", location);
    running.current = setInterval(() => {
      fetch("http://localhost:8000" + location)
      .then(res => res.json())
      .then(data => {
        const trees = data["trees"];
        var perc = trees.filter((tree) => tree.status === "burnt").length / trees.length;
        simTime.current = [...simTime.current, simTime.current.length + 1];
        burntPerc.current = [...burntPerc.current, perc];
        setTrees(data["trees"]);
      });
    }, 1000 / simSpeed);
  };

  const handleStop = () => {
    vizdata.current = {...vizdata.current, x: simTime.current, y: burntPerc.current};
    console.log(vizdata.current);
    clearInterval(running.current);
    console.log(simTime.current, burntPerc.current);
  }

  let burning = trees.filter(t => t.status == "burning").length;

  if (burning == 0)
    handleStop();

  let offset = 10; // (500 - gridSize * 12) / 2;
  return (
    <>
      <div>
        <Button 
          variation="primary"
          colorTheme="overlay" 
          onClick={setup}>
          Setup
        </Button>
        <Button variant={"contained"} onClick={handleStart}>
          Start
        </Button>
        <Button variant={"contained"} onClick={handleStop}>
          Stop
        </Button>
        <SliderField 
          label="Grid size" 
          min={10} max={40} step={10} 
          type='number' 
          value={gridSize} 
          onChange={setGridSize}/>

        <SliderField 
          label="Simulation speed" 
          min={1} max={10} 
          type='number'
          value={simSpeed} 
          onChange={setSimSpeed}/>

        <SliderField // Nuevo slider de densidad
          label="Density"
          min={0.1} max={1.0} step={0.1}
          type='number'
          value={density}
          onChange={setDensity}
        />
      </div>
      <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg" style={{backgroundColor:"white"}}>
      {
        trees.map(tree => 
          <image 
            key={tree["id"]} 
            x={offset + 12*(tree["pos"][0] - 1)} 
            y={offset + 12*(tree["pos"][1] - 1)} 
            width={15} href={
              tree["status"] === "green" ? "./greentree.svg" :
              (tree["status"] === "burning" ? "./burningtree.svg" : 
                "./burnttree.svg")
            }
          />
        )
      }
      </svg>
      <Plot
        data={[vizdata.current]}
        layout={ {width: 320, height: 240, title: {text: 'A Fancy Plot'}} }
      />
    </>
  );
}

export default App
