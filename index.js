// import syntax (recommended)
import yahooFinance from 'yahoo-finance2';

// require syntax (if your code base does not support imports)
// const yahooFinance = require('yahoo-finance2').default; // NOTE the .default



// Function to get stock prices
async function getStockPrices(stockTicker) {
    try {
        const options = { period1: '7d', interval: '1d' }; //Fetches last weeks prices
        const prices = await yahooFinance.historical(stockTicker, options);
        console.log(`Prices for ${stockTicker} over the last week`);
        prices.forEach((price) => {
            console.log(`Date: ${price.date}, Close: ${price.close}`);
        });
    } catch (error) {
        console.error(`Sorry, we couldn't find data for ${stockTicker}.`);
    }
}

// Passing arguments for node.js
async function run() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Please provide an accurate stock symbol.");
    } else {
        const stockTicker = args[0].toUpperCase(); //Changes the stock ticker to all uppercase
        await getStockPrices(stockTicker);
    }
}

run();