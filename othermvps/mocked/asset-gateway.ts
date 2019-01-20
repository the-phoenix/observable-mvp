import { Asset } from '@app/core/entities'
import { IAssetDataAccessor } from '@app/usecases'

export const assets = {
  btc: new Asset('BTC', 'Bitcoin', 'CRYPTO'),
  ltc: new Asset('LTC', 'Litecoin', 'CRYPTO'),
  eth: new Asset('ETH', 'Ethereum', 'CRYPTO'),
  etc: new Asset('ETC', 'Ethereum Classic', 'CRYPTO'),
  xrp: new Asset('XRP', 'Ripple', 'CRYPTO'),
  usd: new Asset('USD', 'US Dollar', 'FIAT'),
}

export class MockedAssetGateway implements IAssetDataAccessor {
  constructor() { }

  public async getAssets(): Promise<Asset[]> {
    return Object.values(assets)
  }
}
