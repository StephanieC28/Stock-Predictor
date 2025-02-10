// Import syntax (recommended)
import yahooFinance from 'yahoo-finance2';
import cliui from 'cliui';
import chalk from 'chalk';

// Function to get stock prices
async function getStockPrices(stockTicker, period1, period2) {
    try {
        const queryOptions = { period1, period2 };
        const result = await yahooFinance.chart(stockTicker, queryOptions);
        
        // Check if the result contains quotes
        if (result && result.quotes && result.quotes.length > 0) {
            const ui = cliui({});
            ui.div(
                {
                    text: chalk.bold("Date"),
                    padding: [2, 0, 1, 0]
                },
                {
                    text: chalk.bold("Close"),
                    padding: [2, 0, 1, 0]
                }
            );

            result.quotes.forEach((price) => {
                const date = new Date(price.date).toISOString().split('T')[0];
                const close = price.close.toFixed(2);
                ui.div(
                    {
                        text: `${date}`,
                        width: 35,
                        padding: [2, 0, 1, 0]
                    },
                    {
                        text: `${close}`,
                        width: 35,
                        padding: [2, 0, 1, 0]
                    }
                );
            });

            console.log(ui.toString());
        } else {
            console.error(`No quotes found for ${stockTicker}.`);
        }
    } catch (error) {
        console.error(`Sorry, we couldn't find data for ${stockTicker}.`);
        console.error(error);
    }
}

// Function to handle user input
function handleUserInput(input) {
    const inputs = input.trim().split(' ');
    if (inputs.length === 3 ) {
        const [stockTicker, period1, period2] = inputs;
        getStockPrices(stockTicker.toUpperCase(), period1, period2);
    } else {
        console.error("Please provide a valid stock symbol and date range in the format: <symbol> <start_date> <end_date>");
    }
    process.stdin.pause();  // Stop reading input after processing
}


// Either pass arguments for node.js or run the prompt if no argument is provided
async function run() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('Please provide a stock symbol and date range (format: <symbol> <start_date> <end_date>): ');
        process.stdin.setEncoding('utf8');
        process.stdin.once('data', handleUserInput);
    } else if (args.length === 3) {
        const [stockTicker, period1, period2] = args;
        await getStockPrices(stockTicker.toUpperCase(), period1, period2);
    } else {
        console.error("Sorry, please provide a valid stock symbol and date range in the format: <symbol> <start_date> <end_date>");
    }
}

run();
