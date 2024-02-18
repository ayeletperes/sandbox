import React, { useState, useEffect, useCallback } from 'react';
import { Form, useField } from "@open-tech-world/react-form";
import { PrimaryButton, TextField, Stack, SpinButton, DetailsList, DetailsListLayoutMode, SelectionMode} from "@fluentui/react";
import {VerticalBarChart} from '@fluentui/react-charting';
import * as tf from "@tensorflow/tfjs";
import { vAlleleCallOHE, dAlleleCallOHE, jAlleleCallOHE } from "./FastaReader";
import { SequenceTokenizer, ExtractAllele } from './PredictSequence';

const tokenizer = new SequenceTokenizer();
const extractor = new ExtractAllele();
const model_url = "tfjs/alignairr_model/model.json";
const desiredOutputNames = ['v_allele', 'd_allele', 'j_allele'];
const AlleleCallOHE = {v_allele: vAlleleCallOHE, d_allele: dAlleleCallOHE, j_allele: jAlleleCallOHE};
export default function App() {
  const [model, setModel] = useState(null);
  const [outputIndices, setOutputIndices] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState({ v_allele: "", d_allele: "", j_allele: "" });
  const [resultsConf, setResultsConf] = useState({ v_allele: [], d_allele: [], j_allele: []});
  const [predictionsAvailable, setPredictionsAvailable] = useState(false);
  const [vconfidence, setvConfidence] = useState("0.9");
  const [dconfidence, setdConfidence] = useState("0.2");
  const [jconfidence, setjConfidence] = useState("0.8");
  const [vcap, setvCap] = useState("3");
  const [dcap, setdCap] = useState("3");
  const [jcap, setjCap] = useState("3");
  
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadGraphModel(model_url);
        console.log("Model loaded successfully");
        setModel(loadedModel);
        setIsLoading(false);

        const indices = await getOutputIndices(loadedModel, desiredOutputNames);
        setOutputIndices(indices);
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };

    loadModel();
  }, []);

  const getOutputIndices = async (model, desiredOutputNames) => {
    if (!model) {
      console.error("Model not loaded yet.");
      return null;
    }

    const outputIndices = {};
    Object.keys(model.signature.outputs).forEach((key, index) => {
      if (desiredOutputNames.includes(key)) {
        outputIndices[key] = index;
      }
    });

    return outputIndices;
  };

  const getLabel = async (sequence, outputName, alleleOHE, confidence, cap) => {
    if (!isLoading) {
      const dataset = tokenizer.tokenizeSingleSequence(sequence);
      try {
        const predicted = await model.predict(dataset);
        let results = {v_allele: "", d_allele: "", j_allele: "" };
        for (let i = 0; i < outputName.length; i++) {
          const allele_call = outputName[i];
          const index = outputIndices[allele_call];
          const probabilitiesTensor = predicted[index];
          const probabilitiesArray = await probabilitiesTensor.data();
          const allele_prediction = extractor.getAlleles(probabilitiesArray, alleleOHE[allele_call], confidence[allele_call], cap[allele_call]);
          results[allele_call] = allele_prediction;
        }
        return results;
      } catch (error) {
        console.log("Error predicting:", error);
      }
    } else {
      console.error("Model is still loading.");
    }
  };

  const handleSubmit = async (values) => {
    try {
      const seq = values.sequence.replace(/\n/g, '').toUpperCase()
      const confidences = {
        v_allele: vconfidence,
        d_allele: dconfidence,
        j_allele: jconfidence,
      };
      const caps = {
        v_allele: vcap,
        d_allele: dcap,
        j_allele: jcap,
      };
      const vdjResults = await getLabel(seq, ['v_allele','d_allele','j_allele'], 
      AlleleCallOHE, confidences, caps);

      setResults({
        v_allele: vdjResults['v_allele'].map((item) => item.index).join(', '),
        d_allele: vdjResults['d_allele'].map((item) => item.index).join(', '),
        j_allele: vdjResults['j_allele'].map((item) => item.index).join(', '),
      });

      const vAlleleProbs = vdjResults['v_allele'].map((item) => {
        return {
          x: item.index,
          y: item.prob,
          color: '#627CEF',
        }
      });
      const dAlleleProbs = vdjResults['d_allele'].map((item) => {
        return {
          x: item.index,
          y: item.prob,
          color: '#0E7878',
        }
      });
      const jAlleleProbs = vdjResults['j_allele'].map((item) => {
        return {
          x: item.index,
          y: item.prob,
          color: '#C19C00',
        }
      });
      
      setResultsConf({
        v_allele: vAlleleProbs,
        d_allele: dAlleleProbs,
        j_allele: jAlleleProbs,
      })
      
      setPredictionsAvailable(true);
    } catch (error) {
      console.error("Error in predictions:", error);
    }

  };

  const BarChartCell = (values) => {
    
    /* const points = values.values.map((value, index) => ({
      x: (index + 1).toString(),
      y: value,
      color: '#627CEF',
    })); */

    const yAxisTickFormat = (value) => {
      return value.toFixed(2);
    };

    return <VerticalBarChart
      culture={window.navigator.language}
      data={values.values}
      height={1200}
      width={300}
      hideLegend={true}
      enableReflow={true}
      hideLabels={true}
      rotateXAxisLables={true}
      yAxisTickFormat={yAxisTickFormat}
    />;
  };

  function resultsTable({results, resultsConf}){
    
    const columns = [
      { key: 'vAlleles', name: 'V Alleles', fieldName: 'vAlleles', minWidth: 200, height: 400, maxWidth: 300, isResizable: false, isMultiline: true },
      { key: 'dAlleles', name: 'D Alleles', fieldName: 'dAlleles', minWidth: 200, maxWidth: 300, isResizable: false, isMultiline: true, },
      { key: 'jAlleles', name: 'J Alleles', fieldName: 'jAlleles', minWidth: 200, maxWidth: 300, isResizable: false, isMultiline: true, },
    ];
  
    const items = [
      { key: 'alleles', vAlleles: results['v_allele'], dAlleles: results['d_allele'], jAlleles: results['j_allele']},
      { key: 'confidence', vAlleles: <BarChartCell values={resultsConf['v_allele']}/>, dAlleles: <BarChartCell values={resultsConf['d_allele']}/>, jAlleles: <BarChartCell values={resultsConf['j_allele']}/>, height: 400},
    ];
    
    const columnHeaderStyles = {
      root: {
        selectors: {
          ":hover": {
            background: "white",
          },
        },
      },
    };

    return (
      <DetailsList
        items={items}
        columns={columns}
        setKey="set"
        selectionMode={SelectionMode.none}
        layoutMode={DetailsListLayoutMode.fixedColumns}
        styles={columnHeaderStyles}
        onRenderRow={ (props, defaultRender) => {
          var height = 40
          if(props.item.key=='confidence'){
            height = 200
          }
          return defaultRender({...props, styles: {root: {
            height: height,
            selectors: {
              ":hover": {
                background: "white",
              },
            },
          }}})
        }
        }  
      />
    );
  };

  function FluentTextField({ name, height = '130px', width='200%', ...otherProps }) {
    const { field, error } = useField(name);
    const getStyles = () => {
      return {
        fieldGroup: {
          height: height,
          width: width
        }
      }
    };
    return (
      <TextField multiline errorMessage={error} {...field} {...otherProps} styles={getStyles} />
    );
  }

  const spinButtonOnChange = function(setName, min, max) {
    return useCallback((event, newValue) => {
      if (newValue !== undefined) {
        newValue = Number(newValue);
        min = Number(min);
        max = Number(max);
        if (newValue > max) newValue = max;
        if (newValue < min) newValue = min;
        newValue = newValue.toString();
        setName(newValue)
      }
    }, []);
  };

  
  function FluentNumberField({ name, maxWidth = '100px', defualtVal, setName, min, max, step}) {
    const getStyles = () => {
      return {
        root: { 
          maxWidth: maxWidth
        }
      }
    };
    return (
      <SpinButton
        label={name}
        value={defualtVal}
        step={step}
        styles={getStyles}
        onChange={spinButtonOnChange(setName, min, max)}
      />
    );
  }

  return (
    <div className="App">
      <Form
        validate={(values) => {
          const errors = {};
          if (!values.sequence) {
            errors.sequence = "Required!";
          }
          return errors;
        }}
        onSubmit={handleSubmit}
      >
        <Stack enableScopedSelectors disableShrink tokens={{ childrenGap: 20 }}>
          <Stack enableScopedSelectors horizontal disableShrink tokens={{ childrenGap: 300 }}>
            <Stack>
              <label>Enter sequence: </label>
              <br />
              <FluentTextField name="sequence" height = '130px' width='200%' />
              <br />
              <PrimaryButton type="submit" text="Submit" />
            </Stack>
            <Stack>
              <label>Confidence level: </label>
              <br />
              <Stack enableScopedSelectors horizontal disableShrink horizontalAlign="space-between">
                <FluentNumberField name="V" maxWidth="100px" defualtVal={vconfidence} setName={setvConfidence} min="0" max="1" step="0.1"/>
                <FluentNumberField name="D" maxWidth="100px" defualtVal={dconfidence} setName={setdConfidence} min="0" max="1" step="0.1"/>
                <FluentNumberField name="J" maxWidth="100px" defualtVal={jconfidence} setName={setjConfidence} min="0" max="1" step="0.1"/>
              </Stack>
              <br />
              <label>Max allele assignment: </label>
              <br />
              <Stack enableScopedSelectors horizontal disableShrink horizontalAlign="space-between">
                <FluentNumberField name="V" maxWidth="100px" defualtVal={vcap} setName={setvCap} min="1" max="10" step="1.0"/>
                <FluentNumberField name="D" maxWidth="100px" defualtVal={dcap} setName={setdCap} min="1" max="10" step="1.0"/>
                <FluentNumberField name="J" maxWidth="100px" defualtVal={jcap} setName={setjCap} min="1" max="10" step="1.0"/>
              </Stack>
            </Stack>
          </Stack>
          {/* {predictionsAvailable && (
        <table style={{ width: '50%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <tbody>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>V Alleles</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>D Alleles</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>J Alleles</th>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '8px' }}>{results.v_allele}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{results.d_allele}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{results.j_allele}</td>
            </tr>
          </tbody>
        </table>
      )} */}
        {predictionsAvailable && (
          resultsTable({results, resultsConf})
        )}
        </Stack>
      </Form>
    </div>
  );
}
