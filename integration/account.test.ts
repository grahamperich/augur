import "jest-environment-puppeteer";
import { UnlockedAccounts } from "./constants/accounts";
import { dismissDisclaimerModal } from "./helpers/dismiss-disclaimer-modal";
import BigNumber from "bignumber.js";

const url = `${process.env.AUGUR_URL}`;
const TIMEOUT = 20000; // this is big because loading account balances can take a while

jest.setTimeout(100000);

interface AccountData {
  rep?: string;
  eth?: string;
}
describe("Account", () => {
  let originalAccountData: AccountData;

  beforeAll(async () => {
    await page.goto(url);

    // No idea what a 'typical' desktop resolution would be for our users.
    await page.setViewport({
      height: 1200,
      width: 1200
    });
    await page.evaluate(
      account => window.integrationHelpers.updateAccountAddress(account),
      UnlockedAccounts.CONTRACT_OWNER
    );
    await dismissDisclaimerModal(page);
  });

  describe("Deposit Page", () => {
    it("should show correct stats in deposit page", async () => {
      await page.goto(url + "#/deposit-funds");
      const accountData = await page.evaluate(() =>
        window.integrationHelpers.getAccountData()
      );
      const rep = await accountData.rep;
      const eth = await accountData.eth;

      const formatRep = await page.evaluate(
        value => window.integrationHelpers.formatRep(value),
        rep
      );
      const formatEth = await page.evaluate(
        value => window.integrationHelpers.formatEth(value),
        eth
      );

      // correct account ETH and REP should be shown in deposit page
      await expect(page).toMatchElement("span.rep_value", {
        text: formatRep.formatted,
        timeout: TIMEOUT
      });
      await expect(page).toMatchElement("span.eth_value", {
        text: formatEth.formatted,
        timeout: TIMEOUT
      });

      // correct account ETH and REP should be shown in core stats bar
      await expect(page).toMatchElement("span#core-bar-rep", {
        text: formatRep.formatted,
        timeout: TIMEOUT
      });
      await expect(page).toMatchElement("span#core-bar-eth", {
        text: formatEth.formatted,
        timeout: TIMEOUT
      });

      // correct account address should be shown in deposit page
      const displayAddress = accountData.displayAddress;
      await expect(displayAddress.toLowerCase()).toEqual(
        UnlockedAccounts.CONTRACT_OWNER
      );
      await expect(page).toMatch(displayAddress);
    });
  });

  describe("REP Faucet Page", () => {
    it("should have a working 'Get REP' button", async () => {
      // keep track of original account data
      originalAccountData = await page.evaluate(() =>
        window.integrationHelpers.getAccountData()
      );

      // log in to secondary account - doing rep faucet on this account so that we always have rep to withdraw
      await page.evaluate(
        account => window.integrationHelpers.updateAccountAddress(account),
        UnlockedAccounts.SECONDARY_ACCOUNT
      );

      // make sure logged in
      await page.waitForSelector("#core-bar-eth", { timeout: TIMEOUT });

      // navigate to rep faucet
      await page.goto(url + "#/rep-faucet");

      // get account data
      const accountData = await page.evaluate(() =>
        window.integrationHelpers.getAccountData()
      );
      const initialRep = await accountData.rep;

      // click 'Get REP' button
      await expect(page).toClick(
        "button.account-rep-faucet-styles_AccountRepFaucet__button",
        { timeout: TIMEOUT }
      );

      // verify you receieved a confirmed notification
      await expect(page).toClick(
        "button.top-bar-styles_TopBar__notification-icon"
      );
      await expect(page).toMatch("faucet - confirmed", { timeout: TIMEOUT });

      // balance should now have 47.00 more REP - compare old and new account balances
      const newRepPlus = await new BigNumber(initialRep).plus(47);
      const formatRep = await page.evaluate(
        value => window.integrationHelpers.formatEth(value),
        newRepPlus
      );
      await expect(page).toMatch(formatRep.formatted.split(".")[0], {
        timeout: TIMEOUT
      }); // decimals may not equal be sometimes cause of rounding
    });
  });

  describe("Withdraw Page", () => {
    it("should be able to send funds to another account using the form", async () => {
      // send eth from a second account to first account and check that the amount is right
      // navigate to withdraw page
      await page.goto(url + "#/withdraw-funds");

      // withdraw eth
      await expect(page).toFill("input#quantity", "100", { timeout: TIMEOUT });
      await expect(page).toFill(
        "input#address",
        UnlockedAccounts.CONTRACT_OWNER
      );
      await expect(page).toClick("button#withdraw-button");

      // check for notification
      await expect(page).toClick(
        "button.top-bar-styles_TopBar__notification-icon"
      );
      await expect(page).toMatch("Transfer Ether -- Success", {
        timeout: TIMEOUT
      });
      await expect(page).toClick(
        "button.top-bar-styles_TopBar__notification-icon"
      );

      // withdraw rep
      await expect(page).toClick(".input-dropdown-styles_InputDropdown");
      await expect(page).toClick("button", { text: "REP", timeout: TIMEOUT });
      await expect(page).toFill("input#quantity", "10", { timeout: TIMEOUT });
      await expect(page).toFill(
        "input#address",
        UnlockedAccounts.CONTRACT_OWNER
      );
      await expect(page).toClick("button#withdraw-button");

      // check for notification
      await expect(page).toClick(
        "button.top-bar-styles_TopBar__notification-icon"
      );
      await expect(page).toMatch("Transfer REP -- Success", {
        timeout: TIMEOUT
      });
      await expect(page).toClick(
        "button.top-bar-styles_TopBar__notification-icon"
      );

      // log into original account
      await page.evaluate(
        account => window.integrationHelpers.updateAccountAddress(account),
        UnlockedAccounts.CONTRACT_OWNER
      );
      await page.goto(url + "#/deposit-funds");

      // compare old and new account balances
      const eth = await originalAccountData.eth; // sometimes null for newAccountData
      const newEth = await new BigNumber(eth || 0).plus(100);
      const formatEth = await page.evaluate(
        value => window.integrationHelpers.formatEth(value),
        newEth
      );
      await expect(page).toMatch(formatEth.formatted.split(".")[0], {
        timeout: TIMEOUT
      }); // decimals may not equal be sometimes cause of rounding

      const rep = await originalAccountData.rep; // sometimes null for newAccountData
      const newRep = await new BigNumber(rep || 0).plus(10);
      const formatRep = await page.evaluate(
        value => window.integrationHelpers.formatRep(value),
        newRep
      );
      await expect(page).toMatch(formatRep.formatted.split(".")[0], {
        timeout: TIMEOUT
      }); // decimals may not equal be sometimes cause of rounding
    });
  });

  describe("Authentication", () => {
    it("should correctly display 'Account' page", async () => {
      // logout
      await page.evaluate(() => window.integrationHelpers.logout());

      // go to account page
      await expect(page).toClick("span", { text: "Account", timeout: TIMEOUT });

      await expect(page).toMatch("Link an ethereum account", {
        timeout: TIMEOUT
      });

      // expect to be on authentication page
      const pageUrl = await page.url();
      await expect(pageUrl).toEqual(`${process.env.AUGUR_URL}#/authentication`);
    });

    it("should only display two options in the sidebar when not logged in", async () => {
      // options available should be "Markets" and "Account"
      await page.waitForSelector("a[href$='#/markets']");
      await page.waitForSelector("a[href='#/deposit-funds']");

      // check that only those two options show up
      const sidebarElements = await page.$$("li#side-nav-items");
      await expect(sidebarElements.length).toEqual(2);
    });
  });
});
