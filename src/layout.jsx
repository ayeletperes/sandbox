// Import necessary React components and styling
import React, { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';


// Functional Component representing the form layout
const FormLayout = ({ onSubmit }) => {
  const [textInput, setTextInput] = useState('');
  const [numberInputs, setNumberInputs] = useState([0, 0, 0, 0, 0, 0]);

  const handleInputChange = (e, index) => {
    const newNumberInputs = [...numberInputs];
    newNumberInputs[index] = parseInt(e.target.value, 10);
    setNumberInputs(newNumberInputs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ textInput, numberInputs });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Text Input:
        <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} />
      </label>

      <label>
        Number Inputs:
        <div>
          {numberInputs.map((value, index) => (
            <input
              key={index}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(e, index)}
            />
          ))}
        </div>
      </label>

      <button type="submit">Run Analysis</button>
    </form>
  );
};

// Functional Component representing the result layout
const ResultLayout = ({ result }) => {
  const { textOutput, chartData1, chartData2, chartData3, alignmentOutput } = result;

  return (
    <div>
      <p>{textOutput}</p>

      <div style={{ display: 'flex' }}>
        <div>
          <Bar data={chartData1} />
        </div>
        <div>
          <Bar data={chartData2} />
        </div>
        <div>
          <Bar data={chartData3} />
        </div>
      </div>

      <p>{alignmentOutput}</p>
    </div>
  );
};

// Main Component that holds the overall layout
const MainComponent = () => {
  const [result, setResult] = useState(null);

  const runAnalysis = (formData) => {
    // Perform analysis using formData and update result state
    const mockResult = {
      textOutput: 'Analysis Result Text',
      chartData1: { labels: ['Label1'], datasets: [{ data: [50] }] },
      chartData2: { labels: ['Label2'], datasets: [{ data: [30] }] },
      chartData3: { labels: ['Label3'], datasets: [{ data: [20] }] },
      alignmentOutput: 'Alignment Result Text',
    };

    setResult(mockResult);
  };

  return (
    <div>
      <FormLayout onSubmit={runAnalysis} />
      {result && <ResultLayout result={result} />}
    </div>
  );
};

export default MainComponent;
