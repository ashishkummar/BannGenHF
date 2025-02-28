import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";

// Load environment variables
dotenv.config();

import { SYSTEM_P } from './systemPrompt.js';c

const app = express();
app.use(cors());
app.use(bodyParser.json());

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL = "mistralai/Mistral-7B-Instruct-v0.3"; // Free model on HF

const SYSTEM_PROMPT =  SYSTEM_P;

// Fetch dataset rows from Hugging Face dataset
const fetchDatasetRows = async () => {
  try {
    const response = await axios.get(
      `https://datasets-server.huggingface.co/rows?dataset=ashishkummar%2Fhtmlbanner&config=default&split=train&offset=0&length=5`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching dataset:", error);
    return null;
  }
};

app.post("/generate", async (req, res) => {
  const userPrompt = req.body.prompt;

  try {
    // Fetch the dataset rows
    const dataset = await fetchDatasetRows();

    // If the dataset is available, you can incorporate it into the prompt or response
    if (dataset) {
//----::
      //console.log("Fetched dataset rows:", dataset); // You can log or manipulate the dataset here

      // Now send the prompt to the model API
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${MODEL}`,
        { inputs: `${SYSTEM_PROMPT} User: ${userPrompt}` },
        { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
      );

      const result = response.data[0].generated_text;

      if (result.includes("<div") && result.includes("</div>")) {
        res.json({ html_code: result });
      } else {
        res.json({ error: "Invalid prompt" });
      }
    } else {
      res.status(500).json({ error: "Failed to fetch dataset" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
