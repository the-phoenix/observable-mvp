import axios from 'axios'
import { Observable, of, concat, timer, interval } from 'rxjs'
import { flatMap, map } from 'rxjs/operators'

import { ILogger } from '@app/core/interfaces'
import { Asset } from '@app/core/entities'

import { IFiatRateExternalGateway } from '@app/usecases/fiat-rate/i-fiat-rate-external-gateway.interface'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

const DEFAULT = {
  UPDATE_INTERVAL: 12 * HOUR,
  API_KEY: 'd396819585fad97b7538e002325c92a0',
  BASE_URL: `http://data.fixer.io/api`,
}
type CURRENCY_RATES = { [assetSymbol: string]: number }

export class FixerIoGateway implements IFiatRateExternalGateway {
  private _ratesMap: Map<string, CURRENCY_RATES> = new Map()
  private _observableMap: Map<string, Observable<CURRENCY_RATES>> = new Map()
  private _requestInterval: number
  private _apiKey: string
  private _baseUrl: string
  private _supportedAssets: Asset[] = []

  constructor(
    private _logger: ILogger,
    private _config: { UPDATE_INTERVAL: number, API_KEY: string, BASE_URL: string } = DEFAULT,
  ) {
    this._requestInterval = this._config.UPDATE_INTERVAL
    this._apiKey = this._config.API_KEY
    this._baseUrl = this._config.BASE_URL
  }

  public async getSupportedAssets(): Promise<Asset[]> {
    if (!(this._supportedAssets.length)) {
      const res = await axios.get(`${this._baseUrl}/symbols?access_key=${this._apiKey}`)

      const symbolsObjectWithNames: { [assetSymbol: string]: string } = res.data.symbols

      this._supportedAssets = Object
        .entries(symbolsObjectWithNames)
        .map(([symbol, fullName]) => new Asset(symbol, fullName, 'FIAT'))
    }

    return this._supportedAssets
  }
  
  public subscribeRates(baseAssetSymbol: string): Observable<CURRENCY_RATES> {
    let fetchObservable

    fetchObservable = interval(this._config.UPDATE_INTERVAL)
      .pipe(
        flatMap(() => this._fetchRates()),
        map(rates => baseAssetSymbol !== 'EUR' 
                  ? this._getConvertedRatesBasedOn(baseAssetSymbol, rates)
                  : rates),
      )

    const rates = this._ratesMap.get(baseAssetSymbol)
    if (rates) {
      return concat(of(rates), fetchObservable)
    }

    return fetchObservable
  }

  private async _fetchRates(): Promise<{ [assetSymbol: string]: number }> {
    return axios
      .get(`${this._baseUrl}/latest?access_key=${this._apiKey}&base=EUR`)
      .then(res => {
        this._logger.info('rates recieved:', res.data)

        return res.data.rates
      })
  }

  private _getConvertedRatesBasedOn(targetCurrencySymbol: string, rates: CURRENCY_RATES) {
    const currencySymbols = Object.keys(rates)
    const targetCurrencyRate = rates[targetCurrencySymbol]

    return currencySymbols.reduce((acc: CURRENCY_RATES, symbol) => {
      if (symbol !== targetCurrencySymbol) {
        acc[symbol] = acc[symbol] / targetCurrencyRate
      }

      return acc
    }, { EUR: 1 })
  }
}