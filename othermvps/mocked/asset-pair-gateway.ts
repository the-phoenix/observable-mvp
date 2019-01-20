import { AssetPair, Asset } from '@app/core/entities'
import { IAssetPairDataAccessor } from '@app/usecases'
import { assets } from './asset-gateway';

export class MockedAssetPairGateway implements IAssetPairDataAccessor {
  constructor() { }

  public async getAssetPairs(): Promise<AssetPair[]> {
    return Array.from(
      new Set([
        new AssetPair(assets.btc, assets.usd),
        new AssetPair(assets.ltc, assets.usd),
        new AssetPair(assets.ltc, assets.btc),
        new AssetPair(assets.eth, assets.usd),
        new AssetPair(assets.eth, assets.btc),
        new AssetPair(assets.etc, assets.btc),
        new AssetPair(assets.etc, assets.usd),
        new AssetPair(assets.xrp, assets.usd),
        new AssetPair(assets.xrp, assets.btc),
      ])
    )
  }
}
