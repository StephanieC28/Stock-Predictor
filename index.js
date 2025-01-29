// import syntax (recommended)
import yahooFinance from 'yahoo-finance2';

// require syntax (if your code base does not support imports)
// const yahooFinance = require('yahoo-finance2').default; // NOTE the .default



// Function to get stock prices
async function getStockPrices(stockTicker) {
    try {
        // const options = { period1: '7', interval: '1d' }; //Fetches last weeks prices
        // const prices = await yahooFinance.historical(stockTicker, options);
        // console.log(`Prices for ${stockTicker} over the last week`);
        // prices.forEach((price) => {
        //     console.log(`Date: ${price.date}, Close: ${price.close}`);
        // });

        // https://github.com/gadicc/node-yahoo-finance2/blob/devel/docs/modules/chart.md
        const queryOptions = { period1: '2021-05-08', interval: '1d' };
        const result = await yahooFinance.chart(stockTicker, queryOptions);
        result.quotes.forEach((price) => {
            console.log(`Date: ${price.date}, Close: ${price.close}`);
        });
        console.log(result.events.dividends);
        console.log(result.meta);

        console.log(Object.keys(result));
    } catch (error) {
        console.error(`Sorry, we couldn't find data for ${stockTicker}.`);
        console.error(error);
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
