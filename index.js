// Import syntax
import yahooFinance from 'yahoo-finance2';
import cliui from 'cliui';
import chalk from 'chalk';
//import cliGraph from 'cli-graph';
import babar from 'babar';

//Function to turn internal dates to yyyymmdd format for the graph axes
function convertDateToNumber(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() +1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return parseInt(`${year}${month}${day}`);
}

// Function to get stock prices & create graphs
async function getStockPrices(stockTicker, period1, period2) {
    try {
        const queryOptions = { period1, period2 };
        const result = await yahooFinance.chart(stockTicker, queryOptions);
        
        // Check if the result contains quotes
        if (result && result.quotes && result.quotes.length > 0) {
            const ui = cliui({});
            const openingPrices = [];
            const closingPrices = [];
            const rightDay = new Date(period1);
            rightDay.setDate(rightDay.getDate() +1);

            ui.div(
                {
                    text: chalk.bold("Date"),
                    width: 35,
                    padding: [0, 2, 0, 2]
                },
                {
                    text: chalk.bold("Open"),
                    width: 35,
                    padding: [0, 2, 0, 2]
                },
                {
                    text: chalk.bold("Close"),
                    width: 35,
                    padding: [0, 2, 0, 2]
                }
            );

            result.quotes.forEach((price, index) => {
                const date = new Date(price.date).toISOString().split('T')[0];
                const open = price.open.toFixed(2);
                const close = price.close.toFixed(2);
                const dateNum = convertDateToNumber(date);
                if (new Date(date) >= rightDay) {
                    openingPrices.push([dateNum, parseFloat(open)]);
                    closingPrices.push([dateNum, parseFloat(close)]);
                    ui.div(
                        {
                            text: `${date}`,
                            width: 25,
                            padding: [0, 2, 0, 2]
                        },
                        {
                            text: `${open}`,
                            width: 25,
                            padding: [0, 2, 0, 2]
                        },
                        {
                            text: `${close}`,
                            width: 27,
                            padding: [0, 2, 0, 2]
                        }
                    );
                }
            });

            console.log(ui.toString());

            // Calculate scaling factor of y-axis using the cli-graph
            //const minPrice = Math.min(...openingPrices);
            //const maxPrice = Math.max(...openingPrices);
            //const range = maxPrice - minPrice;
            //const scaleFactor = 10 / range; // Scales so that it fits within graph's height

            // Create the line graph for opening prices using cli-graph
            //const graph = new cliGraph({ height:10 });

            //openingPrices.forEach((price, index) => {
                //graph.addPoint(index, (price - minPrice) * scaleFactor);
            //});

            //Create the bar graph for opening prices using babar
            const openGraph = babar(openingPrices, {
                width: 80,
                height: 30,
                color: 'green',
                xFractions: 0,
                yFractions: 2
            });

            const closeGraph = babar(closingPrices, {
                width: 80,
                height: 30,
                color: 'red',
                xFractions: 0,
                yFractions: 2
            });

            console.log(chalk.bold("\nOpening Prices: "));
            console.log(openGraph);
            console.log(chalk.bold("\nClosing Prices: "));
            console.log(closeGraph);
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