import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import yahooFinance from 'yahoo-finance2';
import chalk from 'chalk';
import dotenv from "dotenv";

dotenv.config();

//Personal GitHub access token
const token = process.env["GITHUB_TOKEN"];

//Initialize the DeepSeek-R1 model
const client = ModelClient(
    "https://models.inference.ai.azure.com",
    new AzureKeyCredential(token)
);

//Function to interact with the model
async function queryModel(prompt) {
    const response = await client.path("/chat/completions").post({
        body: {
            messages: [
                {role: "user", content: prompt }
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

//Function to parse human-readable dates into yyyy-mm-dd
function parseDate(inputDate) {
    try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
            return inputDate;
        }
        const parsedDate = new Date(inputDate);
        if (!isNaN(parsedDate)) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() +1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        throw new Error(`Invalid date format for "${inputDate}"`);
    } catch (err) {
        console.error(`Error parsing date "${inputDate}":`, err.message);
        return null;
    }
}

//Function to turn internal dates to yyyymmdd format for graph axes
function convertDateToNumber(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return parseInt(`${year}${month}${day}`);
}

//Function to give the first requested date with info
function addOneDay(date) {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
}

//Function to generate the AI prompt
function generatePrompt(stockTicker, date, openingPrice) {
    const readableDate = new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    return `Let's pretend that you're my finance guru friend. I'm telling you that ${stockTicker}'s stock opening price on ${readableDate} is ${openingPrice}. By the end of the day, considering all news articles and events that happened on ${readableDate} or earlier, what would your finance guru prediction of the closing price be? Let's pretend that it's ${readableDate}, 8 am too, so you don't know the close price from the internet or anything. You can search up any news or media that's been published up to this time, ${readableDate} 8 am. Can you also state the general prediction (if it's up or down) by making the very last word of the response up or down depending on the outcome prediction? Also, make the second last word/phrase, the predicted closing price.`;
}

//Function to extract AI Predictions from its response
function extractPredictions(aiResponse) {
    const words = aiResponse.trim().split(" ");
    const predictedPrice = words[words.length - 2]; // Second-to-last word
    const generalDirection = words[words.length - 1]; // Last word
    return { predictedPrice, generalDirection };
}

//Function to get stock prices, generate AI Predictions, & create graphs
async function getStockPrices(stockTicker, period1, period2) {
    try {
        const startDate = parseDate(period1);
        const endDate = parseDate(period2);

        if (!startDate || !endDate) {
                throw new Error("Invalid date(s). Please use yyyy-mm-dd or readable formats like 'March 6, 2025'.");
        }

        const queryOptions = { period1: startDate, period2: endDate };
        const result = await yahooFinance.chart(stockTicker, queryOptions);

        if (result && result.quotes && result.quotes.length > 0) {
            console.log("Result:", result);
            const predictedPrices = [];
            for (const price of result.quotes) {
                const date = new Date(price.date).toISOString().split("T")[0];
                const open = price.open.toFixed(2);

                //Generate AI Prompts & get predictions
                const prompt = generatePrompt(stockTicker, date, open);
                const aiResponse = await queryModel(prompt);

                //Extract prediction only
                const { predictedPrice, generalDirection } = extractPredictions(aiResponse);
                predictedPrices.push([date, parseFloat(predictedPrice)]);

                //Displaying only the predicted closing price and general direction
                console.log(chalk.bold(`\nDate: ${date}`));
                console.log(chalk.bold(`Predicted Closing Price: ${predictedPrice}`));
                console.log(chalk.bold(`General Direction: ${generalDirection}`));
            }

            return predictedPrices;
    } else {
        console.error(`No quotes found for ${stockTicker}.`);
    }
 } catch (error) {
    console.error(`Sorry, we couldn't find data for ${stockTicker}.`);
    console.error(error);
 }
}

//Input Validation
//function handleUserInput(stockTicker, startDate, endDate) {
    //console.log("Validating input...");
    //console.log(`Stock Ticker: ${stockTicker}`);
    //console.log(`Start Date: ${startDate}`);
    //console.log(`End Date: ${endDate}`);

    //if (!stockTicker || !startDate || !endDate) {
        //console.error("Error: All fields are required. Please provide valid inputs.");
        //process.exit(1);
    //}

    //getStockPrices(stockTicker.toUpperCase(), startDate, endDate);
//}

//Interactive prompt using readline
//function promptForInput() {
    //const rl = readline.createInterface({
        //input: process.stdin,
        //output: process.stdout,
    //});

    //rl.question("Enter stock ticker: ", (stockTicker) => {
        //rl.question("Enter start date: ", (startDate) => {
            //rl.question("Enter end date: ", (endDate) => {
                //handleUserInput(stockTicker, startDate, endDate);
                //rl.close();
            //});
        //});
    //});
//}

//promptForInput();

//Export for use in server.js
export { getStockPrices };

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
