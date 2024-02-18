import * as tf from "@tensorflow/tfjs";

export class SequenceTokenizer {
    constructor() {
      this.tokenizerDictionary = {
        "A": 1,
        "T": 2,
        "G": 3,
        "C": 4,
        "N": 5,
        "P": 0,  // pad token
      };
    }
  
    encodeAndEqualPadSequence(sequence, maxSeqLength = 512) {
      const encodedSequence = sequence.split('').map(nucleotide => this.tokenizerDictionary[nucleotide]);
      const paddingLength = maxSeqLength - encodedSequence.length;
      const isEven = paddingLength % 2 === 0;
      const padSize = Math.floor(paddingLength / 2);
  
      if (isEven) {
        encodedSequence.unshift(...Array(padSize).fill(0));
        encodedSequence.push(...Array(padSize).fill(0));
      } else {
        encodedSequence.unshift(...Array(padSize).fill(0));
        encodedSequence.push(...Array(padSize + 1).fill(0));
      }
  
      return encodedSequence;
    }
  
    tokenizeSingleSequence(sequence, maxSeqLength = 512) {
      const paddedArray = this.encodeAndEqualPadSequence(sequence, maxSeqLength);
      const paddedSequenceTensor = tf.tensor2d([paddedArray], [1, maxSeqLength], 'int32');
      const input = {
        'tokenized_sequence': paddedSequenceTensor
      };
  
      return input;
    }
  }

export class ExtractAllele {
  
  dynamicCumulativeConfidenceThreshold(prediction, percentage = 0.9, cap = 3){

    const sortedIndices = tf.topk(prediction, prediction.length, true).indices.arraySync()
    const selectedLabels = [];
    let cumulativeConfidence = 0.0;
    const totalConfidence = prediction.reduce((sum, value) => sum + value, 0);
    const threshold = percentage * totalConfidence
    for (const index of sortedIndices) {
      cumulativeConfidence += prediction[index];
      selectedLabels.push(index);
      if (cumulativeConfidence >= threshold || selectedLabels.length>=cap) {
        break;
      }
    }

    return selectedLabels;
  };

  getAlleles(likelihood_vectors, AlleleCallOHE, confidence = 0.9, cap = 3) {

    const selectedAllelesIndex = this.dynamicCumulativeConfidenceThreshold(likelihood_vectors, confidence, cap);

    const results = [];
    selectedAllelesIndex.forEach(index => {
      results.push({
          index: AlleleCallOHE[index],
          prob: likelihood_vectors[index]
        });
    });

    return results;
  }
}