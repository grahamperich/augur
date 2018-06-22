"use strict";

import "jest-environment-puppeteer";
import { dismissDisclaimerModal } from "./helpers/dismiss-disclaimer-modal";

const url = `${process.env.AUGUR_URL}`;
const timeoutMilliseconds = 9000; // TODO: Figure out a way to reduce timeout required for certain DOM elements

jest.setTimeout(100000);

describe("Create market page", () => {
  beforeAll(async () => {
    await page.goto(url);

    // TODO: Determine what a 'typical' desktop resolution would be for our users
    await page.setViewport({
      height: 1200,
      width: 1200
    });
  });

  it("should allow user to create a new yes/no market", async () => {
    await dismissDisclaimerModal(page);

    // Go to create-market page and wait for it to load
    await page.goto(url.concat("#/create-market"), {
      waitUntil: "networkidle0"
    });
    await page.waitForSelector("#cm__input--desc", { visible: true });

    // Verify that a market must have a Market Question and a Category, but Tags are optional
    let isDisabled = await page.$eval(
      ".create-market-form-styles_CreateMarketForm__next",
      el => el.disabled
    );
    expect(isDisabled).toEqual(true);

    await expect(page).toFill(
      "#cm__input--desc",
      "Will this yes/no market be created successfully?"
    );

    isDisabled = await page.$eval(
      ".create-market-form-styles_CreateMarketForm__next",
      el => el.disabled
    );
    expect(isDisabled).toEqual(true);

    await page.$eval("#cm__input--desc", input => (input.value = ""));
    await expect(page).toFill("#cm__input--cat", "climate");

    isDisabled = await page.$eval(
      ".create-market-form-styles_CreateMarketForm__next",
      el => el.disabled
    );
    expect(isDisabled).toEqual(false);

    // Verify that Tags and Category must be unique
    await expect(page).toFill("#cm__input--tag1", "climate");

    isDisabled = await page.$eval(
      ".create-market-form-styles_CreateMarketForm__next",
      el => el.disabled
    );
    expect(isDisabled).toEqual(true);

    await page.$eval("#cm__input--cat", input => (input.value = ""));
    await page.$eval("#cm__input--tag1", input => (input.value = ""));

    // Verify suggested category is populated as Category name is typed and that it can be clicked to auto-fill the Category field
    await expect(page).toFill("#cm__input--cat", "cli");
    await expect(page).toMatchElement(
      ".create-market-form-define-styles_CreateMarketDefine__suggested-categories li button:nth-child(1)",
      { text: "climate" }
    );
    await expect(page).toClick(
      ".create-market-form-define-styles_CreateMarketDefine__suggested-categories li button:nth-child(1)"
    );
    let categoryValue = await page.$eval("#cm__input--cat", el => el.value);
    expect(categoryValue).toEqual("climate");

    await page.$eval("#cm__input--cat", input => (input.value = ""));

    // Fill out Define page
    await expect(page).toFill(
      "#cm__input--desc",
      "Will this yes/no market be created successfully?"
    );
    await expect(page).toFill("#cm__input--cat", "Integration Test");
    await expect(page).toFill("#cm__input--tag1", "Yes/No");
    await expect(page).toFill("#cm__input--tag2", "Test");

    // Verify that the white market card above the form updates for each field
    await expect(page).toMatchElement(
      ".create-market-preview-styles_CreateMarketPreview__description",
      { text: "Will this yes/no market be created successfully?" }
    );
    await expect(page).toMatchElement(
      ".category-tag-trail-styles_CategoryTagTrail .word-trail-styles_WordTrail:nth-child(1) .tag-trail-button",
      { text: "Integration Test" }
    );
    await expect(page).toMatchElement(".tag-trail-button", { text: "Yes/No" });
    await expect(page).toMatchElement(".tag-trail-button", { text: "Test" });

    await expect(page).toClick("button", { text: "Next: Outcome" });

    // Fill out Outcome page
    await expect(page).toClick("li button", { text: "Yes/No" });

    // Verify that Additional Information field is optional
    isDisabled = await page.$eval(
      ".create-market-form-styles_CreateMarketForm__next",
      el => el.disabled
    );
    expect(isDisabled).toEqual(false);

    await expect(page).toFill(
      "#cm__input--details",
      "Here is some additional information."
    );
    await expect(page).toClick("button", { text: "Next: Resolution" });

    // TODO: Each section is required
    // TODO: If you select "Outcome will be detailed on a public website" you should see a text input appear to allow website to be entered. This input should be required if shown
    // TODO: If you select "Someone Else" in the "Designated Reporter" section, then you should see a text input appear and you should be required to enter an ethereum address if this input is shown
    // TODO: Confirm that the Datepicker doesn't allow you to choose a day in the past
    // TODO: Create a market with Resolution Source set to "Outcome will be detailed on a public website" and enter a website value. Confirm that this website is displayed as the resolution source on the market's Trading page
    // TODO: Create a market with yourself set as the Designated Reporter. Verify that you are the only user that sees the market when its in the Designated Reporting phase
    // TODO: Create a market with someone else as the Designated Reporter. Verify that that user is the only user that see the market when its in the Designated Reporting phase
    // TODO: Verify that your selected end date and time is displayed as the end date and time on the Markets List market card

    // Fill out Resolution page
    await expect(page).toClick("button", {
      text: "Outcome will be detailed on a public website"
    });
    await expect(page).toFill(
      ".create-market-form-styles_CreateMarketForm__fields li:nth-child(1) ul li div input",
      "https://www.reuters.com"
    );
    await expect(page).toClick("button", { text: "Someone Else" });
    await expect(page).toFill(
      ".create-market-form-styles_CreateMarketForm__fields li:nth-child(2) ul li div input",
      "0xbd355A7e5a7ADb23b51F54027E624BfE0e238DF6"
    );
    await expect(page).toFill("#cm__input--date", "Jan 1, 2030");
    await expect(page).toSelect(
      "#cm__input--time div:nth-child(1) select",
      "11"
    );
    await expect(page).toSelect(
      "#cm__input--time div:nth-child(2) select",
      "59"
    );
    await expect(page).toSelect(
      "#cm__input--time div:nth-child(3) select",
      "PM"
    );
    await expect(page).toClick("button", { text: "Next: Liquidity" });

    // TODO: Verify Settlement Fee is required and must be a number between 0 and 100
    // TODO: Verify that orders must be priced between min and max value for the market
    // TOOD: Verify that adding an order should update the charts
    // TODO: Verify that the orders added to the market are listed on the market's Trading page after market creation

    // Fill out Liquidity page
    await expect(page).toFill("#cm__input--settlement", "1");

    // Place buy orders
    await expect(page).toFill("#cm__input--quantity", "2");
    await expect(page).toFill("#cm__input--limit-price", "0.4");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toFill("#cm__input--quantity", "1");
    await expect(page).toFill("#cm__input--limit-price", "0.37");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toFill("#cm__input--quantity", "3");
    await expect(page).toFill("#cm__input--limit-price", "0.34");
    await expect(page).toClick("button", { text: "Add Order" });

    // Place sell orders
    await expect(page).toClick("button", { text: "Sell" });

    await expect(page).toFill("#cm__input--quantity", "1");
    await expect(page).toFill("#cm__input--limit-price", "0.43");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toFill("#cm__input--quantity", "2");
    await expect(page).toFill("#cm__input--limit-price", "0.47");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toFill("#cm__input--quantity", "2");
    await expect(page).toFill("#cm__input--limit-price", "0.5");
    await expect(page).toClick("button", { text: "Add Order" });

    // Go to the Review page
    await expect(page).toClick("button", { text: "Next: Review" });

    // TODO: Verify that the broken-down stats appear to be accurate
    // TODO: Verify that the ETH and gas required to place liquidity orders is included in the totals

    // Submit new market
    await expect(page).toClick("button", { text: "Submit" });

    // Make sure user is redirected to Portfolio: Transactions page
    await page.waitForSelector(".transactions-styles_Transaction__item", {
      visible: true
    });

    // Go to new market trading page
    await page.goto(
      url.concat("#/markets?category=Integration%20Test&tags=Yes%2FNo"),
      { waitUntil: "networkidle0" }
    );
    await page.waitForSelector(
      ".market-common-styles_MarketCommon__topcontent h1 span a",
      { visible: true }
    );
    await expect(page).toClick(
      ".market-common-styles_MarketCommon__topcontent h1 span a",
      { timeout: timeoutMilliseconds }
    );

    // Verify that Additional Information is displayed
    await expect(page).toMatchElement(
      ".market-header-styles_MarketHeader__details span",
      {
        text: "Here is some additional information.",
        timeout: timeoutMilliseconds
      }
    );

    // Verify settlement fee is correct
    await expect(page).toMatchElement(
      ".market-header-styles_MarketHeader__properties .market-header-styles_MarketHeader__property:nth-child(2) span:nth-child(2)",
      { text: "2.00%", timeout: timeoutMilliseconds }
    );

    // Verify liquidity got created
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(1)",
      { text: "Yes", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(2) span",
      { text: "-", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(2)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(3)",
      { text: "0.5000", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(1)",
      { text: "Yes", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(2) span",
      { text: "-", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(2)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(3)",
      { text: "0.4700", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(1)",
      { text: "Yes", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(2) span",
      { text: "-", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(2)",
      { text: "1.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(3)",
      { text: "0.4300", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(1)",
      { text: "Yes", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(2) span",
      { text: "+", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(2)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(3)",
      { text: "0.4000", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(1)",
      { text: "Yes", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(2) span",
      { text: "+", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(2)",
      { text: "1.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(3)",
      { text: "0.3700", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(1)",
      { text: "Yes", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(2) span",
      { text: "+", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(2)",
      { text: "3.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(3)",
      { text: "0.3400", timeout: timeoutMilliseconds }
    );
  });

  it("should allow user to create a new categorical market", async () => {
    // Go to create-market page & wait for it to load
    await page.goto(url.concat("#/create-market"), {
      waitUntil: "networkidle0"
    });
    await page.waitForSelector("#cm__input--desc", { visible: true });

    // Fill out Define page
    await expect(page).toFill(
      "#cm__input--desc",
      "Will this categorical market be created successfully?",
      { timeout: timeoutMilliseconds }
    );
    await expect(page).toFill("#cm__input--cat", "Integration Test");
    await expect(page).toFill("#cm__input--tag1", "Categorical");
    await expect(page).toFill("#cm__input--tag2", "Test");
    await expect(page).toClick("button", { text: "Next: Outcome" });

    // TODO: Verify there are 8 inputs under the "Potential Outcomes" label and the first 2 are required
    // TODO: Verify that Outcome names must be unique
    // TODO: Verify that Additional Information field is optional
    // TODO: Confirm that when a with two or more outcomes is created, those outcomes are properly listed as the market's outcomes

    // Fill out Outcome page
    await expect(page).toClick("button", { text: "Multiple Choice" });
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__categorical div:nth-child(1) input",
      "Outcome 1"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__categorical div:nth-child(2) input",
      "Outcome 2"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__categorical div:nth-child(3) input",
      "Outcome 3"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__categorical div:nth-child(4) input",
      "Outcome 4"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__categorical div:nth-child(5) input",
      "Outcome 5"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__categorical div:nth-child(6) input",
      "Outcome 6"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__categorical div:nth-child(7) input",
      "Outcome 7"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__categorical div:nth-child(8) input",
      "Outcome 8"
    );
    await expect(page).toFill(
      "#cm__input--details",
      "Here is some additional information."
    );
    await expect(page).toClick("button", { text: "Next: Resolution" });

    // Fill out Resolution page
    await expect(page).toClick("button", {
      text: "Outcome will be detailed on a public website"
    });
    await expect(page).toFill(
      ".create-market-form-styles_CreateMarketForm__fields li:nth-child(1) ul li div input",
      "https://www.reuters.com"
    );
    await expect(page).toClick("button", { text: "Someone Else" });
    await expect(page).toFill(
      ".create-market-form-styles_CreateMarketForm__fields li:nth-child(2) ul li div input",
      "0xbd355A7e5a7ADb23b51F54027E624BfE0e238DF6"
    );
    await expect(page).toFill("#cm__input--date", "Jan 1, 2030");
    await expect(page).toSelect(
      "#cm__input--time div:nth-child(1) select",
      "11"
    );
    await expect(page).toSelect(
      "#cm__input--time div:nth-child(2) select",
      "59"
    );
    await expect(page).toSelect(
      "#cm__input--time div:nth-child(3) select",
      "PM"
    );
    await expect(page).toClick("button", { text: "Next: Liquidity" });

    // Fill out Liquidity page
    await expect(page).toFill("#cm__input--settlement", "1");

    // Place buy orders
    await expect(page).toSelect(
      ".input-dropdown-styles_InputDropdown__select",
      "Outcome 1"
    );
    await expect(page).toFill("#cm__input--quantity", "2");
    await expect(page).toFill("#cm__input--limit-price", "0.4");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toSelect(
      ".input-dropdown-styles_InputDropdown__select",
      "Outcome 1"
    );
    await expect(page).toFill("#cm__input--quantity", "1");
    await expect(page).toFill("#cm__input--limit-price", "0.37");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toSelect(
      ".input-dropdown-styles_InputDropdown__select",
      "Outcome 1"
    );
    await expect(page).toFill("#cm__input--quantity", "3");
    await expect(page).toFill("#cm__input--limit-price", "0.34");
    await expect(page).toClick("button", { text: "Add Order" });

    // Place sell orders
    await expect(page).toClick("button", { text: "Sell" });
    await expect(page).toSelect(
      ".input-dropdown-styles_InputDropdown__select",
      "Outcome 1"
    );
    await expect(page).toFill("#cm__input--quantity", "1");
    await expect(page).toFill("#cm__input--limit-price", "0.43");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toSelect(
      ".input-dropdown-styles_InputDropdown__select",
      "Outcome 1"
    );
    await expect(page).toFill("#cm__input--quantity", "2");
    await expect(page).toFill("#cm__input--limit-price", "0.47");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toSelect(
      ".input-dropdown-styles_InputDropdown__select",
      "Outcome 1"
    );
    await expect(page).toFill("#cm__input--quantity", "2");
    await expect(page).toFill("#cm__input--limit-price", "0.5");
    await expect(page).toClick("button", { text: "Add Order" });

    // Go to the Review page
    await expect(page).toClick("button", { text: "Next: Review" });

    // Submit new market
    await expect(page).toClick("button", { text: "Submit" });

    // Make sure user is redirected to Transactions page
    await page.waitForSelector(".transactions-styles_Transaction__item", {
      visible: true
    });

    // Go to new market trading page
    await page.goto(
      url.concat("#/markets?category=Integration%20Test&tags=Categorical"),
      { waitUntil: "networkidle0" }
    );
    await page.waitForSelector(
      ".market-common-styles_MarketCommon__topcontent h1 span a",
      { visible: true }
    );
    await expect(page).toClick(
      ".market-common-styles_MarketCommon__topcontent h1 span a",
      { timeout: timeoutMilliseconds }
    );

    // Verify settlement fee is correct
    await expect(page).toMatchElement(
      ".market-header-styles_MarketHeader__properties .market-header-styles_MarketHeader__property:nth-child(2) span:nth-child(2)",
      { text: "2.00%", timeout: timeoutMilliseconds }
    );

    // Verify liquidity got created
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(1)",
      { text: "Outcome 1", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(2) span",
      { text: "-", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(2)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(3)",
      { text: "0.5000", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(1)",
      { text: "Outcome 1", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(2) span",
      { text: "-", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(2)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(3)",
      { text: "0.4700", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(1)",
      { text: "Outcome 1", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(2) span",
      { text: "-", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(2)",
      { text: "1.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(3)",
      { text: "0.4300", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(1)",
      { text: "Outcome 1", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(2) span",
      { text: "+", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(2)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(3)",
      { text: "0.4000", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(1)",
      { text: "Outcome 1", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(2) span",
      { text: "+", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(2)",
      { text: "1.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(3)",
      { text: "0.3700", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(1)",
      { text: "Outcome 1", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(2) span",
      { text: "+", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(2)",
      { text: "3.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(3)",
      { text: "0.3400", timeout: timeoutMilliseconds }
    );
  });

  it("should allow user to create a new scalar market", async () => {
    // Go to create-market page & wait for it to load
    await page.goto(url.concat("#/create-market"), {
      waitUntil: "networkidle0"
    });
    await page.waitForSelector("#cm__input--desc", { visible: true });

    // Fill out Define page
    await expect(page).toFill(
      "#cm__input--desc",
      "Will this scalar market be created successfully?",
      { timeout: timeoutMilliseconds }
    );
    await expect(page).toFill("#cm__input--cat", "Integration Test");
    await expect(page).toFill("#cm__input--tag1", "Scalar");
    await expect(page).toFill("#cm__input--tag2", "Test");
    await expect(page).toClick("button", { text: "Next: Outcome" });

    // TODO: You should see 3 input boxes under the "Range Values" header, and an additional input under the "precision" header
    // TODO: Min Value is required, must be less than Max Value
    // TODO: Max Value is required, must be greater than Min Value
    // TODO: Denomination is an optional field to indicate the denomination of the range
    // TODO: Precision should be defaulted to 0.0001
    // TODO: Precision is required
    // TODO: Additional Information field is optional
    // TODO: Create a scalar market and verify that precision is set based on your entered precision value
    // TODO: Create a scalar market and verify that Min, Max, and Denomination are properly displayed on the Markets List market card

    // Fill out Outcome page
    await expect(page).toClick("button", { text: "Numerical Range" });
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__scalar div:nth-child(1) input",
      "0"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__scalar div:nth-child(2) input",
      "30"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__scalar div:nth-child(3) input",
      "0.5"
    );
    await expect(page).toFill(
      ".create-market-form-outcome-styles_CreateMarketOutcome__scalar div:nth-child(4) input",
      "0.0001"
    );
    await expect(page).toFill(
      "#cm__input--details",
      "Here is some additional information."
    );
    await expect(page).toClick("button", { text: "Next: Resolution" });

    // Fill out Resolution page
    await expect(page).toClick("button", {
      text: "Outcome will be detailed on a public website"
    });
    await expect(page).toFill(
      ".create-market-form-styles_CreateMarketForm__fields li:nth-child(1) ul li div input",
      "https://www.reuters.com"
    );
    await expect(page).toClick("button", { text: "Someone Else" });
    await expect(page).toFill(
      ".create-market-form-styles_CreateMarketForm__fields li:nth-child(2) ul li div input",
      "0xbd355A7e5a7ADb23b51F54027E624BfE0e238DF6"
    );
    await expect(page).toFill("#cm__input--date", "Jan 1, 2030");
    await expect(page).toSelect(
      "#cm__input--time div:nth-child(1) select",
      "11"
    );
    await expect(page).toSelect(
      "#cm__input--time div:nth-child(2) select",
      "59"
    );
    await expect(page).toSelect(
      "#cm__input--time div:nth-child(3) select",
      "PM"
    );
    await expect(page).toClick("button", { text: "Next: Liquidity" });

    // Fill out Liquidity page
    await expect(page).toFill("#cm__input--settlement", "1");

    // Place buy orders
    await expect(page).toFill("#cm__input--quantity", "12");
    await expect(page).toFill("#cm__input--limit-price", "1");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toFill("#cm__input--quantity", "10");
    await expect(page).toFill("#cm__input--limit-price", "2");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toFill("#cm__input--quantity", "7");
    await expect(page).toFill("#cm__input--limit-price", "3");
    await expect(page).toClick("button", { text: "Add Order" });

    // Place sell orders
    await expect(page).toClick("button", { text: "Sell" });

    await expect(page).toFill("#cm__input--quantity", "2");
    await expect(page).toFill("#cm__input--limit-price", "15");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toFill("#cm__input--quantity", "1");
    await expect(page).toFill("#cm__input--limit-price", "17.5");
    await expect(page).toClick("button", { text: "Add Order" });

    await expect(page).toFill("#cm__input--quantity", "2");
    await expect(page).toFill("#cm__input--limit-price", "20");
    await expect(page).toClick("button", { text: "Add Order" });

    // Go to the Review page
    await expect(page).toClick("button", { text: "Next: Review" });

    // Submit new market
    await expect(page).toClick("button", { text: "Submit" });

    // Make sure user is redirected to Transactions page
    await page.waitForSelector(".transactions-styles_Transaction__item", {
      visible: true
    });

    // Go to new market trading page
    await page.goto(
      url.concat("#/markets?category=Integration%20Test&tags=Scalar"),
      { waitUntil: "networkidle0" }
    );
    await page.waitForSelector(
      ".market-common-styles_MarketCommon__topcontent h1 span a",
      { visible: true }
    );
    await expect(page).toClick(
      ".market-common-styles_MarketCommon__topcontent h1 span a",
      { timeout: timeoutMilliseconds }
    );

    // Verify settlement fee is correct
    await expect(page).toMatchElement(
      ".market-header-styles_MarketHeader__properties .market-header-styles_MarketHeader__property:nth-child(2) span:nth-child(2)",
      { text: "2.00%", timeout: timeoutMilliseconds }
    );

    // Verify liquidity got created
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(1)",
      { text: "20.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(2) span",
      { text: "-", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(2)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(1) li:nth-child(3)",
      { text: "20.0000", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(1)",
      { text: "17.5000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(2) span",
      { text: "-", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(2)",
      { text: "1.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(2) li:nth-child(3)",
      { text: "17.5000", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(1)",
      { text: "15.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(2) span",
      { text: "-", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(2)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(3) li:nth-child(3)",
      { text: "15.0000", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(1)",
      { text: "3.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(2) span",
      { text: "+", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(2)",
      { text: "7.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(4) li:nth-child(3)",
      { text: "3.0000", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(1)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(2) span",
      { text: "+", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(2)",
      { text: "10.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(5) li:nth-child(3)",
      { text: "2.0000", timeout: timeoutMilliseconds }
    );

    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(1)",
      { text: "1.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(2) span",
      { text: "+", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(2)",
      { text: "12.0000", timeout: timeoutMilliseconds }
    );
    await expect(page).toMatchElement(
      ".market-positions-list-styles_MarketPositionsList__table-body .market-positions-list--order-styles_Order:nth-child(6) li:nth-child(3)",
      { text: "1.0000", timeout: timeoutMilliseconds }
    );
  });
});
