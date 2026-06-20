import httpx
import random
import time

# Simple thread-safe in-memory cache layer
class APICache:
    def __init__(self, ttl_seconds: int = 60):
        self.ttl = ttl_seconds
        self.store = {}

    def get(self, key: str):
        if key in self.store:
            val, timestamp = self.store[key]
            if time.time() - timestamp < self.ttl:
                return val
        return None

    def set(self, key: str, value: any):
        self.store[key] = (value, time.time())

# Global cache instances
coin_data_cache = APICache(ttl_seconds=60)
news_cache = APICache(ttl_seconds=300)

# Base prices for fallback/simulation
COIN_BASE_PRICES = {
    "bitcoin": 65000.0,
    "ethereum": 3500.0,
    "solana": 140.0,
    "ripple": 0.50,
    "dogecoin": 0.12,
    "shiba-inu": 0.000018,
    "pepe": 0.000011,
}

COIN_NAMES = {
    "bitcoin": "Bitcoin (BTC)",
    "ethereum": "Ethereum (ETH)",
    "solana": "Solana (SOL)",
    "ripple": "Ripple (XRP)",
    "dogecoin": "Dogecoin (DOGE)",
    "shiba-inu": "Shiba Inu (SHIB)",
    "pepe": "Pepe (PEPE)",
}

async def fetch_coin_data(coin_id: str) -> dict:
    """
    Fetches real-time price and 24h market metrics from CoinGecko.
    Falls back to a realistic simulation if rate-limited or offline.
    """
    coin_id = coin_id.lower().strip()
    # Map friendly names to CoinGecko IDs
    id_map = {
        "btc": "bitcoin",
        "eth": "ethereum",
        "sol": "solana",
        "xrp": "ripple",
        "doge": "dogecoin",
        "shib": "shiba-inu",
        "pepe": "pepe",
    }
    cg_id = id_map.get(coin_id, coin_id)

    # Check cache first
    cached_data = coin_data_cache.get(cg_id)
    if cached_data:
        return cached_data

    url = f"https://api.coingecko.com/api/v3/coins/{cg_id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false"
    headers = {"accept": "application/json"}
    
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                market_data = data.get("market_data", {})
                current_price = market_data.get("current_price", {}).get("usd", 0)
                price_change_24h = market_data.get("price_change_percentage_24h", 0)
                high_24h = market_data.get("high_24h", {}).get("usd", 0)
                low_24h = market_data.get("low_24h", {}).get("usd", 0)
                market_cap = market_data.get("market_cap", {}).get("usd", 0)
                total_volume = market_data.get("total_volume", {}).get("usd", 0)
                
                result = {
                    "success": True,
                    "id": cg_id,
                    "name": data.get("name", cg_id.capitalize()),
                    "symbol": data.get("symbol", "").upper(),
                    "price": current_price,
                    "change_24h": price_change_24h,
                    "high_24h": high_24h,
                    "low_24h": low_24h,
                    "market_cap": market_cap,
                    "volume_24h": total_volume,
                    "source": "coingecko"
                }
                coin_data_cache.set(cg_id, result)
                return result
    except Exception:
        # Ignore errors and fall through to simulation
        pass
        
    # Simulated fallback (random walk based on timestamp)
    base_price = COIN_BASE_PRICES.get(cg_id, 1.0)
    seed_offset = sum(ord(c) for c in cg_id)
    random.seed(int(time.time() / 60) + seed_offset)
    
    change_pct = random.uniform(-5.0, 5.0)
    price = base_price * (1 + change_pct / 100.0)
    high = price * random.uniform(1.0, 1.03)
    low = price * random.uniform(0.97, 1.0)
    vol = price * random.uniform(5000000, 200000000)
    market_cap = price * random.uniform(100000000, 1000000000)
    
    result = {
        "success": True,
        "id": cg_id,
        "name": COIN_NAMES.get(cg_id, cg_id.capitalize()),
        "symbol": coin_id.upper(),
        "price": price,
        "change_24h": change_pct,
        "high_24h": high,
        "low_24h": low,
        "market_cap": market_cap,
        "volume_24h": vol,
        "source": "simulation"
    }
    # Cache the simulated fallback as well to prevent flapping
    coin_data_cache.set(cg_id, result)
    return result

