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

@pytest.mark.asyncio
async def test_calculate_technical_indicators():
    # Test indicators calculation and descriptions
    indicators = await calculate_technical_indicators(65000.0, "bitcoin")
    assert "rsi" in indicators
    assert "macd" in indicators
    assert "moving_averages" in indicators
    assert "stochastic" in indicators
    assert "pivot_points" in indicators
    assert "fear_greed" in indicators
    
    assert "value" in indicators["rsi"]
    assert "status" in indicators["rsi"]
    assert "description" in indicators["rsi"]
    
    assert "hist" in indicators["macd"]
    assert "sma_50" in indicators["moving_averages"]

    assert "k" in indicators["stochastic"]
    assert "d" in indicators["stochastic"]
    assert "status" in indicators["stochastic"]

    assert "pivot" in indicators["pivot_points"]
    assert "r1" in indicators["pivot_points"]
    assert "s1" in indicators["pivot_points"]

    assert "value" in indicators["fear_greed"]
    assert "previous_value" in indicators["fear_greed"]
    assert "status" in indicators["fear_greed"]

def test_detect_candlestick_patterns():
    from app.tools import detect_candlestick_patterns
    # Mock data to simulate Doji (small body relative to range)
    klines_doji = [
        [0, "100", "105", "95", "100", "1000"],
        [0, "100", "105", "95", "100", "1000"],
        [0, "100", "105", "95", "100", "1000"],
        [0, "100", "105", "95", "100", "1000"],
        [0, "100", "105", "95", "100.01", "1000"]
    ]
    patterns = detect_candlestick_patterns(klines_doji)
    assert "Doji" in patterns

def test_run_backtest_simulation():
    from app.tools import run_backtest_simulation
    res = run_backtest_simulation("BTCUSDT", "sma_crossover")
    assert res["success"] is True
    assert "net_profit" in res
    assert "win_rate" in res
    assert "total_trades" in res
    assert "equity_curve" in res
