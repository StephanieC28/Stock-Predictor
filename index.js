// Import syntax
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import yahooFinance from "yahoo-finance2";
import cliui from "cliui";
import chalk from "chalk";
import babar from "babar";
import dotenv from "dotenv";

dotenv.config();

// Personal GitHub access token
const token = process.env["GITHUB_TOKEN"];

// Initialize the DeepSeek-R1 model
const client = ModelClient(
  "https://models.inference.ai.azure.com",
  new AzureKeyCredential(token)
);

// Function to interact with the model
async function queryModel(prompt) {
  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "user", content: prompt }
      ],
      model: "DeepSeek-R1",
      max_tokens: 4096,
    }
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  return response.body.choices[0].message.content;
}

// Function to parse human-readable dates into yyyy-mm-dd
function parseDate(inputDate) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
    return inputDate;
  }
  const parsedDate = new Date(inputDate);
  if (!isNaN(parsedDate)) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  throw new Error(`Invalid date format for "${inputDate}"`);
}

// Function to generate the AI prompt dynamically
function generatePrompt(stockTicker, date, openingPrice) {
  const readableDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `Let's pretend that you're my finance guru friend. I'm telling you that ${stockTicker}'s stock opening price on ${readableDate} is ${openingPrice}. By the end of the day, considering all news articles and events that happened on ${readableDate} or earlier, what would your finance guru prediction of the closing price be? Let's pretend that it's ${readableDate}, 8 am too, so you don't know the close price from the internet or anything. You can search up any news or media that's been published up to this time, ${readableDate} 8 am. Can you also state the general prediction (if it's up or down) by making the very last word of the response up or down depending on the outcome prediction? Also, make the second last word/phrase, the predicted closing price.`;
}

// Function to extract AI predictions from its response
function extractPrediction(aiResponse) {
  const words = aiResponse.trim().split(" ");
  const predictedPrice = words[words.length - 2]; // Second-to-last word
  const generalDirection = words[words.length - 1]; // Last word
  return { predictedPrice, generalDirection };
}

// Function to get stock prices, generate AI predictions, and create graphs
async function getStockPrices(stockTicker, period1, period2) {
  try {
    const startDate = parseDate(period1);
    const endDate = parseDate(period2);

    const queryOptions = { period1: startDate, period2: endDate };
    const result = await yahooFinance.chart(stockTicker, queryOptions);

    if (result && result.quotes && result.quotes.length > 0) {
      const ui = cliui({});
      const openingPrices = [];
      const closingPrices = [];
      const predictedPrices = [];

      ui.div(
        { text: chalk.bold("Date"), width: 35, padding: [0, 2, 0, 2] },
        { text: chalk.bold("Open"), width: 35, padding: [0, 2, 0, 2] },
        { text: chalk.bold("Close"), width: 35, padding: [0, 2, 0, 2] }
      );

      for (const price of result.quotes) {
        const date = new Date(price.date).toISOString().split("T")[0];
        const open = price.open.toFixed(2);
        const close = price.close.toFixed(2);

        // Add real prices to their respective arrays
        openingPrices.push([date, parseFloat(open)]);
        closingPrices.push([date, parseFloat(close)]);

        ui.div(
          { text: `${date}`, width: 25, padding: [0, 2, 0, 2] },
          { text: `${open}`, width: 25, padding: [0, 2, 0, 2] },
          { text: `${close}`, width: 27, padding: [0, 2, 0, 2] }
        );

        // Generate AI prompt and get prediction
        const prompt = generatePrompt(stockTicker, date, open);
        const aiResponse = await queryModel(prompt);

        // Extract prediction
        const { predictedPrice, generalDirection } = extractPrediction(aiResponse);
        predictedPrices.push([date, parseFloat(predictedPrice)]);

        // Display AI output
        console.log(chalk.bold(`\nAI prediction for ${stockTicker} on ${date}:`));
        console.log(aiResponse);
        console.log(chalk.bold(`Predicted Closing Price: ${predictedPrice}`));
        console.log(chalk.bold(`General Direction: ${generalDirection}`));
      }

      console.log(ui.toString());

      // Create the graph for actual prices
      const actualGraphData = openingPrices.map((entry, index) => ({
        x: index,
        y: entry[1],
        label: "Opening",
      }));

      actualGraphData.push(
        ...closingPrices.map((entry, index) => ({
          x: index,
        label:"Closing"}));
}

// Function to handle user input
function handleUserInput(input) {
    const inputs = input.trim().split(' ');
    if (inputs.length === 3 ) {
        const [stockTicker, period1, period2] = inputs;
        getStockPrices(stockTicker.toUpperCase(), period1, period2);
    } else {
        console.error("Please provide a valid stock symbol and date range in the format: symbol start_date end_date in yyyy-mm-dd");
    }
    process.stdin.pause();  // Stop reading input after processing
}


// Either pass arguments for node.js or run the prompt if no argument is provided
async function run() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('Please provide a stock symbol and date range in the format: symbol start_date end_date in yyyy-mm-dd ');
        process.stdin.setEncoding('utf8');
        process.stdin.once('data', handleUserInput);
    } else if (args.length === 3) {
        const [stockTicker, period1, period2] = args;
        await getStockPrices(stockTicker.toUpperCase(), period1, period2);
    } else {
        console.error("Sorry, please provide a valid stock symbol and date range in the format: symbol start_date end_date in yyyy-mm-dd");
    }
}

run();