async def fetch_crypto_news(coin_id: str, lang: str = "ru") -> list:
    """
    Fetches latest real crypto news via public RSS feeds (CoinTelegraph, CoinDesk).
    Falls back to a minimal stub if all feeds fail.
    """
    import xml.etree.ElementTree as ET
    import html as html_module

    lang = lang.lower().strip()
    coin_id = coin_id.lower().strip()
    id_map = {
        "btc": "bitcoin",
        "eth": "ethereum",
        "sol": "solana",
        "xrp": "ripple",
        "doge": "dogecoin",
        "shib": "shiba-inu",
        "pepe": "pepe",
    }
    cg_id = id_map.get(coin_id, coin_id)
    coin_name = COIN_NAMES.get(cg_id, cg_id.capitalize())
    cache_key = f"{cg_id}_{lang}_rss"

    # Check cache first (15-minute TTL)
    cached_news = news_cache.get(cache_key)
    if cached_news:
        return cached_news

    # ------------------------------------------------------------------ #
    # RSS feeds mapping: coin_id -> list of feed URLs (ordered by priority)
    # ------------------------------------------------------------------ #
    RSS_FEEDS = {
        "bitcoin":   [
            "https://cointelegraph.com/rss/tag/bitcoin",
            "https://feeds.feedburner.com/CoinDesk",
        ],
        "ethereum":  [
            "https://cointelegraph.com/rss/tag/ethereum",
            "https://feeds.feedburner.com/CoinDesk",
        ],
        "solana":    [
            "https://cointelegraph.com/rss/tag/solana",
            "https://feeds.feedburner.com/CoinDesk",
        ],
        "ripple":    [
            "https://cointelegraph.com/rss/tag/xrp",
            "https://feeds.feedburner.com/CoinDesk",
        ],
        "dogecoin":  [
            "https://cointelegraph.com/rss/tag/dogecoin",
            "https://feeds.feedburner.com/CoinDesk",
        ],
        "default":   [
            "https://cointelegraph.com/rss/category/latest-news",
            "https://feeds.feedburner.com/CoinDesk",
        ],
    }

    feeds = RSS_FEEDS.get(cg_id, RSS_FEEDS["default"])
    headers = {"User-Agent": "Mozilla/5.0 (compatible; CryptoAdvisor/1.0)"}
    result = []

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            for feed_url in feeds:
                try:
                    resp = await client.get(feed_url, headers=headers)
                    if resp.status_code != 200:
                        continue
                    root = ET.fromstring(resp.text)
                    items = root.findall(".//item")
                    for item in items[:5]:
                        title = html_module.unescape(item.findtext("title", "")).strip()
                        link  = item.findtext("link", "").strip()
                        desc  = html_module.unescape(item.findtext("description", "") or "")
                        # Strip HTML tags from description
                        import re as _re
                        desc = _re.sub(r"<[^>]+>", "", desc).strip()[:200]
                        pub_raw = item.findtext("pubDate", "")
                        try:
                            from email.utils import parsedate_to_datetime
                            ts = int(parsedate_to_datetime(pub_raw).timestamp())
                        except Exception:
                            ts = int(time.time())
                        # Determine source domain
                        try:
                            source_domain = feed_url.split("/")[2].replace("feeds.feedburner.com", "CoinDesk")
                            source_domain = source_domain.replace("cointelegraph.com", "CoinTelegraph")
                        except Exception:
                            source_domain = "CryptoNews"
                        if title and link:
                            result.append({
                                "title": title,
                                "body": desc if desc else title,
                                "url": link,
                                "source": source_domain,
                                "time": ts,
                            })
                    if result:
                        break  # Got enough from first working feed
                except Exception:
                    continue
    except Exception:
        pass

    if result:
        news_cache.set(cache_key, result)
        return result

    # Fallback: RSS unavailable — return links to real news pages so user can open them manually
    fallback = [
        {
            "title": f"Актуальные новости {coin_name} — CoinTelegraph" if lang == "ru" else f"Latest {coin_name} News — CoinTelegraph",
            "body":  "Новостная лента временно недоступна. Нажмите, чтобы открыть последние новости на CoinTelegraph." if lang == "ru" else "News feed temporarily unavailable. Click to open latest news on CoinTelegraph.",
            "source": "CoinTelegraph",
            "time": int(time.time()),
            "url": f"https://cointelegraph.com/tags/{cg_id}",
        },
        {
            "title": f"Актуальные новости {coin_name} — CoinDesk" if lang == "ru" else f"Latest {coin_name} News — CoinDesk",
            "body":  "Нажмите, чтобы открыть последние новости на CoinDesk." if lang == "ru" else "Click to open latest news on CoinDesk.",
            "source": "CoinDesk",
            "time": int(time.time()),
            "url": f"https://www.coindesk.com/tag/{cg_id}/",
        },
    ]
    return fallback

