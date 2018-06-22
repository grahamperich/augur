"use strict";

import "jest-environment-puppeteer";
import Flash from "./helpers/flash";
import { UnlockedAccounts } from "./constants/accounts";
import { IFlash, IMarket, MarketCosts } from "./types/types";
import { dismissDisclaimerModal } from "./helpers/dismiss-disclaimer-modal";
import { toMyMarkets, toPortfolio } from "./helpers/navigation-helper";
import {
  createYesNoMarket,
  createScalarMarket
} from "./helpers/create-markets";
import { waitNextBlock } from "./helpers/wait-new-block";
import BigNumber from "bignumber.js";

const url = `${process.env.AUGUR_URL}`;
const SMALL_TIMEOUT = 10000;
const BIG_TIMEOUT = 100000;

jest.setTimeout(200000);

let flash: IFlash = new Flash();

// NEED EXTREMELY FRESH DOCKER IMAGE

describe("My Markets", () => {
  let scalarMarket: IMarket;
  let categoricalMarket: IMarket;
  let yesNoMarket: IMarket;
  let marketId: string;
  let marketCosts: MarketCosts;

  beforeAll(async () => {
    await page.goto(url);

    // No idea what a 'typical' desktop resolution would be for our users.
    await page.setViewport({
      height: 1500,
      width: 1200
    });
    await dismissDisclaimerModal(page);
    marketId = await page.evaluate(
      marketDescription =>
        window.integrationHelpers.findMarketId(marketDescription),
      "Will the Dow Jones Industrial Average close at a higher price on Fri Jun 08 2018 than it closed at the previous day?"
    );
    marketCosts = await page.evaluate(() =>
      window.integrationHelpers.getMarketCreationCostBreakdown()
    );

    // go to my markets page
    await toMyMarkets();
    // verify that you are on that page
    await expect(page).toMatch("portfolio: my markets", {
      timeout: SMALL_TIMEOUT
    });
  });

  afterAll(async () => {
    flash.dispose();
  });

  it("should update market's volume correctly when trades occur", async () => {
    //needs the Will Dow Jones market to not have any volume

    //check that market has 0 volume
    let market = await page.$("[id='id-" + marketId + "']");
    await expect(market).toMatchElement(".value_volume", {
      text: "0",
      timeout: SMALL_TIMEOUT
    });

    // fill market order
    await flash.fillMarketOrders(marketId, "1", "buy");

    // check that volume updates correctly
    market = await page.$("[id='id-" + marketId + "']");
    await expect(page).toMatchElement("span.value_volume", {
      text: "0.0030",
      timeout: SMALL_TIMEOUT
    });
  });

  it("should show an empty view if the user hasn't created any markets", async () => {
    // needs secondary account to not have any previously created markets

    // use account with no markets created
    await page.evaluate(
      account => window.integrationHelpers.updateAccountAddress(account),
      UnlockedAccounts.SECONDARY_ACCOUNT
    );
    // go to my markets page
    await toMyMarkets();
    // verify that you are on that page
    await expect(page).toMatch("portfolio: my markets", {
      timeout: SMALL_TIMEOUT
    });
    //need account to not have any created markets
    await expect(page).toMatch("You haven't created any markets.", {
      timeout: SMALL_TIMEOUT
    });
  });

  it("should show user account created markets", async () => {
    // get rep needed to create markets
    await page.evaluate(() => window.integrationHelpers.getRep());
    // create a market
    scalarMarket = await createScalarMarket();

    // expect market to be present
    await expect(page).toMatch(scalarMarket.description, {
      timeout: SMALL_TIMEOUT
    });
  });

  it("should have markets move through 'Open', 'In Reporting', and 'Resolved' sections appropriately", async () => {
    // expect market to be in 'Open' section
    await expect(page).toMatchElement(
      "[data-testid='open-" + scalarMarket.id + "']",
      { timeout: SMALL_TIMEOUT }
    );

    // put market in reporting state
    await flash.setMarketEndTime(scalarMarket.id);
    await flash.pushDays(1);
    await waitNextBlock(2);

    // expect market to be in reporting section
    await expect(page).toMatchElement(
      "[data-testid='inReporting-" + scalarMarket.id + "']",
      { timeout: SMALL_TIMEOUT }
    );

    // finalize market
    await flash.forceFinalize(scalarMarket.id);

    // expect market to be in finalized section
    await expect(page).toMatchElement(
      "[data-testid='resolved-" + scalarMarket.id + "']",
      { timeout: SMALL_TIMEOUT }
    );
  });

  it("should the market be resolved to something other than 'Market is Invalid' (and the reporter claims their REP which triggers market finalization), then the Validity bond becomes available in 'Outstanding Returns', is claimable, and the Collected Returns balance updates properly", async () => {
    // need to refresh page
    await waitNextBlock(2);
    await toPortfolio();
    // go to my markets page
    await toMyMarkets();
    // verify that you are on that page
    await expect(page).toMatch("portfolio: my markets", {
      timeout: SMALL_TIMEOUT
    });

    const validityBond = await page.evaluate(
      value => window.integrationHelpers.formatEth(value),
      marketCosts.validityBond
    );
    // check for validity bond
    await expect(page).toMatchElement(
      "[data-testid='unclaimedCreatorFees-" + scalarMarket.id + "']",
      { text: validityBond, timeout: BIG_TIMEOUT }
    );
    // claim reporter gas bond
    await expect(page).toClick(
      "[data-testid='collectMarketCreatorFees-" + scalarMarket.id + "']",
      { timeout: SMALL_TIMEOUT }
    );
    // check that outstanding returns go away;
    await expect(page).not.toMatchElement(
      "[data-testid='unclaimedCreatorFees-" + scalarMarket.id + "']",
      { text: validityBond, timeout: BIG_TIMEOUT }
    );
  });

  it("should verify that, when a market is reported on by the Designated Reporter, the reporter gas bond becomes available in 'Outstanding Returns', is claimable, and the Collected Returns balance updates properly.", async () => {
    // create market with designated reporter
    const assignedReporterMarket = await createYesNoMarket(
      UnlockedAccounts.CONTRACT_OWNER
    );
    // make designated report
    await flash.designateReport(assignedReporterMarket.id, "0");

    // need to refresh page
    await waitNextBlock(2);
    await toPortfolio();
    // go to my markets page
    await toMyMarkets();
    // verify that you are on that page
    await expect(page).toMatch("portfolio: my markets", {
      timeout: SMALL_TIMEOUT
    });

    const reporterGasBond = await page.evaluate(
      value => window.integrationHelpers.formatEth(value),
      marketCosts.targetReporterGasCosts
    );

    // check for reporter gas bond
    await expect(page).toMatchElement(
      "[data-testid='unclaimedCreatorFees-" + assignedReporterMarket.id + "']",
      { text: reporterGasBond, timeout: BIG_TIMEOUT }
    ); // need to find creationFee
    // claim reporter gas bond
    await expect(page).toClick(
      "[data-testid='collectMarketCreatorFees-" +
        assignedReporterMarket.id +
        "']",
      { timeout: SMALL_TIMEOUT }
    );
    // check that outstanding returns go away
    await expect(page).not.toMatchElement(
      "[data-testid='unclaimedCreatorFees-" + assignedReporterMarket.id + "']",
      { text: reporterGasBond, timeout: BIG_TIMEOUT }
    );
  });

  it("should have outstanding returns become available to the market creator when complete sets settle, and that the amount that becomes available is correct", async () => {});

  it("should be able to collect outstanding returns from settled trades and the Collected Returns balance on the market updates correctly", async () => {});

  it("should show most recently resolved markets at the top of the Resolved list", async () => {
    // functionality not implemented yet
  });
});
