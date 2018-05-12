import flow from 'lodash.flow'
import reverse from 'lodash.reverse'
import sortBy from 'lodash.sortby'
import * as profitService from '../exchange/services/populate-profit-cache'
import * as bookCache from '../exchange/data-access/book-dao'
import * as profitCache from '../exchange/data-access/profit-dao'

export const getDashboard = async ({ userAmount, currency }) => {
  // TODO: create a currency cache
  const amount = (await simulateGetCurrencyFromCache(currency)) * userAmount

  // get profits from cache or generate on cache miss
  let profits = await profitCache.getBest(amount)

  if (!profits || !profits.length) {
    await profitService.populateCache({ bookCache, profitCache, amount  })
    profits = await profitCache.getBest(amount)
  }

  // build the final dashboard
  const dashboard = buildDashboard(profits)

  return dashboard
}

const toDashboardEntry = (profit) => ({
  source: profit.source,
  sourceName: profit.sourceName,
  dest: profit.dest,
  destName: profit.destName,
  coin: profit.coin,
  profitPercent: profit.profitPercent,
})

const buildDashboard = (profits) => (
  flow([
    (_) => _.map(toDashboardEntry),
    (_) => sortBy(_, (el) => el.profitPercent),
    reverse,
  ])(profits)
)

const simulateGetCurrencyFromCache = async (currency) => {
  const response = await fetch('http://free.currencyconverterapi.com/api/v3/convert?q=BRL_USD&compact=y')
  return (await response.json()).BRL_USD.val
}
