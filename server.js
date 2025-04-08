// Import required modules
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
// import chalk from "chalk";
import babar from "babar";
import { getStockPrices } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files (HTML, CSS, JS)

// Route to serve the HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route to handle stock prediction requests
app.post("/predict", async (req, res) => {
  const { stockTicker, startDate, endDate } = req.body;

  console.log("Recieved input: ", { stockTicker, startDate, endDate });

  if (!stockTicker || !startDate || !endDate) {
    return res.status(400).json({ message: "Invalid input. Please provide stockTicker, startDate, and endDate." });
  }

  try {
    // Call the function to get stock prices and predictions
    const predictedPrices = await getStockPrices(stockTicker, startDate, endDate);
    console.log("Predicted Prices: ", predictedPrices);
    //Create graphs for output
    const predictedGraph = babar(
        predictedPrices.map(([dateNum, price], index) => [index, price]),
      {
        width: 80,
        height: 15,
        caption: "Predicted Closing Prices",
        xFractions: 0,
        yFractions: 2,
      }
    );

    // Format response into a friendly message
    const resultMessage = `
        Predicted Results for ${stockTicker} (${startDate} to ${endDate}):

        Predicted Closing Prices:
        ${predictedGraph}

    `;

    //Send JSON response
    res.json({ message: resultMessage });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ message: "An error occurred while processing your request." });
}
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
