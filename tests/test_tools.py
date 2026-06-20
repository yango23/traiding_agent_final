import pytest
from app.tools import fetch_coin_data, fetch_crypto_news, calculate_technical_indicators

@pytest.mark.asyncio
async def test_fetch_coin_data():
    # Test for Bitcoin (should return correct schema)
    res = await fetch_coin_data("btc")
    assert res["success"] is True
    assert res["symbol"] == "BTC"
    assert "price" in res
    assert "change_24h" in res
    assert "high_24h" in res
    assert "low_24h" in res
    assert "volume_24h" in res

@pytest.mark.asyncio
async def test_fetch_crypto_news():
    # Test news for Bitcoin in Russian
    res = await fetch_crypto_news("btc", lang="ru")
    assert isinstance(res, list)
    assert len(res) > 0
    assert "title" in res[0]
    assert "body" in res[0]
    assert "source" in res[0]

def test_calculate_technical_indicators():
    # Test indicators calculation and descriptions
    indicators = calculate_technical_indicators(65000.0, "bitcoin")
    assert "rsi" in indicators
    assert "macd" in indicators
    assert "moving_averages" in indicators
    
    assert "value" in indicators["rsi"]
    assert "status" in indicators["rsi"]
    assert "description" in indicators["rsi"]
    
    assert "hist" in indicators["macd"]
    assert "sma_50" in indicators["moving_averages"]