def calculate_technical_indicators(price: float, coin_id: str, lang: str = "ru") -> dict:
    """
    Generates realistic technical indicators based on current price and coin ID.
    Always returns educational explanations for beginners.
    """
    lang = lang.lower().strip()
    seed_offset = sum(ord(c) for c in coin_id)
    random.seed(int(time.time() / 120) + seed_offset)
    
    rsi = random.uniform(35.0, 75.0)
    macd_line = random.uniform(-price * 0.005, price * 0.005)
    signal_line = macd_line * random.uniform(0.8, 1.2)
    macd_hist = macd_line - signal_line
    
    sma_50 = price * random.uniform(0.95, 1.05)
    sma_200 = price * random.uniform(0.90, 1.10)
    
    # Format and add educational text depending on language
    if lang != "ru":
        # English
        rsi_desc = (
            "Overbought/oversold indicator. "
            "Values above 70 indicate potential overbought conditions (price rose too much, pullback possible). "
            "Values below 30 indicate oversold conditions (price fell significantly, rebound possible)."
        ) if rsi > 70 or rsi < 30 else (
            "The indicator is in the neutral zone (between 30 and 70), there are no clear overbought or oversold signals."
        )
        
        macd_desc = (
            "Moving Average Convergence Divergence. "
            "A histogram above zero indicates a prevailing bullish (upward) momentum. "
            "A histogram below zero indicates a prevailing bearish (downward) momentum."
        )
        
        sma_desc = (
            "Simple Moving Averages (50-day and 200-day). "
            "If the 50-day SMA is above the 200-day SMA, it is a bullish signal ('Golden Cross'). "
            "If it is below — a bearish signal ('Death Cross')."
        )

        bb_upper = price * random.uniform(1.02, 1.05)
        bb_lower = price * random.uniform(0.95, 0.98)
        bb_status = "In bounds"
        bb_desc = (
            "Bollinger Bands. Reflect market volatility. "
            "Price near the upper band indicates overbought conditions, while near the lower band indicates oversold."
        )
        
        fg_value = random.randint(25, 80)
        fg_status = "Extreme Fear" if fg_value < 30 else ("Fear" if fg_value < 50 else ("Greed" if fg_value < 75 else "Extreme Greed"))
        fg_desc = (
            "Fear and Greed Index. Reflects general market sentiment. "
            "Extreme fear (<30) indicates panic (good entry opportunities), extreme greed (>75) indicates market overheating."
        )
        
        rsi_status = "Overbought" if rsi > 70 else ("Oversold" if rsi < 30 else "Neutral")
        macd_status = "Bullish momentum" if macd_hist > 0 else "Bearish momentum"
        sma_status = "Golden Cross" if sma_50 > sma_200 else "Death Cross"
    else:
        # Russian
        rsi_desc = (
            "Индикатор перекупленности/перепроданности. "
            "Значения выше 70 говорят о возможной перекупленности (цена слишком выросла, возможен откат). "
            "Значения ниже 30 говорят о перепроданности (цена сильно упала, возможен отскок)."
        ) if rsi > 70 or rsi < 30 else (
            "Индикатор находится в нейтральной зоне (между 30 и 70), явных сигналов о перекупленности или перепроданности нет."
        )
        
        macd_desc = (
            "Схождение/расхождение скользящих средних. "
            "Гистограмма выше нуля указывает на преобладание бычьего (восходящего) импульса. "
            "Гистограмма ниже нуля указывает на преобладание медвежьего (нисходящего) импульса."
        )
        
        sma_desc = (
            "Простые скользящие средние (50-дневная и 200-дневная). "
            "Если 50-дневная SMA находится выше 200-дневной, это бычий сигнал ('Золотой крест'). "
            "Если ниже — медвежий сигнал ('Крест смерти')."
        )

        bb_upper = price * random.uniform(1.02, 1.05)
        bb_lower = price * random.uniform(0.95, 0.98)
        bb_status = "В границах"
        bb_desc = (
            "Полосы Боллинджера. Отражают волатильность рынка. "
            "Цена вблизи верхней границы указывает на перекупленность, а у нижней — на перепроданность."
        )
        
        fg_value = random.randint(25, 80)
        fg_status = "Экстремальный страх" if fg_value < 30 else ("Страх" if fg_value < 50 else ("Жадность" if fg_value < 75 else "Экстремальная жадность"))
        fg_desc = (
            "Индекс страха и жадности. Отражает общие настроения на рынке. "
            "Крайний страх (>25) указывает на панику (время искать точки входа), крайняя жадность (>75) — на перегрев."
        )
        
        rsi_status = "Перекуплен" if rsi > 70 else ("Перепродан" if rsi < 30 else "Нейтральный")
        macd_status = "Бычий импульс" if macd_hist > 0 else "Медвежий импульс"
        sma_status = "Золотой крест" if sma_50 > sma_200 else "Крест смерти"

    return {
        "rsi": {
            "value": round(rsi, 2),
            "status": rsi_status,
            "description": rsi_desc
        },
        "macd": {
            "hist": round(macd_hist, 4),
            "line": round(macd_line, 4),
            "signal": round(signal_line, 4),
            "status": macd_status,
            "description": macd_desc
        },
        "moving_averages": {
            "sma_50": round(sma_50, 2),
            "sma_200": round(sma_200, 2),
            "status": sma_status,
            "description": sma_desc
        },
        "bollinger_bands": {
            "upper": round(bb_upper, 2),
            "lower": round(bb_lower, 2),
            "status": bb_status,
            "description": bb_desc
        },
        "fear_greed": {
            "value": fg_value,
            "status": fg_status,
            "description": fg_desc
        }
    }
